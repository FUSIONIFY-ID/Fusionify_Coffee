import { Module } from '@nestjs/common';
import { StaffModule } from '../staff/staff.module';
import { CatalogAdminService } from './catalog-admin.service';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { StaffCatalogController } from './staff-catalog.controller';

@Module({
  imports: [StaffModule],
  controllers: [CatalogController, StaffCatalogController],
  providers: [CatalogService, CatalogAdminService],
})
export class CatalogModule {}
