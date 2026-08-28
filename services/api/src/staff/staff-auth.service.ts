import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { StaffStatus } from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import {
  createOpaqueToken,
  hashOpaqueToken,
  verifyPassword,
} from '../auth/crypto.util';
import {
  buildTotpUri,
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  verifyTotp,
} from './totp.util';
import type {
  StaffLoginInput,
  StaffRefreshInput,
  StaffTotpVerifyInput,
} from './staff.types';
import { staffRolePermissions } from './staff.permissions';

const challengeLifetimeMs = 5 * 60 * 1000;
const accessLifetimeMs = 15 * 60 * 1000;
const refreshLifetimeMs = 8 * 60 * 60 * 1000;

@Injectable()
export class StaffAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(
    input: StaffLoginInput,
    context?: { ipAddress?: string; userAgent?: string },
  ) {
    const email = input.email?.trim().toLowerCase();
    const user = email
      ? await this.prisma.staffUser.findUnique({ where: { email } })
      : null;

    if (
      !user ||
      user.status !== StaffStatus.ACTIVE ||
      !(await verifyPassword(input.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid staff credentials.');
    }

    const challengeToken = createOpaqueToken();
    await this.prisma.staffLoginChallenge.create({
      data: {
        staffUserId: user.id,
        tokenHash: hashOpaqueToken(challengeToken),
        expiresAt: new Date(Date.now() + challengeLifetimeMs),
      },
    });

    await this.audit(user.id, 'STAFF_PASSWORD_VERIFIED', context);

    return {
      challengeToken,
      requiresTotpSetup: !user.totpSecretEncrypted || !user.totpEnabledAt,
      requiresTotp: Boolean(user.totpSecretEncrypted && user.totpEnabledAt),
      expiresInSeconds: Math.floor(challengeLifetimeMs / 1000),
    };
  }

  async setupTotp(challengeToken: string) {
    const challenge = await this.requireChallenge(challengeToken);
    const user = await this.prisma.staffUser.findUniqueOrThrow({
      where: { id: challenge.staffUserId },
    });

    if (user.totpEnabledAt) {
      throw new BadRequestException('TOTP is already enabled.');
    }

    const secret = generateTotpSecret();
    await this.prisma.staffUser.update({
      where: { id: user.id },
      data: { totpSecretEncrypted: encryptTotpSecret(secret) },
    });

    await this.audit(user.id, 'STAFF_TOTP_SETUP_STARTED');

    return {
      secret,
      otpauthUri: buildTotpUri(user.email, secret),
    };
  }

  async verifyTotp(
    input: StaffTotpVerifyInput,
    context?: { ipAddress?: string; userAgent?: string },
  ) {
    const challenge = await this.requireChallenge(input.challengeToken);
    const user = await this.prisma.staffUser.findUniqueOrThrow({
      where: { id: challenge.staffUserId },
    });

    if (!user.totpSecretEncrypted) {
      throw new BadRequestException('TOTP setup is required.');
    }

    const secret = decryptTotpSecret(user.totpSecretEncrypted);
    if (!verifyTotp(secret, input.code)) {
      await this.audit(user.id, 'STAFF_TOTP_REJECTED', context);
      throw new UnauthorizedException('Invalid authenticator code.');
    }

    const session = await this.prisma.$transaction(async (tx) => {
      await tx.staffLoginChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });

      if (!user.totpEnabledAt) {
        await tx.staffUser.update({
          where: { id: user.id },
          data: { totpEnabledAt: new Date() },
        });
      }

      const tokens = this.newTokens();
      await tx.staffSession.create({
        data: {
          staffUserId: user.id,
          accessTokenHash: tokens.accessTokenHash,
          refreshTokenHash: tokens.refreshTokenHash,
          accessExpiresAt: tokens.accessExpiresAt,
          refreshExpiresAt: tokens.refreshExpiresAt,
        },
      });

      return tokens;
    });

    await this.audit(user.id, 'STAFF_LOGIN_SUCCEEDED', context);

    return {
      staff: this.staffView(user),
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      accessExpiresAt: session.accessExpiresAt,
      refreshExpiresAt: session.refreshExpiresAt,
    };
  }

  async refresh(input: StaffRefreshInput) {
    const session = await this.prisma.staffSession.findUnique({
      where: { refreshTokenHash: hashOpaqueToken(input.refreshToken) },
      include: { staffUser: true },
    });

    if (
      !session ||
      session.revokedAt ||
      session.refreshExpiresAt.getTime() <= Date.now() ||
      session.staffUser.status !== StaffStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Staff refresh token is invalid.');
    }

    const tokens = this.newTokens();
    await this.prisma.staffSession.update({
      where: { id: session.id },
      data: {
        accessTokenHash: tokens.accessTokenHash,
        refreshTokenHash: tokens.refreshTokenHash,
        accessExpiresAt: tokens.accessExpiresAt,
        refreshExpiresAt: tokens.refreshExpiresAt,
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessExpiresAt: tokens.accessExpiresAt,
      refreshExpiresAt: tokens.refreshExpiresAt,
    };
  }

  async getForAccessToken(accessToken: string) {
    const session = await this.prisma.staffSession.findUnique({
      where: { accessTokenHash: hashOpaqueToken(accessToken) },
      include: { staffUser: true },
    });

    if (
      !session ||
      session.revokedAt ||
      session.accessExpiresAt.getTime() <= Date.now() ||
      session.staffUser.status !== StaffStatus.ACTIVE
    ) {
      return null;
    }

    return {
      session,
      staff: session.staffUser,
      permissions: staffRolePermissions[session.staffUser.role],
    };
  }

  async me(staffUserId: string) {
    const user = await this.prisma.staffUser.findUniqueOrThrow({
      where: { id: staffUserId },
    });
    return this.staffView(user);
  }

  async logout(sessionId: string) {
    const session = await this.prisma.staffSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    await this.audit(session.staffUserId, 'STAFF_LOGOUT');
    return { success: true };
  }

  async listAuditLogs(limit = 100) {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    return this.prisma.staffAuditLog.findMany({
      include: {
        staffUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });
  }

  async audit(
    staffUserId: string | null,
    action: string,
    context?: {
      ipAddress?: string;
      userAgent?: string;
      targetType?: string;
      targetId?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    await this.prisma.staffAuditLog.create({
      data: {
        staffUserId,
        action,
        targetType: context?.targetType,
        targetId: context?.targetId,
        metadata: context?.metadata,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      },
    });
  }

  private async requireChallenge(token: string) {
    if (!token) {
      throw new UnauthorizedException('Staff login challenge is required.');
    }

    const challenge = await this.prisma.staffLoginChallenge.findUnique({
      where: { tokenHash: hashOpaqueToken(token) },
    });

    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException(
        'Staff login challenge is invalid or expired.',
      );
    }

    return challenge;
  }

  private newTokens() {
    const accessToken = createOpaqueToken();
    const refreshToken = createOpaqueToken();
    return {
      accessToken,
      refreshToken,
      accessTokenHash: hashOpaqueToken(accessToken),
      refreshTokenHash: hashOpaqueToken(refreshToken),
      accessExpiresAt: new Date(Date.now() + accessLifetimeMs),
      refreshExpiresAt: new Date(Date.now() + refreshLifetimeMs),
    };
  }

  private staffView(user: {
    id: string;
    fullName: string;
    email: string;
    role: import('../generated/prisma/enums').StaffRole;
    status: StaffStatus;
    outletId: string | null;
    totpEnabledAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      outletId: user.outletId,
      totpEnabled: Boolean(user.totpEnabledAt),
      permissions: staffRolePermissions[user.role],
      createdAt: user.createdAt,
    };
  }
}
