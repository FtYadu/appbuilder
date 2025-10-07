# Base image
FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy the entire monorepo
COPY . .

# Install dependencies
RUN pnpm install

# Build the api service
RUN pnpm --filter api-service build

# Expose port and start app
EXPOSE 3001
CMD [ "pnpm", "--filter", "api-service", "start" ]