import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  it('marks development catalog as preview data', () => {
    const service = new CatalogService();

    const catalog = service.getPreviewCatalog();

    expect(catalog.preview).toBe(true);
    expect(catalog.products).toHaveLength(3);
  });
});
