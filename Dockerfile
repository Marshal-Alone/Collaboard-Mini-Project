FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

# Copy backend source code
COPY backend/ ./

# Copy frontend source code
COPY frontend/ ../frontend/

# Expose the port
EXPOSE 5050

# Start the application
CMD ["npm", "start"]
