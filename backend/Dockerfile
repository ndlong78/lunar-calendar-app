FROM node:22-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Install dependencies first to leverage Docker layer caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

EXPOSE 5000

CMD ["npm", "start"]
