import { Controller, Get } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('v1/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('preview')
  getPreviewCatalog() {
    return this.catalogService.getPreviewCatalog();
  }
}
