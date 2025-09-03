const mongoose = require('mongoose');
require('dotenv').config();

async function debugButtonVisibility() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Poll = mongoose.model('Poll', new mongoose.Schema({
      title: String,
      status: String,
      openPlayEvent: {
        confirmedPlayers: [String],
        matches: mongoose.Schema.Types.Mixed,
        matchesGenerated: Boolean
      }
    }), 'polls');
    
    console.log('🔍 Debugging Generate Matches button visibility...\n');
    
    const polls = await Poll.find({});
    
    for (const poll of polls) {
      if (poll.openPlayEvent) {
        const event = poll.openPlayEvent;
        const confirmedCount = event.confirmedPlayers?.length || 0;
        const hasMatches = event.matches && event.matches.length > 0;
        const matchesGenerated = event.matchesGenerated || false;
        
        console.log(`📊 Poll: "${poll.title}"`);
        console.log(`   Status: ${poll.status}`);
        console.log(`   Confirmed Players: ${confirmedCount}`);
        console.log(`   Has Matches: ${hasMatches}`);
        console.log(`   matchesGenerated: ${matchesGenerated}`);
        
        // Check button visibility conditions
        const shouldShowButton = !matchesGenerated && confirmedCount >= 4;
        console.log(`   🎯 Should Show Generate Button: ${shouldShowButton}`);
        
        if (shouldShowButton) {
          console.log(`   ✅ BUTTON SHOULD BE VISIBLE`);
        } else {
          console.log(`   ❌ Button hidden because:`);
          if (matchesGenerated) console.log(`      - matchesGenerated is true`);
          if (confirmedCount < 4) console.log(`      - Need at least 4 players (have ${confirmedCount})`);
        }
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

debugButtonVisibility();