/**
 * Date validation utilities for reservation cancellation
 */

export interface Reservation {
  date: string | Date;
  status: string;
}

/**
 * Checks if a reservation can be cancelled based on its status only
 * @param reservation The reservation to check
 * @returns true if the reservation can be cancelled, false otherwise
 */
export function canCancelReservation(reservation: Reservation): boolean {
  // Validate inputs
  if (!reservation) {
    return false;
  }
  
  // Allow cancellation of any reservation regardless of date, only check status
  return reservation.status !== 'cancelled';
}

/**
 * Checks if a date is in the past (before today)
 * @param date The date to check
 * @returns true if the date is in the past, false otherwise
 */
export function isPastDate(date: string | Date): boolean {
  if (!date) {
    return true; // Treat null/undefined dates as past dates for safety
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  // Check if date is valid
  if (isNaN(checkDate.getTime())) {
    console.warn('Invalid date in isPastDate:', date);
    return true; // Treat invalid dates as past dates for safety
  }
  
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate < today;
}