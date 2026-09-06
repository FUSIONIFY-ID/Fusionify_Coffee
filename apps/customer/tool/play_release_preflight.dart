import 'dart:io';

import 'package:fusionify_coffee/core/network/api_base_url.dart';

const applicationId = 'id.fusionify.coffee';

void main(List<String> arguments) {
  final values = <String, String>{};
  for (final argument in arguments) {
    final separator = argument.indexOf('=');
    if (!argument.startsWith('--') || separator < 3) {
      _fail('Arguments must use --name=value.');
    }
    values[argument.substring(2, separator)] = argument.substring(
      separator + 1,
    );
  }

  final apiBaseUrl = values['api-base-url'] ?? '';
  final buildName = values['build-name'] ?? '';
  final buildNumber = int.tryParse(values['build-number'] ?? '');

  try {
    resolveApiBaseUrl(
      explicitBaseUrl: apiBaseUrl,
      releaseMode: true,
      developmentFallback: '',
    );
  } on StateError catch (error) {
    _fail(error.message);
  }

  if (!RegExp(r'^\d+\.\d+\.\d+$').hasMatch(buildName)) {
    _fail('build-name must use semantic version format, for example 0.1.0.');
  }
  if (buildNumber == null || buildNumber < 1) {
    _fail('build-number must be a positive integer.');
  }

  stdout.writeln('Play release preflight passed.');
  stdout.writeln('Application ID: $applicationId');
  stdout.writeln('Version: $buildName+$buildNumber');
}

Never _fail(String message) {
  stderr.writeln('Play release preflight failed: $message');
  exit(64);
}
