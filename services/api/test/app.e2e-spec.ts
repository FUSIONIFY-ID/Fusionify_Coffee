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

  it('/v1/catalog/preview (GET) clearly identifies preview data', () => {
    return request(app.getHttpServer())
      .get('/v1/catalog/preview')
      .expect(200)
      .expect({
        preview: true,
        outlet: {
          id: 'preview-outlet',
          name: 'Fusionify Coffee Preview Store',
          pickupEnabled: true,
        },
        products: [
          {
            id: 'aren-latte',
            name: 'Aren Latte',
            category: 'Coffee',
            basePrice: 28000,
          },
          {
            id: 'sea-salt-latte',
            name: 'Sea Salt Latte',
            category: 'Coffee',
            basePrice: 32000,
          },
          {
            id: 'matcha-cloud',
            name: 'Matcha Cloud',
            category: 'Non Coffee',
            basePrice: 30000,
          },
        ],
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
