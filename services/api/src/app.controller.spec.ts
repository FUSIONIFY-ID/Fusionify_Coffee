import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = moduleRef.get<AppController>(AppController);
  });

  it('returns service health', () => {
    expect(controller.getHealth()).toEqual({
      status: 'ok',
      service: 'fusionify-coffee-api',
    });
  });
});
