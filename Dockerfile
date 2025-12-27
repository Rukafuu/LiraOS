# Use Node 22 (supports Prisma 7)
FROM node:22-slim

# Install system dependencies required for Prisma (OpenSSL)
RUN apt-get update -y && apt-get install -y openssl ca-certificates procps

# Set working directory
WORKDIR /app

# Copy the entire repository
COPY . .

# Change to backend directory
WORKDIR /app/Chat/backend

# Install dependencies (Prisma 7 requires Node 20.19+ or 22+)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Expose port (railway usually sets PORT env var)
ENV PORT=4000
EXPOSE 4000

# Start command
# Start command with DB push
CMD npx prisma db push --accept-data-loss && npm start
