import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { hashOtp, hashPassword } from './../src/auth/crypto.util';
import { PrismaService } from './../src/database/prisma.service';
import { StaffRole } from './../src/generated/prisma/enums';
import { totpAtCounter } from './../src/staff/totp.util';

type OrderResponse = {
  id: string;
  status: string;
  subtotal: number;
  totalAmount: number;
  items: Array<{ unitPrice: number }>;
};

type OtpRequestResponse = {
  challengeId: string;
};

type OtpVerifyResponse = {
  verificationToken: string;
};

type RegisteredUserResponse = {
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    phoneCountry: string;
    phoneVerified: boolean;
    preferredLanguage: string;
  };
};

type ProfileResponse = {
  fullName: string;
  phoneCountry: string;
  phoneVerified: boolean;
  preferredLanguage: string;
};

type StaffLoginResponse = {
  challengeToken: string;
  requiresTotpSetup: boolean;
  requiresTotp: boolean;
};

type StaffTotpSetupResponse = {
  secret: string;
  otpauthUri: string;
};

type StaffSessionResponse = {
  accessToken: string;
  refreshToken: string;
  staff: {
    id: string;
    email: string;
    role: string;
    totpEnabled: boolean;
    permissions: string[];
  };
};

type StaffMeResponse = {
  id: string;
  email: string;
  role: string;
  totpEnabled: boolean;
  permissions: string[];
};

type StaffUserViewResponse = {
  id: string;
  email: string;
  role: string;
  status: string;
  outletId: string | null;
  totpEnabled: boolean;
};

type StaffOrderResponse = {
  id: string;
  status: string;
  outletId: string;
  statusEvents: Array<{
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
  }>;
};

type CustomerOrderDetailResponse = {
  id: string;
  status: string;
  statusEvents: Array<{
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
  }>;
};

describe('Fusionify Coffee API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let userSequence = 0;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    app = moduleFixture.createNestApplication({ rawBody: true });
    await app.init();
  });

  async function createAndLoginStaff(role: StaffRole, outletId?: string) {
    userSequence += 1;
    const email = `staff-${Date.now()}-${userSequence}@example.com`;
    const password = 'Fusionify-Staff-2026';

    await prisma.staffUser.create({
      data: {
        email,
        fullName: 'Fusionify Staff Test',
        passwordHash: await hashPassword(password),
        role,
        outletId,
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/v1/staff/auth/login')
      .send({ email, password })
      .expect(201);
    const login = loginResponse.body as unknown as StaffLoginResponse;

    expect(login.requiresTotpSetup).toBe(true);
    expect(login.requiresTotp).toBe(false);

    const setupResponse = await request(app.getHttpServer())
      .post('/v1/staff/auth/totp/setup')
      .send({ challengeToken: login.challengeToken })
      .expect(201);
    const setup = setupResponse.body as unknown as StaffTotpSetupResponse;

    expect(setup.otpauthUri).toContain('otpauth://totp/');
    const code = totpAtCounter(setup.secret, Math.floor(Date.now() / 30_000));

    const verifiedResponse = await request(app.getHttpServer())
      .post('/v1/staff/auth/totp/verify')
      .send({
        challengeToken: login.challengeToken,
        code,
      })
      .expect(201);

    return verifiedResponse.body as unknown as StaffSessionResponse;
  }

  async function registerCustomer() {
    userSequence += 1;
    const suffix = (Date.now() + userSequence).toString().slice(-7);
    const phone = `0812${suffix}`;

    const requested = await request(app.getHttpServer())
      .post('/v1/auth/otp/request')
      .send({
        country: 'ID',
        phone,
        channel: 'WHATSAPP',
        language: 'ID_ID',
        purpose: 'REGISTER',
      })
      .expect(201);

    const requestedBody = requested.body as unknown as OtpRequestResponse;
    const challengeId = requestedBody.challengeId;
    const challenge = await prisma.otpChallenge.findUniqueOrThrow({
      where: { id: challengeId },
    });

    await prisma.otpChallenge.update({
      where: { id: challengeId },
      data: {
        codeHash: hashOtp(challenge.phoneE164, 'REGISTER', '123456'),
      },
    });

    const verified = await request(app.getHttpServer())
      .post('/v1/auth/otp/verify')
      .send({
        challengeId,
        code: '123456',
      })
      .expect(201);

    const verifiedBody = verified.body as unknown as OtpVerifyResponse;

    const registered = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        challengeId,
        verificationToken: verifiedBody.verificationToken,
        fullName: 'Fusionify Test User',
        password: 'Fusionify-2026',
        preferredLanguage: 'ID_ID',
      })
      .expect(201);

    const registeredBody = registered.body as unknown as RegisteredUserResponse;

    return {
      accessToken: registeredBody.accessToken,
      user: registeredBody.user,
    };
  }

  it('/v1/health (GET)', () => {
    return request(app.getHttpServer()).get('/v1/health').expect(200).expect({
      status: 'ok',
      service: 'fusionify-coffee-api',
    });
  });

  it('/v1/catalog/preview (GET) returns English localized seeded data', () => {
    return request(app.getHttpServer())
      .get('/v1/catalog/preview?lang=EN')
      .expect(200)
      .then((response) => {
        expect(response.text).toContain('"preview":true');
        expect(response.text).toContain('"language":"EN"');
        expect(response.text).toContain('"aren-latte"');
        expect(response.text).toContain(
          '"Database-backed development fixture."',
        );
        expect(response.text).toContain('"Oat Milk"');
      });
  });

  it('/v1/catalog/preview (GET) returns Malay localized seeded data', () => {
    return request(app.getHttpServer())
      .get('/v1/catalog/preview?lang=MS_MY')
      .expect(200)
      .then((response) => {
        expect(response.text).toContain('"language":"MS_MY"');
        expect(response.text).toContain('"category":"Kopi"');
        expect(response.text).toContain('"Susu Oat"');
        expect(response.text).toContain(
          '"Data pembangunan yang bersumber daripada pangkalan data."',
        );
      });
  });

  it('registers a verified Indonesian customer and restores profile', async () => {
    const registered = await registerCustomer();

    const profile = await request(app.getHttpServer())
      .get('/v1/account/me')
      .set('Authorization', `Bearer ${registered.accessToken}`)
      .expect(200);

    const profileBody = profile.body as unknown as ProfileResponse;

    expect(profileBody.fullName).toBe('Fusionify Test User');
    expect(profileBody.phoneCountry).toBe('ID');
    expect(profileBody.phoneVerified).toBe(true);
    expect(profileBody.preferredLanguage).toBe('ID_ID');
  });

  it('requires staff password + TOTP and creates an audited staff session', async () => {
    const session = await createAndLoginStaff(StaffRole.SUPER_ADMIN);

    expect(session.staff.role).toBe('SUPER_ADMIN');
    expect(session.staff.totpEnabled).toBe(true);
    expect(session.staff.permissions).toContain('audit.read');

    const meResponse = await request(app.getHttpServer())
      .get('/v1/staff/me')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .expect(200);
    const me = meResponse.body as unknown as StaffMeResponse;

    expect(me.email).toBe(session.staff.email);
    expect(me.totpEnabled).toBe(true);

    const auditResponse = await request(app.getHttpServer())
      .get('/v1/staff/audit-logs')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .expect(200);

    expect(Array.isArray(auditResponse.body)).toBe(true);
  });

  it('enforces staff RBAC for audit access', async () => {
    const session = await createAndLoginStaff(StaffRole.CASHIER);

    expect(session.staff.permissions).not.toContain('audit.read');

    await request(app.getHttpServer())
      .get('/v1/staff/audit-logs')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .expect(403);
  });

  it('lets privileged staff manage accounts and blocks ordinary staff', async () => {
    const admin = await createAndLoginStaff(StaffRole.SUPER_ADMIN);

    const createdResponse = await request(app.getHttpServer())
      .post('/v1/staff/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        fullName: 'Preview Cashier',
        email: `cashier-${Date.now()}-${userSequence}@example.com`,
        role: 'CASHIER',
        outletId: 'preview-outlet',
        initialPassword: 'Fusionify-Cashier-2026',
      })
      .expect(201);

    const created = createdResponse.body as unknown as StaffUserViewResponse;
    expect(created.role).toBe('CASHIER');
    expect(created.status).toBe('ACTIVE');
    expect(created.outletId).toBe('preview-outlet');
    expect(created.totpEnabled).toBe(false);

    const listResponse = await request(app.getHttpServer())
      .get('/v1/staff/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    const staffList = listResponse.body as unknown as StaffUserViewResponse[];
    expect(staffList.some((staff) => staff.id === created.id)).toBe(true);

    const cashier = await createAndLoginStaff(
      StaffRole.CASHIER,
      'preview-outlet',
    );

    await request(app.getHttpServer())
      .get('/v1/staff/users')
      .set('Authorization', `Bearer ${cashier.accessToken}`)
      .expect(403);
  });

  it('creates server-priced guest POS orders and fails payment safely without provider config', async () => {
    const cashier = await createAndLoginStaff(
      StaffRole.CASHIER,
      'preview-outlet',
    );
    const idempotencyKey = `pos-order-${Date.now()}-${userSequence}`;
    const body = {
      outletId: 'preview-outlet',
      items: [
        {
          productId: 'aren-latte',
          quantity: 2,
          modifierOptionIds: [
            'aren-latte-size-regular',
            'aren-latte-temperature-iced',
            'aren-latte-sugar-sugar-50',
            'aren-latte-ice-normal-ice',
            'aren-latte-milk-fresh-milk',
          ],
        },
      ],
    };

    const createdResponse = await request(app.getHttpServer())
      .post('/v1/staff/orders')
      .set('Authorization', `Bearer ${cashier.accessToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send(body)
      .expect(201);

    const created = createdResponse.body as unknown as OrderResponse & {
      userId: string | null;
    };

    expect(created.userId).toBeNull();
    expect(created.status).toBe('AWAITING_PAYMENT');
    expect(created.subtotal).toBe(56000);
    expect(created.totalAmount).toBe(56000);

    const repeatedResponse = await request(app.getHttpServer())
      .post('/v1/staff/orders')
      .set('Authorization', `Bearer ${cashier.accessToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send(body)
      .expect(201);
    const repeated = repeatedResponse.body as unknown as OrderResponse;

    expect(repeated.id).toBe(created.id);

    await request(app.getHttpServer())
      .post(`/v1/staff/orders/${created.id}/payments`)
      .set('Authorization', `Bearer ${cashier.accessToken}`)
      .set('Idempotency-Key', `pos-payment-${Date.now()}-${userSequence}`)
      .send({ channel: 'GOPAY_QRIS' })
      .expect(503);

    const refreshedResponse = await request(app.getHttpServer())
      .get(`/v1/staff/orders/${created.id}`)
      .set('Authorization', `Bearer ${cashier.accessToken}`)
      .expect(200);
    const refreshed = refreshedResponse.body as unknown as {
      status: string;
      payments: Array<{ status: string }>;
    };

    expect(refreshed.status).toBe('AWAITING_PAYMENT');
    expect(refreshed.payments).toHaveLength(1);
    expect(refreshed.payments[0].status).toBe('FAILED');
  });

  it('enforces sequential outlet-scoped fulfillment transitions', async () => {
    const registered = await registerCustomer();
    const created = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Authorization', `Bearer ${registered.accessToken}`)
      .set('Idempotency-Key', `fulfillment-e2e-${Date.now()}`)
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

    const barista = await createAndLoginStaff(
      StaffRole.BARISTA,
      'preview-outlet',
    );

    const preparingResponse = await request(app.getHttpServer())
      .post(`/v1/staff/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${barista.accessToken}`)
      .send({ toStatus: 'PREPARING', note: 'Started by barista.' })
      .expect(201);
    const preparing = preparingResponse.body as unknown as StaffOrderResponse;

    expect(preparing.status).toBe('PREPARING');

    await request(app.getHttpServer())
      .post(`/v1/staff/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${barista.accessToken}`)
      .send({ toStatus: 'COMPLETED' })
      .expect(409);

    for (const status of ['READY', 'PICKED_UP', 'COMPLETED']) {
      await request(app.getHttpServer())
        .post(`/v1/staff/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${barista.accessToken}`)
        .send({ toStatus: status })
        .expect(201);
    }

    const customerOrderResponse = await request(app.getHttpServer())
      .get(`/v1/orders/${order.id}`)
      .set('Authorization', `Bearer ${registered.accessToken}`)
      .expect(200);
    const customerOrder =
      customerOrderResponse.body as unknown as CustomerOrderDetailResponse;

    expect(customerOrder.status).toBe('COMPLETED');
    expect(customerOrder.statusEvents.map((event) => event.toStatus)).toEqual([
      'CONFIRMED',
      'PREPARING',
      'READY',
      'PICKED_UP',
      'COMPLETED',
    ]);

    await prisma.outlet.upsert({
      where: { id: 'other-e2e-outlet' },
      update: {},
      create: {
        id: 'other-e2e-outlet',
        name: 'Other E2E Outlet',
        pickupEnabled: true,
      },
    });

    const otherOrder = await prisma.order.create({
      data: {
        checkoutKey: `other-outlet-${Date.now()}-${userSequence}`,
        userId: registered.user.id,
        outletId: 'other-e2e-outlet',
        status: 'CONFIRMED',
        subtotal: 10000,
        totalAmount: 10000,
      },
    });

    await request(app.getHttpServer())
      .get(`/v1/staff/orders/${otherOrder.id}`)
      .set('Authorization', `Bearer ${barista.accessToken}`)
      .expect(404);
  });

  it('/v1/orders (POST) requires authentication', async () => {
    await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Idempotency-Key', `unauthenticated-${Date.now()}`)
      .send({
        outletId: 'preview-outlet',
        items: [],
      })
      .expect(401);
  });

  it('/v1/orders (POST) prices the cart on the server idempotently', async () => {
    const registered = await registerCustomer();
    const checkoutKey = `checkout-e2e-${Date.now()}`;
    const body = {
      outletId: 'preview-outlet',
      items: [
        {
          productId: 'aren-latte',
          quantity: 2,
          modifierOptionIds: [
            'aren-latte-size-regular',
            'aren-latte-temperature-iced',
            'aren-latte-sugar-sugar-50',
            'aren-latte-ice-normal-ice',
            'aren-latte-milk-fresh-milk',
          ],
        },
      ],
    };

    const created = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Authorization', `Bearer ${registered.accessToken}`)
      .set('Idempotency-Key', checkoutKey)
      .send(body)
      .expect(201);
    const createdBody = created.body as OrderResponse;

    expect(createdBody.status).toBe('AWAITING_PAYMENT');
    expect(createdBody.subtotal).toBe(56000);
    expect(createdBody.totalAmount).toBe(56000);
    expect(createdBody.items).toHaveLength(1);
    expect(createdBody.items[0].unitPrice).toBe(28000);

    const repeated = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Authorization', `Bearer ${registered.accessToken}`)
      .set('Idempotency-Key', checkoutKey)
      .send(body)
      .expect(201);
    const repeatedBody = repeated.body as OrderResponse;

    expect(repeatedBody.id).toBe(createdBody.id);
  });

  it('fails payment creation safely when AutoGoPay is not configured', async () => {
    const registered = await registerCustomer();
    const checkoutKey = `payment-order-e2e-${Date.now()}`;
    const created = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Authorization', `Bearer ${registered.accessToken}`)
      .set('Idempotency-Key', checkoutKey)
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
    const order = created.body as OrderResponse;

    await request(app.getHttpServer())
      .post(`/v1/orders/${order.id}/payments`)
      .set('Authorization', `Bearer ${registered.accessToken}`)
      .set('Idempotency-Key', `payment-e2e-${Date.now()}`)
      .send({ channel: 'GOPAY_QRIS' })
      .expect(503);

    const refreshed = await request(app.getHttpServer())
      .get(`/v1/orders/${order.id}`)
      .set('Authorization', `Bearer ${registered.accessToken}`)
      .expect(200);
    const refreshedBody = refreshed.body as {
      payments: Array<{ status: string }>;
    };

    expect(refreshedBody.payments).toHaveLength(1);
    expect(refreshedBody.payments[0].status).toBe('FAILED');
  });

  it('/v1/orders (POST) rejects missing required modifiers', async () => {
    const registered = await registerCustomer();

    await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Authorization', `Bearer ${registered.accessToken}`)
      .set('Idempotency-Key', `invalid-e2e-${Date.now()}`)
      .send({
        outletId: 'preview-outlet',
        items: [
          {
            productId: 'aren-latte',
            quantity: 1,
            modifierOptionIds: [],
          },
        ],
      })
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
