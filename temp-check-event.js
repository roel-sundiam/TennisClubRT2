const mongoose = require('mongoose');
require('dotenv').config();

async function getOpenPlayDetails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Poll = mongoose.model('Poll', new mongoose.Schema({}, { strict: false }), 'polls');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    
    const poll = await Poll.findOne({ 
      title: 'September 1 500 Open Play',
      'metadata.category': 'open_play' 
    });
    
    if (!poll) {
      console.log('❌ Poll not found');
      return;
    }
    
    console.log('🏆 September 1 500 Open Play Details');
    console.log('='.repeat(50));
    console.log(`Status: ${poll.status}`);
    console.log(`Event Date: ${poll.openPlayEvent.eventDate}`);
    console.log(`Time: ${poll.openPlayEvent.startTime}:00 - ${poll.openPlayEvent.endTime}:00`);
    console.log(`Player Fee: ₱${poll.openPlayEvent.playerFee}`);
    console.log(`Tournament Tier: ${poll.openPlayEvent.tournamentTier}`);
    console.log(`Max Players: ${poll.openPlayEvent.maxPlayers}`);
    console.log(`Confirmed Players: ${poll.openPlayEvent.confirmedPlayers?.length || 0}`);
    console.log(`Matches Generated: ${poll.openPlayEvent.matchesGenerated}`);
    
    if (poll.openPlayEvent.confirmedPlayers?.length > 0) {
      console.log('\n👥 Confirmed Players:');
      const users = await User.find({ 
        _id: { $in: poll.openPlayEvent.confirmedPlayers.map(id => new mongoose.Types.ObjectId(id)) }
      });
      
      poll.openPlayEvent.confirmedPlayers.forEach((playerId, index) => {
        const user = users.find(u => u._id.toString() === playerId);
        console.log(`  ${index + 1}. ${user ? user.fullName || user.username : 'Unknown'} (${playerId})`);
      });
    }
    
    if (poll.openPlayEvent.matches && poll.openPlayEvent.matches.length > 0) {
      console.log('\n🎾 Generated Matches:');
      
      for (const match of poll.openPlayEvent.matches) {
        console.log(`\nMatch ${match.matchNumber} (Court ${match.court}):`);
        console.log(`  Status: ${match.status}`);
        
        if (match.players) {
          const matchUsers = await User.find({ 
            _id: { $in: match.players.map(id => new mongoose.Types.ObjectId(id)) }
          });
          
          console.log(`  Players:`);
          match.players.forEach((playerId, index) => {
            const user = matchUsers.find(u => u._id.toString() === playerId);
            console.log(`    ${index + 1}. ${user ? user.fullName || user.username : 'Unknown'} (${playerId})`);
          });
          
          if (match.team1 && match.team2) {
            const team1Users = await User.find({ 
              _id: { $in: match.team1.map(id => new mongoose.Types.ObjectId(id)) }
            });
            const team2Users = await User.find({ 
              _id: { $in: match.team2.map(id => new mongoose.Types.ObjectId(id)) }
            });
            
            console.log(`  Team 1:`);
            match.team1.forEach(playerId => {
              const user = team1Users.find(u => u._id.toString() === playerId);
              console.log(`    - ${user ? user.fullName || user.username : 'Unknown'}`);
            });
            
            console.log(`  Team 2:`);
            match.team2.forEach(playerId => {
              const user = team2Users.find(u => u._id.toString() === playerId);
              console.log(`    - ${user ? user.fullName || user.username : 'Unknown'}`);
            });
          }
          
          if (match.score) {
            console.log(`  Score: ${match.score}`);
            console.log(`  Winner: Team ${match.winningTeam || 'TBD'}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

getOpenPlayDetails();