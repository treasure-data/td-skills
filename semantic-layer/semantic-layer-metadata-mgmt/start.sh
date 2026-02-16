#!/bin/bash

# Semantic Layer Metadata Management - Startup Script

echo "🚀 Starting Semantic Layer Metadata Management..."
echo ""

# Check if .env files exist
if [ ! -f ".env" ]; then
    echo "⚠️  Frontend .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Created .env - please update with your configuration"
fi

if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Copying from backend/.env.example..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env - please update with your TD API key"
    echo ""
    echo "❌ Cannot start without TD API key. Please:"
    echo "   1. Edit backend/.env"
    echo "   2. Set TD_API_KEY=your-api-key"
    echo "   3. Run this script again"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
    echo "✅ Frontend dependencies installed"
    echo ""
fi

# Check if backend venv exists
if [ ! -d "backend/venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo "✅ Backend dependencies installed"
    echo ""
fi

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Start backend
echo "🔧 Starting backend server (port 5000)..."
cd backend
source venv/bin/activate
python api.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 2

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend started successfully (PID: $BACKEND_PID)"
else
    echo "❌ Backend failed to start. Check backend.log for details"
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend server (port 3000)..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 2

# Check if frontend started successfully
if ps -p $FRONTEND_PID > /dev/null; then
    echo "✅ Frontend started successfully (PID: $FRONTEND_PID)"
else
    echo "❌ Frontend failed to start. Check frontend.log for details"
    kill $BACKEND_PID
    exit 1
fi

echo ""
echo "✨ Application is running!"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend:  http://localhost:5000"
echo ""
echo "📋 Logs:"
echo "   - Backend:  tail -f backend.log"
echo "   - Frontend: tail -f frontend.log"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for processes
wait
