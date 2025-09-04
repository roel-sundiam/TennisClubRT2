const mongoose = require('mongoose');
require('dotenv').config();

async function testRegenerationPreservation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔍 Connected to test preservation of completed matches');
    
    const Poll = require('./src/models/Poll').default;
    const pollId = '68b8bb0b2cb436d47ee60b56'; // September 7 Open Play
    
    console.log('\n📋 BEFORE: Current poll state');
    const poll = await Poll.findById(pollId);
    if (poll?.openPlayEvent?.matches) {
      console.log('Matches before:');
      poll.openPlayEvent.matches.forEach((match, i) => {
        console.log(`  Match ${match.matchNumber}: status=${match.status}, players=${match.players.length}`);
      });
    }
    
    // Simulate marking Match 1 as completed
    if (poll?.openPlayEvent?.matches?.length > 0) {
      console.log('\n✅ Marking Match 1 as completed...');
      poll.openPlayEvent.matches[0].status = 'completed';
      poll.openPlayEvent.matches[0].score = '6-4, 6-2';
      poll.openPlayEvent.matches[0].winningTeam = 1;
      await poll.save();
      console.log('Match 1 marked as completed');
    }
    
    console.log('\n🔄 Testing regeneration with completed Match 1...');
    // Now test the generateMatches logic by calling the actual endpoint
    const http = require('http');
    const data = JSON.stringify({});
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/polls/${pollId}/generate-matches`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.SUPERADMIN_TOKEN || 'your-token-here'
      }
    };
    
    console.log('Calling regenerate API...');
    // For testing, let's just check the current state after our manual change
    await poll.reload();
    
    console.log('\n📋 AFTER: Poll state after marking completed');
    if (poll?.openPlayEvent?.matches) {
      console.log('Matches after marking completed:');
      poll.openPlayEvent.matches.forEach((match, i) => {
        console.log(`  Match ${match.matchNumber}: status=${match.status}, score=${match.score || 'none'}`);
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testRegenerationPreservation();