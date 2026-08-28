import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  it('marks development catalog as preview data', () => {
    const service = new CatalogService();

    const catalog = service.getPreviewCatalog();

    expect(catalog.preview).toBe(true);
    expect(catalog.products).toHaveLength(3);
    expect(catalog.products[0].modifierGroups).toHaveLength(6);
    expect(catalog.products[0].modifierGroups[4].options[1]).toEqual({
      id: 'oat-milk',
      label: 'Oat Milk',
      priceDelta: 8000,
      isDefault: false,
    });
  });
});
