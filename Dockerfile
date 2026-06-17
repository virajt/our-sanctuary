# Use official Node.js image as the builder and runner
FROM node:20-alpine

WORKDIR /app

# Copy dependency configuration
COPY package.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm install

# Copy application source code
COPY . .

# Build Vite frontend and bundle backend server
RUN npm run build

# Expose port (Cloud Run will inject PORT at runtime)
EXPOSE 3000

# Set environment variable for production
ENV NODE_ENV=production

# Start the Node.js Express server
CMD ["npm", "start"]
