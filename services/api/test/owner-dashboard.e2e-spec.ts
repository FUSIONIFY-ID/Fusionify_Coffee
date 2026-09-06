import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { createOpaqueToken, hashOpaqueToken } from './../src/auth/crypto.util';
import { PrismaService } from './../src/database/prisma.service';
import {
  OrderStatus,
  PaymentStatus,
  StaffRole,
} from './../src/generated/prisma/enums';

type DashboardResponse = {
  outlets: Array<{ id: string; name: string }>;
  currencyTotals: Array<{
    currency: string;
    netSales: number;
    paidOrders: number;
  }>;
  totals: {
    completedOrders: number;
    activeQueue: number;
    paymentAttention: number;
    lowStock: number;
    maintenanceDue: number;
  };
  outletPerformance: Array<{
    id: string;
    netSales: number;
    paidOrders: number;
  }>;
  attention: Array<{ type: string; referenceId: string }>;
};

describe('Owner control center (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let sequence = 0;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    app = moduleFixture.createNestApplication({ rawBody: true });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  function unique(prefix: string) {
    sequence += 1;
    return `${prefix}-${Date.now()}-${sequence}`;
  }

  async function createOutlet(prefix: string) {
    const id = unique(prefix);
    return prisma.outlet.create({
      data: {
        id,
        name: `${prefix} Test Outlet`,
        currency: 'IDR',
        timezone: 'Asia/Jakarta',
      },
    });
  }

  async function staffSession(role: StaffRole, outletId?: string) {
    const staff = await prisma.staffUser.create({
      data: {
        fullName: `${role} Dashboard Test`,
        email: `${unique('owner-dashboard')}@example.com`,
        passwordHash: 'test-only-unused',
        role,
        outletId,
      },
    });
    const accessToken = createOpaqueToken();
    const refreshToken = createOpaqueToken();
    await prisma.staffSession.create({
      data: {
        staffUserId: staff.id,
        accessTokenHash: hashOpaqueToken(accessToken),
        refreshTokenHash: hashOpaqueToken(refreshToken),
        accessExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        refreshExpiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
    });
    return { accessToken, staffId: staff.id };
  }

  async function createOrder(
    outletId: string,
    status: OrderStatus,
    totalAmount: number,
    paymentStatus: PaymentStatus,
  ) {
    return prisma.order.create({
      data: {
        checkoutKey: unique('dashboard-checkout'),
        outletId,
        status,
        currency: 'IDR',
        subtotal: totalAmount,
        totalAmount,
        payments: {
          create: {
            idempotencyKey: unique('dashboard-payment'),
            provider: 'AUTOGOPAY',
            channel: 'GOPAY_QRIS',
            status: paymentStatus,
            amount: totalAmount,
            currency: 'IDR',
          },
        },
      },
      include: { payments: true },
    });
  }

  it('reports real paid sales and scoped operational alerts', async () => {
    const outletA = await createOutlet('owner-a');
    const outletB = await createOutlet('owner-b');
    const owner = await staffSession(StaffRole.OWNER);
    const cashier = await staffSession(StaffRole.CASHIER, outletA.id);

    await createOrder(
      outletA.id,
      OrderStatus.COMPLETED,
      50_000,
      PaymentStatus.PAID,
    );
    await createOrder(
      outletA.id,
      OrderStatus.CONFIRMED,
      30_000,
      PaymentStatus.PAID,
    );
    const failedOrder = await createOrder(
      outletA.id,
      OrderStatus.AWAITING_PAYMENT,
      20_000,
      PaymentStatus.FAILED,
    );
    await createOrder(
      outletB.id,
      OrderStatus.COMPLETED,
      40_000,
      PaymentStatus.PAID,
    );

    const item = await prisma.inventoryItem.create({
      data: {
        sku: unique('LOW-STOCK').toUpperCase(),
        name: 'Dashboard Test Beans',
        type: 'INGREDIENT',
        baseUnit: 'gram',
      },
    });
    const inventory = await prisma.outletInventory.create({
      data: {
        outletId: outletA.id,
        inventoryItemId: item.id,
        onHandBaseUnit: 3,
        reorderPointBaseUnit: 10,
      },
    });
    const asset = await prisma.asset.create({
      data: {
        outletId: outletA.id,
        assetTag: unique('DUE-ASSET').toUpperCase(),
        name: 'Dashboard Test Grinder',
        category: 'Grinder',
        nextMaintenanceAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/v1/staff/owner-dashboard?rangeDays=7&outletId=${outletA.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const dashboard = response.body as unknown as DashboardResponse;

    expect(dashboard.outlets.map((outlet) => outlet.id)).toEqual(
      expect.arrayContaining([outletA.id, outletB.id]),
    );
    expect(dashboard.currencyTotals).toContainEqual(
      expect.objectContaining({
        currency: 'IDR',
        netSales: 80_000,
        paidOrders: 2,
      }),
    );
    expect(dashboard.totals).toMatchObject({
      completedOrders: 1,
      activeQueue: 1,
      paymentAttention: 1,
      lowStock: 1,
      maintenanceDue: 1,
    });
    expect(dashboard.outletPerformance).toEqual([
      expect.objectContaining({
        id: outletA.id,
        netSales: 80_000,
        paidOrders: 2,
      }),
    ]);
    expect(dashboard.attention).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'PAYMENT',
          referenceId: failedOrder.payments[0].id,
        }),
        expect.objectContaining({
          type: 'LOW_STOCK',
          referenceId: inventory.id,
        }),
        expect.objectContaining({
          type: 'MAINTENANCE_DUE',
          referenceId: asset.id,
        }),
      ]),
    );

    await request(app.getHttpServer())
      .get('/v1/staff/owner-dashboard')
      .set('Authorization', `Bearer ${cashier.accessToken}`)
      .expect(403);
  });

  it('scopes outlet access and persists asset maintenance schedules', async () => {
    const outletA = await createOutlet('operations-a');
    const outletB = await createOutlet('operations-b');
    const manager = await staffSession(StaffRole.OUTLET_MANAGER, outletA.id);
    const owner = await staffSession(StaffRole.OWNER);
    const assetA = await prisma.asset.create({
      data: {
        outletId: outletA.id,
        assetTag: unique('SERVICE-A').toUpperCase(),
        name: 'Service Test Machine',
        category: 'Coffee Machine',
        status: 'MAINTENANCE',
      },
    });
    const assetB = await prisma.asset.create({
      data: {
        outletId: outletB.id,
        assetTag: unique('SERVICE-B').toUpperCase(),
        name: 'Other Outlet Machine',
        category: 'Coffee Machine',
      },
    });

    const scopedOutlets = await request(app.getHttpServer())
      .get('/v1/staff/outlets')
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .expect(200);
    expect(scopedOutlets.body).toEqual([
      expect.objectContaining({ id: outletA.id }),
    ]);

    const ownerOutlets = await request(app.getHttpServer())
      .get('/v1/staff/outlets')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(
      (ownerOutlets.body as Array<{ id: string }>).map((outlet) => outlet.id),
    ).toEqual(expect.arrayContaining([outletA.id, outletB.id]));

    const nextMaintenanceAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    await request(app.getHttpServer())
      .post(`/v1/staff/operations/assets/${assetA.id}/maintenance`)
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send({
        description: 'Replaced group-head gasket and completed calibration.',
        cost: 125_000,
        performedAt: new Date().toISOString(),
        nextMaintenanceAt: nextMaintenanceAt.toISOString(),
        statusAfter: 'ACTIVE',
      })
      .expect(201);

    const updatedAsset = await prisma.asset.findUniqueOrThrow({
      where: { id: assetA.id },
      include: { maintenances: true },
    });
    expect(updatedAsset.status).toBe('ACTIVE');
    expect(updatedAsset.nextMaintenanceAt?.toISOString()).toBe(
      nextMaintenanceAt.toISOString(),
    );
    expect(updatedAsset.maintenances).toContainEqual(
      expect.objectContaining({
        description: 'Replaced group-head gasket and completed calibration.',
        cost: 125_000,
        staffUserId: manager.staffId,
      }),
    );

    await request(app.getHttpServer())
      .post(`/v1/staff/operations/assets/${assetB.id}/maintenance`)
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send({
        description: 'Must not cross outlet scope.',
        performedAt: new Date().toISOString(),
      })
      .expect(404);
  });
});
