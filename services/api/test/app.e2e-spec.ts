import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

type OrderResponse = {
  id: string;
  status: string;
  subtotal: number;
  totalAmount: number;
  items: Array<{ unitPrice: number }>;
};

describe('Fusionify Coffee API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
