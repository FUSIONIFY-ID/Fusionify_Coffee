import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CatalogModule } from './catalog/catalog.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DatabaseModule, CatalogModule],
  controllers: [AppController],
})
export class AppModule {}
