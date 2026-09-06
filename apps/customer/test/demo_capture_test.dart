import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/app/app.dart';
import 'package:fusionify_coffee/app/router.dart';
import 'package:fusionify_coffee/features/catalog/application/catalog_provider.dart';
import 'package:fusionify_coffee/features/catalog/domain/catalog_models.dart';

const _captureDemo = bool.fromEnvironment('CAPTURE_DEMO');

const _demoCatalog = CatalogSnapshot(
  preview: true,
  outlet: Outlet(
    id: 'preview-outlet',
    name: 'Fusionify Coffee Preview Store',
    note: 'Jl. Pajajaran, Bogor · Buka sampai 22.00',
    imageUrl: 'asset://outlets/preview-store.webp',
    currency: 'IDR',
    pickupEnabled: true,
    deliveryEnabled: true,
  ),
  campaigns: [
    Campaign(
      id: 'signature-lineup',
      title: 'Signature Fusion',
      body: 'Tiga rasa andalan untuk nemenin harimu.',
      ctaLabel: 'Lihat Menu',
      imageUrl: 'asset://campaigns/signature-lineup.webp',
      actionPath: '/menu',
    ),
    Campaign(
      id: 'morning-pickup',
      title: 'Pagi Tanpa Antre',
      body: 'Pesan dulu, ambil saat kopi dan sarapanmu siap.',
      ctaLabel: 'Pesan Sekarang',
      imageUrl: 'asset://campaigns/morning-pickup.webp',
      actionPath: '/menu',
    ),
    Campaign(
      id: 'fusion-black-rewards',
      title: 'Menuju Fusion Black',
      body: 'Naik tier lewat transaksi yang tercatat di akunmu.',
      ctaLabel: 'Lihat Membership',
      imageUrl: 'asset://campaigns/fusion-black-rewards.webp',
      actionPath: '/rewards',
    ),
  ],
  products: [
    Product(
      id: 'aren-latte',
      name: 'Aren Latte',
      categoryId: 'coffee',
      description: 'Espresso, susu segar, dan gula aren.',
      category: 'Kopi',
      basePrice: 28000,
      modifierGroups: [],
      isBestseller: true,
      imageUrl: 'asset://products/aren-latte.webp',
    ),
    Product(
      id: 'sea-salt-latte',
      name: 'Sea Salt Latte',
      categoryId: 'coffee',
      description: 'Latte lembut dengan krim sea salt.',
      category: 'Kopi',
      basePrice: 32000,
      modifierGroups: [],
      imageUrl: 'asset://products/sea-salt-latte.webp',
    ),
    Product(
      id: 'buttercream-latte',
      name: 'Buttercream Latte',
      categoryId: 'coffee',
      description: 'Espresso creamy dan buttercream lembut.',
      category: 'Kopi',
      basePrice: 33000,
      modifierGroups: [],
      isBestseller: true,
      imageUrl: 'asset://products/buttercream-latte.webp',
    ),
    Product(
      id: 'matcha-cloud',
      name: 'Matcha Cloud',
      categoryId: 'non-coffee',
      description: 'Matcha creamy dengan foam ringan.',
      category: 'Non-Kopi',
      basePrice: 30000,
      modifierGroups: [],
      imageUrl: 'asset://products/matcha-cloud.webp',
    ),
    Product(
      id: 'pandan-coconut-latte',
      name: 'Pandan Coconut Latte',
      categoryId: 'non-coffee',
      description: 'Pandan harum dan kelapa creamy.',
      category: 'Non-Kopi',
      basePrice: 31000,
      modifierGroups: [],
      imageUrl: 'asset://products/pandan-coconut-latte.webp',
    ),
    Product(
      id: 'chocolate-malt-cloud',
      name: 'Chocolate Malt Cloud',
      categoryId: 'non-coffee',
      description: 'Cokelat malt dingin dengan foam ringan.',
      category: 'Non-Kopi',
      basePrice: 32000,
      modifierGroups: [],
      imageUrl: 'asset://products/chocolate-malt-cloud.webp',
    ),
  ],
);

void main() {
  testWidgets(
    'captures rendered customer home and menu demo',
    (tester) async {
      await tester.binding.setSurfaceSize(const Size(390, 844));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      appRouter.go('/');
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            catalogProvider.overrideWith((ref) async => _demoCatalog),
          ],
          child: const FusionifyCoffeeApp(),
        ),
      );
      await tester.pumpAndSettle();

      await expectLater(
        find.byType(Scaffold).first,
        matchesGoldenFile('captures/demo-home.png'),
      );

      appRouter.go('/menu');
      await tester.pumpAndSettle();

      await expectLater(
        find.byType(Scaffold).first,
        matchesGoldenFile('captures/demo-menu.png'),
      );
    },
    skip: !_captureDemo,
  );
}
