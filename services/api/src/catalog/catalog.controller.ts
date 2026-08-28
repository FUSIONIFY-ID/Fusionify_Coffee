import { Controller, Get, Headers, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('v1/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('preview')
  getPreviewCatalog(
    @Query('lang') language?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.catalogService.getPreviewCatalog(language ?? acceptLanguage);
  }
}
