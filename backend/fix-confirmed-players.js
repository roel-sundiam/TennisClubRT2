const mongoose = require('mongoose');
require('dotenv').config();

async function fixConfirmedPlayers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Poll = mongoose.model('Poll', new mongoose.Schema({
      title: String,
      status: String,
      options: [{
        text: String,
        votes: Number,
        voters: [String]
      }],
      metadata: {
        category: String
      },
      openPlayEvent: {
        confirmedPlayers: [String],
        matches: mongoose.Schema.Types.Mixed,
        matchesGenerated: Boolean
      }
    }), 'polls');
    
    console.log('🔧 Fixing confirmedPlayers sync...\n');
    
    const openPlayPolls = await Poll.find({ 'metadata.category': 'open_play' });
    
    for (const poll of openPlayPolls) {
      const yesOption = poll.options.find(option => option.text.toLowerCase() === 'yes');
      
      if (yesOption && poll.openPlayEvent) {
        const beforeCount = poll.openPlayEvent.confirmedPlayers.length;
        const yesVoters = yesOption.voters.length;
        
        console.log(`📊 Poll: "${poll.title}"`);
        console.log(`   Before: ${beforeCount} confirmed players`);
        console.log(`   Yes Votes: ${yesVoters}`);
        
        // Manually sync Yes voters to confirmedPlayers
        poll.openPlayEvent.confirmedPlayers = yesOption.voters;
        
        await poll.save();
        
        console.log(`   After: ${poll.openPlayEvent.confirmedPlayers.length} confirmed players`);
        console.log(`   ✅ Fixed sync\n`);
      }
    }
    
    console.log('🎯 Verification - checking button visibility now...');
    
    const updatedPolls = await Poll.find({ 'metadata.category': 'open_play' });
    
    for (const poll of updatedPolls) {
      if (poll.openPlayEvent) {
        const confirmedCount = poll.openPlayEvent.confirmedPlayers.length;
        const matchesGenerated = poll.openPlayEvent.matchesGenerated || false;
        const shouldShowButton = !matchesGenerated && confirmedCount >= 4;
        
        console.log(`📊 Poll: "${poll.title}"`);
        console.log(`   Confirmed Players: ${confirmedCount}`);
        console.log(`   Generate Button Should Show: ${shouldShowButton ? '✅ YES' : '❌ NO'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixConfirmedPlayers();