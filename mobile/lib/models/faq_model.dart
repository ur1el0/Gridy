class FAQModel {
  final int id;
  final String question;
  final String answer;
  final int order;
  final String category;

  const FAQModel({
    required this.id,
    required this.question,
    required this.answer,
    required this.order,
    required this.category,
  });

  factory FAQModel.fromJson(Map<String, dynamic> json) {
    return FAQModel(
      id: json['id'] as int? ?? 0,
      question: json['question'] as String? ?? '',
      answer: json['answer'] as String? ?? '',
      order: json['order'] as int? ?? 0,
      category: json['category'] as String? ?? 'OTHER',
    );
  }
}
