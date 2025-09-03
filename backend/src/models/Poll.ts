import mongoose, { Schema, Document } from 'mongoose';
import Payment from './Payment';

export interface IPollOption {
  _id: string;
  text: string;
  votes: number;
  voters: string[]; // Array of user IDs who voted for this option
}

export interface IOpenPlayEvent {
  eventDate: Date;
  startTime: number; // 5-22 (5 AM to 10 PM)
  endTime: number; // 5-22 (5 AM to 10 PM)
  playerFee: number; // ₱150 per player
  maxPlayers: number; // 12 players max
  confirmedPlayers: string[]; // User IDs who voted "yes"
  matches?: Array<{
    court: number; // Always 1 (single court)
    matchNumber: number; // Sequential match number (varies by player count)
    players: string[]; // 4 player IDs per match
    team1: string[]; // 2 player IDs for team 1
    team2: string[]; // 2 player IDs for team 2
    score?: string; // e.g., "6-4, 6-2" or "21-19" (first score wins)
    winningTeam?: 1 | 2; // Which team won (1 or 2)
    status: 'scheduled' | 'in_progress' | 'completed'; // Match status
  }>;
  matchesGenerated: boolean;
  blockedTimeSlots: number[]; // Array of blocked time slots for reservations
  tournamentTier: '100' | '250' | '500'; // Tournament tier for seeding points
}

export interface IPollDocument extends Document {
  title: string;
  description: string;
  options: IPollOption[];
  createdBy: string;
  status: 'draft' | 'active' | 'closed' | 'cancelled';
  isAnonymous: boolean;
  allowMultipleVotes: boolean;
  startDate: Date;
  endDate?: Date;
  totalVotes: number;
  eligibleVoters: string[]; // Array of user IDs eligible to vote
  metadata?: {
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    adminNotes?: string;
  };
  openPlayEvent?: IOpenPlayEvent; // For Open Play polls
  createdAt: Date;
  updatedAt: Date;
}

const openPlayEventSchema = new Schema({
  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },
  startTime: {
    type: Number,
    required: [true, 'Start time is required'],
    min: [5, 'Start time must be between 5 and 22'],
    max: [22, 'Start time must be between 5 and 22']
  },
  endTime: {
    type: Number,
    required: [true, 'End time is required'],
    min: [5, 'End time must be between 5 and 22'],
    max: [22, 'End time must be between 5 and 22'],
    validate: {
      validator: function(this: any, endTime: number) {
        return endTime > this.startTime;
      },
      message: 'End time must be after start time'
    }
  },
  playerFee: {
    type: Number,
    required: [true, 'Player fee is required'],
    min: [0, 'Player fee cannot be negative']
  },
  maxPlayers: {
    type: Number,
    required: [true, 'Max players is required'],
    min: [2, 'Must allow at least 2 players'],
    max: [20, 'Cannot exceed 20 players']
  },
  confirmedPlayers: [{
    type: String,
    ref: 'User'
  }],
  matches: [{
    court: {
      type: Number,
      required: true,
      min: 1,
      max: 1 // Always court 1 for new system
    },
    matchNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 6
    },
    players: [{
      type: String,
      ref: 'User',
      required: true
    }],
    team1: {
      type: [{
        type: String,
        ref: 'User'
      }],
      validate: [arrayLimit2, 'Team must have exactly 2 players']
    },
    team2: {
      type: [{
        type: String,
        ref: 'User'
      }],
      validate: [arrayLimit2, 'Team must have exactly 2 players']
    },
    score: {
      type: String,
      trim: true,
      maxlength: [50, 'Score cannot exceed 50 characters']
    },
    winningTeam: {
      type: Number,
      enum: [1, 2],
      validate: {
        validator: function(this: any, winningTeam: number) {
          return !this.score || [1, 2].includes(winningTeam);
        },
        message: 'Winning team must be 1 or 2 when score is provided'
      }
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed'],
      default: 'scheduled'
    }
  }],
  matchesGenerated: {
    type: Boolean,
    default: false
  },
  blockedTimeSlots: [{
    type: Number,
    min: 5,
    max: 22
  }],
  tournamentTier: {
    type: String,
    enum: {
      values: ['100', '250', '500'],
      message: 'Tournament tier must be 100, 250, or 500'
    },
    default: '100',
    index: true
  }
}, { _id: false });

// Validator function for team size
function arrayLimit2(val: string[]) {
  return val.length === 2;
}

const pollOptionSchema = new Schema({
  text: {
    type: String,
    required: [true, 'Option text is required'],
    maxlength: [200, 'Option text cannot exceed 200 characters'],
    trim: true
  },
  votes: {
    type: Number,
    default: 0,
    min: [0, 'Votes cannot be negative']
  },
  voters: [{
    type: String,
    ref: 'User'
  }]
}, { _id: true });

const pollSchema = new Schema<IPollDocument>({
  title: {
    type: String,
    required: [true, 'Poll title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Poll description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    trim: true
  },
  options: {
    type: [pollOptionSchema],
    validate: {
      validator: function(options: IPollOption[]) {
        return options.length >= 2 && options.length <= 10;
      },
      message: 'Poll must have between 2 and 10 options'
    }
  },
  createdBy: {
    type: String,
    ref: 'User',
    required: [true, 'Poll creator is required'],
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'active', 'closed', 'cancelled'],
      message: 'Status must be draft, active, closed, or cancelled'
    },
    default: 'draft',
    index: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  allowMultipleVotes: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    index: true
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(this: IPollDocument, endDate: Date) {
        return !endDate || endDate > this.startDate;
      },
      message: 'End date must be after start date'
    },
    index: true
  },
  totalVotes: {
    type: Number,
    default: 0,
    min: [0, 'Total votes cannot be negative']
  },
  eligibleVoters: [{
    type: String,
    ref: 'User'
  }],
  metadata: {
    category: {
      type: String,
      enum: ['general', 'facility', 'rules', 'events', 'financial', 'other', 'open_play']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    adminNotes: { type: String, maxlength: 500 }
  },
  openPlayEvent: openPlayEventSchema
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
pollSchema.index({ status: 1, startDate: -1 });
pollSchema.index({ createdBy: 1, status: 1 });
pollSchema.index({ endDate: 1, status: 1 });

// Pre-save middleware to update total votes and calculate blocked time slots
pollSchema.pre('save', function(next) {
  const poll = this;
  
  // Calculate total votes from all options
  if (poll.options && Array.isArray(poll.options)) {
    poll.totalVotes = poll.options.reduce((total, option) => total + option.votes, 0);
  } else {
    poll.totalVotes = 0;
  }
  
  // Auto-close poll if end date has passed
  if (poll.endDate && poll.endDate < new Date() && poll.status === 'active') {
    poll.status = 'closed';
  }
  
  // Calculate blocked time slots for Open Play events
  if (poll.metadata?.category === 'open_play' && poll.openPlayEvent && 
      typeof poll.openPlayEvent.startTime === 'number' && 
      typeof poll.openPlayEvent.endTime === 'number') {
    const blockedSlots = [];
    const startTime = poll.openPlayEvent.startTime;
    const endTime = poll.openPlayEvent.endTime;
    
    for (let slot = startTime; slot < endTime; slot++) {
      blockedSlots.push(slot);
    }
    
    poll.openPlayEvent.blockedTimeSlots = blockedSlots;
  }
  
  // Update confirmed players for Open Play events
  if (poll.metadata?.category === 'open_play' && poll.openPlayEvent) {
    const yesOption = poll.options.find(option => option.text.toLowerCase() === 'yes');
    if (yesOption) {
      poll.openPlayEvent.confirmedPlayers = yesOption.voters || [];
      
      // Auto-close poll if max players reached
      if (poll.openPlayEvent.confirmedPlayers && poll.openPlayEvent.confirmedPlayers.length >= poll.openPlayEvent.maxPlayers) {
        poll.status = 'closed';
      }
    }
  }
  
  next();
});

// Virtual for poll status display
pollSchema.virtual('statusDisplay').get(function(this: IPollDocument) {
  const statusMap = {
    draft: 'Draft',
    active: 'Active',
    closed: 'Closed',
    cancelled: 'Cancelled'
  };
  return statusMap[this.status];
});

// Virtual for time remaining
pollSchema.virtual('timeRemaining').get(function(this: IPollDocument) {
  if (!this.endDate || this.status !== 'active') return null;
  
  const now = new Date();
  const timeLeft = this.endDate.getTime() - now.getTime();
  
  if (timeLeft <= 0) return 'Expired';
  
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
});

// Virtual for participation rate
pollSchema.virtual('participationRate').get(function(this: IPollDocument) {
  if (!this.eligibleVoters || this.eligibleVoters.length === 0) return 0;
  return Math.round((this.totalVotes / this.eligibleVoters.length) * 100);
});

// Static method to get active polls with manual player population
pollSchema.statics.getActivePolls = async function() {
  const mongoose = require('mongoose');
  const User = mongoose.model('User');
  
  const now = new Date();
  const polls = await this.find({
    status: 'active',
    startDate: { $lte: now },
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gt: now } }
    ]
  })
  .populate('createdBy', 'username fullName')
  .sort({ startDate: -1 });

  // Manually populate match players for Open Play events
  for (const poll of polls) {
    if (poll.openPlayEvent?.matches) {
      const allPlayerIds: string[] = [];
      poll.openPlayEvent.matches.forEach((match: any) => {
        if (match.players) {
          allPlayerIds.push(...match.players);
        }
      });
      
      if (allPlayerIds.length > 0) {
        const uniquePlayerIds = [...new Set(allPlayerIds)];
        const players = await User.find({
          _id: { $in: uniquePlayerIds.map((id: string) => new mongoose.Types.ObjectId(id)) }
        }).select('username fullName _id');
        
        const playerMap: Record<string, any> = {};
        players.forEach((player: any) => {
          playerMap[player._id.toString()] = {
            _id: player._id,
            username: player.username,
            fullName: player.fullName
          };
        });
        
        // Replace player IDs with player objects
        poll.openPlayEvent.matches.forEach((match: any) => {
          if (match.players) {
            match.players = match.players.map((playerId: string) => 
              playerMap[playerId] || { _id: playerId, username: 'Unknown', fullName: 'Unknown Player' }
            );
          }
        });
      }
    }
  }

  return polls;
};

// Static method to check if user can vote on poll
pollSchema.statics.canUserVote = function(pollId: string, userId: string) {
  return this.findOne({
    _id: pollId,
    status: 'active',
    eligibleVoters: userId,
    startDate: { $lte: new Date() },
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gt: new Date() } }
    ]
  });
};

// Static method to cast vote
pollSchema.statics.castVote = async function(pollId: string, userId: string, optionIds: string[]) {
  const session = await mongoose.startSession();
  
  try {
    return await session.withTransaction(async () => {
      const poll = await this.findById(pollId).session(session);
      if (!poll) {
        throw new Error('Poll not found');
      }
      
      // Validate poll is active and user can vote
      const now = new Date();
      if (poll.status !== 'active') {
        throw new Error('Poll is not active');
      }
      
      if (poll.startDate > now || (poll.endDate && poll.endDate < now)) {
        throw new Error('Poll is not currently accepting votes');
      }
      
      if (!poll.eligibleVoters || !poll.eligibleVoters.includes(userId)) {
        throw new Error('User is not eligible to vote on this poll');
      }
      
      // Check if user has already voted
      const hasVoted = poll.options.some((option: any) => option.voters.includes(userId));
      if (hasVoted && !poll.allowMultipleVotes) {
        throw new Error('User has already voted on this poll');
      }
      
      // Validate option IDs
      if (!poll.allowMultipleVotes && optionIds.length > 1) {
        throw new Error('Poll does not allow multiple votes');
      }
      
      const validOptionIds = poll.options.map((option: any) => option._id.toString());
      const invalidOptions = optionIds.filter(id => !validOptionIds.includes(id));
      if (invalidOptions.length > 0) {
        throw new Error('Invalid option ID(s)');
      }
      
      // Remove previous votes if replacing
      if (hasVoted) {
        poll.options.forEach((option: any) => {
          const voterIndex = option.voters.indexOf(userId);
          if (voterIndex > -1) {
            option.voters.splice(voterIndex, 1);
            option.votes = Math.max(0, option.votes - 1);
          }
        });
      }
      
      // Add new votes
      optionIds.forEach(optionId => {
        const option = poll.options.find((opt: any) => opt._id.toString() === optionId);
        if (option) {
          option.voters.push(userId);
          option.votes += 1;
        }
      });
      
      // Handle Open Play payment creation/removal
      if (poll.metadata?.category === 'open_play' && poll.openPlayEvent) {
        const yesOption = poll.options.find((option: any) => option.text.toLowerCase() === 'yes');
        const noOption = poll.options.find((option: any) => option.text.toLowerCase() === 'no');
        
        if (yesOption && noOption) {
          const isVotingYes = optionIds.some(optionId => 
            yesOption._id.toString() === optionId
          );
          const wasVotingYes = hasVoted && yesOption.voters.includes(userId);
          
          // If user is now voting YES and wasn't before, handle payment
          if (isVotingYes && !wasVotingYes) {
            const dueDate = new Date(poll.openPlayEvent.eventDate);
            dueDate.setHours(poll.openPlayEvent.startTime - 1, 0, 0, 0); // 1 hour before event
            
            // Check if user has sufficient credit balance for auto-deduction
            const User = mongoose.model('User');
            const CreditTransaction = mongoose.model('CreditTransaction');
            const user = await User.findById(userId).session(session);
            
            let paymentStatus = 'pending';
            let paymentMethod = 'cash';
            
            if (user && user.creditBalance >= poll.openPlayEvent.playerFee) {
              // Auto-deduct from credits
              try {
                console.log(`💳 Auto-deducting ₱${poll.openPlayEvent.playerFee} from ${user.fullName}'s credit balance for Open Play`);
                
                await (CreditTransaction as any).createTransaction(
                  userId,
                  'deduction',
                  poll.openPlayEvent.playerFee,
                  `Open Play participation fee: ${poll.title}`,
                  {
                    referenceId: poll._id.toString(),
                    referenceType: 'poll',
                    metadata: {
                      source: 'open_play_participation',
                      reason: 'Open Play event fee',
                      pollId: poll._id.toString(),
                      eventTitle: poll.title
                    }
                  }
                );
                
                paymentStatus = 'completed';
                paymentMethod = 'credits';
                console.log(`✅ Successfully deducted ₱${poll.openPlayEvent.playerFee} from credits for Open Play`);
              } catch (error) {
                console.error('Failed to auto-deduct credits for Open Play:', error);
                // Fall back to pending payment
                paymentStatus = 'pending';
                paymentMethod = 'cash';
              }
            }
            
            await Payment.create([{
              pollId: poll._id.toString(),
              userId: userId,
              amount: poll.openPlayEvent.playerFee,
              currency: 'PHP',
              paymentMethod,
              status: paymentStatus,
              paymentDate: paymentStatus === 'completed' ? new Date() : undefined,
              dueDate: dueDate,
              description: `Open Play: ${poll.title}`,
              metadata: {
                openPlayEventTitle: poll.title,
                openPlayEventDate: poll.openPlayEvent.eventDate,
                discounts: [] // Initialize empty discounts array to prevent length error
              }
            }], { session });
          }
          
          // If user was voting YES but is now voting NO (or removing vote), handle refund
          else if (wasVotingYes && !isVotingYes) {
            // Find the existing payment to check if it was paid with credits
            const existingPayment = await Payment.findOne({
              pollId: poll._id.toString(),
              userId: userId,
              status: { $in: ['pending', 'completed'] }
            }).session(session);
            
            if (existingPayment) {
              // If payment was completed with credits, refund the credits
              if (existingPayment.status === 'completed' && (existingPayment.paymentMethod as any) === 'credits') {
                try {
                  const CreditTransaction = mongoose.model('CreditTransaction');
                  console.log(`💳 Auto-refunding ₱${existingPayment.amount} credits for Open Play cancellation`);
                  
                  await (CreditTransaction as any).refundOpenPlay(
                    userId,
                    poll._id.toString(),
                    existingPayment.amount
                  );
                  
                  console.log(`✅ Successfully refunded ₱${existingPayment.amount} credits for Open Play cancellation`);
                } catch (error) {
                  console.error('Failed to auto-refund credits for Open Play cancellation:', error);
                  // Continue with payment deletion even if refund fails
                }
              }
              
              // Delete the payment record
              await Payment.deleteOne(
                { _id: existingPayment._id },
                { session }
              );
            }
          }
        }
      }
      
      // CRITICAL: Manually sync confirmed players for Open Play events AFTER all vote modifications
      // This must happen after votes are added/removed to ensure accurate sync
      if (poll.metadata?.category === 'open_play' && poll.openPlayEvent) {
        const yesOptionUpdated = poll.options.find((option: any) => option.text.toLowerCase() === 'yes');
        if (yesOptionUpdated) {
          console.log(`🔄 Syncing confirmed players: ${yesOptionUpdated.voters.length} yes voters`);
          poll.openPlayEvent.confirmedPlayers = [...yesOptionUpdated.voters]; // Create new array to ensure change is detected
          
          // Auto-close poll if max players reached
          if (poll.openPlayEvent.confirmedPlayers && poll.openPlayEvent.confirmedPlayers.length >= poll.openPlayEvent.maxPlayers) {
            poll.status = 'closed';
          }
        }
      }
      
      await poll.save({ session });
      return poll;
    });
  } finally {
    await session.endSession();
  }
};


// Static method to generate doubles matches with max 2 matches per player using DoublesSchedulerService
pollSchema.statics.generateMatches = function(confirmedPlayers: string[]) {
  const { DoublesSchedulerService } = require('../services/DoublesSchedulerService');
  
  console.log(`🎾 Generating doubles matches for ${confirmedPlayers.length} players using DoublesSchedulerService`);
  
  try {
    const matches = DoublesSchedulerService.generateMatches(confirmedPlayers);
    
    // Log match summary
    const playerStats: { [key: string]: number } = {};
    matches.forEach((match: any) => {
      match.players.forEach((playerId: string) => {
        playerStats[playerId] = (playerStats[playerId] || 0) + 1;
      });
    });
    
    console.log(`✅ Generated ${matches.length} matches with player distribution:`, playerStats);
    
    return matches;
  } catch (error) {
    console.error('❌ Error generating doubles matches:', error);
    throw error;
  }
};

// Static method to get poll results with manual player population
pollSchema.statics.getPollResults = async function(pollId: string, includeVoters: boolean = false) {
  const mongoose = require('mongoose');
  const User = mongoose.model('User');
  
  const projection = includeVoters ? {} : { 'options.voters': 0 };
  
  const poll = await this.findById(pollId, projection)
    .populate('createdBy', 'username fullName')
    .populate('eligibleVoters', 'username fullName');

  if (!poll) {
    return null;
  }

  // Manually populate match players for Open Play events
  if (poll.openPlayEvent?.matches) {
    const allPlayerIds: string[] = [];
    poll.openPlayEvent.matches.forEach((match: any) => {
      if (match.players) {
        allPlayerIds.push(...match.players);
      }
    });
    
    if (allPlayerIds.length > 0) {
      const uniquePlayerIds = [...new Set(allPlayerIds)];
      const players = await User.find({
        _id: { $in: uniquePlayerIds.map((id: string) => new mongoose.Types.ObjectId(id)) }
      }).select('username fullName _id');
      
      const playerMap: Record<string, any> = {};
      players.forEach((player: any) => {
        playerMap[player._id.toString()] = {
          _id: player._id,
          username: player.username,
          fullName: player.fullName
        };
      });
      
      // Replace player IDs with player objects
      poll.openPlayEvent.matches.forEach((match: any) => {
        if (match.players) {
          match.players = match.players.map((playerId: string) => 
            playerMap[playerId] || { _id: playerId, username: 'Unknown', fullName: 'Unknown Player' }
          );
        }
      });
    }
  }

  return poll;
};

const Poll = mongoose.model<IPollDocument>('Poll', pollSchema);

export default Poll;