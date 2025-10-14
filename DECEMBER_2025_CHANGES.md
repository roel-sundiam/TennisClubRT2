# December 2025 Changes - Court Pricing & Payment System

**Effective Date:** December 1, 2025

## Overview

This document outlines the comprehensive changes to the court reservation pricing structure and payment system that will take effect on December 1, 2025.

## Pricing Changes

### Current Pricing (Before December 1, 2025)

- **Peak hours (5AM, 6PM, 7PM, 9PM):** ₱100 fixed per hour
- **Off-peak hours:** ₱20 per member + ₱50 per non-member

### New Pricing (From December 1, 2025)

- **Peak hours (5AM, 6PM, 7PM, 9PM):** ₱150 base + ₱70 per guest
- **Non-peak hours:** ₱100 base + ₱70 per guest
- **Formula:** `Total Fee = Base Rate + (Number of Guests × ₱70)`

### Pricing Examples

#### Example 1: All Members, Non-Peak
- **Players:** 4 members, 0 guests
- **Calculation:** ₱100 base
- **Total:** ₱100

#### Example 2: All Members, Peak
- **Players:** 4 members, 0 guests
- **Calculation:** ₱150 base
- **Total:** ₱150

#### Example 3: Mixed Players, Non-Peak
- **Players:** 3 members + 1 guest
- **Calculation:** ₱100 base + (1 × ₱70)
- **Total:** ₱170

#### Example 4: Mixed Players, Peak
- **Players:** 2 members + 2 guests
- **Calculation:** ₱150 base + (2 × ₱70)
- **Total:** ₱290

## Payment System Changes

### Current System (Before December 1, 2025)

- One payment record created per reservation
- Single payment covers entire reservation cost
- Payment due immediately or within 7 days

### New System (From December 1, 2025)

#### Multiple Payments Per Reservation

- **One payment per member** (guests do not get payment records)
- Base rate split equally among all members
- Guest fees added only to the reserver's payment

#### Payment Distribution Formula

```
Member Share = Base Rate ÷ Number of Members
Reserver's Total = Member Share + (Number of Guests × ₱70)
Other Members' Total = Member Share
```

#### Payment Distribution Examples

**Example: Non-peak, 3 members + 2 guests**
- Base rate: ₱100
- Guest fees: 2 × ₱70 = ₱140
- Member share: ₱100 ÷ 3 = ₱33.33

**Payment breakdown:**
- User A (reserver): ₱33.33 + ₱140 = **₱173.33**
- User B: **₱33.33**
- User C: **₱33.33**
- **Total: ₱240**

**Example: Peak, 2 members + 1 guest**
- Base rate: ₱150
- Guest fees: 1 × ₱70 = ₱70
- Member share: ₱150 ÷ 2 = ₱75

**Payment breakdown:**
- User A (reserver): ₱75 + ₱70 = **₱145**
- User B: **₱75**
- **Total: ₱220**

## Payment Timeline

### Before Reservation Time

- ✅ **Edit allowed:** Reserver or admin can modify reservation
- ❌ **Pay button disabled:** Members cannot pay yet
- 📝 **Payment status:** All payments remain 'pending'

### After Reservation Time Passes

- ❌ **Edit locked:** Reservation cannot be modified
- ✅ **Pay button enabled:** Members can now pay their individual amounts
- 💰 **Payment required:** Members with unpaid amounts are blocked from making new reservations

### Rationale

This "play first, pay after" system ensures:
- Payments are only collected for reservations that actually occurred
- Members can confirm they attended before paying
- No-shows can be removed via editing before the reservation time

## Edit Behavior

### Who Can Edit

- The reserver (user who created the reservation)
- Admin or superadmin users

### Edit Timeline

- **Before reservation time:** Editing allowed
- **After reservation time:** Editing locked (payments become available)

### Payment Recalculation on Edit

When a reservation is edited (players added/removed):

1. **Cancel old payments:** All pending payments are marked as 'cancelled'
2. **Recalculate fees:** New total calculated based on updated player list
3. **Create new payments:** Fresh payment records created for all members with new amounts
4. **Audit trail maintained:** Old cancelled payments remain in database for history

#### Edit Example

**Original reservation:** 3 members, non-peak, ₱100 total
- User A: ₱33.33 pending
- User B: ₱33.33 pending
- User C: ₱33.33 pending

**User A edits:** Adds 2 guests
**New total:** ₱100 + (2 × ₱70) = ₱240

**After edit:**
- Old payments: All marked 'cancelled'
- New payments created:
  - User A: ₱33.33 + ₱140 = ₱173.33 pending
  - User B: ₱33.33 pending
  - User C: ₱33.33 pending

## No-Show Handling

If players don't show up for a reservation:

1. **Before reservation time:** Reserver edits to remove no-show players
2. **Fees recalculated:** Remaining players' fees adjusted automatically
3. **No payment for no-shows:** Removed players don't get payment records

## Overdue Payment Enforcement

The existing overdue payment blocking system continues:

- Members with unpaid payments 1+ days overdue cannot create new reservations
- Must settle outstanding payments before booking again
- Applies to both old single-payment reservations and new per-member payments

## Database Schema Changes

### Reservation Model - Player Structure

**Before:**
```typescript
players: [String]  // ["John Doe", "Jane Smith", "Guest 1"]
```

**After:**
```typescript
players: [{
  name: String,              // Player's name
  userId: String | null,     // MongoDB User ID (null for guests)
  isMember: Boolean,         // true if registered member
  isGuest: Boolean          // true if non-member guest
}]
```

### Backward Compatibility

- Existing reservations with simple string arrays remain unchanged
- New pricing only applies to reservations created after December 1, 2025
- No data migration required for existing records

## Frontend Changes

### Minimal UI Changes

- **Reservation form:** UI remains unchanged, users type player names as before
- **Auto-detection:** System automatically identifies members vs guests using fuzzy matching
- **Pricing preview:** Updated to show new calculation in real-time
- **Payment button:** Disabled (grayed out) until reservation time passes

### My Reservations View

- Shows individual payment status for each member
- Displays reserver's payment including guest fees
- "Pay" button appears only after reservation time

## Implementation Notes

### Environment Variables

No new environment variables required. Pricing logic is hardcoded based on requirements:

```bash
# Existing variables (still used for peak hour identification)
PEAK_HOURS=5,18,19,21

# New pricing (hardcoded in business logic)
# NON_PEAK_BASE_FEE=100
# PEAK_BASE_FEE=150
# GUEST_FEE=70
```

### Files Modified

**Backend:**
- `backend/src/models/Reservation.ts` - Player schema, pricing calculation
- `backend/src/controllers/reservationController.ts` - Multiple payment creation, edit logic
- `backend/src/controllers/paymentController.ts` - Payment availability timing
- `backend/src/controllers/manualCourtUsageController.ts` - Admin pricing updates

**Frontend:**
- `frontend/src/app/components/reservations/` - Pricing calculation and button logic
- `frontend/src/app/components/my-reservations/` - Payment display
- `frontend/src/app/components/payments/` - Payment availability
- `frontend/src/app/components/admin-manual-court-usage/` - Admin pricing

**Documentation:**
- `CLAUDE.md` - Updated pricing documentation
- `DECEMBER_2025_CHANGES.md` - This document

## Testing Checklist

- [ ] Create reservation with all members (non-peak)
- [ ] Create reservation with all members (peak)
- [ ] Create reservation with members + guests (non-peak)
- [ ] Create reservation with members + guests (peak)
- [ ] Edit reservation to add players (verify payment cancellation/recreation)
- [ ] Edit reservation to remove players (verify payment cancellation/recreation)
- [ ] Verify pay button disabled before reservation time
- [ ] Verify pay button enabled after reservation time
- [ ] Test payment blocking for members with unpaid amounts
- [ ] Verify pricing display in admin manual court usage
- [ ] Test multi-hour reservations with new pricing
- [ ] Verify audit trail shows cancelled payments after edits

## Deployment Plan

### Pre-Deployment (November 2025)

1. Complete all development in `feature/december-updates` branch
2. Thorough testing in development environment
3. User acceptance testing with sample scenarios
4. Documentation review and finalization

### Deployment (December 1, 2025)

1. Merge `feature/december-updates` to `main` branch
2. Deploy to production
3. Monitor for any issues
4. Communicate changes to all members

### Post-Deployment

1. Monitor payment processing
2. Gather user feedback
3. Address any issues promptly
4. Update training materials if needed

## Support & Questions

For questions or issues related to these changes, contact the system administrator or refer to the updated documentation in `CLAUDE.md`.

---

**Document Version:** 1.0
**Last Updated:** October 11, 2025
**Effective Date:** December 1, 2025
