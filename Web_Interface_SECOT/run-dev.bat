@echo off
echo Starting SECOT Dashboard development environment...

REM Start the backend in a new window
start cmd /k "cd backend && cargo run"

REM Start the frontend in a new window
start cmd /k "cd frontend && npm run dev"

echo Development servers started!
