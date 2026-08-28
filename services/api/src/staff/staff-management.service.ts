import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hashPassword } from '../auth/crypto.util';
import { PrismaService } from '../database/prisma.service';
import { StaffRole, StaffStatus } from '../generated/prisma/enums';
import { StaffAuthService } from './staff-auth.service';
import type {
  CreateStaffInput,
  ResetStaffPasswordInput,
  UpdateStaffInput,
} from './staff.types';
import { staffRolePermissions } from './staff.permissions';

const outletScopedRoles = new Set<StaffRole>([
  StaffRole.OUTLET_MANAGER,
  StaffRole.CASHIER,
  StaffRole.BARISTA,
  StaffRole.INVENTORY_STAFF,
]);

@Injectable()
export class StaffManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: StaffAuthService,
  ) {}

  async listStaff() {
    const users = await this.prisma.staffUser.findMany({
      include: {
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { fullName: 'asc' }],
      take: 250,
    });

    return users.map((user) => this.toView(user));
  }

  async createStaff(actorStaffUserId: string, input: CreateStaffInput) {
    const actor = await this.requireActor(actorStaffUserId);
    const fullName = this.validateFullName(input.fullName);
    const email = this.validateEmail(input.email);
    this.assertRoleManageable(actor.role, input.role);

    const outletId = await this.validateOutletForRole(
      input.role,
      input.outletId ?? null,
    );

    const existing = await this.prisma.staffUser.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('A staff account already uses this email.');
    }

    const passwordHash = await this.hashStaffPassword(input.initialPassword);

    const created = await this.prisma.staffUser.create({
      data: {
        fullName,
        email,
        role: input.role,
        outletId,
        passwordHash,
      },
      include: {
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.authService.audit(actor.id, 'STAFF_USER_CREATED', {
      targetType: 'StaffUser',
      targetId: created.id,
      metadata: {
        role: created.role,
        outletId: created.outletId,
      },
    });

    return this.toView(created);
  }

  async updateStaff(
    actorStaffUserId: string,
    targetStaffUserId: string,
    input: UpdateStaffInput,
  ) {
    const actor = await this.requireActor(actorStaffUserId);
    const target = await this.prisma.staffUser.findUnique({
      where: { id: targetStaffUserId },
    });

    if (!target) {
      throw new NotFoundException('Staff account not found.');
    }
    this.assertCanManageTarget(actor.id, actor.role, target.id, target.role);

    const nextRole = input.role ?? target.role;
    const nextStatus = input.status ?? target.status;
    this.assertRoleManageable(actor.role, nextRole);

    if (
      target.role === StaffRole.SUPER_ADMIN &&
      target.status === StaffStatus.ACTIVE &&
      (nextRole !== StaffRole.SUPER_ADMIN ||
        nextStatus !== StaffStatus.ACTIVE)
    ) {
      await this.assertAnotherActiveSuperAdmin(target.id);
    }

    const outletId =
      input.outletId !== undefined || input.role !== undefined
        ? await this.validateOutletForRole(
            nextRole,
            input.outletId !== undefined ? input.outletId : target.outletId,
          )
        : target.outletId;

    const fullName =
      input.fullName === undefined
        ? target.fullName
        : this.validateFullName(input.fullName);

    const changedSecurityScope =
      nextRole !== target.role ||
      nextStatus !== target.status ||
      outletId !== target.outletId;

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.staffUser.update({
        where: { id: target.id },
        data: {
          fullName,
          role: nextRole,
          status: nextStatus,
          outletId,
        },
        include: {
          outlet: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (changedSecurityScope) {
        await tx.staffSession.updateMany({
          where: { staffUserId: target.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      return next;
    });

    await this.authService.audit(actor.id, 'STAFF_USER_UPDATED', {
      targetType: 'StaffUser',
      targetId: target.id,
      metadata: {
        previousRole: target.role,
        role: updated.role,
        previousStatus: target.status,
        status: updated.status,
        previousOutletId: target.outletId,
        outletId: updated.outletId,
        sessionsRevoked: changedSecurityScope,
      },
    });

    return this.toView(updated);
  }

  async resetPassword(
    actorStaffUserId: string,
    targetStaffUserId: string,
    input: ResetStaffPasswordInput,
  ) {
    const actor = await this.requireActor(actorStaffUserId);
    const target = await this.prisma.staffUser.findUnique({
      where: { id: targetStaffUserId },
    });
    if (!target) {
      throw new NotFoundException('Staff account not found.');
    }

    this.assertCanManageTarget(actor.id, actor.role, target.id, target.role);
    const passwordHash = await this.hashStaffPassword(input.newPassword);

    await this.prisma.$transaction(async (tx) => {
      await tx.staffUser.update({
        where: { id: target.id },
        data: { passwordHash },
      });
      await tx.staffSession.updateMany({
        where: { staffUserId: target.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.staffLoginChallenge.updateMany({
        where: { staffUserId: target.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
    });

    await this.authService.audit(actor.id, 'STAFF_PASSWORD_RESET_BY_ADMIN', {
      targetType: 'StaffUser',
      targetId: target.id,
    });

    return { success: true };
  }

  async resetTotp(actorStaffUserId: string, targetStaffUserId: string) {
    const actor = await this.requireActor(actorStaffUserId);
    const target = await this.prisma.staffUser.findUnique({
      where: { id: targetStaffUserId },
    });
    if (!target) {
      throw new NotFoundException('Staff account not found.');
    }

    this.assertCanManageTarget(actor.id, actor.role, target.id, target.role);

    await this.prisma.$transaction(async (tx) => {
      await tx.staffUser.update({
        where: { id: target.id },
        data: {
          totpSecretEncrypted: null,
          totpEnabledAt: null,
        },
      });
      await tx.staffSession.updateMany({
        where: { staffUserId: target.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.staffLoginChallenge.updateMany({
        where: { staffUserId: target.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
    });

    await this.authService.audit(actor.id, 'STAFF_TOTP_RESET_BY_ADMIN', {
      targetType: 'StaffUser',
      targetId: target.id,
    });

    return { success: true };
  }

  private async requireActor(staffUserId: string) {
    const actor = await this.prisma.staffUser.findUnique({
      where: { id: staffUserId },
    });
    if (!actor || actor.status !== StaffStatus.ACTIVE) {
      throw new ForbiddenException('Active staff account is required.');
    }
    return actor;
  }

  private assertCanManageTarget(
    actorId: string,
    actorRole: StaffRole,
    targetId: string,
    targetRole: StaffRole,
  ) {
    if (actorId === targetId) {
      throw new BadRequestException(
        'Use self-service security settings for your own account.',
      );
    }

    if (
      targetRole === StaffRole.SUPER_ADMIN &&
      actorRole !== StaffRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only SUPER_ADMIN can manage SUPER_ADMIN.');
    }
  }

  private assertRoleManageable(actorRole: StaffRole, role: StaffRole) {
    if (role === StaffRole.SUPER_ADMIN && actorRole !== StaffRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can assign SUPER_ADMIN.');
    }
  }

  private async assertAnotherActiveSuperAdmin(targetId: string) {
    const count = await this.prisma.staffUser.count({
      where: {
        id: { not: targetId },
        role: StaffRole.SUPER_ADMIN,
        status: StaffStatus.ACTIVE,
      },
    });

    if (count === 0) {
      throw new ConflictException(
        'At least one active SUPER_ADMIN must remain.',
      );
    }
  }

  private validateFullName(value: string) {
    const fullName = value?.trim();
    if (!fullName || fullName.length < 2 || fullName.length > 120) {
      throw new BadRequestException('Staff full name is invalid.');
    }
    return fullName;
  }

  private validateEmail(value: string) {
    const email = value?.trim().toLowerCase();
    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      throw new BadRequestException('Staff email is invalid.');
    }
    return email;
  }

  private async hashStaffPassword(value: string) {
    try {
      return await hashPassword(value);
    } catch {
      throw new BadRequestException(
        'Staff password must contain between 8 and 128 characters.',
      );
    }
  }

  private async validateOutletForRole(
    role: StaffRole,
    outletId: string | null,
  ) {
    if (outletScopedRoles.has(role) && !outletId) {
      throw new BadRequestException(
        'This staff role requires an outlet assignment.',
      );
    }

    if (!outletId) {
      return null;
    }

    const outlet = await this.prisma.outlet.findUnique({
      where: { id: outletId },
      select: { id: true },
    });
    if (!outlet) {
      throw new BadRequestException('Assigned outlet does not exist.');
    }

    return outlet.id;
  }

  private toView(user: {
    id: string;
    fullName: string;
    email: string;
    role: StaffRole;
    status: StaffStatus;
    outletId: string | null;
    totpEnabledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    outlet?: { id: string; name: string } | null;
  }) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      outletId: user.outletId,
      outlet: user.outlet ?? null,
      totpEnabled: Boolean(user.totpEnabledAt),
      permissions: staffRolePermissions[user.role],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
