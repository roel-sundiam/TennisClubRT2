# Court Booking Validations Documentation

This document provides a comprehensive overview of all validations implemented in the Tennis Club RT2 court booking system. The validations are organized by category and include implementation details and code references.

## Overview

The court booking system implements a **multi-layer validation approach** to ensure data integrity, security, and business rule compliance:

1. **Frontend Layer**: Angular reactive forms with real-time validation
2. **Route Layer**: Express.js middleware for authentication and authorization
3. **Controller Layer**: Business logic validation in API endpoints
4. **Model Layer**: Mongoose schema validation and custom validators
5. **Database Layer**: Unique indexes and constraints

---

## 1. Authentication & Authorization Validations

### 1.1 Authentication Required
- **Description**: Valid JWT token must be present in request headers
- **Implementation**: `authenticateToken` middleware
- **Location**: `/backend/src/middleware/auth.ts:10-84`
- **Error**: `401 - Access token required` or `401 - Invalid token`

### 1.2 Account Approval
- **Description**: User account must be approved by an administrator
- **Implementation**: `requireApprovedUser` middleware
- **Location**: `/backend/src/middleware/auth.ts:111-133`
- **Business Rule**: All users except superadmins must have `isApproved: true`
- **Error**: `403 - Account pending approval`

### 1.3 Membership Fees Paid
- **Description**: Members must have paid membership fees before booking
- **Implementation**: `requireMembershipFees` middleware
- **Location**: `/backend/src/middleware/auth.ts:135-157`
- **Business Rule**: Only applies to users with role `member`
- **Error**: `403 - Membership fees must be paid before using this feature`

### 1.4 Active Account
- **Description**: User account must be active (not deactivated)
- **Implementation**: Check in `authenticateToken` middleware
- **Location**: `/backend/src/middleware/auth.ts:47-53`
- **Error**: `401 - Account has been deactivated`

---

## 2. Date & Time Validations

### 2.1 Date in Future
- **Description**: Reservation date cannot be in the past
- **Implementation**: 
  - **Model Level**: Mongoose validator
  - **Controller Level**: Business logic check
- **Locations**: 
  - `/backend/src/models/Reservation.ts:17-24` (schema validation)
  - `/backend/src/controllers/reservationController.ts:175-186` (controller check)
- **Error**: `Reservation date cannot be in the past` or `Cannot make reservations for past dates`

### 2.2 Valid Time Slot Range
- **Description**: Time slots must be within court operating hours (5 AM - 10 PM)
- **Implementation**: 
  - **Model Level**: Min/max validation
  - **Validation Rules**: Express-validator
- **Locations**:
  - `/backend/src/models/Reservation.ts:26-31` (schema validation)
  - `/backend/src/controllers/reservationController.ts:515` (validation rules)
- **Range**: `min: 5, max: 22` (5:00 AM to 10:00 PM, last start time 9:00 PM)
- **Error**: `Court operates from 5 AM to 10 PM` or `Time slot must be between 5 and 22`

### 2.3 Time Slot Availability
- **Description**: Selected time slot must not be already booked
- **Implementation**: Database query with `isSlotAvailable` static method
- **Location**: `/backend/src/models/Reservation.ts:116-129`
- **Business Rule**: Checks for existing reservations with status `pending` or `confirmed`
- **Error**: `Time slot is already reserved`

### 2.4 Past Time Prevention (Same Day)
- **Description**: Cannot book time slots that have already passed for today
- **Implementation**: Frontend Philippine timezone check
- **Location**: `/frontend/src/app/components/reservations/reservations.component.ts:754-760`
- **Logic**: `hasTimePassed = slot.hour <= currentPhilippineTime.getHours()`
- **Timezone**: Asia/Manila (Philippine Standard Time)

---

## 3. Player Validations

### 3.1 Minimum Players Required
- **Description**: At least one player must be specified
- **Implementation**: 
  - **Controller Level**: Length check
  - **Validation Rules**: Express-validator
- **Locations**:
  - `/backend/src/controllers/reservationController.ts:208-214` (create)
  - `/backend/src/controllers/reservationController.ts:360-366` (update)
  - `/backend/src/controllers/reservationController.ts:518` (validation rules)
- **Error**: `At least one player is required`

### 3.2 Maximum Players Limit
- **Description**: Maximum of 4 players allowed per reservation
- **Implementation**: 
  - **Controller Level**: Length check
  - **Validation Rules**: Express-validator
- **Locations**:
  - `/backend/src/controllers/reservationController.ts:216-222` (create)
  - `/backend/src/controllers/reservationController.ts:368-374` (update)
  - `/backend/src/controllers/reservationController.ts:518` (validation rules)
- **Error**: `Maximum 4 players allowed`

### 3.3 Player Name Length
- **Description**: Each player name must be between 1-50 characters
- **Implementation**: 
  - **Model Level**: Mongoose maxlength validation
  - **Validation Rules**: Express-validator length check
- **Locations**:
  - `/backend/src/models/Reservation.ts:37` (schema validation)
  - `/backend/src/controllers/reservationController.ts:522-523` (validation rules)
- **Error**: `Player name cannot exceed 50 characters` or `Player name must be 1-50 characters long`

### 3.4 Player Name Trimming
- **Description**: Player names are automatically trimmed of whitespace
- **Implementation**: 
  - **Model Level**: Trim in schema
  - **Controller Level**: Explicit trimming
  - **Validation Rules**: Express-validator trim
- **Locations**:
  - `/backend/src/models/Reservation.ts:36` (schema trim)
  - `/backend/src/controllers/reservationController.ts:256, 376` (controller trimming)
  - `/backend/src/controllers/reservationController.ts:521` (validation trim)

---

## 4. Business Logic Validations

### 4.1 Unique Reservation Constraint
- **Description**: Prevents double booking of the same time slot on the same date
- **Implementation**: MongoDB compound unique index with partial filter
- **Location**: `/backend/src/models/Reservation.ts:83-91`
- **Index**: `{ date: 1, timeSlot: 1 }` (unique)
- **Partial Filter**: Only applies to reservations with status `pending` or `confirmed`
- **Error**: Database duplicate key error

### 4.2 Sequential Time Slots (Multi-hour Bookings)
- **Description**: For multi-hour reservations, ensures consecutive available time slots
- **Implementation**: Frontend logic in availability checking
- **Location**: `/frontend/src/app/components/reservations/reservations.component.ts:636-671`
- **Method**: `updateAvailableEndTimes()`
- **Logic**: Stops at first unavailable slot to ensure consecutive booking

### 4.3 Court Operating Hours Enforcement
- **Description**: Enforces court operating hours (5:00 AM - 10:00 PM)
- **Implementation**: Multiple layers enforce the 5-22 hour range
- **Locations**: Model validation, controller validation, and frontend logic
- **Business Rule**: Last reservation can start at 9:00 PM (21:00) and end at 10:00 PM (22:00)

---

## 5. Form & Request Validations

### 5.1 Required Fields
- **Description**: Essential form fields must be provided
- **Implementation**: Angular reactive forms with `Validators.required`
- **Location**: `/frontend/src/app/components/reservations/reservations.component.ts:415-422`
- **Required Fields**: `date`, `startTime`, `endTime`, `players[0]`

### 5.2 Date Format Validation
- **Description**: Date must be in ISO8601 format (YYYY-MM-DD)
- **Implementation**: Express-validator `isISO8601()`
- **Location**: `/backend/src/controllers/reservationController.ts:511-513`
- **Error**: `Invalid date format`

### 5.3 Time Range Logic
- **Description**: End time must be after start time, with logical hour progression
- **Implementation**: Frontend business logic
- **Location**: `/frontend/src/app/components/reservations/reservations.component.ts:594-634`
- **Logic**: End time options are generated based on selected start time

### 5.4 Real-time Availability Check
- **Description**: Checks current slot availability before displaying booking options
- **Implementation**: 
  - **Load reservations**: `loadReservationsForDate()`
  - **Update availability**: `updateTimeSlotAvailability()`
- **Location**: `/frontend/src/app/components/reservations/reservations.component.ts:713-770`

---

## 6. Edit/Update Restrictions

### 6.1 Cannot Edit Past Reservations
- **Description**: Reservations for past dates cannot be modified
- **Implementation**: Date comparison in controller
- **Locations**:
  - `/backend/src/controllers/reservationController.ts:300-310` (general past check)
  - `/backend/src/controllers/reservationController.ts:326-333` (reschedule check)
- **Error**: `Cannot edit past reservations` or `Cannot reschedule to a past date`

### 6.2 Status-Based Edit Restrictions
- **Description**: Cannot edit cancelled or completed reservations
- **Implementation**: Status check in update controller
- **Location**: `/backend/src/controllers/reservationController.ts:312-319`
- **Blocked Statuses**: `cancelled`, `completed`
- **Error**: `Cannot edit cancelled or completed reservations`

### 6.3 Ownership Verification
- **Description**: Members can only edit their own reservations (admins can edit any)
- **Implementation**: User ID comparison in controllers
- **Locations**:
  - `/backend/src/controllers/reservationController.ts:149-155` (get reservation)
  - `/backend/src/controllers/reservationController.ts:291-298` (update reservation)
- **Error**: `Access denied`

---

## 7. Cancellation Validations

### 7.1 Cannot Cancel Past Reservations
- **Description**: Reservations for dates that have passed cannot be cancelled
- **Implementation**: Date comparison in cancel controller
- **Location**: `/backend/src/controllers/reservationController.ts:412-420`
- **Error**: `Cannot cancel past reservations`

### 7.2 Status-Based Cancellation Restrictions
- **Description**: Cannot cancel reservations that are already cancelled or completed
- **Implementation**: Status check in cancel controller
- **Location**: `/backend/src/controllers/reservationController.ts:422-429`
- **Blocked Statuses**: `cancelled`, `completed`
- **Error**: `Reservation is already cancelled or completed`

---

## Implementation Architecture

### Validation Flow
```
Frontend Form Validation
         ↓
Express Route Middleware
         ↓
Express-Validator Rules
         ↓
Controller Business Logic
         ↓
Mongoose Schema Validation
         ↓
Database Constraints
```

### Error Handling
- **Frontend**: Form validation errors and notification system
- **Backend**: Structured JSON error responses with `success: false`
- **Database**: Constraint violation handling

### Peak Hours Logic
- **Peak Hours**: 5 AM, 6 PM, 7 PM, 8 PM, 9 PM (configurable via environment)
- **Peak Hour Fee**: ₱100 minimum or calculated player fees (whichever is higher)
- **Off-Peak Fee**: ₱20 per member, ₱50 per non-member

### Timezone Handling
- **Frontend**: All time calculations use Philippine timezone (Asia/Manila)
- **Backend**: Dates stored in UTC, timezone-aware validation
- **Business Rule**: Court operates in Philippine Standard Time

---

## Configuration

### Environment Variables
```bash
# Court Operating Hours
PEAK_HOURS=5,18,19,20,21
PEAK_HOUR_FEE=100
OFF_PEAK_FEE_PER_MEMBER=20

# Authentication
JWT_SECRET=your-secret-key
```

### Database Indexes
```javascript
// Compound unique index for preventing double booking
{ date: 1, timeSlot: 1 } // unique, partial filter for active reservations

// Performance indexes
{ userId: 1, date: -1 }
{ status: 1, paymentStatus: 1 }
{ date: 1, status: 1 }
```

---

## Testing Validation

To test these validations:

1. **Authentication**: Try accessing endpoints without JWT token
2. **Date Validation**: Attempt to book past dates
3. **Time Slots**: Try booking outside 5 AM - 10 PM range
4. **Player Limits**: Submit with 0 or 5+ players
5. **Availability**: Try booking same slot twice
6. **Permissions**: Test cross-user access restrictions

This comprehensive validation system ensures data integrity, prevents conflicts, and maintains business rule compliance across the entire court booking workflow.