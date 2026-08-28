import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Fusionify Coffee API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/v1/health')
      .expect(200)
      .expect({
        status: 'ok',
        service: 'fusionify-coffee-api',
      });
  });

  it('/v1/catalog/preview (GET) clearly identifies preview data', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/catalog/preview')
      .expect(200);

    expect(response.body.preview).toBe(true);
    expect(response.body.products).toHaveLength(3);
  });

  afterEach(async () => {
    await app.close();
  });
});
