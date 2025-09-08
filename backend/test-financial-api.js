const axios = require('axios');

async function testFinancialReport() {
  try {
    console.log('🧪 Testing financial report API with database expenses...');
    
    // First login to get admin token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'superadmin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Admin login successful with token');
    
    const response = await axios.get('http://localhost:3000/api/reports/financial-sheet', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Response status:', response.status);
    console.log('📊 Financial Data Structure:');
    console.log('Club Name:', response.data.data.clubName);
    console.log('Period:', response.data.data.period);
    console.log('Total Receipts:', '₱' + response.data.data.totalReceipts.toLocaleString());
    
    console.log('\n💰 Disbursements/Expenses:');
    response.data.data.disbursementsExpenses.forEach((expense, index) => {
      console.log(`${index + 1}. ${expense.description}: ₱${expense.amount.toLocaleString()}`);
    });
    
    console.log('\n📈 Financial Summary:');
    console.log('Total Disbursements:', '₱' + response.data.data.totalDisbursements.toLocaleString());
    console.log('Net Income:', '₱' + response.data.data.netIncome.toLocaleString());
    console.log('Fund Balance:', '₱' + response.data.data.fundBalance.toLocaleString());
    console.log('Last Updated:', response.data.data.lastUpdated);
    
    console.log('\n✅ Financial report API test completed successfully!');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

testFinancialReport();