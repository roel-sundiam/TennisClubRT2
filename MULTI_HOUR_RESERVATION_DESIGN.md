# Multi-Hour Reservation System Design

## Current Problem
The system currently creates separate 1-hour reservations for multi-hour bookings, leading to:
- Multiple reservation records for one booking session
- Payment allocation confusion
- Inconsistent user experience

## Proposed Solution

### 1. Database Schema Changes

#### Reservation Model Enhancement
```typescript
// Add to existing Reservation model
duration: {
  type: Number,
  min: 1,
  max: 4,
  default: 1,
  required: true
},
endTimeSlot: {
  type: Number,
  min: 6,
  max: 23,
  required: true
},
isMultiHour: {
  type: Boolean,
  default: false,
  index: true
}
```

#### Compound Index Update
```typescript
// Replace existing index with:
{ date: 1, timeSlot: 1, endTimeSlot: 1 }
// With partial filter for active reservations
```

### 2. Backend Logic Changes

#### Reservation Controller
- **createReservation**: Check availability for all slots in range
- **Payment calculation**: Total fee for all hours
- **Conflict detection**: Prevent overlapping reservations

#### Payment Controller
- **Single payment**: One payment record for entire duration
- **Proper description**: "6:00-8:00 AM (2 hours)" instead of separate entries

### 3. Frontend UI Enhancement

#### Reservation Form
```html
<!-- Duration selection -->
<mat-form-field>
  <mat-label>Duration</mat-label>
  <mat-select formControlName="duration">
    <mat-option value="1">1 hour</mat-option>
    <mat-option value="2">2 hours</mat-option>
    <mat-option value="3">3 hours</mat-option>
    <mat-option value="4">4 hours</mat-option>
  </mat-select>
</mat-form-field>

<!-- Dynamic end time display -->
<div class="time-range">
  Selected: {{startTime}} - {{endTime}}
</div>
```

#### Calendar View
- Show multi-hour blocks visually
- Prevent overlapping selections
- Clear pricing breakdown

### 4. Migration Strategy

#### Phase 1: Add New Fields (Backward Compatible)
- Add duration, endTimeSlot, isMultiHour fields
- Default values maintain current behavior
- Existing reservations remain functional

#### Phase 2: Update Logic
- Modify creation logic to support multi-hour
- Update availability checking
- Enhanced payment processing

#### Phase 3: UI Enhancement
- Add duration selector
- Update calendar display
- Improve user experience

### 5. Validation Rules

#### Time Slot Validation
```typescript
// Ensure endTimeSlot is valid
endTimeSlot = timeSlot + duration
if (endTimeSlot > 23) {
  throw new Error('Booking extends beyond court hours')
}
```

#### Availability Check
```typescript
// Check all slots in range are available
for (let slot = timeSlot; slot < endTimeSlot; slot++) {
  if (!isSlotAvailable(date, slot)) {
    throw new Error(`Time slot ${slot}:00 is not available`)
  }
}
```

### 6. Benefits

#### For Users
- Single booking for multi-hour sessions
- Clear pricing breakdown
- One payment, one confirmation
- Better user experience

#### For System
- Reduced database records
- Cleaner payment tracking
- Easier reporting
- More accurate availability

### 7. Implementation Priority

1. **High**: Database schema changes (backward compatible)
2. **High**: Backend reservation logic
3. **Medium**: Payment processing updates
4. **Medium**: Frontend duration selector
5. **Low**: Advanced UI features (drag to extend, etc.)

This design maintains backward compatibility while adding robust multi-hour support.