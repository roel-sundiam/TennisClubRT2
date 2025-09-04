const { DoublesSchedulerService } = require('./dist/services/DoublesSchedulerService');

// Test match numbering specifically
function testMatchNumbering() {
  console.log('🧪 Testing Match Numbering in Enhanced Regeneration');
  console.log('==================================================');
  
  const players = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6'];
  
  console.log(`\n👥 Testing with ${players.length} players`);
  
  // Test case: Match 1 completed, should generate matches 2 and 3
  console.log('\n📝 Test Case: Match 1 completed, generating matches 2 and 3');
  
  const completedMatches = [{
    matchNumber: 1,
    players: ['player1', 'player2', 'player3', 'player4'],
    team1: ['player1', 'player2'],
    team2: ['player3', 'player4'],
    status: 'completed'
  }];
  
  try {
    const remainingMatches = DoublesSchedulerService.generateRemainingMatches(
      players,
      completedMatches,
      2 // Should start from match number 2
    );
    
    console.log(`✅ Generated ${remainingMatches.length} matches`);
    
    // Check match numbers
    remainingMatches.forEach((match, index) => {
      const expectedNumber = 2 + index; // Should start from 2
      const actualNumber = match.matchNumber;
      
      if (actualNumber === expectedNumber) {
        console.log(`  ✅ Match ${index + 1}: matchNumber = ${actualNumber} (expected ${expectedNumber})`);
      } else {
        console.log(`  ❌ Match ${index + 1}: matchNumber = ${actualNumber} (expected ${expectedNumber})`);
      }
      
      // Check if matchNumber is defined
      if (actualNumber === undefined) {
        console.log(`  🚨 CRITICAL: Match ${index + 1} has undefined matchNumber!`);
      }
      
      // Validate all required properties
      const requiredProps = ['matchNumber', 'court', 'players', 'team1', 'team2', 'status'];
      requiredProps.forEach(prop => {
        if (match[prop] === undefined) {
          console.log(`  ⚠️  Match ${index + 1} missing property: ${prop}`);
        }
      });
    });
    
    // Test match structure matches what poll controller expects
    console.log('\n🔍 Testing match structure compatibility:');
    remainingMatches.forEach((match, index) => {
      console.log(`  Match ${match.matchNumber}:`);
      console.log(`    court: ${match.court} (${typeof match.court})`);
      console.log(`    matchNumber: ${match.matchNumber} (${typeof match.matchNumber})`);
      console.log(`    players: [${match.players.join(', ')}] (length: ${match.players.length})`);
      console.log(`    team1: [${match.team1.join(', ')}] (length: ${match.team1.length})`);
      console.log(`    team2: [${match.team2.join(', ')}] (length: ${match.team2.length})`);
      console.log(`    status: ${match.status}`);
    });
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
  }
}

// Test edge cases for match numbering
function testMatchNumberingEdgeCases() {
  console.log('\n🧪 Testing Match Numbering Edge Cases');
  console.log('====================================');
  
  const players = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
  
  // Edge case 1: Starting from match 1 (no completed matches)
  console.log('\n📝 Edge Case 1: No completed matches (start from 1)');
  try {
    const result = DoublesSchedulerService.generateRemainingMatches(players, [], 1);
    console.log(`  ✅ Generated ${result.length} matches starting from 1`);
    result.forEach(match => {
      console.log(`    Match ${match.matchNumber}: ${match.players.length} players`);
    });
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
  }
  
  // Edge case 2: Starting from match 5
  console.log('\n📝 Edge Case 2: Starting from match 5');
  try {
    const completedMatches = [
      { matchNumber: 1, players: ['p1', 'p2', 'p3', 'p4'], status: 'completed' },
      { matchNumber: 2, players: ['p5', 'p6', 'p1', 'p3'], status: 'completed' },
      { matchNumber: 3, players: ['p2', 'p4', 'p5', 'p6'], status: 'completed' },
      { matchNumber: 4, players: ['p1', 'p5', 'p2', 'p6'], status: 'completed' }
    ];
    
    const result = DoublesSchedulerService.generateRemainingMatches(players, completedMatches, 5);
    console.log(`  ✅ Generated ${result.length} matches starting from 5`);
    result.forEach(match => {
      console.log(`    Match ${match.matchNumber}: ${match.players.length} players`);
    });
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
  }
  
  // Edge case 3: All matches completed (should generate 0)
  console.log('\n📝 Edge Case 3: All matches completed');
  try {
    const allCompleted = [
      { matchNumber: 1, players: ['p1', 'p2', 'p3', 'p4'], status: 'completed' },
      { matchNumber: 2, players: ['p5', 'p6', 'p1', 'p3'], status: 'completed' },
      { matchNumber: 3, players: ['p2', 'p4', 'p5', 'p6'], status: 'completed' }
    ];
    
    const result = DoublesSchedulerService.generateRemainingMatches(players, allCompleted, 4);
    console.log(`  ✅ Generated ${result.length} matches (expected 0)`);
    if (result.length === 0) {
      console.log(`    ✅ Correctly generated no matches when all are completed`);
    } else {
      console.log(`    ⚠️  Unexpected: generated matches when all should be completed`);
    }
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
  }
}

// Run tests
console.log('Starting Match Numbering Tests...\n');
testMatchNumbering();
testMatchNumberingEdgeCases();
console.log('\n✅ Match numbering test suite completed!');