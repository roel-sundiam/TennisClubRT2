# Testing Plan

### 1. Court Fee Saving in Reservations

- **Check:** When booking a court, the correct court fee should be saved in the `reservations` table.
- **Expectation:** Only **one record** should be saved.
- **Action:** Reserve a court, then check the `reservations` table.
- **Next Step:** ✅ If fixed, stop here and wait for tester confirmation before proceeding to **Test #2**.

---

### 2. Pending Payments Display

- **Check:** In the `/payments` page under **Pending Payments** tab, it should show:
  - Correct court fee
  - Booked members
  - Reservation date and time
- **Next Step:** ✅ If fixed, stop here and wait for tester confirmation before proceeding to **Test #3**.

---

### 3. Complete Payment Modal

- **Check:** When paying a pending payment, the **Complete Payment modal form** should display the correct court fee.
- **Next Step:** ✅ If fixed, stop here and wait for tester confirmation before proceeding to **Test #4**.

---

### 4. Payment Completion

- **Check:** After completing a payment:
  - It should be **removed** from the Pending Payments tab.
  - It should appear in **Payment History**, showing:
    - Correct court fee
    - Booked members
    - Reservation date and time
- **Next Step:** ✅ If fixed, stop here and wait for tester confirmation. This is the final step.
