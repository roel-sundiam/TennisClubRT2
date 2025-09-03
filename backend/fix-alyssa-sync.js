const mongoose = require('mongoose');
require('dotenv').config();

async function fixAlyssaSync() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tennisclub');
    
    const Poll = mongoose.model('Poll', new mongoose.Schema({}, { strict: false }), 'polls');
    
    const poll = await Poll.findOne({ 
      title: 'Open Play 1',
      'metadata.category': 'open_play'
    });
    
    if (!poll) {
      console.log('❌ Poll not found');
      return;
    }
    
    console.log('📊 Before fix:');
    console.log('  Yes voters:', poll.options[0].voters.length);
    console.log('  Confirmed players:', poll.openPlayEvent.confirmedPlayers.length);
    console.log('  Alyssa in voters:', poll.options[0].voters.includes('68a7bd6c2e91c9d68ec8453d'));
    console.log('  Alyssa in confirmed:', poll.openPlayEvent.confirmedPlayers.includes('68a7bd6c2e91c9d68ec8453d'));
    
    // Force sync - copy all Yes voters to confirmedPlayers
    const yesOption = poll.options.find(opt => opt.text.toLowerCase() === 'yes');
    if (yesOption) {
      console.log('\n🔄 Syncing confirmed players with Yes voters...');
      poll.openPlayEvent.confirmedPlayers = [...yesOption.voters]; // Create new array
      
      // Mark as modified to ensure save
      poll.markModified('openPlayEvent.confirmedPlayers');
      
      await poll.save();
      
      console.log('\n✅ After fix:');
      console.log('  Yes voters:', yesOption.voters.length);
      console.log('  Confirmed players:', poll.openPlayEvent.confirmedPlayers.length);
      console.log('  Alyssa in confirmed:', poll.openPlayEvent.confirmedPlayers.includes('68a7bd6c2e91c9d68ec8453d'));
      
      console.log('\n📝 All confirmed players:');
      poll.openPlayEvent.confirmedPlayers.forEach((playerId, index) => {
        console.log(`  ${index + 1}. ${playerId}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

fixAlyssaSync();