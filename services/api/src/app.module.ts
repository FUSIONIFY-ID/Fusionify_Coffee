import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CatalogModule } from './catalog/catalog.module';

@Module({
  imports: [CatalogModule],
  controllers: [AppController],
})
export class AppModule {}
