import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_strings.dart';
import '../../auth/application/auth_controller.dart';
import '../../auth/domain/auth_models.dart';

class ActiveSessionsScreen extends ConsumerStatefulWidget {
  const ActiveSessionsScreen({super.key});

  @override
  ConsumerState<ActiveSessionsScreen> createState() =>
      _ActiveSessionsScreenState();
}

class _ActiveSessionsScreenState extends ConsumerState<ActiveSessionsScreen> {
  late Future<List<AccountSessionView>> _sessions;

  @override
  void initState() {
    super.initState();
    _sessions = ref.read(authRepositoryProvider).listSessions();
  }

  void _reload() {
    setState(() {
      _sessions = ref.read(authRepositoryProvider).listSessions();
    });
  }

  Future<void> _revoke(AccountSessionView session) async {
    await ref.read(authRepositoryProvider).revokeSession(session.id);
    _reload();
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    return Scaffold(
      appBar: AppBar(title: Text(strings.activeDevices)),
      body: FutureBuilder<List<AccountSessionView>>(
        future: _sessions,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(CoffeeSpacing.lg),
                child: Text(strings.sessionLoadFailed),
              ),
            );
          }
          final sessions = snapshot.data ?? const <AccountSessionView>[];
          if (sessions.isEmpty) {
            return Center(child: Text(strings.noActiveSessions));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(CoffeeSpacing.md),
            itemCount: sessions.length,
            separatorBuilder: (_, _) => const Divider(),
            itemBuilder: (context, index) {
              final session = sessions[index];
              final hasDevice = session.deviceName?.trim().isNotEmpty == true;
              final title = hasDevice
                  ? session.deviceName!
                  : (session.platform ?? 'Fusionify Coffee');
              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Icon(
                  session.isCurrent
                      ? Icons.smartphone
                      : Icons.devices_other_outlined,
                ),
                title: Text(title),
                subtitle: Text(
                  session.isCurrent
                      ? strings.currentDevice
                      : (session.platform ?? ''),
                ),
                trailing: session.isCurrent
                    ? const Icon(
                        Icons.check_circle,
                        color: CoffeeColors.success,
                      )
                    : TextButton(
                        onPressed: () => _revoke(session),
                        child: Text(strings.revokeSession),
                      ),
              );
            },
          );
        },
      ),
    );
  }
}
