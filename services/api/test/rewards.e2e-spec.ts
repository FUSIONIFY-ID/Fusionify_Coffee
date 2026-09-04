import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { createOpaqueToken, hashOpaqueToken } from './../src/auth/crypto.util';
import { PrismaService } from './../src/database/prisma.service';
import { StaffRole } from './../src/generated/prisma/enums';

type OrderResponse = {
  id: string;
  subtotal: number;
};

type RewardsResponse = {
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  recentActivity: Array<{
    type: string;
    points: number;
    balanceAfter: number;
    orderId: string | null;
  }>;
};

describe('Fusion Points (e2e)', () => {
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

  async function customerSession() {
    sequence += 1;
    const user = await prisma.customerUser.create({
      data: {
        fullName: 'Rewards Test Customer',
        phoneCountry: 'ID',
        phoneE164: `+628199${Date.now()}${sequence}`,
        phoneVerifiedAt: new Date(),
        passwordHash: 'test-only-unused',
      },
    });
    const accessToken = createOpaqueToken();
    const refreshToken = createOpaqueToken();
    await prisma.userSession.create({
      data: {
        userId: user.id,
        accessTokenHash: hashOpaqueToken(accessToken),
        refreshTokenHash: hashOpaqueToken(refreshToken),
        accessExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        refreshExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    return { userId: user.id, accessToken };
  }

  async function staffSession(role: StaffRole) {
    sequence += 1;
    const staff = await prisma.staffUser.create({
      data: {
        fullName: 'Rewards Test Staff',
        email: `rewards-staff-${Date.now()}-${sequence}@example.com`,
        passwordHash: 'test-only-unused',
        role,
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
    return { accessToken };
  }

  it('awards one ledger entry when an eligible customer order completes', async () => {
    const admin = await staffSession(StaffRole.SUPER_ADMIN);
    const customer = await customerSession();

    await request(app.getHttpServer())
      .put('/v1/staff/rewards/programs/IDR')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ spendUnit: 1000, pointsPerUnit: 1, active: true })
      .expect(200);

    const createdResponse = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .set('Idempotency-Key', `rewards-order-${Date.now()}-${sequence}`)
      .send({
        outletId: 'preview-outlet',
        items: [
          {
            productId: 'aren-latte',
            quantity: 1,
            modifierOptionIds: [
              'aren-latte-size-regular',
              'aren-latte-temperature-iced',
              'aren-latte-sugar-sugar-50',
              'aren-latte-ice-normal-ice',
              'aren-latte-milk-fresh-milk',
            ],
          },
        ],
      })
      .expect(201);
    const order = createdResponse.body as unknown as OrderResponse;
    expect(order.subtotal).toBe(28000);

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' },
      }),
      prisma.orderStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: 'AWAITING_PAYMENT',
          toStatus: 'CONFIRMED',
          note: 'E2E simulated paid order.',
        },
      }),
    ]);

    for (const status of ['PREPARING', 'READY', 'PICKED_UP', 'COMPLETED']) {
      await request(app.getHttpServer())
        .post(`/v1/staff/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ toStatus: status })
        .expect(201);
    }

    const response = await request(app.getHttpServer())
      .get('/v1/rewards/me')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .expect(200);
    const rewards = response.body as unknown as RewardsResponse;

    expect(rewards.balance).toBe(28);
    expect(rewards.lifetimeEarned).toBe(28);
    expect(rewards.lifetimeRedeemed).toBe(0);
    expect(rewards.recentActivity).toHaveLength(1);
    expect(rewards.recentActivity[0]).toMatchObject({
      type: 'ORDER_REWARD',
      points: 28,
      balanceAfter: 28,
      orderId: order.id,
    });

    const ledgerCount = await prisma.loyaltyLedgerEntry.count({
      where: { orderId: order.id },
    });
    expect(ledgerCount).toBe(1);
  });

  it('protects customer balance and reward-program configuration', async () => {
    await request(app.getHttpServer()).get('/v1/rewards/me').expect(401);

    const cashier = await staffSession(StaffRole.CASHIER);
    await request(app.getHttpServer())
      .put('/v1/staff/rewards/programs/IDR')
      .set('Authorization', `Bearer ${cashier.accessToken}`)
      .send({ spendUnit: 1000, pointsPerUnit: 1, active: true })
      .expect(403);
  });
});
