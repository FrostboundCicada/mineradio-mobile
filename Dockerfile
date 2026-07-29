FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy server source code
COPY server/ ./server/

# Create placeholder directories
RUN mkdir -p dist www data

# Ensure node is in PATH
ENV PATH="/usr/local/bin:${PATH}"
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production
ENV STATIC_DIR=/app/www
ENV MINERADIO_BEAT_CACHE_DIR=/tmp/beatmaps

# Expose the port
EXPOSE 3000

# Start the full server directly
CMD ["node", "server/server.js"]
