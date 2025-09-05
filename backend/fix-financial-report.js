const fs = require('fs');
const path = require('path');

console.log('🔧 Manual fix for financial report requested');

try {
  // Read current financial report
  const dataPath = path.join(__dirname, 'data/financial-report.json');
  const fileContent = fs.readFileSync(dataPath, 'utf8');
  const financialData = JSON.parse(fileContent);
  
  // Find Tennis Court Usage Receipts
  const courtReceiptsIndex = financialData.receiptsCollections.findIndex((item) => 
    item.description === 'Tennis Court Usage Receipts'
  );
  
  if (courtReceiptsIndex !== -1) {
    const baselineAmount = 67800; // Google Sheets baseline
    const recordedAmount = 70; // Homer's recorded payment
    const newAmount = baselineAmount + recordedAmount;
    
    console.log(`💰 Baseline: ₱${baselineAmount}, Recorded: ₱${recordedAmount}, Total: ₱${newAmount}`);
    
    financialData.receiptsCollections[courtReceiptsIndex].amount = newAmount;
    
    // Recalculate total receipts
    financialData.totalReceipts = financialData.receiptsCollections.reduce((sum, item) => sum + item.amount, 0);
    
    // Ensure App Service Fee is preserved in disbursements
    let appServiceFee = 103.20; // Use the known correct amount
    const appServiceFeeIndex = financialData.disbursementsExpenses.findIndex(
      (item) => item.description === 'App Service Fee'
    );
    
    if (appServiceFeeIndex === -1) {
      // Add App Service Fee if it doesn't exist
      financialData.disbursementsExpenses.push({
        description: 'App Service Fee',
        amount: appServiceFee
      });
      console.log('💰 Added missing App Service Fee to financial report (script)');
    } else {
      // Preserve existing App Service Fee amount
      appServiceFee = financialData.disbursementsExpenses[appServiceFeeIndex].amount;
      console.log(`💰 Preserved existing App Service Fee: ₱${appServiceFee} (script)`);
    }
    
    // Recalculate total disbursements to include App Service Fee
    financialData.totalDisbursements = financialData.disbursementsExpenses.reduce((sum, item) => sum + item.amount, 0);
    
    // Recalculate net income and fund balance
    financialData.netIncome = financialData.totalReceipts - financialData.totalDisbursements;
    financialData.fundBalance = financialData.beginningBalance.amount + financialData.netIncome;
    financialData.lastUpdated = new Date().toISOString();
    
    // Save updated report
    fs.writeFileSync(dataPath, JSON.stringify(financialData, null, 2));
    
    console.log('✅ Financial report manually fixed:', {
      baseline: baselineAmount,
      recorded: recordedAmount,
      total: newAmount,
      totalReceipts: financialData.totalReceipts,
      netIncome: financialData.netIncome,
      fundBalance: financialData.fundBalance
    });
    
  } else {
    console.log('❌ Tennis Court Usage Receipts not found in financial data');
  }
  
} catch (error) {
  console.error('❌ Error fixing financial report:', error);
}