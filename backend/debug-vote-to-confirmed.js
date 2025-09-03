const mongoose = require('mongoose');
require('dotenv').config();

async function debugVoteToConfirmed() {
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
    
    console.log('🔍 Debugging vote to confirmedPlayers conversion...\n');
    
    const polls = await Poll.find({});
    
    for (const poll of polls) {
      if (poll.openPlayEvent) {
        console.log(`📊 Poll: "${poll.title}"`);
        console.log(`   Status: ${poll.status}`);
        console.log(`   Metadata Category: ${poll.metadata?.category}`);
        
        // Check options
        poll.options.forEach((option, index) => {
          console.log(`   Option ${index + 1}: "${option.text}" - ${option.votes} votes, ${option.voters.length} voters`);
          if (option.voters.length > 0) {
            console.log(`      Voters: ${option.voters.slice(0, 3).join(', ')}${option.voters.length > 3 ? '...' : ''}`);
          }
        });
        
        // Check Open Play data
        const confirmedCount = poll.openPlayEvent.confirmedPlayers?.length || 0;
        console.log(`   Confirmed Players: ${confirmedCount}`);
        if (confirmedCount > 0) {
          console.log(`      Players: ${poll.openPlayEvent.confirmedPlayers.slice(0, 3).join(', ')}${confirmedCount > 3 ? '...' : ''}`);
        }
        
        // Check if post-save middleware should work
        const isOpenPlay = poll.metadata?.category === 'open_play';
        const yesOption = poll.options.find(option => option.text.toLowerCase() === 'yes');
        console.log(`   Is Open Play Category: ${isOpenPlay}`);
        console.log(`   Has Yes Option: ${!!yesOption}`);
        
        if (isOpenPlay && yesOption) {
          const yesVoters = yesOption.voters.length;
          const confirmedLength = poll.openPlayEvent.confirmedPlayers.length;
          
          if (yesVoters !== confirmedLength) {
            console.log(`   ❌ MISMATCH: ${yesVoters} Yes votes but ${confirmedLength} confirmed players`);
            console.log(`   🔧 Should auto-sync: Yes voters -> confirmedPlayers`);
          } else {
            console.log(`   ✅ SYNCED: Yes votes match confirmed players`);
          }
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

debugVoteToConfirmed();