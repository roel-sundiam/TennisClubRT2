# Testing Court Reservations - Step-by-Step Guide

This guide provides detailed steps for manually and automatically testing court reservations with fee calculations.

## Table of Contents
1. [Understanding the Fee Structure](#understanding-the-fee-structure)
2. [Manual Testing Steps](#manual-testing-steps)
3. [Automated Testing with Cypress](#automated-testing-with-cypress)
4. [Test Scenarios](#test-scenarios)
5. [Troubleshooting](#troubleshooting)

---

## Understanding the Fee Structure

### Base Fees
- **Peak Hours**: 5 AM, 6 PM, 7 PM, 8 PM, 9 PM → **₱150/hour**
- **Off-Peak Hours**: All other hours → **₱100/hour**

### Guest Fees
- **₱70 per guest per hour** (added to reserver's payment)

### Payment Distribution
- **Base fee**: Split equally among ALL members
- **Guest fees**: Paid entirely by the reserver (Player 1)
- **Guests**: Pay ₱0 (included in reserver's payment)

### Example Calculations

**Example 1: Simple Off-Peak**
- Time: 10:00 AM - 11:00 AM (1 hour off-peak)
- Players: 1 member
- Calculation: ₱100 × 1 hour = **₱100**
- Member pays: **₱100**

**Example 2: Peak with Guest**
- Time: 6:00 PM - 7:00 PM (1 hour peak)
- Players: 1 member + 1 guest
- Calculation:
  - Base: ₱150 × 1 hour = ₱150
  - Guest: ₱70 × 1 guest × 1 hour = ₱70
  - Total: **₱220**
- Member pays: ₱150 + ₱70 = **₱220**
- Guest pays: **₱0**

**Example 3: Multiple Members with Guest**
- Time: 2:00 PM - 3:00 PM (1 hour off-peak)
- Players: 2 members + 1 guest
- Calculation:
  - Base: ₱100 × 1 hour = ₱100
  - Guest: ₱70 × 1 guest × 1 hour = ₱70
  - Total: **₱170**
- Member 1 (reserver): ₱100/2 + ₱70 = **₱120**
- Member 2: ₱100/2 = **₱50**
- Guest: **₱0**

**Example 4: Mixed Rate (Crossing Peak)**
- Time: 5:00 PM - 7:00 PM (2 hours: 1 off-peak + 1 peak)
- Players: 1 member
- Calculation:
  - 5:00-6:00: ₱100 (off-peak)
  - 6:00-7:00: ₱150 (peak)
  - Total: **₱250**
- Member pays: **₱250**

---

## Manual Testing Steps

### Prerequisites
1. Backend running on `http://localhost:3000`
2. Frontend running on `http://localhost:4200`
3. Test user logged in (testmember / pass123)

### Test Case 1: Basic Off-Peak Reservation

**Steps:**

1. **Navigate to New Reservation**
   ```
   Go to: http://localhost:4200/reservations/new
   ```

2. **Select Date**
   - Click on date input field
   - Select a future date (e.g., 7 days from today)
   - Wait for time slots to load

3. **Select Start Time** (Off-Peak)
   - Click button labeled "10:00" (10 AM - off-peak)
   - Observe: End time buttons now appear

4. **Select End Time**
   - Click button labeled "11:00" (11 AM - 1 hour duration)
   - Observe: Fee information section appears

5. **Verify Fee Display**
   - Check "Rate Type:" shows "Off-Peak"
   - Check "Players:" shows "1 (1 members, 0 non-members)"
   - Check "Base Fee" row shows "₱100"
   - Check "Total Fee:" shows "₱100"

6. **Verify Player Payment**
   - Under "Payment per Player:" section
   - Your username should show with amount "₱100"

7. **Submit Reservation**
   - Click "Book Court" button
   - Wait for success message
   - Verify redirect to reservations list

**Expected Result:** ✅ Reservation created with ₱100 fee

---

### Test Case 2: Peak Hour Reservation

**Steps:**

1. Navigate to `/reservations/new`

2. Select date (future date)

3. **Select Start Time** (Peak Hour)
   - Click "18:00" (6 PM - peak hour)
   - Notice: Button may have "peak" indicator

4. **Select End Time**
   - Click "19:00" (7 PM)

5. **Verify Fee Calculation**
   - Rate Type: "Peak"
   - Base Fee: "₱150"
   - Total Fee: "₱150"

6. Submit and verify

**Expected Result:** ✅ Reservation created with ₱150 fee

---

### Test Case 3: Reservation with Guest

**Steps:**

1. Navigate to `/reservations/new`

2. Select date and time:
   - Date: Future date
   - Start: "10:00" (off-peak)
   - End: "11:00"

3. **Add Guest Player**
   - Click "+ Add Custom Player" button
   - Type guest name: "John Doe"
   - Press Tab or click outside

4. **Verify Fee Updates**
   - Players: "2 (1 members, 1 non-members)"
   - Base Fee: "₱100"
   - Guest Fee: "₱70" (should appear as new line)
   - Total Fee: "₱170"

5. **Verify Payment Distribution**
   - Your payment: "₱170" (base + guest fee)
   - Guest payment: Should not appear (₱0)

6. Submit reservation

**Expected Result:** ✅ Total ₱170, reserver pays all

---

### Test Case 4: Multiple Members Splitting Fee

**Steps:**

1. Navigate to `/reservations/new`

2. Select date and time (off-peak, 1 hour)

3. **Add Second Member**
   - Click "+ Add Member Player" button
   - Click on dropdown that appears
   - Search or select a member from list
   - Click to select

4. **Verify Fee Split**
   - Players: "2 (2 members, 0 non-members)"
   - Base Fee: "₱100"
   - Total Fee: "₱100" (same total)
   - Player 1 payment: "₱50"
   - Player 2 payment: "₱50"

5. Submit reservation

**Expected Result:** ✅ ₱100 split equally (₱50 each)

---

### Test Case 5: Complex Scenario (2 Members + 1 Guest, Peak)

**Steps:**

1. Navigate to `/reservations/new`

2. Select date and **PEAK time**:
   - Start: "18:00"
   - End: "19:00"

3. Add second member (see Test Case 4)

4. Add guest:
   - Click "+ Add Custom Player"
   - Enter name: "Guest Player"

5. **Verify Complex Fee Calculation**
   - Players: "3 (2 members, 1 non-members)"
   - Base Fee: "₱150" (peak)
   - Guest Fee: "₱70"
   - Total Fee: "₱220"

   **Payment Breakdown:**
   - Member 1 (you): ₱150/2 + ₱70 = **₱145**
   - Member 2: ₱150/2 = **₱75**
   - Guest: **₱0**

6. Submit reservation

**Expected Result:** ✅ Total ₱220, split correctly

---

### Test Case 6: Mixed Rate (Crossing Peak Time)

**Steps:**

1. Navigate to `/reservations/new`

2. Select date

3. **Select Time Spanning Peak/Off-Peak**:
   - Start: "17:00" (5 PM - off-peak)
   - End: "19:00" (7 PM - crosses into peak at 6 PM)

4. **Verify Mixed Rate Calculation**:
   - Rate Type: "Mixed"
   - Time breakdown:
     - 17:00-18:00: Off-peak ₱100
     - 18:00-19:00: Peak ₱150
   - Total Fee: "₱250"

5. Submit reservation

**Expected Result:** ✅ ₱250 (₱100 + ₱150)

---

## Automated Testing with Cypress

### Running the Tests

**Option 1: Interactive Mode**
```bash
cd frontend
npm run cypress:open
```
Then select: `reservation-fee-calculation.cy.ts`

**Option 2: Headless Mode**
```bash
cd frontend
npx cypress run --spec "cypress/e2e/reservation-fee-calculation.cy.ts"
```

### Test Coverage

The automated test suite includes:

✅ **Basic Scenarios**
- Single member, off-peak (₱100)
- Single member, peak (₱150)
- Mixed rate calculations

✅ **Multiple Members**
- 2 members splitting fee
- 4 members (maximum)
- Fee distribution verification

✅ **With Guests**
- 1 member + 1 guest
- 1 member + 2 guests
- 2 members + 1 guest (complex split)

✅ **Complex Scenarios**
- 3-hour mixed rate with multiple players
- Dynamic fee updates when adding/removing players

✅ **UI Verification**
- Fee breakdown display
- Player payment details
- Submit button states

---

## Test Scenarios Matrix

| Scenario | Time | Duration | Members | Guests | Base Fee | Guest Fee | Total | Member 1 Pays | Member 2 Pays |
|----------|------|----------|---------|--------|----------|-----------|-------|---------------|---------------|
| 1        | 10:00-11:00 | 1h off-peak | 1 | 0 | ₱100 | ₱0 | ₱100 | ₱100 | - |
| 2        | 18:00-19:00 | 1h peak | 1 | 0 | ₱150 | ₱0 | ₱150 | ₱150 | - |
| 3        | 10:00-11:00 | 1h off-peak | 1 | 1 | ₱100 | ₱70 | ₱170 | ₱170 | - |
| 4        | 10:00-11:00 | 1h off-peak | 2 | 0 | ₱100 | ₱0 | ₱100 | ₱50 | ₱50 |
| 5        | 18:00-19:00 | 1h peak | 2 | 1 | ₱150 | ₱70 | ₱220 | ₱145 | ₱75 |
| 6        | 17:00-19:00 | 2h mixed | 1 | 0 | ₱250 | ₱0 | ₱250 | ₱250 | - |
| 7        | 18:00-20:00 | 2h peak | 1 | 2 | ₱300 | ₱280 | ₱580 | ₱580 | - |
| 8        | 10:00-11:00 | 1h off-peak | 4 | 0 | ₱100 | ₱0 | ₱100 | ₱25 | ₱25 (each) |

---

## Troubleshooting

### Issue: Fee not updating after adding guest

**Solution:**
- Ensure guest name is entered completely
- Click outside the input field to trigger calculation
- Wait 500ms for calculation to process

### Issue: Dropdown not showing members

**Solution:**
- Check that you're logged in
- Verify backend is running
- Check browser console for API errors
- Ensure user has `isApproved: true`

### Issue: Submit button disabled

**Possible Causes:**
1. Date not selected
2. Start time not selected
3. End time not selected
4. Player 1 (yourself) not present
5. Form validation errors

**Check:**
- All required fields filled
- Date is future date
- End time > start time

### Issue: Wrong fee calculation

**Debug Steps:**
1. Note the exact time range
2. Check if hours are peak (5, 18, 19, 20, 21)
3. Count members vs guests correctly
4. Verify calculation manually:
   ```
   For each hour in range:
     If peak: hourFee = 150 + (guests × 70)
     If off-peak: hourFee = 100 + (guests × 70)
     totalFee += hourFee
   ```
5. Check browser console for calculation logs

### Issue: Cypress test failing

**Common Fixes:**
- Increase wait times: `cy.wait(1000)`
- Check selectors match current UI
- Verify test data (dates in future)
- Ensure backend is in test mode
- Run test database seeding

---

## Quick Reference - CSS Selectors

```javascript
// Date input
cy.get('input[id="date"]')

// Time slot buttons
cy.get('.time-btn').contains('10:00')

// Add member button
cy.contains('button', '+ Add Member Player')

// Member dropdown (index i)
cy.get('.custom-dropdown').eq(i).find('.dropdown-trigger')

// Add guest button
cy.contains('button', '+ Add Custom Player')

// Guest name input (index i)
cy.get('.custom-input').eq(i)

// Total fee
cy.get('.fee-info .fee-row.total span').last()

// Base fee
cy.get('.fee-breakdown .fee-row').first().find('span').last()

// Guest fee
cy.get('.fee-breakdown .fee-row').contains('Guest Fee')
  .parent().find('span').last()

// Player payment amount (index i)
cy.get('.player-payment-item').eq(i).find('.player-amount')

// Submit button
cy.get('button[type="submit"].book-btn')
```

---

## Additional Resources

- **Full Cypress Guide**: `/CYPRESS_TESTING.md`
- **Component Details**: Agent exploration output above
- **Test Spec**: `/frontend/cypress/e2e/reservation-fee-calculation.cy.ts`
- **Test Fixtures**: `/frontend/cypress/fixtures/test-data.json`

---

**Happy Testing! 🎾**
