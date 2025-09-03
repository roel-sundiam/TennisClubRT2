const mongoose = require('mongoose');
require('dotenv').config();

async function checkMissingPlayers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = mongoose.model('User', new mongoose.Schema({
      username: String,
      fullName: String,
      email: String
    }), 'users');
    
    // The missing players from the console logs
    const missingPlayerIds = [
      '68a7bd642e91c9d68ec844d4', // Harvey David
      '68a7bd602e91c9d68ec844a6', // Helen Sundiam  
      '68a7bd752e91c9d68ec845ab', // Roel Sundiam
      '68a7bd642e91c9d68ec844d9', // Homer Gallardo
      '68a7bd642e91c9d68ec844de'  // Inigo Vicencio
    ];
    
    console.log('🔍 Checking missing players...');
    
    for (const playerId of missingPlayerIds) {
      const player = await User.findById(playerId);
      if (player) {
        console.log(`✅ Found: ${playerId} -> ${player.fullName || player.username}`);
        console.log(`   📋 Status: isActive=${player.isActive}, isApproved=${player.isApproved}, role=${player.role}`);
      } else {
        console.log(`❌ NOT FOUND: ${playerId}`);
      }
    }
    
    // Also check all members to see the total count
    const allMembers = await User.find({});
    console.log(`\n📊 Total users in database: ${allMembers.length}`);
    
    // Check if there are any filtering criteria that might exclude these users
    const approvedMembers = await User.find({ isApproved: true });
    console.log(`📊 Approved users: ${approvedMembers.length}`);
    
    const paidMembers = await User.find({ membershipFeesPaid: true });
    console.log(`📊 Paid members: ${paidMembers.length}`);
    
    const activeMembersApprovedAndPaid = await User.find({ 
      isApproved: true, 
      membershipFeesPaid: true 
    });
    console.log(`📊 Active members (approved + paid): ${activeMembersApprovedAndPaid.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkMissingPlayers();