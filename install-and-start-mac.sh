#!/bin/bash

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Build the React frontend (if necessary)
npm run concurrently


