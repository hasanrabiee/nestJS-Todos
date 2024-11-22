# Stage 1: Build Stage
FROM node:18 AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# Add the Nest CLI to the PATH for development use
ENV PATH /app/node_modules/.bin:$PATH

# Build the application (only for production builds)
RUN npm run build

# Stage 2: Development & Production Stage
FROM node:18

WORKDIR /app

# Copy application files and node_modules from the builder stage
COPY --from=builder /app .

# Add the Nest CLI to the PATH for live reload and dev commands
ENV PATH /app/node_modules/.bin:$PATH

# Expose application port
EXPOSE 3000

# Command will be overridden by docker-compose for development or production
CMD ["npm", "run", "start"]
