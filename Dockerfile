FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy server source code
COPY server/ ./server/

# Create placeholder dist and www directories
RUN mkdir -p dist www

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production
ENV STATIC_DIR=/app/www

# Expose the port
EXPOSE 3000

# Start the full server directly (it handles both API and static files)
CMD ["node", "server/server.js"]
