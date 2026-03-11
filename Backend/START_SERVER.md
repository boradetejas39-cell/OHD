# How to Start the Backend Server

## Quick Start

1. **Navigate to Backend directory:**
   ```bash
   cd Backend
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Make sure you have a `.env` file:**
   - Copy `env.example` to `.env` if it doesn't exist
   - Update the MongoDB connection string

4. **Start the server:**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   Server is running on port 5000
   Environment: development
   MongoDB connected successfully
   ```

## Troubleshooting

### Port 5000 already in use?
```bash
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace <PID> with actual PID)
taskkill /PID <PID> /F
```

### MongoDB connection error?
- Make sure MongoDB is running
- Check your `.env` file has correct `MONGODB_URI`
- Default: `mongodb://localhost:27017/ohd`

### Dependencies not installed?
```bash
npm install
```

## Verify Server is Running

1. Open browser: `http://localhost:5000`
   - Should show: `{"message":"OHD Backend API Server","status":"running","version":"1.0.0"}`

2. Test API: `http://localhost:5000/api/auth/login`
   - Should return JSON (even if error, means server is working)

