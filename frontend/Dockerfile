# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_ENV=production

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:1.27-alpine

COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
