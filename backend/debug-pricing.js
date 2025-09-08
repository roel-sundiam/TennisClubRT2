#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./dist/models/User.js').default;
const Payment = require('./dist/models/Payment.js').default;

async function debugPricingCalculation() {
  console.log('🔍 PRICING CALCULATION DEBUG TOOL');
  console.log('=' .repeat(50));
  
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
  
  // Get environment variables
  const peakHours = (process.env.PEAK_HOURS || '5,18,19,21').split(',').map(h => parseInt(h));
  const peakHourFee = parseInt(process.env.PEAK_HOUR_FEE || '100');
  const offPeakFeePerMember = parseInt(process.env.OFF_PEAK_FEE_PER_MEMBER || '20');
  const offPeakFeePerNonMember = parseInt(process.env.OFF_PEAK_FEE_PER_NON_MEMBER || '50');
  
  console.log('\n💰 PRICING CONFIGURATION:');
  console.log(`Peak Hours: ${peakHours.join(', ')}`);
  console.log(`Peak Hour Fee: ₱${peakHourFee}`);
  console.log(`Off-Peak Fee per Member: ₱${offPeakFeePerMember}`);
  console.log(`Off-Peak Fee per Non-Member: ₱${offPeakFeePerNonMember}`);
  
  // Get all active members
  const members = await User.find({
    role: { $in: ['member', 'admin'] },
    isActive: true,
    isApproved: true
  }).select('fullName username').lean();
  
  console.log(`\n👥 TOTAL ACTIVE MEMBERS: ${members.length}`);
  
  // Test specific scenario: 3 players at 4PM (16:00)
  const testPlayers = ['Player 1', 'Player 2', 'Player 3']; // Replace with actual player names from your reservation
  const testTimeSlot = 16; // 4PM
  
  console.log(`\n🧪 TEST SCENARIO:`);
  console.log(`Time Slot: ${testTimeSlot}:00 (${testTimeSlot <= 12 ? testTimeSlot : testTimeSlot - 12}${testTimeSlot < 12 ? 'AM' : 'PM'})`);
  console.log(`Players: ${testPlayers.join(', ')}`);
  console.log(`Is Peak Hour: ${peakHours.includes(testTimeSlot)}`);
  
  const memberNames = members.map(m => m.fullName.toLowerCase().trim());
  let memberCount = 0;
  let nonMemberCount = 0;
  
  console.log(`\n🔍 PLAYER CATEGORIZATION:`);
  testPlayers.forEach(playerName => {
    const cleanPlayerName = playerName.toLowerCase().trim();
    const isFoundInMembers = memberNames.includes(cleanPlayerName);
    
    if (isFoundInMembers) {
      memberCount++;
      console.log(`✅ "${playerName}" → MEMBER`);
    } else {
      // Try fuzzy matching
      const fuzzyMatch = memberNames.find(memberName => {
        const similarity = calculateStringSimilarity(cleanPlayerName, memberName);
        return similarity > 0.8;
      });
      
      if (fuzzyMatch) {
        memberCount++;
        console.log(`✅ "${playerName}" → MEMBER (fuzzy match: "${fuzzyMatch}")`);
      } else {
        nonMemberCount++;
        console.log(`❌ "${playerName}" → NON-MEMBER`);
      }
    }
  });
  
  console.log(`\n📊 CATEGORIZATION SUMMARY:`);
  console.log(`Members: ${memberCount}`);
  console.log(`Non-Members: ${nonMemberCount}`);
  
  // Calculate fee
  let totalFee = 0;
  if (peakHours.includes(testTimeSlot)) {
    const calculatedFee = (memberCount * offPeakFeePerMember) + (nonMemberCount * offPeakFeePerNonMember);
    totalFee = Math.max(peakHourFee, calculatedFee);
    console.log(`\n💵 PEAK HOUR CALCULATION:`);
    console.log(`Calculated: ${memberCount} × ₱${offPeakFeePerMember} + ${nonMemberCount} × ₱${offPeakFeePerNonMember} = ₱${calculatedFee}`);
    console.log(`Minimum (Peak Fee): ₱${peakHourFee}`);
    console.log(`Final Amount: ₱${totalFee}`);
  } else {
    totalFee = (memberCount * offPeakFeePerMember) + (nonMemberCount * offPeakFeePerNonMember);
    console.log(`\n💵 OFF-PEAK HOUR CALCULATION:`);
    console.log(`${memberCount} × ₱${offPeakFeePerMember} + ${nonMemberCount} × ₱${offPeakFeePerNonMember} = ₱${totalFee}`);
  }
  
  console.log(`\n🎯 EXPECTED vs ACTUAL:`);
  console.log(`Expected (3 members): ₱${3 * offPeakFeePerMember}`);
  console.log(`Calculated Amount: ₱${totalFee}`);
  console.log(`Discrepancy: ${totalFee !== (3 * offPeakFeePerMember) ? '⚠️ YES' : '✅ NO'}`);
  
  // Find recent payments with the problematic amount
  const problematicPayments = await Payment.find({
    amount: { $in: [120, 180] },
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
  }).populate('reservationId').populate('userId', 'fullName username').limit(5);
  
  console.log(`\n🔍 RECENT PROBLEMATIC PAYMENTS (₱120 or ₱180):`);
  problematicPayments.forEach((payment, index) => {
    console.log(`Payment ${index + 1}:`);
    console.log(`  Amount: ₱${payment.amount}`);
    console.log(`  User: ${payment.userId?.fullName || 'Unknown'}`);
    console.log(`  Time Slot: ${payment.reservationId?.timeSlot || 'N/A'}:00`);
    console.log(`  Players: ${payment.reservationId?.players?.join(', ') || 'N/A'}`);
    console.log(`  Date: ${payment.createdAt.toISOString().split('T')[0]}`);
    console.log();
  });
  
  await mongoose.disconnect();
  console.log('✅ Database connection closed');
}

// String similarity function (simple Levenshtein-based)
function calculateStringSimilarity(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : (maxLen - matrix[len1][len2]) / maxLen;
}

// Run the debug tool
debugPricingCalculation().catch(console.error);