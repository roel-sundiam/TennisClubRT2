#!/usr/bin/env node

/**
 * Script to update September court fees based on screenshot data
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import the actual model
const CourtUsageReport = require('../dist/models/CourtUsageReport').default;

// September updates based on screenshot
const septemberUpdates = [
  { name: "Pauleen Aina Sengson", september: 100 }, // Already correct
  { name: "Pam Asuncion", september: 220 }, // Was 170
  { name: "Dan Castro", september: 40 }, // Was 0  
  { name: "Catereena Canlas", september: 300 }, // Was 0
  { name: "Lea Nacu", september: 300 }, // Was 50
  { name: "CJ Yu", september: 175 }, // Was 0
  { name: "Helen Sundiam", september: 140 } // Already correct
];

async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('🔗 Connected to MongoDB successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function updateSeptemberFees() {
  try {
    console.log('🚀 Starting September court fees update...\n');

    for (const update of septemberUpdates) {
      const member = await CourtUsageReport.findOne({ memberName: update.name });
      
      if (member) {
        const oldSeptember = member.september;
        const oldTotal = member.totalAmount;
        
        // Update September amount
        member.september = update.september;
        
        // Recalculate total (the pre-save middleware should handle this, but let's be explicit)
        member.totalAmount = member.january + member.february + member.march + member.april + 
                            member.may + member.june + member.july + member.august + member.september;
        
        await member.save();
        
        console.log(`✅ ${update.name}:`);
        console.log(`   September: ₱${oldSeptember} → ₱${update.september}`);
        console.log(`   Total: ₱${oldTotal} → ₱${member.totalAmount}`);
        console.log('');
      } else {
        console.log(`❌ Member not found: ${update.name}`);
      }
    }

    // Verify final totals
    const finalTotal = await CourtUsageReport.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const updatedMembers = await CourtUsageReport.find({
      memberName: { $in: septemberUpdates.map(u => u.name) }
    }).select('memberName september totalAmount').sort({ totalAmount: -1 });

    console.log('📊 Updated Members Summary:');
    updatedMembers.forEach(member => {
      console.log(`   ${member.memberName}: September ₱${member.september}, Total ₱${member.totalAmount}`);
    });

    console.log(`\n💰 New Total Revenue: ₱${finalTotal[0]?.total?.toFixed(2) || '0.00'}`);
    console.log('\n✅ September court fees update completed successfully!');
    
  } catch (error) {
    console.error('❌ Update failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectToDatabase();
    await updateSeptemberFees();
    
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
    
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the update
main();