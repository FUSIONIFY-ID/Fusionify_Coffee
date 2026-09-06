import { Controller, Get, Headers, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('v1/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('outlets')
  listOutlets(
    @Query('lang') language?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.catalogService.listOutlets(language ?? acceptLanguage);
  }

  @Get()
  getCatalog(
    @Query('outletId') outletId?: string,
    @Query('lang') language?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.catalogService.getCatalog(language ?? acceptLanguage, outletId);
  }

  @Get('preview')
  getPreviewCatalog(
    @Query('lang') language?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.catalogService.getCatalog(
      language ?? acceptLanguage,
      undefined,
      true,
    );
  }
}
