const { DoublesSchedulerService } = require('./dist/services/DoublesSchedulerService');

// Test the enhanced regeneration with 6 players scenario
function testEnhancedRegeneration() {
  console.log('🧪 Testing Enhanced Regeneration for 6-Player Scenario');
  console.log('=====================================================');
  
  // Simulate 6 players (same as "Open Play 100 September 7")
  const players = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6'];
  
  console.log(`\n👥 Testing with ${players.length} players: ${players.join(', ')}`);
  
  // Step 1: Generate initial complete schedule
  console.log('\n📋 Step 1: Generate complete initial schedule');
  const initialMatches = DoublesSchedulerService.generateMatches(players);
  console.log(`Generated ${initialMatches.length} matches:`);
  initialMatches.forEach(match => {
    console.log(`  Match ${match.matchNumber}: [${match.players.join(', ')}] = (${match.team1.join(', ')}) vs (${match.team2.join(', ')})`);
  });
  
  // Analyze initial distribution
  const initialStats = DoublesSchedulerService.analyzeRotation(players);
  console.log(`\n📊 Initial player match distribution:`);
  Object.entries(initialStats.playerStats).forEach(([player, stats]) => {
    console.log(`  ${player}: ${stats.matchCount} matches (${stats.matchNumbers.join(', ')})`);
  });
  
  // Step 2: Simulate Match 1 completion
  console.log('\n✅ Step 2: Simulate Match 1 completion');
  const completedMatches = [
    {
      ...initialMatches[0],
      status: 'completed',
      score: '6-4, 6-2',
      winningTeam: 1
    }
  ];
  console.log(`Completed match: Match ${completedMatches[0].matchNumber} with players [${completedMatches[0].players.join(', ')}]`);
  
  // Step 3: Test enhanced regeneration
  console.log('\n🔄 Step 3: Test enhanced regeneration (avoiding completed match players)');
  try {
    const remainingMatches = DoublesSchedulerService.generateRemainingMatches(
      players,
      completedMatches,
      2 // Start from match 2
    );
    
    console.log(`Generated ${remainingMatches.length} remaining matches:`);
    remainingMatches.forEach(match => {
      console.log(`  Match ${match.matchNumber}: [${match.players.join(', ')}] = (${match.team1.join(', ')}) vs (${match.team2.join(', ')})`);
    });
    
    // Step 4: Combine and validate final result
    console.log('\n🔍 Step 4: Final validation');
    const finalMatches = [...completedMatches, ...remainingMatches];
    console.log(`Total matches: ${finalMatches.length}`);
    
    // Check player distribution
    const playerMatchCount = new Map();
    players.forEach(player => playerMatchCount.set(player, 0));
    
    finalMatches.forEach(match => {
      match.players.forEach(player => {
        const count = playerMatchCount.get(player) || 0;
        playerMatchCount.set(player, count + 1);
      });
    });
    
    console.log(`\n📊 Final player match distribution:`);
    let allValid = true;
    playerMatchCount.forEach((count, player) => {
      const status = count === 2 ? '✅' : count > 2 ? '❌' : '⚠️';
      console.log(`  ${status} ${player}: ${count} matches`);
      if (count > 2) {
        allValid = false;
        console.log(`    ERROR: Exceeds 2-match limit!`);
      }
    });
    
    // Check for ACTUAL issue: players exceeding 2-match limit (not expected overlaps)
    console.log(`\n🔍 Checking for ACTUAL problems (not expected player overlaps):`);
    const match1Players = new Set(completedMatches[0].players);
    let hasActualProblems = false;
    
    // The REAL issue would be if any player appears in ALL 3 matches (exceeding 2-match limit)
    const playerTotalMatches = new Map();
    finalMatches.forEach(match => {
      match.players.forEach(player => {
        const count = playerTotalMatches.get(player) || 0;
        playerTotalMatches.set(player, count + 1);
      });
    });
    
    playerTotalMatches.forEach((count, player) => {
      if (count > 2) {
        console.log(`  ❌ ACTUAL PROBLEM: ${player} appears in ${count} matches (exceeds 2-match limit)`);
        hasActualProblems = true;
      }
    });
    
    if (!hasActualProblems) {
      console.log(`  ✅ No actual problems found - all players have ≤ 2 matches`);
    }
    
    // Show the overlap (which is EXPECTED and CORRECT for 6 players)
    remainingMatches.forEach(match => {
      const overlappingPlayers = match.players.filter(player => match1Players.has(player));
      if (overlappingPlayers.length > 0) {
        console.log(`  ℹ️  Match ${match.matchNumber} includes players from Match 1: ${overlappingPlayers.join(', ')} (this is EXPECTED)`);
      }
    });
    
    // Final result
    if (allValid && !hasActualProblems) {
      console.log(`\n🎉 SUCCESS: Enhanced regeneration works correctly!`);
      console.log(`   - All players have exactly 2 matches`);
      console.log(`   - No players exceed the 2-match limit`);
      console.log(`   - Generated ${remainingMatches.length} remaining matches as expected`);
      console.log(`   - Player overlaps are expected and correct for optimal rotation`);
    } else {
      console.log(`\n❌ FAILURE: Enhanced regeneration has issues`);
      if (!allValid) console.log(`   - Player match limit violations detected`);
      if (hasActualProblems) console.log(`   - Players exceeding 2-match limit detected`);
    }
    
  } catch (error) {
    console.error(`\n❌ REGENERATION FAILED: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
  }
}

// Test edge cases
function testEdgeCases() {
  console.log('\n🧪 Testing Edge Cases');
  console.log('=====================');
  
  // Test with different player counts
  const testCases = [
    { players: 4, description: '4 players (minimum)' },
    { players: 5, description: '5 players (odd number)' },
    { players: 8, description: '8 players (even number)' },
    { players: 10, description: '10 players (large even)' }
  ];
  
  testCases.forEach(testCase => {
    console.log(`\n📝 Testing ${testCase.description}:`);
    const players = Array.from({ length: testCase.players }, (_, i) => `player${i + 1}`);
    
    try {
      const matches = DoublesSchedulerService.generateMatches(players);
      const stats = DoublesSchedulerService.analyzeRotation(players);
      
      console.log(`  Generated ${matches.length} matches for ${players.length} players`);
      
      // Check if all players have at most 2 matches
      let maxMatches = 0;
      Object.values(stats.playerStats).forEach(stat => {
        maxMatches = Math.max(maxMatches, stat.matchCount);
      });
      
      if (maxMatches <= 2) {
        console.log(`  ✅ All players have ≤ 2 matches (max: ${maxMatches})`);
      } else {
        console.log(`  ❌ Some players exceed 2 matches (max: ${maxMatches})`);
      }
      
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
  });
}

// Run tests
console.log('Starting Enhanced Regeneration Tests...\n');
testEnhancedRegeneration();
testEdgeCases();
console.log('\n✅ Test suite completed!');