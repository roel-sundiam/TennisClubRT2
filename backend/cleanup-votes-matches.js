const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupVotesAndMatches() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Poll = mongoose.model('Poll', new mongoose.Schema({}), 'polls');
    
    console.log('🧹 Starting cleanup of votes and matches...');
    
    // Get all polls to check current state
    const allPolls = await Poll.find({});
    console.log(`📊 Found ${allPolls.length} polls total`);
    
    // Update all polls to remove votes and matches  
    const result = await Poll.updateMany(
      {},
      {
        $unset: {
          'openPlayEvent.matches': "",
          'openPlayEvent.confirmedPlayers': ""
        },
        $set: {
          'openPlayEvent.matchesGenerated': false
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} polls`);
    
    // Verify cleanup
    const pollsWithVotes = await Poll.find({ 'openPlayEvent.confirmedPlayers': { $exists: true, $ne: [] } });
    const pollsWithMatches = await Poll.find({ 'openPlayEvent.matches': { $exists: true } });
    
    console.log(`📊 Polls with votes remaining: ${pollsWithVotes.length}`);
    console.log(`📊 Polls with matches remaining: ${pollsWithMatches.length}`);
    
    console.log('✅ Cleanup completed successfully');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

cleanupVotesAndMatches();