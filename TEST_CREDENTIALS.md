# Tennis Club RT2 - Test Credentials

This document contains all available test accounts for the Tennis Club RT2 system.

## 🔐 Administrative Accounts

### Superadmin Account (Highest Level)
```
Username: superadmin
Password: admin123
Role: superadmin
Email: admin@tennisclub.com
Full Name: Super Administrator
Coin Balance: 1,000,000 coins
```
**Capabilities:**
- Full system access
- Manage all users and roles
- Approve coin purchases
- Access all admin features
- System configuration

### Admin Account (Administrative)  
```
Username: admin
Password: admin123
Role: admin
Email: admin@tennisrt2.com
Full Name: Test Admin
Coin Balance: 500 coins
```
**Capabilities:**
- Member management
- Reservation oversight
- Coin management (award/deduct)
- Reports and analytics

## 👥 Regular Member Accounts

### Primary Test Member
```
Username: RoelSundiam
Password: RT2Tennis
Role: member
Email: roel.sundiam@example.com
Full Name: Roel Sundiam
Coin Balance: 0 coins (modified for testing)
```
**Status:** ✅ Approved, ✅ Active, ✅ Membership Paid

### Legacy Test Member
```
Username: testmember
Password: pass123
Role: member
Email: test@member.com
Full Name: Test Member
Coin Balance: 100 coins
```
**Status:** ✅ Approved, ✅ Active, ✅ Membership Paid

## 🚀 Quick Start Testing Guide

### For Regular User Testing:
1. **Login as:** `RoelSundiam` / `RT2Tennis`
2. **Test features:** Court reservations, coin purchases, payment management
3. **Current status:** 0 coins (perfect for testing coin warnings/blocking)

### For Admin Testing:
1. **Login as:** `superadmin` / `admin123`
2. **Access admin panel:** Navigate to Admin Dashboard
3. **Test features:** Member approval, coin purchase approval, system management

### For Coin Purchase Approval Testing:
1. **Step 1:** Login as `RoelSundiam` and attempt to purchase coins
2. **Step 2:** Login as `superadmin` and approve the purchase
3. **Step 3:** Verify coins are added to RoelSundiam's balance

## 📋 Account Creation Commands

### Create Additional Test Accounts:
```bash
# Create superadmin (if not exists)
npm run create-superadmin

# Import legacy members with default password RT2Tennis
npm run import-members
```

### Manual Account Creation:
All imported members use the default password: `RT2Tennis`
Usernames follow the format: `FirstnameLastname`

## 🔒 Security Notes

### ⚠️ Important:
- **Change default passwords** immediately after first login
- **Superadmin password** (`admin123`) is critical to change
- These are **test credentials only** - not for production use

### Default System Settings:
- **New user coin balance:** 100 coins
- **Coin warning threshold:** 10 coins  
- **Critical balance threshold:** 2 coins
- **JWT token expiration:** 7 days

## 🧪 Testing Scenarios

### Coin System Testing:
- **Zero balance user:** RoelSundiam (0 coins) - Test warnings and blocking
- **Normal balance user:** testmember (100 coins) - Test regular operations
- **Admin user:** superadmin (unlimited) - Test management features

### Role Testing:
- **Member permissions:** Use RoelSundiam or testmember
- **Admin permissions:** Use admin account  
- **Superadmin permissions:** Use superadmin account

### Approval Workflow Testing:
1. **Coin Purchase:** Member requests → Admin approves
2. **User Registration:** New user → Admin approval → Membership payment
3. **Reservation Management:** Member books → Admin oversight

---
**Last Updated:** 2025-08-23  
**System Version:** Tennis Club RT2 Backend v1.0.0