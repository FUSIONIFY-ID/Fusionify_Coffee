import { Controller, Get, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('v1/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('preview')
  getPreviewCatalog(@Query('lang') language?: string) {
    return this.catalogService.getPreviewCatalog(language);
  }
}
