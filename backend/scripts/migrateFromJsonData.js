#!/usr/bin/env node

/**
 * Migration Script: Court Usage Report from JSON Data
 * 
 * This script migrates court usage data from the JSON file to MongoDB
 * 
 * Usage:
 * node scripts/migrateFromJsonData.js [--force]
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import the actual model
const CourtUsageReport = require('../dist/models/CourtUsageReport').default;

function parseAmount(amountStr) {
  if (!amountStr || amountStr === '') return 0;
  // Remove ₱ symbol and comma, then parse to float
  return parseFloat(amountStr.replace(/₱|,/g, '')) || 0;
}

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

async function migrateData(force = false) {
  try {
    console.log('🚀 Starting Court Usage Report data migration from JSON...\n');

    // Read JSON data
    const jsonPath = path.join(__dirname, '../data/court-usage-report.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`📊 Found ${jsonData.data.length} records in JSON file`);

    // Check if data already exists
    const existingCount = await CourtUsageReport.countDocuments();
    
    if (existingCount > 0 && !force) {
      console.log(`⚠️  Found ${existingCount} existing court usage records.`);
      console.log('   Use --force flag to clear existing data before migration.');
      return;
    }

    // Clear existing data if force flag is used
    if (force && existingCount > 0) {
      console.log(`🗑️  Clearing ${existingCount} existing court usage records...`);
      await CourtUsageReport.deleteMany({});
      console.log('✅ Existing data cleared\n');
    }

    // Transform data from JSON format
    const transformedData = [];
    
    for (let i = 1; i < jsonData.data.length; i++) { // Skip TOTAL row at index 0
      const row = jsonData.data[i];
      const memberName = row[0];
      
      // Skip if member name is empty or "TOTAL"
      if (!memberName || memberName === 'TOTAL') continue;
      
      const record = {
        memberName: memberName,
        january: parseAmount(row[1]),
        february: parseAmount(row[2]),
        march: parseAmount(row[3]),
        april: parseAmount(row[4]),
        may: parseAmount(row[5]),
        june: parseAmount(row[6]),
        july: parseAmount(row[7]),
        august: parseAmount(row[8]),
        september: parseAmount(row[9]),
        year: 2025
      };
      
      // Calculate total manually since pre-save might not work
      record.totalAmount = record.january + record.february + record.march + record.april + 
                          record.may + record.june + record.july + record.august + record.september;
      
      if (record.totalAmount > 0) { // Only include members with payments
        transformedData.push(record);
      }
    }

    console.log(`📊 Migrating ${transformedData.length} member records with payments...`);

    // Insert all records
    await CourtUsageReport.insertMany(transformedData, { ordered: false });
    console.log(`✅ Inserted ${transformedData.length} records`);

    // Verify migration
    const finalCount = await CourtUsageReport.countDocuments();
    const totalRevenue = await CourtUsageReport.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    console.log('\n📈 Migration Summary:');
    console.log(`   💾 Records in database: ${finalCount}`);
    console.log(`   💰 Total revenue: ₱${totalRevenue[0]?.total?.toFixed(2) || '0.00'}`);
    console.log(`   📅 Year: 2025`);

    // Show top 5 contributors for verification
    const topContributors = await CourtUsageReport.find()
      .sort({ totalAmount: -1 })
      .limit(5)
      .select('memberName totalAmount');

    console.log('\n🏆 Top 5 Contributors:');
    topContributors.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.memberName}: ₱${member.totalAmount.toFixed(2)}`);
    });

    console.log('\n✅ Court Usage Report data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');

  try {
    await connectToDatabase();
    await migrateData(force);
    
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
    
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
main();