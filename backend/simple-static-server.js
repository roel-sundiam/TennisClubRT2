// Simple standalone server for static court usage data
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001; // Different port to avoid conflicts

// CORS configuration
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:4201'],
  credentials: true
}));

app.use(express.json());

// Static data from screenshots - all 60 members
const staticData = [
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

const monthNames = ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025', 'August 2025', 'September 2025'];
const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep'];

// Static court usage report endpoint
app.get('/api/reports/static-court-usage', (req, res) => {
  try {
    console.log('📊 Loading static court usage data from screenshots...');

    // Convert to the aggregated format (like the screenshots)
    const rawData = staticData.map(member => {
      const row = { 'Players/Members': member.name };
      let total = 0;
      
      monthNames.forEach((monthName, index) => {
        const monthKey = monthKeys[index];
        const amount = member[monthKey] || 0;
        row[monthName] = amount > 0 ? `₱${amount.toFixed(2)}` : '₱0.00';
        total += amount;
      });
      
      row['Total'] = `₱${total.toFixed(2)}`;
      return row;
    });

    // Sort by total amount (highest first)
    rawData.sort((a, b) => {
      const totalA = parseFloat(a['Total'].replace('₱', ''));
      const totalB = parseFloat(b['Total'].replace('₱', ''));
      return totalB - totalA;
    });

    const totalRevenue = rawData.reduce((sum, member) => {
      return sum + parseFloat(member['Total'].replace('₱', ''));
    }, 0);

    const headers = ['Players/Members', ...monthNames, 'Total'];

    const courtUsageData = {
      summary: {
        totalMembers: staticData.length,
        totalRecordedPayments: staticData.length * 9,
        totalRevenue: `₱${totalRevenue.toFixed(2)}`,
        lastUpdated: new Date().toISOString()
      },
      rawData,
      headers
    };

    console.log(`📊 Static report loaded: ${staticData.length} members, ₱${totalRevenue.toFixed(2)} total`);

    res.status(200).json({
      success: true,
      data: courtUsageData,
      metadata: {
        source: 'static_screenshot_data',
        lastModified: new Date().toISOString(),
        cached: false,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error loading static court usage data:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to load static court usage data',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Static data server running on http://localhost:${PORT}`);
  console.log(`📊 Static court usage endpoint: http://localhost:${PORT}/api/reports/static-court-usage`);
});