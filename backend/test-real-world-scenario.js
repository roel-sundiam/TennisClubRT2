const { DoublesSchedulerService } = require('./dist/services/DoublesSchedulerService');

// Test the actual scenario that might be causing the issue
function testRealWorldScenario() {
  console.log('🧪 Testing Real-World Regeneration Scenario');
  console.log('============================================');
  
  // Simulate the actual "Open Play 100 September 7" scenario
  const players = ['67aaa51fe4cbd8a26b02e1ae', '67abc123def456789abc1234', '67abc789def123456789abcd', 
                  '67def456abc789123456abcd', '67fed321abc987654321dcba', '67a1b2c3d4e5f6a7b8c9d0e1'];
  
  console.log(`\n👥 Testing with ${players.length} realistic player IDs`);
  
  // Test the exact scenario that might be causing issues
  console.log('\n🔄 Scenario: Regenerating matches with potentially corrupted data');
  
  // Test different types of corrupted match data that might exist in the database
  const corruptedScenarios = [
    {
      name: 'Match with undefined players',
      completedMatches: [{
        matchNumber: 1,
        players: undefined,
        court: 1,
        status: 'completed'
      }]
    },
    {
      name: 'Match with null players',
      completedMatches: [{
        matchNumber: 1,
        players: null,
        court: 1,
        status: 'completed'
      }]
    },
    {
      name: 'Match with non-array players',
      completedMatches: [{
        matchNumber: 1,
        players: 'not-an-array',
        court: 1,
        status: 'completed'
      }]
    },
    {
      name: 'Match with missing players property',
      completedMatches: [{
        matchNumber: 1,
        court: 1,
        status: 'completed'
        // players property is missing entirely
      }]
    },
    {
      name: 'Match with players containing undefined elements',
      completedMatches: [{
        matchNumber: 1,
        players: [players[0], undefined, players[2], null],
        court: 1,
        status: 'completed'
      }]
    }
  ];
  
  corruptedScenarios.forEach((scenario, index) => {
    console.log(`\n📝 Test ${index + 1}: ${scenario.name}`);
    try {
      const result = DoublesSchedulerService.generateRemainingMatches(
        players,
        scenario.completedMatches,
        2
      );
      
      console.log(`   ✅ SUCCESS: Generated ${result.length} matches despite corrupted data`);
      
      // Validate the result
      if (result.length > 0) {
        const hasValidPlayers = result.every(match => 
          match.players && Array.isArray(match.players) && match.players.length === 4
        );
        if (hasValidPlayers) {
          console.log(`   ✅ All generated matches have valid player arrays`);
        } else {
          console.log(`   ⚠️  Some generated matches have invalid player arrays`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      console.log(`   📋 This scenario would cause the original forEach error`);
    }
  });
  
  // Test the frontend error scenario specifically
  console.log(`\n🌐 Frontend Error Scenario Simulation`);
  console.log('Simulating the exact conditions that caused the 400 Bad Request...');
  
  try {
    // This simulates what might happen if database data is corrupted
    const problematicMatch = {
      _id: '67abc123def456789abc1234',
      matchNumber: 1,
      court: 1,
      status: 'completed',
      // players field might be missing from database due to schema issues
    };
    
    console.log(`📊 Problematic match data:`, JSON.stringify(problematicMatch, null, 2));
    
    const result = DoublesSchedulerService.generateRemainingMatches(
      players,
      [problematicMatch],
      2
    );
    
    console.log(`   ✅ SUCCESS: Even with missing players field, system handled gracefully`);
    console.log(`   📈 Generated ${result.length} matches`);
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    console.log(`   📋 This would cause the exact error seen in the frontend`);
  }
}

// Additional test: What happens with actual MongoDB document structure
function testMongoDocumentStructure() {
  console.log(`\n🗃️  MongoDB Document Structure Test`);
  console.log('Testing with realistic MongoDB document structure...');
  
  const players = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6'];
  
  // Simulate how matches might be stored in MongoDB after population/queries
  const mongoMatch = {
    _id: { $oid: '67abc123def456789abc1234' },
    matchNumber: 1,
    court: 1,
    team1: ['player1', 'player2'],
    team2: ['player3', 'player4'],
    status: 'completed',
    // players might be populated from references and could be objects
    players: [
      { _id: 'player1', username: 'user1' },
      { _id: 'player2', username: 'user2' },
      { _id: 'player3', username: 'user3' },
      { _id: 'player4', username: 'user4' }
    ]
  };
  
  try {
    console.log(`📊 MongoDB-style match:`, JSON.stringify(mongoMatch, null, 2));
    
    const result = DoublesSchedulerService.generateRemainingMatches(
      players,
      [mongoMatch],
      2
    );
    
    console.log(`   ✅ SUCCESS: Handled MongoDB document structure`);
    console.log(`   📈 Generated ${result.length} matches`);
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    console.log(`   📋 MongoDB document structure issues detected`);
  }
}

// Run all tests
console.log('Starting Real-World Scenario Tests...\n');
testRealWorldScenario();
testMongoDocumentStructure();
console.log('\n✅ Real-world scenario test suite completed!');