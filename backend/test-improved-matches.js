const mongoose = require('mongoose');
require('dotenv').config();

async function testImprovedMatches() {
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
    
    console.log('🧪 Testing Improved Match Generation Algorithm\n');
    
    // Get player names for better display
    const playerIds = poll.openPlayEvent.confirmedPlayers;
    const users = await User.find({ _id: { $in: playerIds } });
    const getPlayerName = (id) => {
      const user = users.find(u => u._id.toString() === id);
      return user ? user.fullName : id;
    };
    
    console.log('👥 Players:', playerIds.length);
    playerIds.forEach((id, index) => {
      console.log(`  ${index + 1}. ${getPlayerName(id)}`);
    });
    
    // Test the new algorithm multiple times to see variety
    console.log('\n🎯 Generating 3 different match sets to test variety:\n');
    
    for (let test = 1; test <= 3; test++) {
      console.log(`--- Test ${test} ---`);
      
      // Simulate the generateMatches function (we'll call it via the model)
      const testMatches = await generateMatchesTest(playerIds);
      
      // Analyze teammate pairings
      const teammateCount = analyzeTeammatePairings(testMatches, getPlayerName);
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

// Simulate the generateMatches function
function generateMatchesTest(confirmedPlayers) {
  if (confirmedPlayers.length < 4) {
    throw new Error('Need at least 4 players to generate matches');
  }
  
  const playerCount = confirmedPlayers.length;
  const totalSlots = 24; // 6 matches × 4 players per match
  const targetMatchesPerPlayer = Math.floor(totalSlots / playerCount);
  const extraSlots = totalSlots % playerCount;
  
  // Track teammate pairings to avoid repeats
  const teammateHistory = new Map();
  confirmedPlayers.forEach(player => {
    teammateHistory.set(player, new Set());
  });
  
  // Helper function to check if two players have been teammates
  const haveBeenTeammates = (player1, player2) => {
    return teammateHistory.get(player1)?.has(player2) || false;
  };
  
  // Helper function to record teammate pairing
  const recordTeammates = (players) => {
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const player1 = players[i];
        const player2 = players[j];
        if (player1 && player2) {
          teammateHistory.get(player1)?.add(player2);
          teammateHistory.get(player2)?.add(player1);
        }
      }
    }
  };
  
  // Helper function to count how many existing teammates a player would have
  const countExistingTeammates = (player, currentMatch) => {
    return currentMatch.filter(teammate => haveBeenTeammates(player, teammate)).length;
  };
  
  // Create player availability pool
  const playerAvailability = new Map();
  confirmedPlayers.forEach((playerId, index) => {
    const matchesForPlayer = targetMatchesPerPlayer + (index < extraSlots ? 1 : 0);
    playerAvailability.set(playerId, matchesForPlayer);
  });
  
  const matches = [];
  
  // Generate 6 matches with teammate diversity
  for (let matchNum = 1; matchNum <= 6; matchNum++) {
    const matchPlayers = [];
    const availablePlayers = confirmedPlayers.filter(player => 
      (playerAvailability.get(player) || 0) > 0
    );
    
    // If we have fewer than 4 available players, we need to reuse some
    if (availablePlayers.length < 4) {
      // Sort by remaining availability (descending) and add players
      const sortedByAvailability = confirmedPlayers
        .map(player => ({ 
          player, 
          availability: playerAvailability.get(player) || 0 
        }))
        .sort((a, b) => b.availability - a.availability);
      
      for (let i = 0; i < 4 && i < sortedByAvailability.length; i++) {
        const playerData = sortedByAvailability[i];
        if (playerData) {
          matchPlayers.push(playerData.player);
        }
      }
    } else {
      // Try to build a match with minimal teammate repeats
      
      // Start with the player who has the most remaining matches
      const firstPlayer = availablePlayers.reduce((prev, current) => 
        (playerAvailability.get(current) || 0) > (playerAvailability.get(prev) || 0) ? current : prev
      );
      matchPlayers.push(firstPlayer);
      
      // Add remaining players, prioritizing those who haven't been teammates
      while (matchPlayers.length < 4) {
        const remainingPlayers = availablePlayers.filter(player => 
          !matchPlayers.includes(player)
        );
        
        if (remainingPlayers.length === 0) break;
        
        // Sort by: 1) fewest existing teammates in current match, 2) most remaining availability
        const bestCandidate = remainingPlayers.reduce((best, candidate) => {
          const candidateExistingTeammates = countExistingTeammates(candidate, matchPlayers);
          const bestExistingTeammates = countExistingTeammates(best, matchPlayers);
          
          if (candidateExistingTeammates < bestExistingTeammates) {
            return candidate;
          } else if (candidateExistingTeammates === bestExistingTeammates) {
            // If tie in teammate count, prefer player with more remaining availability
            return (playerAvailability.get(candidate) || 0) > (playerAvailability.get(best) || 0) ? candidate : best;
          }
          return best;
        });
        
        matchPlayers.push(bestCandidate);
      }
      
      // If we still don't have 4 players, fill with any available players
      while (matchPlayers.length < 4) {
        const remaining = confirmedPlayers.find(player => !matchPlayers.includes(player));
        if (!remaining) break;
        matchPlayers.push(remaining);
      }
    }
    
    // Record teammate pairings for this match
    recordTeammates(matchPlayers);
    
    // Reduce availability for used players
    matchPlayers.forEach(player => {
      const current = playerAvailability.get(player) || 0;
      playerAvailability.set(player, Math.max(0, current - 1));
    });
    
    matches.push({
      court: 1,
      matchNumber: matchNum,
      players: matchPlayers
    });
  }
  
  return matches;
}

function analyzeTeammatePairings(matches, getPlayerName) {
  const pairings = new Map();
  
  matches.forEach((match, matchIndex) => {
    console.log(`Match ${matchIndex + 1}:`);
    const playerNames = match.players.map(getPlayerName);
    console.log(`  ${playerNames[0]} / ${playerNames[1]} vs ${playerNames[2]} / ${playerNames[3]}`);
    
    // Count all possible pairings in this match
    for (let i = 0; i < match.players.length; i++) {
      for (let j = i + 1; j < match.players.length; j++) {
        const player1 = match.players[i];
        const player2 = match.players[j];
        const pair = [player1, player2].sort().join('-');
        
        pairings.set(pair, (pairings.get(pair) || 0) + 1);
      }
    }
  });
  
  // Check for repeated pairings
  const repeatedPairings = Array.from(pairings.entries()).filter(([pair, count]) => count > 1);
  
  if (repeatedPairings.length > 0) {
    console.log('⚠️  Repeated pairings:');
    repeatedPairings.forEach(([pair, count]) => {
      const [p1, p2] = pair.split('-');
      console.log(`  ${getPlayerName(p1)} & ${getPlayerName(p2)}: ${count} times`);
    });
  } else {
    console.log('✅ No repeated pairings - perfect variety!');
  }
  
  return pairings.size;
}

testImprovedMatches();