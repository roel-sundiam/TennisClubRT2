# Test Database Setup for Merged Branch

This document explains how to use the test database with the merged `merge/main-december-updates` branch.

## Overview

The `merge/main-december-updates` branch combines:
- **main branch**: Recent bug fixes (timezone corrections, pagination fixes)
- **feature/december-updates branch**: December 2025 pricing system

To avoid affecting production data, we've set up a separate test database: `TennisClubRT2_Test`

## Database Configuration

### Current Setup

In `backend/.env`, you'll find three database URIs:

```bash
# Production database (default - currently active)
MONGODB_URI=mongodb+srv://...TennisClubRT2

# Test database (for testing merged branch)
MONGODB_URI_TEST=mongodb+srv://...TennisClubRT2_Test

# Legacy database
MONGODB_URI_LEGACY=mongodb+srv://...AppDB
```

## How to Switch to Test Database

### Option 1: Temporarily Override (Recommended for Testing)

1. Edit `backend/.env` and comment out the production URI:
   ```bash
   # MONGODB_URI=mongodb+srv://...TennisClubRT2
   MONGODB_URI=mongodb+srv://...TennisClubRT2_Test
   ```

2. Restart the backend server:
   ```bash
   cd backend
   npm run dev
   ```

### Option 2: Environment Variable Override

Set environment variable before starting the server:
```bash
export MONGODB_URI="mongodb+srv://...TennisClubRT2_Test"
cd backend && npm run dev
```

## Initial Test Database Setup

### 1. Create the Database in MongoDB Atlas

The database `TennisClubRT2_Test` will be automatically created when you first connect.
Indexes and collections will be created when you insert data.

### 2. Create Initial Admin User

```bash
cd backend
npm run create-superadmin
```

This will create a superadmin user with credentials shown in the console.

### 3. (Optional) Import Sample Data

If you want to test with real member data:

```bash
cd backend
npm run import-members
```

Or copy data from production database using the backup created during merge:
```bash
# The backup is located at:
backend/backups/pre-merge-backup_2025-10-28T01-02-14-112Z.json
```

## Testing the Merged Features

### Key Features to Test

1. **December 2025 Pricing System**
   - Peak hours (5AM, 6PM, 7PM, 9PM): ₱150 base + ₱70 per guest
   - Non-peak hours: ₱100 base + ₱70 per guest
   - Base fee split among members
   - Guest fees added to reserver only

2. **Payment Workflow**
   - One payment per member per reservation
   - "Play first, pay after" - payment button enabled after reservation time
   - Multiple payment records per reservation

3. **Backward Compatibility**
   - Old reservations with simple player arrays still work
   - New reservations use member/guest tracking

4. **Timezone Fixes**
   - Ensure date queries respect UTC/local timezone
   - Court blocking dates display correctly

## Switching Back to Production Database

1. Edit `backend/.env` and restore the original MONGODB_URI:
   ```bash
   MONGODB_URI=mongodb+srv://...TennisClubRT2
   # MONGODB_URI=mongodb+srv://...TennisClubRT2_Test
   ```

2. Restart the backend server

## Important Notes

⚠️ **ALWAYS verify which database you're connected to** before making changes!

Check the console output when starting the backend:
```
✅ Connected to MongoDB: TennisClubRT2_Test
```

⚠️ **The main and feature/december-updates branches remain unchanged**

This merged branch is on: `merge/main-december-updates`

## Branches Status

- ✅ `main`: Unchanged (latest production code)
- ✅ `feature/december-updates`: Unchanged (December 2025 features)
- ✅ `merge/main-december-updates`: New branch with both merged

## Next Steps

After successful testing:
1. Decide whether to merge this into main
2. Deploy to production with appropriate migration strategy
3. Consider re-implementing court blocking feature if needed
