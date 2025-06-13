# Azure App Service Startup Script
# This tells Azure App Service how to start your application

# Install dependencies for both frontend and backend
npm install
cd backend && npm install && cd ..

# Build the frontend
npm run build

# Start the backend server
node backend/server.js
