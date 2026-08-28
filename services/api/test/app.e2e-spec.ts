import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { hashOtp } from './../src/auth/crypto.util';
import { PrismaService } from './../src/database/prisma.service';

type OrderResponse = {
  id: string;
  status: string;
  subtotal: number;
  totalAmount: number;
  items: Array<{ unitPrice: number }>;
};

describe('Fusionify Coffee API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    app = moduleFixture.createNestApplication({ rawBody: true });
    await app.init();
  });

  it('/v1/health (GET)', () => {
    return request(app.getHttpServer()).get('/v1/health').expect(200).expect({
      status: 'ok',
      service: 'fusionify-coffee-api',
    });
  });

  it('/v1/catalog/preview (GET) reads seeded PostgreSQL data', () => {
    return request(app.getHttpServer())
      .get('/v1/catalog/preview')
      .expect(200)
      .then((response) => {
        expect(response.text).toContain('"preview":true');
        expect(response.text).toContain('"aren-latte"');
        expect(response.text).toContain(
          '"Database-backed development fixture."',
        );
        expect(response.text).toContain('"Oat Milk"');
      });
  });

  it('registers a verified Indonesian customer and restores profile', async () => {
    const phone = `0812${Date.now().toString().slice(-7)}`;

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

    const challengeId = requested.body.challengeId as string;
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

    const registered = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        challengeId,
        verificationToken: verified.body.verificationToken as string,
        fullName: 'Fusionify Test User',
        password: 'Fusionify-2026',
        preferredLanguage: 'ID_ID',
      })
      .expect(201);

    const accessToken = registered.body.accessToken as string;

    const profile = await request(app.getHttpServer())
      .get('/v1/account/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(profile.body.fullName).toBe('Fusionify Test User');
    expect(profile.body.phoneCountry).toBe('ID');
    expect(profile.body.phoneVerified).toBe(true);
    expect(profile.body.preferredLanguage).toBe('ID_ID');
  });

  it('/v1/orders (POST) prices the cart on the server idempotently', async () => {
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
      .set('Idempotency-Key', checkoutKey)
      .send(body)
      .expect(201);
    const repeatedBody = repeated.body as OrderResponse;

    expect(repeatedBody.id).toBe(createdBody.id);
  });

  it('fails payment creation safely when AutoGoPay is not configured', async () => {
    const checkoutKey = `payment-order-e2e-${Date.now()}`;
    const created = await request(app.getHttpServer())
      .post('/v1/orders')
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
      .set('Idempotency-Key', `payment-e2e-${Date.now()}`)
      .send({ channel: 'GOPAY_QRIS' })
      .expect(503);

    const refreshed = await request(app.getHttpServer())
      .get(`/v1/orders/${order.id}`)
      .expect(200);
    const refreshedBody = refreshed.body as {
      payments: Array<{ status: string }>;
    };

    expect(refreshedBody.payments).toHaveLength(1);
    expect(refreshedBody.payments[0].status).toBe('FAILED');
  });

  it('/v1/orders (POST) rejects missing required modifiers', async () => {
    await request(app.getHttpServer())
      .post('/v1/orders')
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
