class PaymentRecipientModel {
  final int id;
  final String provider;
  final String providerLabel;
  final String displayName;
  final String recipientName;
  final String recipientIdentifier;
  final String instructions;

  const PaymentRecipientModel({
    required this.id,
    required this.provider,
    required this.providerLabel,
    required this.displayName,
    required this.recipientName,
    required this.recipientIdentifier,
    required this.instructions,
  });

  factory PaymentRecipientModel.fromJson(Map<String, dynamic> json) {
    return PaymentRecipientModel(
      id: json['id'] is int
          ? json['id'] as int
          : int.parse(json['id'].toString()),
      provider: json['provider'] as String? ?? 'OTHER',
      providerLabel: json['provider_label'] as String? ?? 'E-payment',
      displayName: json['display_name'] as String? ?? '',
      recipientName: json['recipient_name'] as String? ?? '',
      recipientIdentifier: json['recipient_identifier'] as String? ?? '',
      instructions: json['instructions'] as String? ?? '',
    );
  }
}
