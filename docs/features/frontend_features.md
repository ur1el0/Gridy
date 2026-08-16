# Gridy Frontend Architecture & Features Manual

This document details the core frontend features and architecture implemented in the Gridy Web Admin Panel (Phase 6), built using ReactJS, TypeScript, and Vite.

---

## 1. Authentication & State Persistence
* **JWT Context Flow**: Leverages a React `AuthContext` provider to maintain active user session data across all components.
* **Axios Interceptors**: A pre-configured `axiosPrivate` instance automatically attaches Bearer tokens to all outbound API requests. If a `401 Unauthorized` occurs, the interceptor transparently calls the `/auth/refresh/` endpoint, rotates the token, and replays the original request to ensure a seamless session experience without forcing re-logins.
* **Protected Routing**: Wraps all administrative pages inside a `<ProtectedRoute>` component that automatically redirects unauthenticated traffic to the `/login` portal.

---

## 2. Dashboard & Analytics
* **API Integration**: Fetches real-time profile data and aggregated system metrics (`/api/v1/dashboard/summary/`) on component mount.
* **Responsive Layout**: Adapts gracefully from desktop to tablet devices using Tailwind CSS flex and grid utilities.

---

## 3. Document Requests Management
* **Dynamic Data Tables**: Renders active resident requests for clearances and certificates with visual urgency indicators.
* **Slide-over Review Modal**: Officials can click on a request to open a detailed slide-over panel, reviewing the resident's data and safely transitioning the status between `PENDING`, `APPROVED`, or `REJECTED`.

---

## 4. Issue Reports Triage
* **Visual Urgency Badges**: Reports are color-coded (Low, Medium, High, Urgent) to aid officials in rapid prioritization.
* **Image Lightbox**: integrates full-screen image viewing capabilities, fetching the Cloudinary CDN URLs attached to incident reports (e.g., potholes, hazards) for detailed inspection.

---

## 5. Live Queue Dashboard (Real-Time Service)
* **API Polling Architecture**: Implements a `useEffect` interval loop that queries the backend `/tickets/` endpoint every 5 seconds. This provides real-time "Now Serving" updates without the overhead of WebSockets.
* **Dual-Panel Interface**: 
  * **Now Serving**: Highlights the currently active ticket in high-visibility typography with a one-click "Complete" action.
  * **Waiting List**: A tabular view of all pending tickets with "Call Next" buttons to dynamically advance the queue.

---

## 6. Communications & Bulletins
* **Announcements Board**: Interfaces with the backend to publish community-wide alerts or pin vital updates.
* **Activity Schedules**: Dedicated UI to manage upcoming Barangay events and milestones.
