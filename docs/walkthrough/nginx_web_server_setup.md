# Production Web Server Architecture (Nginx & Multi-Stage Docker)

This guide details the Nginx web server deployment and multi-stage containerization pipeline used to serve the Gridy React frontend application.

---

## 1. Why Nginx in Production?

In local development, the frontend runs using Vite's internal Node.js development server (`npm run dev`). However, in production, Node.js development servers are unsuitable:
1. **Memory & Resource Overhead**: Node.js processes consume 150MB–300MB of RAM simply listening for client connections.
2. **Missing Static Optimizations**: Development servers do not pre-compress assets with Gzip or provide edge HTTP caching headers.
3. **Process Crash Vulnerability**: Node.js is single-threaded and susceptible to unhandled runtime thread crashes.

**Nginx** is a high-performance, asynchronous event-driven HTTP server designed to serve static assets with near-zero CPU overhead, consuming less than 20MB of RAM while handling thousands of concurrent client connections.

---

## 2. Multi-Stage Docker Pipeline (`frontend/Dockerfile`)

To keep the production container ultra-lightweight and secure, Gridy utilizes a **multi-stage build**:

```dockerfile
# Stage 1: Compilation Engine
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production Web Server
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Benefits:
* **Attack Surface Reduction**: The final production image contains zero Node.js runtimes, package managers (`npm`), or dev dependencies.
* **Minimal Footprint**: The image size drops from over 800MB (full Node build environment) to approximately 25MB (Nginx Alpine plus compiled static assets).

---

## 3. SPA Routing & Fallback (`try_files`)

In a Single Page Application (SPA), React Router handles navigation entirely client-side using the HTML5 History API (`pushState`).

If a barangay official navigates to `https://gridy.app/admin/clearances` and refreshes their browser:
1. The browser requests `/admin/clearances` directly from Nginx.
2. Because `/admin/clearances` does not exist as a physical file on the server, Nginx would return a `404 Not Found` by default.
3. To resolve this, Nginx is configured with the `try_files` fallback directive in `frontend/nginx.conf`:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

This directive instructs Nginx:
* First, look for a static file matching the URI (`$uri`).
* Second, look for a directory matching the URI (`$uri/`).
* Third, if neither exists, return `/index.html` with an HTTP 200 status, allowing React Router to mount and render the intended view.

---

## 4. Asset Compression (Gzip)

To ensure rapid load times even under low-bandwidth rural government connectivity, Nginx is configured with automatic Gzip compression:

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

This compresses text, CSS, JavaScript, and JSON payloads on the fly by 60% to 75%, substantially lowering bandwidth consumption.