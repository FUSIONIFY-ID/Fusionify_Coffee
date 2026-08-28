import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import { StaffAuthService } from '../staff/staff-auth.service';

type StaffOrderActor = {
  staffUserId: string;
  outletId: string | null;
};

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.CONFIRMED]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.READY,
  [OrderStatus.READY]: OrderStatus.PICKED_UP,
  [OrderStatus.PICKED_UP]: OrderStatus.COMPLETED,
};

@Injectable()
export class StaffOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly staffAuthService: StaffAuthService,
  ) {}

  async list(
    actor: StaffOrderActor,
    filters: { status?: string; outletId?: string },
  ) {
    const status = this.parseStatus(filters.status);
    const outletId = this.resolveOutlet(actor, filters.outletId);

    return this.prisma.order.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(outletId ? { outletId } : {}),
      },
      include: {
        outlet: {
          select: { id: true, name: true },
        },
        items: {
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 250,
    });
  }

  async getById(actor: StaffOrderActor, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        outlet: {
          select: { id: true, name: true },
        },
        items: {
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        statusEvents: {
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            note: true,
            createdAt: true,
            staffUser: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order || (actor.outletId && order.outletId !== actor.outletId)) {
      throw new NotFoundException('Order not found.');
    }

    return order;
  }

  async transition(
    actor: StaffOrderActor,
    orderId: string,
    input: { toStatus: string; note?: string },
  ) {
    const requested = this.parseRequiredStatus(input.toStatus);
    const note = this.validateNote(input.note);
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        outletId: true,
      },
    });

    if (!order || (actor.outletId && order.outletId !== actor.outletId)) {
      throw new NotFoundException('Order not found.');
    }

    const allowed = nextStatus[order.status];
    if (!allowed || allowed !== requested) {
      throw new ConflictException(
        `Order cannot move from ${order.status} to ${requested}.`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          status: order.status,
        },
        data: {
          status: requested,
        },
      });

      if (updated.count !== 1) {
        throw new ConflictException(
          'Order status changed concurrently. Refresh and try again.',
        );
      }

      await tx.orderStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: requested,
          staffUserId: actor.staffUserId,
          note,
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: {
          outlet: {
            select: { id: true, name: true },
          },
          items: {
            orderBy: { createdAt: 'asc' },
          },
          statusEvents: {
            select: {
              id: true,
              fromStatus: true,
              toStatus: true,
              note: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    });

    await this.staffAuthService.audit(
      actor.staffUserId,
      'ORDER_STATUS_CHANGED',
      {
        targetType: 'Order',
        targetId: order.id,
        metadata: {
          fromStatus: order.status,
          toStatus: requested,
          outletId: order.outletId,
        },
      },
    );

    return result;
  }

  private resolveOutlet(actor: StaffOrderActor, requested?: string) {
    if (actor.outletId) {
      if (requested && requested !== actor.outletId) {
        throw new NotFoundException('Outlet not found.');
      }
      return actor.outletId;
    }
    return requested?.trim() || undefined;
  }

  private parseStatus(value?: string) {
    if (!value) return undefined;
    if (!Object.values(OrderStatus).includes(value as OrderStatus)) {
      throw new BadRequestException('Order status filter is invalid.');
    }
    return value as OrderStatus;
  }

  private parseRequiredStatus(value: string) {
    if (!value || !Object.values(OrderStatus).includes(value as OrderStatus)) {
      throw new BadRequestException('Target order status is invalid.');
    }
    return value as OrderStatus;
  }

  private validateNote(value?: string) {
    const note = value?.trim();
    if (!note) return null;
    if (note.length > 500) {
      throw new BadRequestException('Order status note is too long.');
    }
    return note;
  }
}
