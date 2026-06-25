# Use official Node.js image as the builder and runner
FROM node:20-alpine

WORKDIR /app

# Copy dependency configuration
COPY package.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm install

# Copy application source code
COPY . .

# GOOGLE_CLIENT_ID must be available at BUILD time (not just runtime) because
# Vite bakes it into the static JS bundle it produces. It is not a secret -
# Google OAuth Client IDs are meant to be public, they identify the app to
# Google, not the user - so it's safe to pass as a build arg.
ARG GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}

# Build Vite frontend and bundle backend server
RUN npm run build

# Expose port (Cloud Run will inject PORT at runtime)
EXPOSE 3000

# Set environment variable for production
ENV NODE_ENV=production

# Start the Node.js Express server
CMD ["npm", "start"]
