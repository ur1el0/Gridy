import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/network/api_client.dart';
import '../core/theme/app_colors.dart';
import '../models/navigator_model.dart';
import '../services/navigator_service.dart';
import '../services/storage_service.dart';

/// Screen providing authenticated resident access to the Public Information AI Navigator.
/// Strictly adheres to RA 10173 data minimization:
/// - Turns exist solely in screen state memory and are discarded upon exiting.
/// - Never writes queries or responses to StorageService, database, or analytics.
/// - Connects exclusively through the tenant-scoped Gridy backend; zero direct LLM requests.
class NavigatorScreen extends StatefulWidget {
  final ApiClient? apiClient;
  final NavigatorService? navigatorService;

  const NavigatorScreen({
    super.key,
    this.apiClient,
    this.navigatorService,
  });

  @override
  State<NavigatorScreen> createState() => _NavigatorScreenState();
}

class _NavigatorScreenState extends State<NavigatorScreen> {
  late final NavigatorService _service;
  final TextEditingController _queryController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _inputFocusNode = FocusNode();

  // In-memory conversation state only. Discarded on screen disposal.
  final List<NavigatorTurn> _turns = [];
  bool _isLoading = false;
  String? _errorMessage;
  bool _isErrorRetryable = false;
  String? _lastFailedQuery;

  static const List<String> _suggestedQuestions = [
    'How to get a barangay clearance?',
    'Are first-time jobseekers exempt from fees?',
    'What are the emergency hotlines?',
    'How to report a community issue?',
  ];

  @override
  void initState() {
    super.initState();
    final client = widget.apiClient ?? ApiClient();
    _service = widget.navigatorService ?? NavigatorService(apiClient: client);
    _hydrateCredentialsIfNeeded(client);
  }

  Future<void> _hydrateCredentialsIfNeeded(ApiClient client) async {
    if (widget.apiClient == null && widget.navigatorService == null) {
      try {
        final storage = await StorageService.init();
        final token = storage.getAccessToken();
        if (token != null && mounted) {
          client.setAuthCredentials(accessToken: token);
        }
      } catch (_) {}
    }
  }

  @override
  void dispose() {
    _turns.clear();
    _queryController.dispose();
    _scrollController.dispose();
    _inputFocusNode.dispose();
    super.dispose();
  }

  Future<void> _sendQuery([String? predefinedQuery]) async {
    final text = (predefinedQuery ?? _queryController.text).trim();
    if (text.isEmpty || _isLoading) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _isErrorRetryable = false;
      _lastFailedQuery = null;
    });

    _queryController.clear();
    _announce('Searching public barangay records');

    try {
      final response = await _service.submitQuery(text);
      if (!mounted) return;

      setState(() {
        _turns.add(
          NavigatorTurn(
            id: DateTime.now().microsecondsSinceEpoch.toString(),
            query: text,
            askedAt: DateTime.now(),
            response: response,
          ),
        );
        _isLoading = false;
      });

      _announce('Response received: ${response.answer}');
      _scrollToBottom();
    } catch (error) {
      if (!mounted) return;

      final message = _service.getRequestErrorMessage(error);
      final retryable = _service.isRequestErrorRetryable(error);

      setState(() {
        _isLoading = false;
        _errorMessage = message;
        _isErrorRetryable = retryable;
        _lastFailedQuery = text;
      });

      _announce(message);
      _scrollToBottom();
    }
  }

  void _clearConversation() {
    setState(() {
      _turns.clear();
      _queryController.clear();
      _errorMessage = null;
      _isErrorRetryable = false;
      _lastFailedQuery = null;
    });
    _announce('Conversation cleared');
  }

  void _announce(String message) {
    if (!mounted) return;
    try {
      final view = View.maybeOf(context);
      if (view != null) {
        SemanticsService.sendAnnouncement(view, message, TextDirection.ltr);
      }
    } catch (_) {}
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _dialNumber(String number) async {
    final clean = number.replaceAll(RegExp(r'[^\d+]'), '');
    final uri = Uri(scheme: 'tel', path: clean);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open phone dialer.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: AppColors.primaryNavy,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          tooltip: 'Back',
          constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Row(
          children: [
            const Icon(Icons.auto_awesome, color: Color(0xFFFBBF24), size: 20),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'Ask Barangay',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: -0.2,
                  ),
                ),
                Text(
                  'Public information assistant',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          if (_turns.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.refresh_rounded, color: Colors.white),
              tooltip: 'Clear conversation',
              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
              onPressed: _clearConversation,
            ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Public Information Safety Notice
            _buildSafetyNotice(),

            // Conversation Stream / Empty State
            Expanded(
              child: _turns.isEmpty && !_isLoading && _errorMessage == null
                  ? _buildSuggestedQuestions()
                  : _buildConversationList(),
            ),

            // Input Bar
            _buildInputBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildSafetyNotice() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        color: Color(0xFFFFFBEB),
        border: Border(
          bottom: BorderSide(color: Color(0xFFFDE68A)),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Icon(Icons.shield_outlined, color: Color(0xFFB45309), size: 18),
          SizedBox(width: 10),
          Expanded(
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: 'Public information only. ',
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                  TextSpan(
                    text:
                        'Answers come from your barangay\'s published records and may be processed by an AI service. Do not type names, contact numbers, ID numbers, payment references, or details of a personal case.',
                  ),
                ],
              ),
              style: TextStyle(
                fontSize: 11.5,
                height: 1.4,
                color: Color(0xFF78350F),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuggestedQuestions() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const SizedBox(height: 8),
        const Text(
          'Ask about clearances, requirements, fee exemptions, activities, or hotlines.',
          style: TextStyle(
            fontSize: 14,
            color: Color(0xFF334155),
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'SUGGESTED QUESTIONS',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.5,
            color: Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 10),
        ..._suggestedQuestions.map(
          (q) => Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              child: InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => _sendQuery(q),
                child: Container(
                  constraints: const BoxConstraints(minHeight: 48),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.chat_bubble_outline_rounded,
                          size: 16, color: AppColors.primaryNavy),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          q,
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildConversationList() {
    return ListView(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      children: [
        ..._turns.map((turn) => _buildTurnItem(turn)),
        if (_isLoading) _buildLoadingCard(),
        if (_errorMessage != null) _buildErrorCard(),
      ],
    );
  }

  Widget _buildTurnItem(NavigatorTurn turn) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // User Bubble
          Align(
            alignment: Alignment.centerRight,
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.85,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: const BoxDecoration(
                color: AppColors.primaryNavy,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(4),
                  bottomLeft: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    turn.query,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    formatManilaTime(turn.askedAt),
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),

          // Assistant Response Card
          _buildResponseCard(turn),
        ],
      ),
    );
  }

  Widget _buildResponseCard(NavigatorTurn turn) {
    final response = turn.response;
    final (badgeLabel, badgeColor, badgeBg, badgeIcon) = _classifyResponse(response);

    return Material(
      color: Colors.white,
      borderRadius: const BorderRadius.only(
        topLeft: Radius.circular(4),
        topRight: Radius.circular(16),
        bottomLeft: Radius.circular(16),
        bottomRight: Radius.circular(16),
      ),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(4),
            topRight: Radius.circular(16),
            bottomLeft: Radius.circular(16),
            bottomRight: Radius.circular(16),
          ),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Classification Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: badgeBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: badgeColor.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(badgeIcon, size: 14, color: badgeColor),
                const SizedBox(width: 6),
                Text(
                  badgeLabel,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: badgeColor,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Answer Text
          Text(
            response.answer,
            style: const TextStyle(
              fontSize: 13.5,
              height: 1.5,
              color: Color(0xFF0F172A),
            ),
          ),

          // Retry button for retryable assistant-unavailable response
          if (response.isRetryable) ...[
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: _isLoading ? null : () => _sendQuery(turn.query),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(120, 48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                side: const BorderSide(color: Color(0xFFCBD5E1)),
              ),
              icon: const Icon(Icons.refresh_rounded, size: 16, color: Color(0xFF334155)),
              label: const Text(
                'Try again',
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF334155),
                ),
              ),
            ),
          ],

          // Sources Cited
          if (response.sources.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Divider(color: Color(0xFFF1F5F9)),
            const SizedBox(height: 6),
            Text(
              response.isAnswered ? 'SOURCES CITED' : 'PUBLIC RECORDS YOU CAN CHECK',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 6),
            ...response.sources.map((s) => _buildSourceItem(s)),
          ],

          // Escalation Section
          const SizedBox(height: 12),
          const Divider(color: Color(0xFFF1F5F9)),
          _buildEscalationSection(response.escalation),
        ],
      ),
    ),
  );
}

  (String, Color, Color, IconData) _classifyResponse(NavigatorQueryResponseModel r) {
    if (r.isAnswered) {
      return (
        'Answer from public records',
        const Color(0xFF065F46),
        const Color(0xFFECFDF5),
        Icons.check_circle_outline_rounded,
      );
    }
    if (r.isPrivacyNotice) {
      return (
        'Privacy notice',
        const Color(0xFF92400E),
        const Color(0xFFFFFBEB),
        Icons.shield_outlined,
      );
    }
    if (r.isUnavailable) {
      return (
        'Assistant unavailable',
        const Color(0xFF9F1239),
        const Color(0xFFFFF1F2),
        Icons.info_outline_rounded,
      );
    }
    return (
      'Not in public records',
      const Color(0xFF334155),
      const Color(0xFFF1F5F9),
      Icons.help_outline_rounded,
    );
  }

  Widget _buildSourceItem(NavigatorSourceModel source) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  source.title,
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFFCBD5E1)),
                ),
                child: Text(
                  source.category.replaceAll('_', ' ').toUpperCase(),
                  style: const TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF475569),
                  ),
                ),
              ),
            ],
          ),
          if (source.reference.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              'Reference: ${source.reference}',
              style: const TextStyle(fontSize: 11, color: Color(0xFF475569)),
            ),
          ],
          if (source.updatedAt != null) ...[
            const SizedBox(height: 3),
            Row(
              children: [
                const Icon(Icons.calendar_today_outlined, size: 11, color: Color(0xFF64748B)),
                const SizedBox(width: 4),
                Text(
                  'Updated ${formatManilaDate(source.updatedAt!)}',
                  style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B)),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildEscalationSection(NavigatorEscalationModel escalation) {
    return Material(
      type: MaterialType.transparency,
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
        tilePadding: EdgeInsets.zero,
        initiallyExpanded: false,
        title: const Text(
          'Barangay Hall & emergency contacts',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: Color(0xFF334155),
          ),
        ),
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // In-person Notice
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.apartment_rounded, size: 16, color: Color(0xFF64748B)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        escalation.barangayHallNotice,
                        style: const TextStyle(fontSize: 12, color: Color(0xFF334155)),
                      ),
                    ),
                  ],
                ),

                // Office Contact
                if (escalation.officeContact != null &&
                    escalation.officeContact!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.phone_outlined, size: 16, color: Color(0xFF64748B)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Barangay office: ${escalation.officeContact}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],

                // Emergency Hotlines
                if (escalation.hotlines.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  const Text(
                    'EMERGENCY HOTLINES',
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 6),
                  ...escalation.hotlines.map(
                    (h) => Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFCBD5E1)),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  h.name,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF0F172A),
                                  ),
                                ),
                                Text(
                                  h.category,
                                  style: const TextStyle(
                                    fontSize: 10,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          TextButton.icon(
                            onPressed: () => _dialNumber(h.number),
                            style: TextButton.styleFrom(
                              minimumSize: const Size(48, 48),
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                            ),
                            icon: const Icon(Icons.call, size: 14, color: AppColors.primaryNavy),
                            label: Text(
                              h.number,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primaryNavy,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

  Widget _buildLoadingCard() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: const [
          SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryNavy),
            ),
          ),
          SizedBox(width: 12),
          Text(
            'Searching public barangay records…',
            style: TextStyle(
              fontSize: 13,
              color: Color(0xFF475569),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorCard() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF1F2),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFFECDD3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.error_outline_rounded, size: 18, color: Color(0xFFBE123C)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _errorMessage ?? 'An error occurred.',
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF881337),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          if (_isErrorRetryable && _lastFailedQuery != null) ...[
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: _isLoading ? null : () => _sendQuery(_lastFailedQuery),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(120, 48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                side: const BorderSide(color: Color(0xFFBE123C)),
              ),
              icon: const Icon(Icons.refresh_rounded, size: 16, color: Color(0xFF881337)),
              label: const Text(
                'Try again',
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF881337),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Color(0xFFE2E8F0)),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Semantics(
              label: 'Question input',
              textField: true,
              child: TextField(
                controller: _queryController,
                focusNode: _inputFocusNode,
                maxLength: 500,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _sendQuery(),
                decoration: InputDecoration(
                  hintText: 'Ask a question about barangay public services…',
                  hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                  counterText: '',
                  filled: true,
                  fillColor: const Color(0xFFF1F5F9),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.send_rounded),
            color: AppColors.primaryNavy,
            tooltip: 'Send question',
            constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
            onPressed: _isLoading ? null : () => _sendQuery(),
          ),
        ],
      ),
    );
  }
}
