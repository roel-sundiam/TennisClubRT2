import { Request, Response } from 'express';
import CourtUsageReport from '../models/CourtUsageReport';

// Controller for court usage data from database
// Helper function to format currency without commas
function formatCurrency(amount: number): string {
  return `₱${amount.toFixed(2)}`;
}

// Helper function to generate dynamic month columns from January of given year to current month
function generateDynamicMonths(year: number): {monthNames: string[], monthKeys: string[]} {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
  
  const monthNames: string[] = [];
  const monthKeys: string[] = [];
  
  // If requested year is future, show all 12 months
  // If requested year is current year, show from January to current month
  // If requested year is past, show all 12 months
  const endMonth = (year === currentYear) ? currentMonth : 12;
  
  for (let month = 1; month <= endMonth; month++) {
    const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' });
    monthNames.push(`${monthName} ${year}`);
    monthKeys.push(`${year}-${month.toString().padStart(2, '0')}`);
  }
  
  return { monthNames, monthKeys };
}

export const getStaticCourtUsageReport = async (req: Request, res: Response) => {
  try {
    console.log('📊 Loading court usage data from database...');

    // Get year parameter, default to current year
    const currentYear = new Date().getFullYear();
    const year = parseInt(req.query.year as string) || currentYear;

    // Fetch data from database, sorted by total amount (highest first)
    const courtUsageRecords = await CourtUsageReport.find({ year }).sort({ totalAmount: -1 });

    if (!courtUsageRecords || courtUsageRecords.length === 0) {
      console.log(`⚠️  No court usage data found for year ${year}`);
      
      // Generate dynamic months even for empty data
      const { monthNames } = generateDynamicMonths(year);
      const headers = ['Players/Members', ...monthNames, 'Total'];
      
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
          headers
        }
      });
    }

    // Generate dynamic month columns based on year and current date
    const { monthNames, monthKeys } = generateDynamicMonths(year);
    
    console.log(`📅 Generated ${monthNames.length} dynamic month columns for year ${year}:`, monthNames);

    // Convert database records to the frontend format using dynamic months
    const rawData = courtUsageRecords.map(record => {
      const row: any = {
        'Players/Members': record.memberName
      };
      
      // Calculate total dynamically from monthlyAmounts Map
      let calculatedTotal = 0;
      
      // Map each dynamic month's data
      monthNames.forEach((monthName, index) => {
        const monthKey = monthKeys[index];
        if (!monthKey) return;
        
        // Get amount from the Map using the YYYY-MM key
        const amount = record.monthlyAmounts?.get(monthKey) || 0;
        calculatedTotal += amount;
        row[monthName] = amount > 0 ? formatCurrency(amount) : '₱0.00';
      });
      
      row['Total'] = formatCurrency(calculatedTotal);
      return row;
    });

    // Calculate summary statistics from live data
    const totalRevenue = rawData.reduce((sum, member) => {
      return sum + parseFloat(member['Total'].replace('₱', ''));
    }, 0);
    
    const totalRecordedPayments = courtUsageRecords.reduce((sum, record) => {
      // Count non-zero monthly payments from the Map
      let nonZeroMonths = 0;
      for (const amount of record.monthlyAmounts?.values() || []) {
        if (amount > 0) nonZeroMonths++;
      }
      return sum + nonZeroMonths;
    }, 0);

    // Calculate monthly totals for the totals row
    const monthlyTotals: number[] = [];
    let grandTotal = 0;
    
    // For each month, sum all member amounts
    monthNames.forEach((monthName, index) => {
      let monthTotal = 0;
      rawData.forEach(memberRow => {
        const amountStr = memberRow[monthName] || '₱0.00';
        const amount = parseFloat(amountStr.replace('₱', ''));
        monthTotal += amount;
      });
      monthlyTotals.push(monthTotal);
      grandTotal += monthTotal;
    });
    
    // Create the totals row with special formatting
    const totalsRow: any = {
      'Players/Members': 'MONTHLY TOTALS',
      _isTotal: true // Special flag for frontend styling
    };
    
    // Add monthly totals to the totals row
    monthNames.forEach((monthName, index) => {
      const monthTotal = monthlyTotals[index] || 0;
      totalsRow[monthName] = monthTotal > 0 ? formatCurrency(monthTotal) : '₱0.00';
    });
    
    // Add grand total
    totalsRow['Total'] = formatCurrency(grandTotal);
    
    // Add the totals row to rawData
    rawData.push(totalsRow);
    
    console.log(`📊 Added monthly totals row - Grand total: ₱${grandTotal.toFixed(2)}`);
    console.log(`📅 Monthly totals:`, monthlyTotals.map((total, i) => `${monthNames[i]}: ₱${total.toFixed(2)}`));

    const headers = ['Players/Members', ...monthNames, 'Total'];

    const courtUsageData = {
      summary: {
        totalMembers: courtUsageRecords.length,
        totalRecordedPayments,
        totalRevenue: formatCurrency(totalRevenue),
        lastUpdated: courtUsageRecords.length > 0 
          ? (courtUsageRecords[0]?.updatedAt || new Date()).toISOString() 
          : new Date().toISOString()
      },
      rawData,
      headers
    };

    console.log(`📊 Database report loaded: ${courtUsageRecords.length} members, ₱${totalRevenue.toFixed(2)} total`);
    console.log(`📅 Dynamic months (${monthNames.length}):`, monthKeys);

    res.status(200).json({
      success: true,
      data: courtUsageData,
      metadata: {
        source: 'mongodb_database',
        lastModified: courtUsageRecords.length > 0 
          ? (courtUsageRecords[0]?.updatedAt || new Date()).toISOString() 
          : new Date().toISOString(),
        cached: false,
        timestamp: new Date().toISOString(),
        year: year,
        recordCount: courtUsageRecords.length
      }
    });

  } catch (error: any) {
    console.error('❌ Error loading court usage data from database:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to load court usage data from database',
      error: error.message
    });
  }
};