# MongoDB Setup Guide for macOS

## Option 1: Install MongoDB Community Edition (Recommended)

### Step 1: Install MongoDB using Homebrew

```bash
# Tap the MongoDB formula
brew tap mongodb/brew

# Install MongoDB Community Edition
brew install mongodb-community@8.0

# Or for latest version
brew install mongodb-community
```

### Step 2: Start MongoDB

After installation, start MongoDB using one of these methods:

**Method A: As a macOS service (recommended)**
```bash
brew services start mongodb-community@8.0
```

**Method B: Run manually in foreground**
```bash
mongod --config /usr/local/etc/mongod.conf --fork
```

**Method C: Run manually with custom data directory**
```bash
# Create data directory
mkdir -p ~/mongodb-data

# Start MongoDB
mongod --dbpath ~/mongodb-data
```

### Step 3: Verify MongoDB is Running

```bash
# Check if MongoDB is running
mongosh

# Should connect to MongoDB shell
# Type 'exit' to quit
```

---

## Option 2: Use MongoDB Compass (GUI - Easiest for Development)

### Step 1: Download MongoDB Compass

1. Visit: https://www.mongodb.com/try/download/compass
2. Download the macOS version
3. Install the application

### Step 2: Launch Compass

1. Open MongoDB Compass
2. Connection string: `mongodb://localhost:27017`
3. Click "Connect"

### Step 3: MongoDB Server via Docker (if you have Docker)

```bash
# Pull MongoDB image
docker pull mongodb/mongodb-community-server:latest

# Run MongoDB container
docker run --name mongodb \
  -p 27017:27017 \
  -d mongodb/mongodb-community-server:latest

# Stop MongoDB
docker stop mongodb

# Start MongoDB
docker start mongodb
```

---

## Option 3: Use MongoDB Atlas (Cloud - Free Tier Available)

1. Visit: https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a free cluster
4. Get connection string
5. Update your `.env` file:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/cosmetic-reservation
MONGO_URI_TEST=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/cosmetic-reservation-test
```

---

## Quick Start Recommendation

For local development, I recommend **Option 2 (MongoDB Compass)** as it's the easiest:

1. **Download MongoDB Compass:** https://www.mongodb.com/try/download/compass
2. **Install and Open** Compass
3. **Connect** using default connection: `mongodb://localhost:27017`
4. MongoDB server starts automatically with Compass

---

## Environment Configuration

Create/Update your `.env` file:

```env
# Local MongoDB (default)
MONGO_URI=mongodb://localhost:27017/cosmetic-reservation
MONGO_URI_TEST=mongodb://localhost:27017/cosmetic-reservation-test

# Optional settings
PORT=3000
OWNER_EMAIL=your-email@example.com
```

---

## Testing the Connection

Once MongoDB is running, test your application:

```bash
# Run the development server
npm run dev

# In another terminal, run tests
npm test
```

---

## Troubleshooting

### Issue: "brew services" command not found

**Solution:** Update Homebrew first:
```bash
brew update
brew tap homebrew/services
```

### Issue: Port 27017 already in use

**Solution:** Kill existing MongoDB process:
```bash
# Find MongoDB process
lsof -i :27017

# Kill the process (replace PID with actual number)
kill -9 <PID>
```

### Issue: Connection refused when running tests

**Solutions:**
1. Make sure MongoDB is running
2. Check if port 27017 is accessible: `telnet localhost 27017`
3. Try MongoDB Compass to verify connection

---

## Current Project Configuration

Your project is configured to use:
- **Development DB:** `mongodb://localhost:27017/cosmetic-reservation`
- **Test DB:** `mongodb://localhost:27017/cosmetic-reservation-test`

Both will be automatically created when you first connect.

---

## Next Steps

1. Choose an installation option above
2. Install and start MongoDB
3. Run: `npm run dev` to start the server
4. Visit: `http://localhost:3000/` to use the GUI
5. Run: `npm test` to verify tests work

---

## Need Help?

- MongoDB Documentation: https://www.mongodb.com/docs/manual/installation/
- MongoDB Compass: https://www.mongodb.com/products/compass
- Project Issues: Check `CHANGELOG.md` and `PROJECT_SUMMARY.md`
