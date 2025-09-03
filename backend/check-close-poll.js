require('dotenv').config();
const mongoose = require('mongoose');

// Poll schema definition (simplified version)
const pollSchema = new mongoose.Schema({
  title: String,
  description: String,
  options: [{
    text: String,
    votes: Number,
    voters: [String]
  }],
  createdBy: String,
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'cancelled'],
    default: 'draft'
  },
  isAnonymous: Boolean,
  allowMultipleVotes: Boolean,
  startDate: Date,
  endDate: Date,
  totalVotes: Number,
  eligibleVoters: [String],
  metadata: {
    category: String,
    priority: String,
    adminNotes: String
  },
  openPlayEvent: {
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
  }
}, {
  timestamps: true
});

const Poll = mongoose.model('Poll', pollSchema);

async function checkAndClosePoll() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    
    const pollId = '68aa7f70ec5fdc80e0495cd0';
    console.log(`🔍 Looking for poll with ID: ${pollId}`);
    
    // Find the poll
    const poll = await Poll.findById(pollId);
    
    if (!poll) {
      console.log('❌ Poll not found with the specified ID');
      return;
    }
    
    console.log('📊 Poll found:');
    console.log(`   Title: ${poll.title}`);
    console.log(`   Current Status: ${poll.status}`);
    console.log(`   Category: ${poll.metadata?.category}`);
    console.log(`   Created: ${poll.createdAt}`);
    console.log(`   Updated: ${poll.updatedAt}`);
    
    if (poll.openPlayEvent) {
      console.log(`   Event Date: ${poll.openPlayEvent.eventDate}`);
      console.log(`   Confirmed Players: ${poll.openPlayEvent.confirmedPlayers.length}`);
      console.log(`   Matches Generated: ${poll.openPlayEvent.matchesGenerated}`);
    }
    
    // Check if poll needs to be closed
    if (poll.status === 'active') {
      console.log('🔒 Poll is currently ACTIVE. Closing it now...');
      
      // Update poll status to closed
      const updatedPoll = await Poll.findByIdAndUpdate(
        pollId,
        { status: 'closed' },
        { new: true }
      );
      
      console.log('✅ Poll status successfully updated to CLOSED');
      console.log(`   New Status: ${updatedPoll.status}`);
      console.log('✨ The "Generate Matches" button should now appear in the admin interface');
      
    } else {
      console.log(`ℹ️  Poll is already ${poll.status.toUpperCase()}. No changes needed.`);
      if (poll.status === 'closed') {
        console.log('✨ The "Generate Matches" button should be available in the admin interface');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
checkAndClosePoll();