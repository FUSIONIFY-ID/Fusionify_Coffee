import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { hashOtp } from './../src/auth/crypto.util';
import { PrismaService } from './../src/database/prisma.service';

type OtpRequestResponse = {
  challengeId: string;
};

type OtpVerifyResponse = {
  verificationToken: string;
};

type RegisterResponse = {
  accessToken: string;
};

type FavoriteResponse = {
  id: string;
  productId: string;
};

describe('Customer favorites (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    app = moduleFixture.createNestApplication({ rawBody: true });
    await app.init();
  });

  async function registerCustomer() {
    const suffix = Date.now().toString().slice(-7);
    const requested = await request(app.getHttpServer())
      .post('/v1/auth/otp/request')
      .send({
        country: 'ID',
        phone: `0812${suffix}`,
        channel: 'WHATSAPP',
        language: 'ID_ID',
        purpose: 'REGISTER',
      })
      .expect(201);

    const challengeId = (requested.body as unknown as OtpRequestResponse)
      .challengeId;
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
      .send({ challengeId, code: '123456' })
      .expect(201);

    const verificationToken = (verified.body as unknown as OtpVerifyResponse)
      .verificationToken;

    const registered = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        challengeId,
        verificationToken,
        fullName: 'Favorites Test User',
        password: 'Fusionify-2026',
        preferredLanguage: 'ID_ID',
      })
      .expect(201);

    return (registered.body as unknown as RegisterResponse).accessToken;
  }

  it('requires customer authentication', async () => {
    await request(app.getHttpServer()).get('/v1/account/favorites').expect(401);
  });

  it('adds, lists, and removes favorites idempotently', async () => {
    const accessToken = await registerCustomer();
    const authorization = `Bearer ${accessToken}`;

    const first = await request(app.getHttpServer())
      .post('/v1/account/favorites/aren-latte')
      .set('Authorization', authorization)
      .expect(201);
    const firstBody = first.body as unknown as FavoriteResponse;

    expect(firstBody.productId).toBe('aren-latte');

    const repeated = await request(app.getHttpServer())
      .post('/v1/account/favorites/aren-latte')
      .set('Authorization', authorization)
      .expect(201);
    const repeatedBody = repeated.body as unknown as FavoriteResponse;

    expect(repeatedBody.id).toBe(firstBody.id);

    const list = await request(app.getHttpServer())
      .get('/v1/account/favorites')
      .set('Authorization', authorization)
      .expect(200);
    const favorites = list.body as unknown as FavoriteResponse[];

    expect(favorites).toHaveLength(1);
    expect(favorites[0].productId).toBe('aren-latte');

    await request(app.getHttpServer())
      .delete('/v1/account/favorites/aren-latte')
      .set('Authorization', authorization)
      .expect(200);

    await request(app.getHttpServer())
      .delete('/v1/account/favorites/aren-latte')
      .set('Authorization', authorization)
      .expect(200);

    await request(app.getHttpServer())
      .get('/v1/account/favorites')
      .set('Authorization', authorization)
      .expect(200)
      .expect([]);
  });

  it('rejects inactive or unknown products', async () => {
    const accessToken = await registerCustomer();

    await request(app.getHttpServer())
      .post('/v1/account/favorites/not-a-product')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
