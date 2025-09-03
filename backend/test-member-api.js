const mongoose = require('mongoose');
require('dotenv').config();

async function testMemberAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Import User model schema directly
    const User = mongoose.model('User', new mongoose.Schema({
      username: String,
      fullName: String,
      email: String,
      isActive: Boolean,
      isApproved: Boolean,
      role: String
    }), 'users');
    
    // Check the specific missing players without any filters
    const missingPlayerIds = [
      '68a7bd642e91c9d68ec844d4',
      '68a7bd602e91c9d68ec844a6', 
      '68a7bd752e91c9d68ec845ab',
      '68a7bd642e91c9d68ec844d9',
      '68a7bd642e91c9d68ec844de'
    ];
    
    console.log('🔍 Checking missing players raw data...');
    for (const playerId of missingPlayerIds) {
      const player = await User.findById(playerId);
      if (player) {
        console.log(`✅ ${playerId}:`);
        console.log(`   - fullName: "${player.fullName}"`);
        console.log(`   - username: "${player.username}"`);
        console.log(`   - email: "${player.email}"`);
        console.log(`   - role: "${player.role}"`);
        console.log(`   - isActive: ${player.isActive}`);
        console.log(`   - isApproved: ${player.isApproved}`);
      }
    }
    
    // Test various filter combinations
    console.log('\n🔍 Testing different filters...');
    
    const allUsers = await User.find({});
    console.log(`📊 Total users: ${allUsers.length}`);
    
    const usersWithRole = await User.find({ role: { $exists: true } });
    console.log(`📊 Users with role field: ${usersWithRole.length}`);
    
    const membersAndAdmins = await User.find({ role: { $in: ['member', 'admin'] } });
    console.log(`📊 Members/admins: ${membersAndAdmins.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

testMemberAPI();