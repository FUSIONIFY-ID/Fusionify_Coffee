import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { createOpaqueToken, hashOpaqueToken } from './../src/auth/crypto.util';
import { PrismaService } from './../src/database/prisma.service';
import { StaffRole } from './../src/generated/prisma/enums';

type OrderResponse = { id: string; subtotal: number };
type MembershipResponse = {
  balance: number;
  membership: {
    currency: string;
    qualifyingSpend: number;
    pointsMultiplierBps: number;
    currentTier: { name: string; rank: number } | null;
    nextTier: { name: string; rank: number } | null;
    remainingToNextTier: number;
  };
};

describe('Fusionify Membership (e2e)', () => {
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
        fullName: 'Membership Test Customer',
        phoneCountry: 'ID',
        phoneE164: `+628188${Date.now()}${sequence}`,
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
    return { accessToken };
  }

  async function staffSession(role: StaffRole) {
    sequence += 1;
    const staff = await prisma.staffUser.create({
      data: {
        fullName: 'Membership Test Staff',
        email: `membership-staff-${Date.now()}-${sequence}@example.com`,
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

  async function createAndCompleteOrder(
    customerToken: string,
    staffToken: string,
  ) {
    const created = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', `membership-order-${Date.now()}-${sequence++}`)
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
    const order = created.body as unknown as OrderResponse;

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
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ toStatus: status })
        .expect(201);
    }
    return order;
  }

  it('qualifies membership and applies its multiplier on the next order', async () => {
    const admin = await staffSession(StaffRole.SUPER_ADMIN);
    const customer = await customerSession();

    await request(app.getHttpServer())
      .put('/v1/staff/rewards/programs/IDR')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ spendUnit: 1000, pointsPerUnit: 1, active: true })
      .expect(200);

    await request(app.getHttpServer())
      .put('/v1/staff/rewards/membership-tiers/IDR/0')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: 'Base Test Tier',
        translations: { ID_ID: 'Tier Dasar Test' },
        minimumQualifyingSpend: 0,
        pointsMultiplierBps: 10000,
        active: true,
      })
      .expect(200);
    await request(app.getHttpServer())
      .put('/v1/staff/rewards/membership-tiers/IDR/1')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: 'Plus Test Tier',
        translations: { ID_ID: 'Tier Plus Test' },
        minimumQualifyingSpend: 28000,
        pointsMultiplierBps: 15000,
        active: true,
      })
      .expect(200);

    await createAndCompleteOrder(customer.accessToken, admin.accessToken);

    const firstSummaryResponse = await request(app.getHttpServer())
      .get('/v1/rewards/me')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .set('Accept-Language', 'id-ID')
      .expect(200);
    const firstSummary =
      firstSummaryResponse.body as unknown as MembershipResponse;

    expect(firstSummary.balance).toBe(28);
    expect(firstSummary.membership.qualifyingSpend).toBe(28000);
    expect(firstSummary.membership.currentTier?.name).toBe('Tier Plus Test');
    expect(firstSummary.membership.pointsMultiplierBps).toBe(15000);

    await createAndCompleteOrder(customer.accessToken, admin.accessToken);

    const secondSummaryResponse = await request(app.getHttpServer())
      .get('/v1/rewards/me')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .expect(200);
    const secondSummary =
      secondSummaryResponse.body as unknown as MembershipResponse;

    expect(secondSummary.balance).toBe(70);
    expect(secondSummary.membership.qualifyingSpend).toBe(56000);
    expect(secondSummary.membership.currentTier?.rank).toBe(1);
  });

  it('does not let a cashier configure membership tiers', async () => {
    const cashier = await staffSession(StaffRole.CASHIER);
    await request(app.getHttpServer())
      .put('/v1/staff/rewards/membership-tiers/IDR/0')
      .set('Authorization', `Bearer ${cashier.accessToken}`)
      .send({
        name: 'Blocked Tier',
        minimumQualifyingSpend: 0,
        pointsMultiplierBps: 10000,
        active: true,
      })
      .expect(403);
  });
});
