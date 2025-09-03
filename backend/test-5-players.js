const mongoose = require('mongoose');
require('dotenv').config();

// Simulate the generateMatches logic for 5 players
function simulateMatches(confirmedPlayers) {
  console.log(`🎾 Testing with ${confirmedPlayers.length} players: ${confirmedPlayers.join(', ')}`);
  
  if (confirmedPlayers.length < 4) {
    console.log('❌ Error: Need at least 4 players to generate matches');
    return;
  }
  
  if (confirmedPlayers.length > 12) {
    console.log('❌ Error: Maximum 12 players allowed');
    return;
  }
  
  const playerCount = confirmedPlayers.length;
  const totalSlots = 24; // 6 matches × 4 players per match
  const targetMatchesPerPlayer = Math.floor(totalSlots / playerCount);
  const extraSlots = totalSlots % playerCount;
  
  console.log(`📊 Analysis:`);
  console.log(`   - Total slots needed: ${totalSlots} (6 matches × 4 players)`);
  console.log(`   - Available players: ${playerCount}`);
  console.log(`   - Base matches per player: ${targetMatchesPerPlayer}`);
  console.log(`   - Extra slots to distribute: ${extraSlots}`);
  
  // Create player pool with exact distribution
  const playerPool = [];
  const playerMatchCounts = {};
  
  confirmedPlayers.forEach((playerId, index) => {
    const matchesForPlayer = targetMatchesPerPlayer + (index < extraSlots ? 1 : 0);
    playerMatchCounts[playerId] = matchesForPlayer;
    
    console.log(`   - ${playerId}: will play ${matchesForPlayer} matches`);
    
    for (let i = 0; i < matchesForPlayer; i++) {
      playerPool.push(playerId);
    }
  });
  
  console.log(`\n🎲 Player pool size: ${playerPool.length} (should equal ${totalSlots})`);
  
  if (playerPool.length === totalSlots) {
    console.log('✅ Perfect distribution - all slots filled');
  } else {
    console.log('⚠️  Distribution mismatch');
  }
  
  console.log(`\n🏓 Match Distribution:`);
  Object.entries(playerMatchCounts).forEach(([player, matches]) => {
    console.log(`   ${player}: ${matches} matches`);
  });
}

async function testWith5Players() {
  console.log('='.repeat(60));
  console.log('🧪 TESTING OPEN PLAY WITH 5 PLAYERS');
  console.log('='.repeat(60));
  
  const testPlayers = ['Player1', 'Player2', 'Player3', 'Player4', 'Player5'];
  simulateMatches(testPlayers);
  
  console.log('\n' + '='.repeat(60));
  console.log('🧪 COMPARISON WITH OTHER PLAYER COUNTS');
  console.log('='.repeat(60));
  
  // Test with different player counts
  console.log('\n--- 4 Players (Minimum) ---');
  simulateMatches(['P1', 'P2', 'P3', 'P4']);
  
  console.log('\n--- 8 Players (Even Distribution) ---');  
  simulateMatches(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8']);
  
  console.log('\n--- 12 Players (Maximum) ---');
  simulateMatches(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12']);
}

testWith5Players();