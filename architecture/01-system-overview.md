# 01 System Overview

## 1. Project Context & Objectives

Gridy is a comprehensive Web and Mobile-Based Barangay Information and Service Management System designed to transition local governance from fragmented, manual processes to a centralized digital ecosystem. It is built to support a hybrid communication approach, bridging digital applications with traditional face-to-face local transactions.

Following the enterprise software engineering lifecycle, the system objectives are:

- **Analyze:** Current information dissemination and manual queue practices within local government units.
- **Design:** A scalable, secure client-server architecture including a Web Admin Dashboard (ReactJS) and Resident Mobile App (Flutter).
- **Develop:**
  - An administration module for announcements, schedules, and resident accounts.
  - A hybrid queue management system (coupling physical queue tickets with live mobile tracking).
  - A resident issue-reporting pipeline (incorporating image capture and compression).
  - A document request processing and tracking system.
  - An automated notification system utilizing push payloads (FCM).
- **Test & Evaluate:** Assess usability, reliability, and functional suitability under ISO/IEC 25010 standards.

## 2. High-Level Implementation Scope

- **Web Portal (ReactJS):** Serves as the administrative command center for barangay officials to post announcements, validate requested documents, manage live queues, and review reported issues.
- **Mobile App (Flutter):** Provides residents with self-service capabilities, allowing them to view official announcements/schedules, submit document requests, report localized issues with image evidence, and scan physical queue slips to track status.

## 3. Validation and Evaluation Sites

- **Target Scope:** The system's usability and utility are evaluated by a minimum of 50 survey respondents (officials and residents) across two case-study environments:
  1.  _Barangay Ibabang Dupay_ (Lucena City)
  2.  _Barangay Daungan_ (Pagbilao, Quezon)
