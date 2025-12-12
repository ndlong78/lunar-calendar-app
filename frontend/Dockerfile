# Build stage
FROM node:22-alpine AS builder

# frontend/Dockerfile (Development)
#FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

EXPOSE 3000

# Start dev server
CMD ["npm", "start"]
