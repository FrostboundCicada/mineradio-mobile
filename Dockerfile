FROM node:20-slim

WORKDIR /app

# Copy package files and install ALL dependencies (including dev for build)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Create placeholder dist directory (Suga platform expects it)
RUN mkdir -p dist

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

# Expose the port
EXPOSE 3000

# Start the cloud server (handles CORS + proxies to internal server.js)
CMD ["node", "server/cloud-server.js"]
