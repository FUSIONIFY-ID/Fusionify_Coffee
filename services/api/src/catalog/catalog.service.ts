import { Injectable } from '@nestjs/common';

@Injectable()
export class CatalogService {
  getPreviewCatalog() {
    return {
      preview: true,
      outlet: {
        id: 'preview-outlet',
        name: 'Fusionify Coffee Preview Store',
        pickupEnabled: true,
      },
      products: [
        {
          id: 'aren-latte',
          name: 'Aren Latte',
          category: 'Coffee',
          basePrice: 28000,
        },
        {
          id: 'sea-salt-latte',
          name: 'Sea Salt Latte',
          category: 'Coffee',
          basePrice: 32000,
        },
        {
          id: 'matcha-cloud',
          name: 'Matcha Cloud',
          category: 'Non Coffee',
          basePrice: 30000,
        },
      ],
    };
  }
}
