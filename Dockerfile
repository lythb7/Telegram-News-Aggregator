FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci

# Generate Prisma client (includes correct Linux Alpine binary)
COPY prisma ./prisma
RUN npx prisma generate

# Copy source
COPY . .

# Build Next.js
RUN npm run build

# Create runtime directories
RUN mkdir -p uploads data

EXPOSE 3000

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Push DB schema then start the app
CMD ["sh", "-c", "npx prisma db push && npm start"]
