const mongoose = require('mongoose');
require('dotenv').config();

async function debugMatchGeneration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tennisclub');
    
    const Poll = mongoose.model('Poll', new mongoose.Schema({}, { strict: false }), 'polls');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    
    const poll = await Poll.findOne({ 
      title: 'Open Play 1',
      'metadata.category': 'open_play'
    });
    
    if (!poll) {
      console.log('❌ Poll not found');
      return;
    }
    
    console.log('📊 Poll Debug Info:');
    console.log('  Title:', poll.title);
    console.log('  Yes voters count:', poll.options[0].voters.length);
    console.log('  Yes voters:', poll.options[0].voters);
    console.log('  Confirmed players count:', poll.openPlayEvent.confirmedPlayers.length);
    console.log('  Confirmed players:', poll.openPlayEvent.confirmedPlayers);
    console.log('  Alyssa ID in confirmed:', poll.openPlayEvent.confirmedPlayers.includes('68a7bd6c2e91c9d68ec8453d'));
    
    // Get player names for debugging
    const playerIds = poll.openPlayEvent.confirmedPlayers;
    const users = await User.find({ _id: { $in: playerIds } });
    
    console.log('\n👥 Confirmed Players with Names:');
    for (const playerId of playerIds) {
      const user = users.find(u => u._id.toString() === playerId);
      console.log(`  ${playerId}: ${user ? user.fullName : 'NOT FOUND'}`);
    }
    
    // Check current matches
    if (poll.openPlayEvent.matches && poll.openPlayEvent.matches.length > 0) {
      console.log('\n🎾 Current Matches:');
      poll.openPlayEvent.matches.forEach((match, index) => {
        console.log(`  Match ${index + 1}:`);
        match.players.forEach(playerId => {
          const user = users.find(u => u._id.toString() === playerId);
          console.log(`    ${playerId}: ${user ? user.fullName : 'NOT FOUND'}`);
        });
        console.log(`    Contains Alyssa: ${match.players.includes('68a7bd6c2e91c9d68ec8453d')}`);
      });
      
      // Check if Alyssa appears in any match
      const alyssaInAnyMatch = poll.openPlayEvent.matches.some(match => 
        match.players.includes('68a7bd6c2e91c9d68ec8453d')
      );
      console.log(`\n🔍 Alyssa appears in matches: ${alyssaInAnyMatch}`);
    } else {
      console.log('\n❌ No matches found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

debugMatchGeneration();