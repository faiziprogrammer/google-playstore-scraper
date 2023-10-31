#!/bin/bash

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Build the React frontend (if necessary)
npm run build

# Start the backend and frontend concurrently
cd ../backend
npm start

