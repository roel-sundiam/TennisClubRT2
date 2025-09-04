const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas directly in the script
const pollSchema = new mongoose.Schema({}, { collection: 'polls', strict: false });
const seedingPointSchema = new mongoose.Schema({}, { collection: 'seedingpoints', strict: false });

async function checkCurrentData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔍 Connected to MongoDB to check current data');
    
    const Poll = mongoose.model('Poll', pollSchema);
    const SeedingPoint = mongoose.model('SeedingPoint', seedingPointSchema);
    
    console.log('\n📊 Current Open Play Events:');
    const openPlayPolls = await Poll.find({ 'metadata.category': 'open_play' });
    
    if (openPlayPolls.length === 0) {
      console.log('❌ No Open Play events found - you need to create one first');
    } else {
      for (const poll of openPlayPolls) {
        console.log(`\n📅 Event: ${poll.title}`);
        console.log(`   Status: ${poll.status}`);
        console.log(`   Date: ${poll.openPlayEvent?.eventDate}`);
        console.log(`   Tournament Tier: ${poll.openPlayEvent?.tournamentTier}`);
        console.log(`   Confirmed Players: ${poll.openPlayEvent?.confirmedPlayers?.length || 0}`);
        console.log(`   Matches Generated: ${poll.openPlayEvent?.matchesGenerated}`);
        console.log(`   Total Matches: ${poll.openPlayEvent?.matches?.length || 0}`);
        
        if (poll.openPlayEvent?.matches) {
          console.log('   Match Status:');
          poll.openPlayEvent.matches.forEach((match, i) => {
            console.log(`     Match ${match.matchNumber}: ${match.status}${match.winningTeam ? ` (Team ${match.winningTeam} won)` : ''}`);
          });
        }
      }
    }
    
    console.log('\n🏆 Current Seeding Points:');
    const seedingPoints = await SeedingPoint.find({}).sort({ createdAt: -1 });
    
    if (seedingPoints.length === 0) {
      console.log('❌ No seeding points found - no match results have been recorded');
    } else {
      console.log(`Found ${seedingPoints.length} seeding point entries:`);
      const pointsByUser = {};
      
      seedingPoints.forEach(point => {
        if (!pointsByUser[point.userId]) {
          pointsByUser[point.userId] = { total: 0, entries: [] };
        }
        pointsByUser[point.userId].total += point.points;
        pointsByUser[point.userId].entries.push({
          points: point.points,
          description: point.description,
          date: point.createdAt
        });
      });
      
      for (const [userId, data] of Object.entries(pointsByUser)) {
        console.log(`\n👤 User ${userId}: ${data.total} total points`);
        data.entries.forEach(entry => {
          console.log(`   +${entry.points} - ${entry.description} (${entry.date})`);
        });
      }
    }
    
    console.log('\n💡 Next Steps:');
    if (openPlayPolls.length === 0) {
      console.log('1. Create a new Open Play event in the admin UI');
      console.log('2. Add players and generate matches');
      console.log('3. Record match results to award seeding points');
      console.log('4. Check rankings page to verify points display');
    } else {
      const hasCompletedMatches = openPlayPolls.some(poll => 
        poll.openPlayEvent?.matches?.some(match => match.status === 'completed')
      );
      
      if (!hasCompletedMatches) {
        console.log('1. Go to Record Results tab in admin poll management');
        console.log('2. Record match results (select winning team and enter score)');
        console.log('3. Check rankings page to verify points are awarded and displayed');
      } else if (seedingPoints.length === 0) {
        console.log('1. There are completed matches but no seeding points - check match recording system');
        console.log('2. Try recording another match result to test the system');
      } else {
        console.log('1. Check rankings page - seeding points should be visible now');
        console.log('2. If rankings are empty, there might be a frontend display issue');
      }
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error during check:', error);
    process.exit(1);
  }
}

checkCurrentData();