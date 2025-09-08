const mongoose = require('mongoose');
require('dotenv').config();

// Import models (with .js extension for compiled output)
const User = require('../dist/models/User').default;
const Payment = require('../dist/models/Payment').default;
const Reservation = require('../dist/models/Reservation').default;

// Member contribution data from screenshots
const memberContributions = [
  { name: "PJ Quiazon", jan: 790, feb: 1750, mar: 750, apr: 900, may: 1040, jun: 100, jul: 400, aug: 150, sep: 0 },
  { name: "Pauleen Aina Sengson", jan: 300, feb: 0, mar: 700, apr: 960, may: 935, jun: 1045, jul: 625, aug: 1040, sep: 100 },
  { name: "Jermin David", jan: 1250, feb: 740, mar: 1200, apr: 1500, may: 0, jun: 300, jul: 0, aug: 200, sep: 0 },
  { name: "Miguel Naguit", jan: 1490, feb: 710, mar: 1220, apr: 440, may: 300, jun: 600, jul: 200, aug: 0, sep: 0 },
  { name: "Jhen Cunanan", jan: 0, feb: 1000, mar: 1100, apr: 1100, may: 500, jun: 0, jul: 500, aug: 320, sep: 0 },
  { name: "Pam Asuncion", jan: 670, feb: 580, mar: 445, apr: 360, may: 370, jun: 240, jul: 220, aug: 685, sep: 170 },
  { name: "Roel Sundiam", jan: 710, feb: 490, mar: 420, apr: 420, may: 570, jun: 390, jul: 100, aug: 140, sep: 0 },
  { name: "Marivic Dizon", jan: 650, feb: 350, mar: 325, apr: 270, may: 325, jun: 220, jul: 320, aug: 200, sep: 0 },
  { name: "Marky Alcantara", jan: 0, feb: 680, mar: 480, apr: 400, may: 400, jun: 275, jul: 0, aug: 160, sep: 0 },
  { name: "Carlos Naguit", jan: 350, feb: 990, mar: 880, apr: 120, may: 0, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Elyza Manalac", jan: 420, feb: 240, mar: 640, apr: 570, may: 20, jun: 100, jul: 0, aug: 175, sep: 0 },
  { name: "Rafael Pangilinan", jan: 300, feb: 650, mar: 400, apr: 400, may: 200, jun: 0, jul: 0, aug: 200, sep: 0 },
  { name: "Antonnette Tayag", jan: 50, feb: 400, mar: 800, apr: 200, may: 540, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Dan Castro", jan: 70, feb: 380, mar: 265, apr: 200, may: 200, jun: 260, jul: 140, aug: 220, sep: 0 },
  { name: "Jau Timbol", jan: 0, feb: 0, mar: 140, apr: 160, may: 420, jun: 320, jul: 280, aug: 400, sep: 0 },
  { name: "Mon Henson", jan: 250, feb: 300, mar: 150, apr: 590, may: 220, jun: 150, jul: 0, aug: 0, sep: 0 },
  { name: "Tinni Naguit", jan: 600, feb: 500, mar: 300, apr: 0, may: 0, jun: 0, jul: 20, aug: 200, sep: 0 },
  { name: "Catereena Canlas", jan: 200, feb: 0, mar: 550, apr: 300, may: 0, jun: 0, jul: 0, aug: 400, sep: 0 },
  { name: "Paula Benilde Dungo", jan: 100, feb: 80, mar: 50, apr: 150, may: 325, jun: 400, jul: 300, aug: 0, sep: 0 },
  { name: "Lea Nacu", jan: 580, feb: 240, mar: 130, apr: 0, may: 0, jun: 0, jul: 0, aug: 150, sep: 50 },
  { name: "CJ Yu", jan: 180, feb: 120, mar: 210, apr: 390, may: 0, jun: 0, jul: 0, aug: 100, sep: 0 },
  { name: "Derek Twano", jan: 0, feb: 500, mar: 320, apr: 100, may: 45, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Eboy Villena", jan: 185, feb: 195, mar: 270, apr: 245, may: 0, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Iya Noelle Wijangco", jan: 420, feb: 400, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Homer Gallardo", jan: 0, feb: 250, mar: 100, apr: 150, may: 100, jun: 100, jul: 0, aug: 0, sep: 0 },
  { name: "Ismael Dela Paz", jan: 40, feb: 45, mar: 200, apr: 100, may: 80, jun: 40, jul: 0, aug: 0, sep: 0 },
  { name: "Joey Espiritu", jan: 400, feb: 0, mar: 0, apr: 0, may: 0, jun: 40, jul: 0, aug: 0, sep: 0 },
  { name: "Tracy Gomez-Talo", jan: 320, feb: 40, mar: 0, apr: 0, may: 0, jun: 0, jul: 60, aug: 0, sep: 0 },
  { name: "Adrian Raphael Choi", jan: 170, feb: 40, mar: 210, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Oyet Martin", jan: 70, feb: 80, mar: 0, apr: 0, may: 150, jun: 0, jul: 0, aug: 100, sep: 0 },
  { name: "Renee Anne Pabalete", jan: 0, feb: 200, mar: 200, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Ak Vinluan", jan: 200, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 170, aug: 0, sep: 0 },
  { name: "Ron Balboa", jan: 0, feb: 0, mar: 20, apr: 40, may: 300, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Luchie Vivas", jan: 210, feb: 40, mar: 75, apr: 0, may: 0, jun: 0, jul: 0, aug: 20, sep: 0 },
  { name: "Helen Sundiam", jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 175, sep: 140 },
  { name: "APM", jan: 300, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "France Marie Tongol", jan: 140, feb: 100, mar: 25, apr: 0, may: 0, jun: 0, jul: 0, aug: 20, sep: 0 },
  { name: "Larry Santos", jan: 0, feb: 80, mar: 130, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Jad Garbes", jan: 0, feb: 200, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Bea Burgos-Noveras", jan: 150, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Alyssa Mika Dianelo", jan: 150, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Mervin Nagun", jan: 50, feb: 70, mar: 25, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Inigo Vergara Vicencio", jan: 0, feb: 0, mar: 140, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Luis Miguel Pondang", jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 120, sep: 0 },
  { name: "Frenz David", jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 100, sep: 0 },
  { name: "Vonnel Manabat", jan: 100, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Matthew Gatpolintan", jan: 0, feb: 0, mar: 100, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Cie Arnz", jan: 100, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Bi Angeles", jan: 0, feb: 0, mar: 0, apr: 90, may: 0, jun: 0, jul: 0, aug: 0, sep: 0 },
  { name: "Louise Soliman", jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 20, jul: 0, aug: 60, sep: 0 }
];

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep'];
const monthNames = ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025', 'August 2025', 'September 2025'];

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createUsersIfNotExist() {
  console.log('📝 Creating users if they don\'t exist...');
  let createdCount = 0;
  
  for (const member of memberContributions) {
    const existingUser = await User.findOne({ fullName: member.name });
    
    if (!existingUser) {
      const username = member.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      
      const newUser = new User({
        username: username,
        email: `${username}@tennis.com`,
        password: 'hashedpassword123', // In real app, this would be properly hashed
        fullName: member.name,
        gender: 'other', // Default gender
        phone: '+639123456789',
        address: 'Tennis Club Address',
        role: 'member',
        isActive: true,
        isApproved: true,
        membershipFeesPaid: true,
        coinBalance: 100,
        registrationDate: new Date()
      });
      
      await newUser.save();
      createdCount++;
      console.log(`👤 Created user: ${member.name}`);
    }
  }
  
  console.log(`✅ User creation complete. Created ${createdCount} new users.`);
}

async function createSampleReservations() {
  console.log('📅 Creating sample reservations...');
  let createdCount = 0;
  
  // Create some sample reservations for each user
  for (const member of memberContributions) {
    const user = await User.findOne({ fullName: member.name });
    if (!user) continue;
    
    // Create a few reservations across different months
    for (let monthIndex = 0; monthIndex < months.length; monthIndex++) {
      const monthKey = months[monthIndex];
      const amount = member[monthKey];
      
      if (amount > 0) {
        // Create 1-3 reservations for this month based on amount
        const numReservations = Math.max(1, Math.floor(amount / 100));
        
        for (let i = 0; i < numReservations; i++) {
          const reservationDate = new Date(2025, monthIndex, Math.floor(Math.random() * 28) + 1);
          const timeSlot = Math.floor(Math.random() * 15) + 6; // 6 AM to 9 PM
          
          const reservation = new Reservation({
            userId: user._id,
            date: reservationDate,
            timeSlot: timeSlot,
            players: [user._id],
            totalFee: Math.floor(amount / numReservations),
            status: 'completed',
            createdAt: reservationDate
          });
          
          await reservation.save();
          createdCount++;
        }
      }
    }
  }
  
  console.log(`✅ Created ${createdCount} sample reservations.`);
}

async function insertPaymentData() {
  console.log('💰 Inserting payment data...');
  let totalInserted = 0;
  
  // Clear existing recorded payments
  await Payment.deleteMany({ status: 'record' });
  console.log('🗑️  Cleared existing recorded payments');
  
  for (const member of memberContributions) {
    const user = await User.findOne({ fullName: member.name });
    if (!user) {
      console.log(`❌ User not found: ${member.name}`);
      continue;
    }
    
    // Insert payments for each month
    for (let monthIndex = 0; monthIndex < months.length; monthIndex++) {
      const monthKey = months[monthIndex];
      const amount = member[monthKey];
      
      if (amount > 0) {
        // Create recorded payment directly (no reservation needed for the report)
        const paymentDate = new Date(2025, monthIndex, Math.floor(Math.random() * 28) + 1);
        const payment = new Payment({
          userId: user._id,
          amount: amount,
          paymentMethod: 'gcash',
          status: 'record',
          description: `Court fees for ${monthNames[monthIndex]}`,
          dueDate: paymentDate,
          paymentDate: paymentDate,
          recordedAt: paymentDate,
          createdAt: paymentDate,
          metadata: {
            isManualPayment: true,
            playerNames: [user.fullName],
            courtUsageDate: paymentDate
          }
        });
        
        await payment.save();
        totalInserted++;
        
        if (totalInserted % 50 === 0) {
          console.log(`💳 Inserted ${totalInserted} payments...`);
        }
      }
    }
  }
  
  console.log(`✅ Payment insertion complete! Total payments: ${totalInserted}`);
}

async function main() {
  try {
    console.log('🚀 Starting data insertion process...');
    
    await connectToDatabase();
    await createUsersIfNotExist();
    // Skip reservation creation and go directly to payment insertion
    await insertPaymentData();
    
    console.log('🎉 Data insertion completed successfully!');
    console.log('📊 You can now check the court usage report to see all the member contributions.');
    
  } catch (error) {
    console.error('❌ Error during data insertion:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
  }
}

main();