const { DoublesSchedulerService } = require('./dist/services/DoublesSchedulerService');

console.log('🎾 Testing Doubles Scheduler with 7 Players');
console.log('=============================================');

// Test with 7 players (like September 1 500 Open Play)
const sevenPlayers = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7'];

try {
  const matches = DoublesSchedulerService.generateMatches(sevenPlayers);
  
  console.log(`\n📊 Generated ${matches.length} matches for ${sevenPlayers.length} players:`);
  console.log('');
  
  matches.forEach((match, index) => {
    console.log(`Match ${match.matchNumber}:`);
    console.log(`  Team 1: ${match.team1.join(' & ')}`);
    console.log(`  Team 2: ${match.team2.join(' & ')}`);
    console.log('');
  });
  
  // Analyze player distribution
  const analysis = DoublesSchedulerService.analyzeRotation(sevenPlayers);
  
  console.log('📈 Player Match Statistics:');
  console.log('============================');
  
  Object.entries(analysis.playerStats).forEach(([playerId, stats]) => {
    console.log(`${playerId}: ${stats.matchCount} matches (${stats.matchNumbers.join(', ')})`);
  });
  
  console.log(`\n✅ Total matches: ${analysis.totalMatches}`);
  console.log(`📋 Each player plays maximum 2 matches: ${Object.values(analysis.playerStats).every(stats => stats.matchCount <= 2)}`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
}