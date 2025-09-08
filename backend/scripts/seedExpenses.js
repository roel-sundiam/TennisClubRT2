const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import the Expense model
const ExpenseSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  details: { type: String, required: true },
  category: { type: String, required: true },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Expense = mongoose.model('Expense', ExpenseSchema);

// Expense data from user
const expenseData = [
  { date: '2025-01-02', amount: 300.00, details: 'Tapulin - Rules and Regulations', category: 'Purchase - Miscelleanous' },
  { date: '2025-01-02', amount: 120.00, details: 'Tarpulin Shipping', category: 'Delivery Fee' },
  { date: '2025-01-05', amount: 570.00, details: 'Vinyl Sticker - Net Repair', category: 'Purchase - Miscelleanous' },
  { date: '2025-01-11', amount: 40, details: 'Mineral Water', category: 'Mineral Water' },
  { date: '2025-01-11', amount: 400, details: 'Ball Boy Service', category: 'Court Service' },
  { date: '2025-01-15', amount: 200, details: 'Grass Cutting/CR', category: 'Court Maintenance' },
  { date: '2025-01-18', amount: 400, details: 'Ball Boy Service', category: 'Court Service' },
  { date: '2025-01-18', amount: 800, details: 'Court Pain Retouch', category: 'Court Maintenance' },
  { date: '2025-01-21', amount: 140.00, details: 'Tapulin - Scan Codes', category: 'Purchase - Miscelleanous' },
  { date: '2025-01-21', amount: 120.00, details: 'Tarpulin Shipping', category: 'Delivery Fee' },
  { date: '2025-01-25', amount: 300, details: 'Ball Boy Service', category: 'Court Service' },
  { date: '2025-01-31', amount: 40, details: 'Mineral Water', category: 'Mineral Water' },
  { date: '2025-01-31', amount: 200, details: 'Grass Cutting/CR', category: 'Court Maintenance' },
  { date: '2025-02-03', amount: 140.00, details: 'Tapulin - Scan Codes', category: 'Purchase - Miscelleanous' },
  { date: '2025-02-06', amount: 400, details: 'Tapulin - No Parking', category: 'Purchase - Miscelleanous' },
  { date: '2025-02-06', amount: 120.00, details: 'Tarpulin Shipping', category: 'Delivery Fee' },
  { date: '2025-02-06', amount: 6000, details: 'Tennis Net', category: 'Purchase - Tennis Net' },
  { date: '2025-02-08', amount: 300, details: 'Body Filler Hardener', category: 'Purchase - Miscelleanous' },
  { date: '2025-02-08', amount: 300, details: 'Ball Boy Service', category: 'Court Service' },
  { date: '2025-02-10', amount: 180, details: 'Tapulin - Bracketing', category: 'Purchase - Miscelleanous' },
  { date: '2025-02-10', amount: 120.00, details: 'Tarpulin Shipping', category: 'Delivery Fee' },
  { date: '2025-02-10', amount: 1200, details: '2 - Floor Maps', category: 'Purchase - Miscelleanous' },
  { date: '2025-02-15', amount: 600, details: 'Court Pain Retouch', category: 'Court Maintenance' },
  { date: '2025-02-15', amount: 1200, details: 'Net Repair', category: 'Court Maintenance' },
  { date: '2025-02-15', amount: 400, details: 'Grass Cutting/CR', category: 'Court Maintenance' },
  { date: '2025-02-22', amount: 400, details: 'Ball Boy Service', category: 'Court Service' },
  { date: '2025-02-22', amount: 40, details: 'Mineral Water', category: 'Mineral Water' },
  { date: '2025-03-02', amount: 200, details: 'Grass Cutting/CR', category: 'Court Maintenance' },
  { date: '2025-03-09', amount: 40, details: 'Mineral Water', category: 'Mineral Water' },
  { date: '2025-03-15', amount: 800, details: 'Repair Light, Net Fence, Scoreboard', category: 'Court Maintenance' },
  { date: '2025-03-17', amount: 820, details: 'Treasurer\'s Cup Expense: Food, Umpire, Maintenance', category: 'Tournament Expense' },
  { date: '2025-03-17', amount: 1500, details: 'Score Flat/Number Stickers', category: 'Tennis Score Board' },
  { date: '2025-03-20', amount: 3400, details: 'Lights Purchased - Qty: 2', category: 'Purchase - Lights' },
  { date: '2025-03-21', amount: 550, details: 'Electric Wire, Electric Tape for Lights Installation', category: 'Purchase - Miscelleanous' },
  { date: '2025-03-21', amount: 40, details: 'Mineral Water', category: 'Mineral Water' },
  { date: '2025-03-21', amount: 600, details: '2 New Lights Installation', category: 'Court Maintenance' },
  { date: '2025-03-23', amount: 250, details: 'Paper Cups', category: 'Purchase - Miscelleanous' },
  { date: '2025-03-30', amount: 20504.00, details: 'Water System Revival', category: 'Water System Project Expense' },
  { date: '2025-04-01', amount: 200, details: 'Grass Cutting/CR', category: 'Court Maintenance' },
  { date: '2025-04-01', amount: 40, details: 'Mineral Water', category: 'Mineral Water' },
  { date: '2025-04-01', amount: 165.00, details: 'Firefly Light Bulb for CR', category: 'Purchase - Miscelleanous' },
  { date: '2025-04-01', amount: 135, details: 'Outlet 2 Gang', category: 'Purchase - Miscelleanous' },
  { date: '2025-04-07', amount: 525, details: 'CR Accessories', category: 'Purchase - Miscelleanous' },
  { date: '2025-04-06', amount: 515, details: 'Amerilock Combination Padlock', category: 'Purchase - Miscelleanous' },
  { date: '2025-04-09', amount: 40, details: 'Mineral Water', category: 'Mineral Water' },
  { date: '2025-04-11', amount: 175, details: 'CR Flexible Hose', category: 'Purchase - Miscelleanous' },
  { date: '2025-04-11', amount: 800.00, details: 'CR Bidet Shower Installation', category: 'Court Maintenance' },
  { date: '2025-04-11', amount: 1250, details: 'CR Bidet Shower Accessories', category: 'Purchase - Miscelleanous' },
  { date: '2025-04-15', amount: 200, details: 'Grass Cutting/CR', category: 'Court Maintenance' },
  { date: '2025-04-24', amount: 40, details: 'Mineral Water', category: 'Mineral Water' },
  { date: '2025-05-12', amount: 40, details: 'Mineral Water', category: 'Mineral Water' },
  { date: '2025-05-14', amount: 85.00, details: 'Faucet Cap', category: 'Purchase - Miscelleanous' },
  { date: '2025-05-14', amount: 200, details: 'Grass Cutting/CR', category: 'Court Maintenance' },
  { date: '2025-05-23', amount: 40, details: 'Mineral Water', category: 'Mineral Water' },
  { date: '2025-05-23', amount: 600, details: 'Faucet Leak Repair', category: 'Court Maintenance' },
  { date: '2025-05-23', amount: 1200, details: 'Digital Wall Clock', category: 'Purchase - Miscelleanous' },
  { date: '2025-05-24', amount: 200, details: 'Grass Cutting/CR', category: 'Court Maintenance' },
  { date: '2025-06-02', amount: 275, details: 'Grass Cutting/CR', category: 'Court Maintenance' },
  { date: '2025-06-15', amount: 200, details: 'Grass Cutting/CR', category: 'Court Maintenance' },
  { date: '2025-06-15', amount: 40, details: 'Mineral Water', category: 'Mineral Water' },
  { date: '2025-06-30', amount: 5000, details: 'RT2 club Financial Donation to Joey', category: 'Financial Donation' },
  { date: '2025-07-02', amount: 200, details: 'Grass Cutting/CR', category: 'Court Maintenance' },
  { date: '2025-07-11', amount: 500, details: 'Fence Net Repair/Window repair', category: 'Court Maintenance' },
  { date: '2025-07-17', amount: 200, details: 'Grass Cutting/CR', category: 'Court Maintenance' },
  { date: '2025-07-17', amount: 40, details: 'Mineral Water', category: 'Mineral Water' },
  { date: '2025-08-04', amount: 2000, details: 'Lights Purchased - Qty: 1', category: 'Purchase - Lights' },
  { date: '2025-08-18', amount: 40, details: 'Mineral Water', category: 'Mineral Water' }
];

async function seedExpenses() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Check if expenses already exist
    const existingCount = await Expense.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️ Found ${existingCount} existing expenses. Clearing collection...`);
      await Expense.deleteMany({});
      console.log('🗑️ Cleared existing expenses');
    }

    // Transform and insert expense data
    console.log('📝 Inserting expense data...');
    const expenses = expenseData.map(expense => ({
      ...expense,
      date: new Date(expense.date),
      createdBy: 'system-seed'
    }));

    await Expense.insertMany(expenses);
    
    // Verify insertion
    const insertedCount = await Expense.countDocuments();
    const totalAmount = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    console.log(`✅ Successfully inserted ${insertedCount} expenses`);
    console.log(`💰 Total expense amount: ₱${totalAmount[0]?.total?.toLocaleString() || 0}`);

    // Show category breakdown
    const categoryBreakdown = await Expense.aggregate([
      { 
        $group: { 
          _id: '$category', 
          count: { $sum: 1 }, 
          totalAmount: { $sum: '$amount' } 
        } 
      },
      { $sort: { totalAmount: -1 } }
    ]);

    console.log('\n📊 Category breakdown:');
    categoryBreakdown.forEach(cat => {
      console.log(`  ${cat._id}: ${cat.count} items, ₱${cat.totalAmount.toLocaleString()}`);
    });

  } catch (error) {
    console.error('❌ Error seeding expenses:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the seed function
if (require.main === module) {
  console.log('🌱 Starting expense seeding process...');
  seedExpenses();
}

module.exports = seedExpenses;