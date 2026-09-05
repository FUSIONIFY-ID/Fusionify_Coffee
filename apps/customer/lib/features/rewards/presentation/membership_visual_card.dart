import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/rewards_strings.dart';

String membershipBackgroundAssetForRank(int rank) {
  return _MembershipCardStyle.forRank(rank).asset;
}

class MembershipVisualCard extends StatelessWidget {
  const MembershipVisualCard({
    super.key,
    required this.tierName,
    required this.rank,
    required this.supportingText,
    this.memberName,
    this.onTap,
  });

  final String tierName;
  final int rank;
  final String supportingText;
  final String? memberName;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final style = _MembershipCardStyle.forRank(rank);
    final strings = context.strings;

    return Semantics(
      button: onTap != null,
      label: '${strings.membership}: $tierName',
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 260),
        child: AspectRatio(
          key: ValueKey(style.asset),
          aspectRatio: 1.586,
          child: Material(
            color: style.fallbackColor,
            borderRadius: BorderRadius.circular(CoffeeRadius.card),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: onTap,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.asset(
                    style.asset,
                    fit: BoxFit.cover,
                    excludeFromSemantics: true,
                  ),
                  Padding(
                    padding: const EdgeInsets.all(CoffeeSpacing.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.local_cafe_outlined,
                              size: 20,
                              color: style.foregroundColor,
                            ),
                            const SizedBox(width: CoffeeSpacing.xs),
                            Expanded(
                              child: Text(
                                'FUSIONIFY COFFEE',
                                style: TextStyle(
                                  color: style.foregroundColor,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.2,
                                ),
                              ),
                            ),
                            if (onTap != null)
                              Icon(
                                Icons.chevron_right,
                                color: style.foregroundColor,
                              ),
                          ],
                        ),
                        const Spacer(),
                        Text(
                          tierName.toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(
                                color: style.foregroundColor,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.4,
                              ),
                        ),
                        if (memberName != null && memberName!.trim().isNotEmpty)
                          Text(
                            memberName!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: style.foregroundColor.withValues(
                                alpha: 0.82,
                              ),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        const SizedBox(height: CoffeeSpacing.md),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Expanded(
                              child: Text(
                                supportingText,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: style.foregroundColor.withValues(
                                    alpha: 0.82,
                                  ),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            const SizedBox(width: CoffeeSpacing.sm),
                            Text(
                              strings.digitalMember,
                              style: TextStyle(
                                color: style.foregroundColor,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MembershipCardStyle {
  const _MembershipCardStyle({
    required this.asset,
    required this.foregroundColor,
    required this.fallbackColor,
  });

  final String asset;
  final Color foregroundColor;
  final Color fallbackColor;

  static _MembershipCardStyle forRank(int rank) {
    if (rank >= 4) {
      return const _MembershipCardStyle(
        asset: 'assets/membership/fusion-black.webp',
        foregroundColor: Colors.white,
        fallbackColor: Color(0xFF121212),
      );
    }
    if (rank == 3) {
      return const _MembershipCardStyle(
        asset: 'assets/membership/fusion-gold.webp',
        foregroundColor: Color(0xFF251A0A),
        fallbackColor: Color(0xFFD5A94E),
      );
    }
    if (rank == 2) {
      return const _MembershipCardStyle(
        asset: 'assets/membership/fusion-silver.webp',
        foregroundColor: Color(0xFF181816),
        fallbackColor: Color(0xFFD5D7DA),
      );
    }
    return const _MembershipCardStyle(
      asset: 'assets/membership/fusion-blue.webp',
      foregroundColor: Colors.white,
      fallbackColor: CoffeeColors.primary,
    );
  }
}
