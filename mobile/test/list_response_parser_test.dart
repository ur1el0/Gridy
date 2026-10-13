import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/list_response_parser.dart';

void main() {
  test('reads rows from a DRF paginated response', () {
    final rows = decodeListResponse(
      jsonEncode({
        'count': 2,
        'next': 'https://example.test/items/?page=2',
        'previous': null,
        'results': [
          {'id': 1, 'name': 'First'},
        ],
      }),
    );

    expect(rows, [
      <String, dynamic>{'id': 1, 'name': 'First'},
    ]);
  });

  test('continues to accept legacy raw list responses', () {
    final rows = decodeListResponse(
      jsonEncode([
        {'id': 2, 'name': 'Second'},
      ]),
    );

    expect(rows.single['id'], 2);
  });

  test('rejects malformed list envelopes and non-object rows', () {
    expect(
      () => decodeListResponse('{"count": 0, "results": null}'),
      throwsFormatException,
    );
    expect(() => decodeListResponse('[1, 2]'), throwsFormatException);
  });
}
