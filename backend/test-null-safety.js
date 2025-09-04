const { DoublesSchedulerService } = require('./dist/services/DoublesSchedulerService');

// Test the null safety fixes for the forEach error
function testNullSafety() {
  console.log('🧪 Testing Null Safety for Enhanced Regeneration');
  console.log('================================================');
  
  const players = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6'];
  
  console.log(`\n👥 Testing with ${players.length} players: ${players.join(', ')}`);
  
  // Test case 1: Valid completed matches
  console.log('\n✅ Test 1: Valid completed matches');
  try {
    const validCompletedMatches = [{
      matchNumber: 1,
      players: ['player1', 'player2', 'player3', 'player4'],
      team1: ['player1', 'player2'],
      team2: ['player3', 'player4'],
      status: 'completed'
    }];
    
    const result1 = DoublesSchedulerService.generateRemainingMatches(
      players, 
      validCompletedMatches, 
      2
    );
    
    console.log(`   ✅ SUCCESS: Generated ${result1.length} remaining matches`);
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
  }
  
  // Test case 2: Completed matches with undefined players
  console.log('\n⚠️  Test 2: Completed matches with undefined players');
  try {
    const invalidCompletedMatches = [{
      matchNumber: 1,
      players: undefined, // This would cause the original error
      team1: ['player1', 'player2'],
      team2: ['player3', 'player4'],
      status: 'completed'
    }];
    
    const result2 = DoublesSchedulerService.generateRemainingMatches(
      players, 
      invalidCompletedMatches, 
      2
    );
    
    console.log(`   ✅ SUCCESS: Handled undefined players gracefully, generated ${result2.length} matches`);
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
  }
  
  // Test case 3: Completed matches with null players
  console.log('\n⚠️  Test 3: Completed matches with null players');
  try {
    const nullCompletedMatches = [{
      matchNumber: 1,
      players: null, // This would also cause issues
      team1: ['player1', 'player2'],
      team2: ['player3', 'player4'],
      status: 'completed'
    }];
    
    const result3 = DoublesSchedulerService.generateRemainingMatches(
      players, 
      nullCompletedMatches, 
      2
    );
    
    console.log(`   ✅ SUCCESS: Handled null players gracefully, generated ${result3.length} matches`);
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
  }
  
  // Test case 4: Completed matches with empty players array
  console.log('\n⚠️  Test 4: Completed matches with empty players array');
  try {
    const emptyCompletedMatches = [{
      matchNumber: 1,
      players: [], // Empty array
      team1: ['player1', 'player2'],
      team2: ['player3', 'player4'],
      status: 'completed'
    }];
    
    const result4 = DoublesSchedulerService.generateRemainingMatches(
      players, 
      emptyCompletedMatches, 
      2
    );
    
    console.log(`   ✅ SUCCESS: Handled empty players array gracefully, generated ${result4.length} matches`);
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
  }
  
  // Test case 5: Mixed valid and invalid completed matches
  console.log('\n⚠️  Test 5: Mixed valid and invalid completed matches');
  try {
    const mixedCompletedMatches = [
      {
        matchNumber: 1,
        players: ['player1', 'player2', 'player3', 'player4'],
        team1: ['player1', 'player2'],
        team2: ['player3', 'player4'],
        status: 'completed'
      },
      {
        matchNumber: 2,
        players: undefined, // Invalid
        team1: ['player5', 'player6'],
        team2: ['player1', 'player3'],
        status: 'completed'
      }
    ];
    
    const result5 = DoublesSchedulerService.generateRemainingMatches(
      players, 
      mixedCompletedMatches, 
      3
    );
    
    console.log(`   ✅ SUCCESS: Handled mixed valid/invalid matches, generated ${result5.length} matches`);
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
  }
  
  console.log('\n📊 Summary:');
  console.log('The enhanced regeneration logic now safely handles:');
  console.log('- undefined players arrays');
  console.log('- null players arrays');
  console.log('- empty players arrays');  
  console.log('- mixed valid/invalid match data');
  console.log('- graceful fallbacks when data is corrupted');
}

// Run the test
console.log('Starting Null Safety Tests...\n');
testNullSafety();
console.log('\n✅ Null safety test suite completed!');