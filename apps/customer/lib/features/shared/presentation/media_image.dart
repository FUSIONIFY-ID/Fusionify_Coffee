import 'package:flutter/material.dart';

import '../../../app/theme.dart';

const _bundledMediaRoots = {'campaigns', 'outlets', 'products'};

String? assetPathFromMediaUrl(String? value) {
  final source = value?.trim();
  if (source == null || source.isEmpty) {
    return null;
  }

  String decodedSource;
  try {
    decodedSource = Uri.decodeComponent(source);
  } on FormatException {
    return null;
  }
  if (!decodedSource.toLowerCase().startsWith('asset://') ||
      decodedSource.contains('\\') ||
      decodedSource
          .substring('asset://'.length)
          .split('/')
          .any((segment) => segment == '.' || segment == '..')) {
    return null;
  }

  final uri = Uri.tryParse(source);
  if (uri == null ||
      uri.scheme != 'asset' ||
      uri.host.isEmpty ||
      uri.userInfo.isNotEmpty ||
      uri.hasPort ||
      uri.hasQuery ||
      uri.hasFragment) {
    return null;
  }

  final segments = [uri.host, ...uri.pathSegments];
  if (!_bundledMediaRoots.contains(segments.first) ||
      segments.any((segment) => segment.isEmpty || segment == '..')) {
    return null;
  }

  return 'assets/${segments.join('/')}';
}

bool isRemoteMediaUrl(String? value) {
  final source = value?.trim();
  if (source == null || source.isEmpty) {
    return false;
  }

  final uri = Uri.tryParse(source);
  return uri != null &&
      (uri.scheme == 'https' || uri.scheme == 'http') &&
      uri.host.isNotEmpty;
}

class MediaImage extends StatelessWidget {
  const MediaImage({
    super.key,
    required this.mediaUrl,
    required this.fit,
    this.semanticLabel,
    this.bundledFallback,
    this.placeholderIcon = Icons.image_outlined,
  });

  final String? mediaUrl;
  final BoxFit fit;
  final String? semanticLabel;
  final String? bundledFallback;
  final IconData placeholderIcon;

  @override
  Widget build(BuildContext context) {
    final asset = assetPathFromMediaUrl(mediaUrl);
    if (asset != null) {
      return _asset(asset);
    }

    if (isRemoteMediaUrl(mediaUrl)) {
      return Image.network(
        mediaUrl!.trim(),
        fit: fit,
        semanticLabel: semanticLabel,
        frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
          if (wasSynchronouslyLoaded || frame != null) {
            return child;
          }
          return _placeholder();
        },
        errorBuilder: (_, _, _) => _fallback(),
      );
    }

    return _fallback();
  }

  Widget _asset(String asset) {
    return Image.asset(
      asset,
      fit: fit,
      semanticLabel: semanticLabel,
      errorBuilder: (_, _, _) => _fallback(skipAsset: asset),
    );
  }

  Widget _fallback({String? skipAsset}) {
    if (bundledFallback != null && bundledFallback != skipAsset) {
      return Image.asset(
        bundledFallback!,
        fit: fit,
        semanticLabel: semanticLabel,
        errorBuilder: (_, _, _) => _placeholder(),
      );
    }
    return _placeholder();
  }

  Widget _placeholder() {
    return ColoredBox(
      color: CoffeeColors.surfaceWarm,
      child: Center(
        child: Icon(
          placeholderIcon,
          size: 42,
          color: CoffeeColors.textSecondary,
        ),
      ),
    );
  }
}
