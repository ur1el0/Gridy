# Stage 1: Builder
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm install

# Copy source code and build the Vite/React app
COPY . .
RUN npm run build


# Stage 2: Production Server (Nginx)
FROM nginx:alpine

# Remove default Nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy build files from the Builder stage (Vite outputs to /dist)
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom Nginx routing config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]