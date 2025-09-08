const CourtUsageReport = require('../models/CourtUsageReport.ts').default;

// Controller for court usage data from database
const getStaticCourtUsageReport = async (req, res) => {
  try {
    console.log('📊 Loading court usage data from database...');

    // Get year parameter, default to 2025
    const year = parseInt(req.query.year) || 2025;

    // Fetch data from database, sorted by total amount (highest first)
    const courtUsageRecords = await CourtUsageReport.find({ year }).sort({ totalAmount: -1 });

    if (!courtUsageRecords || courtUsageRecords.length === 0) {
      console.log(`⚠️  No court usage data found for year ${year}`);
      
      return res.status(404).json({
        success: false,
        message: `No court usage data found for year ${year}`,
        data: {
          summary: {
            totalMembers: 0,
            totalRecordedPayments: 0,
            totalRevenue: '₱0.00',
            lastUpdated: new Date().toISOString()
          },
          rawData: [],
          headers: []
        }
      });
    }

    const monthNames = ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025', 'August 2025', 'September 2025'];
    const monthFields = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september'];

    // Convert database records to the frontend format
    const rawData = courtUsageRecords.map(record => {
      const row = {
        'Players/Members': record.memberName
      };
      
      // Calculate total dynamically (don't trust stored totalAmount)
      let calculatedTotal = 0;
      
      // Map each month's data
      monthNames.forEach((monthName, index) => {
        const monthField = monthFields[index];
        const amount = record[monthField] || 0;
        calculatedTotal += amount;
        row[monthName] = amount > 0 ? `₱${amount.toFixed(2)}` : '₱0.00';
      });
      
      row['Total'] = `₱${calculatedTotal.toFixed(2)}`;
      return row;
    });

    // Calculate summary statistics from live data
    const totalRevenue = rawData.reduce((sum, member) => {
      return sum + parseFloat(member['Total'].replace('₱', ''));
    }, 0);
    
    const totalRecordedPayments = courtUsageRecords.reduce((sum, record) => {
      // Count non-zero monthly payments
      return sum + monthFields.filter(field => (record[field] || 0) > 0).length;
    }, 0);

    const headers = ['Players/Members', ...monthNames, 'Total'];

    const courtUsageData = {
      summary: {
        totalMembers: courtUsageRecords.length,
        totalRecordedPayments,
        totalRevenue: `₱${totalRevenue.toFixed(2)}`,
        lastUpdated: courtUsageRecords.length > 0 
          ? (courtUsageRecords[0].updatedAt || new Date()).toISOString() 
          : new Date().toISOString()
      },
      rawData,
      headers
    };

    console.log(`📊 Database report loaded: ${courtUsageRecords.length} members, ₱${totalRevenue.toFixed(2)} total`);

    res.status(200).json({
      success: true,
      data: courtUsageData,
      metadata: {
        source: 'mongodb_database',
        lastModified: courtUsageRecords.length > 0 
          ? (courtUsageRecords[0].updatedAt || new Date()).toISOString() 
          : new Date().toISOString(),
        cached: false,
        timestamp: new Date().toISOString(),
        year: year,
        recordCount: courtUsageRecords.length
      }
    });

  } catch (error) {
    console.error('❌ Error loading court usage data from database:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to load court usage data from database',
      error: error.message
    });
  }
};

module.exports = { getStaticCourtUsageReport };