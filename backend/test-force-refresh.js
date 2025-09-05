const fs = require('fs');
const path = require('path');

async function testForceRefresh() {
  try {
    console.log('🔧 Testing Force Refresh logic with recorded payments...');
    
    // Simulate getting recorded payments (manually for testing)
    console.log('💰 Simulating recorded payments...');
    const recordedPayments = [{ amount: 70 }]; // Homer's payment
    const totalRecordedAmount = recordedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    console.log(`💰 Found ${recordedPayments.length} recorded payments totaling ₱${totalRecordedAmount}`);
    
    // Read current financial report
    const dataPath = path.join(__dirname, 'data/financial-report.json');
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const freshData = JSON.parse(fileContent);
    
    // Find Tennis Court Usage Receipts and add recorded payments
    const courtReceiptsIndex = freshData.receiptsCollections.findIndex((item) => 
      item.description === 'Tennis Court Usage Receipts'
    );
    
    if (courtReceiptsIndex !== -1 && totalRecordedAmount > 0) {
      const courtReceiptsItem = freshData.receiptsCollections[courtReceiptsIndex];
      if (courtReceiptsItem) {
        const baselineAmount = courtReceiptsItem.amount;
        const newAmount = baselineAmount + totalRecordedAmount;
        
        console.log(`🧮 Adjusting Tennis Court Usage Receipts: baseline ₱${baselineAmount} + recorded ₱${totalRecordedAmount} = ₱${newAmount}`);
        
        courtReceiptsItem.amount = newAmount;
        
        // Recalculate total receipts
        freshData.totalReceipts = freshData.receiptsCollections.reduce((sum, item) => sum + item.amount, 0);
        
        // Ensure App Service Fee is preserved in disbursements
        let appServiceFee = 103.20; // Use the known correct amount
        const appServiceFeeIndex = freshData.disbursementsExpenses.findIndex(
          (item) => item.description === 'App Service Fee'
        );
        
        if (appServiceFeeIndex === -1) {
          // Add App Service Fee if it doesn't exist
          freshData.disbursementsExpenses.push({
            description: 'App Service Fee',
            amount: appServiceFee
          });
          console.log('💰 Added missing App Service Fee to financial report (test)');
        } else {
          // Preserve existing App Service Fee amount
          appServiceFee = freshData.disbursementsExpenses[appServiceFeeIndex].amount;
          console.log(`💰 Preserved existing App Service Fee: ₱${appServiceFee} (test)`);
        }
        
        // Recalculate total disbursements to include App Service Fee
        freshData.totalDisbursements = freshData.disbursementsExpenses.reduce((sum, item) => sum + item.amount, 0);
        
        // Recalculate net income and fund balance
        freshData.netIncome = freshData.totalReceipts - freshData.totalDisbursements;
        freshData.fundBalance = freshData.beginningBalance.amount + freshData.netIncome;
        freshData.lastUpdated = new Date().toISOString();
        
        console.log(`📊 Updated totals: receipts ₱${freshData.totalReceipts}, net income ₱${freshData.netIncome}, fund balance ₱${freshData.fundBalance}`);
        
        // Save updated report
        fs.writeFileSync(dataPath, JSON.stringify(freshData, null, 2), 'utf8');
        console.log('💾 Financial report JSON file updated with fresh data + recorded payments');
        
        console.log('✅ Test completed successfully!');
        return true;
      }
    }
    
    console.log('❌ No recorded payments found or court receipts not found');
    return false;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testForceRefresh();