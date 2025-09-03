const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupDirect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Define the schema to match the actual Poll model
    const openPlayEventSchema = new mongoose.Schema({
      eventDate: Date,
      startTime: Number,
      endTime: Number,
      playerFee: Number,
      maxPlayers: Number,
      confirmedPlayers: [String],
      matches: [{
        court: Number,
        matchNumber: Number,
        players: [String]
      }],
      matchesGenerated: Boolean,
      blockedTimeSlots: [Number]
    });

    const pollSchema = new mongoose.Schema({
      title: String,
      description: String,
      options: [{
        text: String,
        votes: Number,
        voters: [String]
      }],
      createdBy: String,
      status: String,
      isAnonymous: Boolean,
      allowMultipleVotes: Boolean,
      startDate: Date,
      endDate: Date,
      totalVotes: Number,
      eligibleVoters: [String],
      metadata: mongoose.Schema.Types.Mixed,
      openPlayEvent: openPlayEventSchema
    }, {
      timestamps: true
    });

    const Poll = mongoose.model('Poll', pollSchema, 'polls');
    
    console.log('🧹 Starting direct cleanup...');
    
    // Find all polls
    const polls = await Poll.find({});
    console.log(`📊 Found ${polls.length} polls`);
    
    // Clear votes and matches for each poll
    for (const poll of polls) {
      if (poll.openPlayEvent) {
        console.log(`🧹 Cleaning poll: ${poll.title}`);
        console.log(`   - Before: ${poll.openPlayEvent.confirmedPlayers?.length || 0} votes, ${poll.openPlayEvent.matches?.length || 0} matches`);
        
        poll.openPlayEvent.confirmedPlayers = [];
        poll.openPlayEvent.matches = [];
        poll.openPlayEvent.matchesGenerated = false;
        
        await poll.save();
        
        console.log(`   - After: ${poll.openPlayEvent.confirmedPlayers.length} votes, ${poll.openPlayEvent.matches.length} matches`);
      }
    }
    
    console.log('✅ Direct cleanup completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

cleanupDirect();