FROM node:22-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./

# Install ALL dependencies (important for Nest build)
RUN npm install

# Copy source code
COPY . .

# Build NestJS app
RUN npm run build

# Expose port (match your app PORT)
EXPOSE 5004

# Run production server
CMD ["node", "dist/main.js"]