const { DoublesSchedulerService } = require('./dist/services/DoublesSchedulerService');

// Simulate the exact API call scenario
function simulateAPICall() {
  console.log('🌐 Simulating API Call Scenario');
  console.log('================================');
  
  // Simulate the exact data structure that comes from MongoDB
  const confirmedPlayers = [
    '67aaa51fe4cbd8a26b02e1ae',
    '67abc123def456789abc1234', 
    '67abc789def123456789abcd',
    '67def456abc789123456abcd',
    '67fed321abc987654321dcba',
    '67a1b2c3d4e5f6a7b8c9d0e1'
  ];
  
  // Simulate a completed match (like what would be in MongoDB)
  const completedMatches = [{
    _id: '67abc123def456789abc1234',
    matchNumber: 1,
    court: 1,
    players: [
      '67aaa51fe4cbd8a26b02e1ae',
      '67abc123def456789abc1234',
      '67abc789def123456789abcd', 
      '67def456abc789123456abcd'
    ],
    team1: ['67aaa51fe4cbd8a26b02e1ae', '67abc123def456789abc1234'],
    team2: ['67abc789def123456789abcd', '67def456abc789123456abcd'],
    status: 'completed',
    score: '6-4, 6-2',
    winningTeam: 1
  }];
  
  console.log('\n📊 Input Data:');
  console.log(`Confirmed Players: ${confirmedPlayers.length}`);
  console.log(`Completed Matches: ${completedMatches.length}`);
  console.log(`Starting Match Number: 2`);
  
  try {
    // Step 1: Data validation (simulate poll controller validation)
    console.log('\n🔍 Step 1: Validating completed matches data structure');
    const validatedCompletedMatches = completedMatches.map(match => ({
      ...match,
      players: Array.isArray(match.players) ? match.players : [],
      matchNumber: typeof match.matchNumber === 'number' ? match.matchNumber : 0
    }));
    
    console.log('Validated completed matches:', validatedCompletedMatches.map(m => 
      `Match ${m.matchNumber}: ${m.players?.length || 0} players`
    ));
    
    // Step 2: Enhanced regeneration
    console.log('\n🔄 Step 2: Calling enhanced regeneration');
    const remainingMatches = DoublesSchedulerService.generateRemainingMatches(
      confirmedPlayers,
      validatedCompletedMatches, 
      2
    );
    
    // Step 3: Format conversion (simulate poll controller conversion)
    console.log('\n📝 Step 3: Converting to expected format');
    const newMatches = remainingMatches.map((match) => ({
      court: match.court,
      matchNumber: match.matchNumber, // This was the missing piece!
      players: match.players,
      team1: match.team1,
      team2: match.team2,
      status: match.status
    }));
    
    // Step 4: Validation (simulate poll controller validation)
    console.log('\n✅ Step 4: Final validation');
    const renumberedMatches = newMatches.map((match, index) => {
      // Validate that match number is set correctly
      if (!match.matchNumber || isNaN(match.matchNumber) || match.matchNumber < 1) {
        throw new Error(`Invalid matchNumber from enhanced regeneration: ${match.matchNumber}`);
      }
      return {
        court: typeof match.court === 'string' ? 1 : match.court,
        matchNumber: match.matchNumber,
        players: [...match.players],
        team1: [...match.team1],
        team2: [...match.team2],
        status: match.status
      };
    });
    
    // Step 5: Final result
    console.log('\n🎯 Final Result:');
    console.log(`✅ Successfully generated ${renumberedMatches.length} matches`);
    renumberedMatches.forEach(match => {
      console.log(`  Match ${match.matchNumber}: [${match.players.map(p => p.substring(0,8)).join(', ')}] = (${match.team1.map(p => p.substring(0,8)).join(',')}) vs (${match.team2.map(p => p.substring(0,8)).join(',')})`);
    });
    
    // Simulate combination with completed matches
    const allMatches = [...completedMatches, ...renumberedMatches];
    console.log(`\n📈 Total matches after regeneration: ${allMatches.length}`);
    
    // Check for the original error scenario
    const hasUndefinedMatchNumbers = renumberedMatches.some(match => match.matchNumber === undefined);
    if (hasUndefinedMatchNumbers) {
      console.log('❌ CRITICAL: Some matches still have undefined matchNumbers!');
    } else {
      console.log('✅ All matches have valid matchNumbers');
    }
    
    console.log('\n🎉 API Simulation SUCCESS - No "Invalid matchNumber" error!');
    
  } catch (error) {
    console.error(`\n❌ API Simulation FAILED: ${error.message}`);
    console.error(`This would cause the 400 Bad Request error seen in frontend`);
    console.error(`Stack:`, error.stack);
  }
}

// Test different scenarios that might cause matchNumber issues
function testMatchNumberScenarios() {
  console.log('\n🧪 Testing Different Match Number Scenarios');
  console.log('===========================================');
  
  const players = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
  
  const scenarios = [
    {
      name: 'Normal regeneration (Match 1 completed)',
      completedMatches: [{ matchNumber: 1, players: ['p1', 'p2', 'p3', 'p4'], status: 'completed' }],
      startingNumber: 2
    },
    {
      name: 'Mid-tournament regeneration (Match 2 completed)', 
      completedMatches: [{ matchNumber: 2, players: ['p1', 'p2', 'p3', 'p4'], status: 'completed' }],
      startingNumber: 1
    },
    {
      name: 'No completed matches',
      completedMatches: [],
      startingNumber: 1
    },
    {
      name: 'Multiple completed matches',
      completedMatches: [
        { matchNumber: 1, players: ['p1', 'p2', 'p3', 'p4'], status: 'completed' },
        { matchNumber: 3, players: ['p5', 'p6', 'p1', 'p3'], status: 'completed' }
      ],
      startingNumber: 2
    }
  ];
  
  scenarios.forEach((scenario, index) => {
    console.log(`\n📝 Scenario ${index + 1}: ${scenario.name}`);
    try {
      const result = DoublesSchedulerService.generateRemainingMatches(
        players,
        scenario.completedMatches,
        scenario.startingNumber
      );
      
      const hasValidNumbers = result.every(match => 
        match.matchNumber !== undefined && 
        typeof match.matchNumber === 'number' && 
        match.matchNumber >= 1
      );
      
      if (hasValidNumbers) {
        console.log(`  ✅ SUCCESS: All ${result.length} matches have valid matchNumbers`);
        result.forEach(match => {
          console.log(`    Match ${match.matchNumber}: ${match.players.length} players`);
        });
      } else {
        console.log(`  ❌ FAILED: Some matches have invalid matchNumbers`);
        result.forEach(match => {
          console.log(`    Match ${match.matchNumber} (${typeof match.matchNumber}): ${match.players.length} players`);
        });
      }
      
    } catch (error) {
      console.log(`  ❌ FAILED: ${error.message}`);
    }
  });
}

// Run tests
console.log('Starting API Simulation Tests...\n');
simulateAPICall();
testMatchNumberScenarios();
console.log('\n✅ API simulation test suite completed!');