FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy server source code
COPY server/ ./server/

# Create placeholder directories
RUN mkdir -p dist www data

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production
ENV STATIC_DIR=/app/www
ENV MINERADIO_BEAT_CACHE_DIR=/tmp/beatmaps

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "const h=require('http');h.get('http://127.0.0.1:3000/api/login/status',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

# Start the full server directly
CMD ["node", "server/server.js"]
