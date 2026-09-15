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