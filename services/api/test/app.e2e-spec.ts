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
    return request(app.getHttpServer()).get('/v1/health').expect(200).expect({
      status: 'ok',
      service: 'fusionify-coffee-api',
    });
  });

  it('/v1/catalog/preview (GET) exposes modifier-aware preview data', () => {
    return request(app.getHttpServer())
      .get('/v1/catalog/preview')
      .expect(200)
      .then((response) => {
        expect(response.text).toContain('"preview":true');
        expect(response.text).toContain('"modifierGroups"');
        expect(response.text).toContain('"oat-milk"');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
