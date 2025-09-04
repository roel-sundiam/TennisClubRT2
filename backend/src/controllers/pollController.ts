import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Poll from '../models/Poll';
import User from '../models/User';
import Payment from '../models/Payment';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { webSocketService } from '../services/websocketService';
import { NotificationService } from '../services/notificationService';
import DoublesSchedulerService from '../services/DoublesSchedulerService';

// Get all polls with filtering and pagination
export const getPolls = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Build filter query
  const filter: any = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.category) {
    filter['metadata.category'] = req.query.category;
  }

  // For members, only show active polls or polls they can see
  if (req.user?.role === 'member') {
    filter.status = { $in: ['active', 'closed'] };
  }

  const total = await Poll.countDocuments(filter);
  const polls = await Poll.find(filter)
    .populate('createdBy', 'username fullName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

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
        const mongoose = require('mongoose');
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

  return res.status(200).json({
    success: true,
    data: polls,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  });
});

// Get active polls for current user
export const getActivePolls = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const polls = await (Poll as any).getActivePolls();
  
  // Filter polls where user is eligible to vote
  const eligiblePolls = polls.filter((poll: any) => 
    poll.eligibleVoters.includes(req.user!._id.toString())
  );

  return res.status(200).json({
    success: true,
    data: eligiblePolls
  });
});

// Get single poll
export const getPoll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const includeVoters = req.query.includeVoters === 'true' && req.user?.role !== 'member';

  const poll = await (Poll as any).getPollResults(id, includeVoters);
  
  if (!poll) {
    return res.status(404).json({
      success: false,
      error: 'Poll not found'
    });
  }

  // Check if member can view this poll
  if (req.user?.role === 'member' && !['active', 'closed'].includes(poll.status)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Add user's voting status
  let userVote = null;
  if (req.user) {
    const userVotes = poll.options
      .filter((option: any) => option.voters.includes(req.user!._id.toString()))
      .map((option: any) => option._id.toString());
    
    if (userVotes.length > 0) {
      userVote = poll.allowMultipleVotes ? userVotes : userVotes[0];
    }
  }

  return res.status(200).json({
    success: true,
    data: {
      ...poll.toObject(),
      userVote,
      canVote: req.user ? poll.eligibleVoters.includes(req.user._id.toString()) : false
    }
  });
});

// Create new poll (admin only)
export const createPoll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    description,
    options,
    isAnonymous,
    allowMultipleVotes,
    startDate,
    endDate,
    eligibleVoters,
    metadata
  } = req.body;

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Validate options
  if (!options || options.length < 2 || options.length > 10) {
    return res.status(400).json({
      success: false,
      error: 'Poll must have between 2 and 10 options'
    });
  }

  // Convert option strings to option objects
  const pollOptions = options.map((text: string, index: number) => ({
    text: text.trim(),
    votes: 0,
    voters: []
  }));

  // If no eligible voters specified, include all active members
  let voters = eligibleVoters;
  if (!voters || voters.length === 0) {
    const allMembers = await User.find({
      isActive: true,
      isApproved: true,
      role: { $in: ['member', 'admin'] }
    }).select('_id');
    voters = allMembers.map(member => member._id.toString());
  }

  const poll = new Poll({
    title,
    description,
    options: pollOptions,
    createdBy: req.user._id,
    isAnonymous,
    allowMultipleVotes,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : undefined,
    eligibleVoters: voters,
    metadata,
    status: 'draft'
  });

  await poll.save();
  await poll.populate('createdBy', 'username fullName');

  return res.status(201).json({
    success: true,
    data: poll,
    message: 'Poll created successfully'
  });
});

// Update poll (admin only)
export const updatePoll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    title,
    description,
    isAnonymous,
    allowMultipleVotes,
    startDate,
    endDate,
    metadata
  } = req.body;

  const poll = await Poll.findById(id);
  
  if (!poll) {
    return res.status(404).json({
      success: false,
      error: 'Poll not found'
    });
  }

  // Only allow updates to draft polls or by creator/admin
  if (poll.status !== 'draft' && req.user?.role === 'member') {
    return res.status(400).json({
      success: false,
      error: 'Cannot update active or closed polls'
    });
  }

  // Update fields
  if (title) poll.title = title;
  if (description) poll.description = description;
  if (isAnonymous !== undefined) poll.isAnonymous = isAnonymous;
  if (allowMultipleVotes !== undefined) poll.allowMultipleVotes = allowMultipleVotes;
  if (startDate) poll.startDate = new Date(startDate);
  if (endDate) poll.endDate = new Date(endDate);
  if (metadata) poll.metadata = { ...poll.metadata, ...metadata };

  await poll.save();
  await poll.populate('createdBy', 'username fullName');

  return res.status(200).json({
    success: true,
    data: poll,
    message: 'Poll updated successfully'
  });
});

// Activate poll (admin only)
export const activatePoll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const poll = await Poll.findById(id);
  
  if (!poll) {
    return res.status(404).json({
      success: false,
      error: 'Poll not found'
    });
  }

  if (poll.status !== 'draft') {
    return res.status(400).json({
      success: false,
      error: 'Only draft polls can be activated'
    });
  }

  poll.status = 'active';
  await poll.save();

  return res.status(200).json({
    success: true,
    data: poll,
    message: 'Poll activated successfully'
  });
});

// Close poll (admin only)
export const closePoll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const poll = await Poll.findById(id);
  
  if (!poll) {
    return res.status(404).json({
      success: false,
      error: 'Poll not found'
    });
  }

  if (poll.status !== 'active') {
    return res.status(400).json({
      success: false,
      error: 'Only active polls can be closed'
    });
  }

  poll.status = 'closed';
  await poll.save();

  return res.status(200).json({
    success: true,
    data: poll,
    message: 'Poll closed successfully'
  });
});

// Vote on poll
export const vote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { optionIds } = req.body;

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one option must be selected'
    });
  }

  try {
    const poll = await (Poll as any).castVote(id, req.user._id.toString(), optionIds);
    
    // BACKUP SYNC: Ensure confirmed players sync for Open Play events
    // This is a fallback in case the castVote method sync fails
    if (poll.metadata?.category === 'open_play' && poll.openPlayEvent) {
      const yesOption = poll.options.find((option: any) => option.text.toLowerCase() === 'yes');
      if (yesOption) {
        const currentConfirmed = poll.openPlayEvent.confirmedPlayers?.length || 0;
        const yesVoters = yesOption.voters?.length || 0;
        
        if (currentConfirmed !== yesVoters) {
          console.log(`🔧 BACKUP SYNC: Fixing confirmed players ${currentConfirmed} → ${yesVoters}`);
          poll.openPlayEvent.confirmedPlayers = [...yesOption.voters];
          await poll.save();
          console.log(`✅ BACKUP SYNC: Confirmed players updated to ${yesVoters}`);
        } else {
          console.log(`✅ SYNC OK: Confirmed players already correct (${currentConfirmed})`);
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      data: poll,
      message: 'Vote cast successfully'
    });
  } catch (error: any) {
    console.error('❌ Vote error:', error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get poll statistics (admin only)
export const getPollStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate } = req.query;
  
  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();
  
  if (end) {
    end.setHours(23, 59, 59, 999);
  }

  const stats = await Promise.all([
    // Total polls
    Poll.countDocuments({}),
    
    // Polls by status
    Poll.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
    
    // Recent polls
    Poll.countDocuments({
      createdAt: { $gte: start, $lte: end }
    }),
    
    // Average participation rate
    Poll.aggregate([
      {
        $match: {
          status: { $in: ['active', 'closed'] },
          totalVotes: { $gt: 0 }
        }
      },
      {
        $project: {
          participationRate: {
            $multiply: [
              { $divide: ['$totalVotes', { $size: '$eligibleVoters' }] },
              100
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgParticipation: { $avg: '$participationRate' }
        }
      }
    ]),
    
    // Polls by category
    Poll.aggregate([
      {
        $group: {
          _id: '$metadata.category',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  return res.status(200).json({
    success: true,
    data: {
      totalPolls: stats[0],
      pollsByStatus: stats[1],
      recentPolls: stats[2],
      averageParticipation: stats[3][0]?.avgParticipation || 0,
      pollsByCategory: stats[4],
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    }
  });
});

// Validation rules
// Admin vote management
export const addAdminVote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id: pollId } = req.params;
  const { optionText, userId } = req.body;

  if (!optionText || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Option text and user ID are required'
    });
  }

  // Verify the user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'User not found'
    });
  }

  const poll = await Poll.findById(pollId);
  if (!poll) {
    return res.status(404).json({
      success: false,
      message: 'Poll not found'
    });
  }

  // Find the option to vote on
  const option = poll.options.find(opt => opt.text === optionText);
  if (!option) {
    return res.status(400).json({
      success: false,
      message: 'Invalid option'
    });
  }

  // Check if user has already voted on this poll
  const hasVoted = poll.options.some(opt => opt.voters.includes(userId));
  if (hasVoted) {
    return res.status(400).json({
      success: false,
      message: 'User has already voted on this poll'
    });
  }

  // Add the vote
  option.voters.push(userId);
  option.votes = option.voters.length;

  // Handle Open Play payment creation for YES votes
  if (poll.metadata?.category === 'open_play' && poll.openPlayEvent && optionText.toLowerCase() === 'yes') {
    const dueDate = new Date(poll.openPlayEvent.eventDate);
    dueDate.setHours(poll.openPlayEvent.startTime - 1, 0, 0, 0); // 1 hour before event
    
    await Payment.create({
      pollId: (poll._id as any).toString(),
      userId: userId,
      amount: poll.openPlayEvent.playerFee,
      currency: 'PHP',
      paymentMethod: 'cash', // Default, user can change later
      status: 'pending',
      dueDate: dueDate,
      description: `Open Play: ${poll.title}`,
      metadata: {
        openPlayEventTitle: poll.title,
        openPlayEventDate: poll.openPlayEvent.eventDate,
        discounts: [] // Initialize empty discounts array to prevent length error
      }
    });
  }

  // Manually sync confirmedPlayers for Open Play events
  if (poll.metadata?.category === 'open_play' && poll.openPlayEvent) {
    const yesOption = poll.options.find(opt => opt.text.toLowerCase() === 'yes');
    if (yesOption) {
      poll.openPlayEvent.confirmedPlayers = yesOption.voters;
    }
  }

  await poll.save();

  return res.json({
    success: true,
    message: 'Vote added successfully',
    data: poll
  });
});

export const removeAdminVote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id: pollId } = req.params;
  const { optionText, userId } = req.body;

  if (!optionText || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Option text and user ID are required'
    });
  }

  const poll = await Poll.findById(pollId);
  if (!poll) {
    return res.status(404).json({
      success: false,
      message: 'Poll not found'
    });
  }

  // Find the option
  const option = poll.options.find(opt => opt.text === optionText);
  if (!option) {
    return res.status(400).json({
      success: false,
      message: 'Invalid option'
    });
  }

  // Check if user has voted for this option
  const voterIndex = option.voters.indexOf(userId);
  if (voterIndex === -1) {
    return res.status(400).json({
      success: false,
      message: 'User has not voted for this option'
    });
  }

  // Remove the vote
  option.voters.splice(voterIndex, 1);
  option.votes = option.voters.length;

  // Handle Open Play payment removal for YES votes
  if (poll.metadata?.category === 'open_play' && poll.openPlayEvent && optionText.toLowerCase() === 'yes') {
    await Payment.deleteOne({
      pollId: (poll._id as any).toString(),
      userId: userId,
      status: 'pending'
    });
  }

  // Manually sync confirmedPlayers for Open Play events
  if (poll.metadata?.category === 'open_play' && poll.openPlayEvent) {
    const yesOption = poll.options.find(opt => opt.text.toLowerCase() === 'yes');
    if (yesOption) {
      poll.openPlayEvent.confirmedPlayers = yesOption.voters;
    }
  }

  await poll.save();

  return res.json({
    success: true,
    message: 'Vote removed successfully',
    data: poll
  });
});

export const createPollValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be 5-200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be 10-1000 characters'),
  body('options')
    .isArray({ min: 2, max: 10 })
    .withMessage('Must have 2-10 options'),
  body('options.*')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each option must be 1-200 characters'),
  body('startDate')
    .isISO8601()
    .withMessage('Invalid start date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date')
];

// Create Open Play event (superadmin only)
export const createOpenPlay = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventDate, startTime, endTime, title, description, tournamentTier = '100' } = req.body;

  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Only superadmins can create Open Play events'
    });
  }

  // Get all active members for notification
  const allMembers = await User.find({
    isActive: true,
    isApproved: true,
    role: { $in: ['member', 'admin'] }
  }).select('_id');
  
  const voters = allMembers.map(member => member._id.toString());

  const timeRangeText = `${startTime}:00 - ${endTime}:00`;
  
  const openPlayPoll = new Poll({
    title: title || `Open Play - ${new Date(eventDate).toLocaleDateString()} ${timeRangeText}`,
    description: description || `Join us for Open Play from ${timeRangeText}! Fee: ₱150 per player. Maximum 12 players. Random doubles matches will be generated.`,
    options: [
      { text: 'Yes', votes: 0, voters: [] },
      { text: 'No', votes: 0, voters: [] }
    ],
    createdBy: req.user._id,
    isAnonymous: false,
    allowMultipleVotes: true, // Allow vote changes for Open Play events
    startDate: new Date(),
    endDate: new Date(new Date(eventDate).getTime() - 2 * 60 * 60 * 1000), // Close 2 hours before event
    eligibleVoters: voters,
    metadata: {
      category: 'open_play',
      priority: 'high'
    },
    openPlayEvent: {
      eventDate: new Date(eventDate),
      startTime: parseInt(startTime),
      endTime: parseInt(endTime),
      playerFee: 150,
      maxPlayers: 12,
      confirmedPlayers: [],
      matchesGenerated: false,
      blockedTimeSlots: [], // Will be calculated by pre-save middleware
      tournamentTier: tournamentTier || '100'
    },
    status: 'active'
  });

  await openPlayPoll.save();
  await openPlayPoll.populate('createdBy', 'username fullName');

  // Send real-time WebSocket notification
  console.log('🎾 Poll Controller: Creating WebSocket notification data...');
  console.log('🎾 Poll Controller: openPlayEvent startTime:', openPlayPoll.openPlayEvent!.startTime);
  console.log('🎾 Poll Controller: openPlayEvent endTime:', openPlayPoll.openPlayEvent!.endTime);
  
  const webSocketNotification = {
    type: 'open_play_created' as const,
    data: {
      pollId: (openPlayPoll._id as any).toString(),
      title: openPlayPoll.title,
      description: openPlayPoll.description,
      eventDate: openPlayPoll.openPlayEvent!.eventDate.toISOString(),
      startTime: openPlayPoll.openPlayEvent!.startTime,
      endTime: openPlayPoll.openPlayEvent!.endTime,
      maxPlayers: openPlayPoll.openPlayEvent!.maxPlayers,
      confirmedPlayers: openPlayPoll.openPlayEvent!.confirmedPlayers.length,
      createdBy: {
        _id: req.user._id.toString(),
        username: req.user.username,
        fullName: req.user.fullName || req.user.username
      }
    },
    timestamp: new Date().toISOString(),
    message: `New Open Play event: ${openPlayPoll.title}`
  };

  console.log('🎾 Poll Controller: Final WebSocket notification data:', JSON.stringify(webSocketNotification, null, 2));

  // Emit WebSocket notification for real-time updates
  webSocketService.emitOpenPlayNotification(webSocketNotification);

  // Send PWA push notifications to all members
  try {
    await NotificationService.sendOpenPlayNotification({
      title: openPlayPoll.title,
      description: openPlayPoll.description,
      date: openPlayPoll.openPlayEvent!.eventDate,
      startTime: openPlayPoll.openPlayEvent!.startTime,
      endTime: openPlayPoll.openPlayEvent!.endTime
    });
    console.log('✅ PWA notifications sent for Open Play event');
  } catch (error) {
    console.error('❌ Failed to send PWA notifications:', error);
    // Don't fail the request if notifications fail
  }

  return res.status(201).json({
    success: true,
    data: openPlayPoll,
    message: 'Open Play event created and notifications sent to all members'
  });
});

// Generate matches for Open Play event (superadmin only)
export const generateMatches = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Only superadmins can generate matches'
    });
  }

  const poll = await Poll.findById(id);
  
  if (!poll || !poll.openPlayEvent) {
    return res.status(404).json({
      success: false,
      error: 'Open Play event not found'
    });
  }

  if (poll.openPlayEvent.confirmedPlayers.length < 4) {
    return res.status(400).json({
      success: false,
      error: 'Need at least 4 players to generate matches'
    });
  }

  try {
    const wasGenerated = poll.openPlayEvent.matchesGenerated;
    console.log(`🎾 Generating matches for poll ${id} with ${poll.openPlayEvent.confirmedPlayers.length} players:`, poll.openPlayEvent.confirmedPlayers);
    
    // **SMART REGENERATION**: Preserve completed matches
    const existingMatches = poll.openPlayEvent.matches || [];
    // Ensure all existing matches have court as number (fix any legacy string values)
    const completedMatches = existingMatches
      .filter(match => match.status === 'completed')
      .map((match, index) => ({
        ...match,
        court: typeof match.court === 'string' ? 1 : match.court, // Convert any string court values to number
        matchNumber: typeof match.matchNumber === 'number' && !isNaN(match.matchNumber) ? match.matchNumber : index + 1 // Fix invalid matchNumbers
      }));
    const incompleteMatches = existingMatches.filter(match => match.status !== 'completed');
    
    console.log(`📊 Found ${completedMatches.length} completed matches, ${incompleteMatches.length} incomplete matches`);
    
    if (completedMatches.length > 0) {
      console.log(`🔒 Preserving ${completedMatches.length} completed matches`);
      console.log(`📋 Completed matches:`, completedMatches.map(m => `Match ${m.matchNumber} (${m.status})`));
    }
    
    // Get total matches expected from DoublesSchedulerService distribution table
    const totalPlayers = poll.openPlayEvent.confirmedPlayers.length;
    
    // Use DoublesSchedulerService to get the correct total match count
    const allMatches = DoublesSchedulerService.generateMatches(poll.openPlayEvent.confirmedPlayers);
    const targetTotalMatches = allMatches.length;
    
    // Calculate how many NEW matches we need (subtract completed matches)
    const currentCompletedMatches = completedMatches.length;
    const newMatchesNeeded = Math.max(0, targetTotalMatches - currentCompletedMatches);
    
    console.log(`🎯 Target: ${targetTotalMatches} total matches (from DoublesSchedulerService)`);
    console.log(`✅ Already completed: ${currentCompletedMatches} matches`);  
    console.log(`🆕 New matches needed: ${newMatchesNeeded} matches`);
    
    let newMatches: any[] = [];
    
    if (newMatchesNeeded === 0) {
      console.log(`🏁 No new matches needed - target already reached`);
      // Keep existing matches as-is
      poll.openPlayEvent.matches = completedMatches;
    } else {
      // Use enhanced regeneration to generate remaining matches while avoiding conflicts
      console.log(`🔄 Using enhanced regeneration for ${completedMatches.length} completed matches`);
      
      // Calculate the starting match number based on completed matches
      const validMatchNumbers = completedMatches.map(m => typeof m.matchNumber === 'number' ? m.matchNumber : 0).filter(n => !isNaN(n) && n > 0);
      const lastCompletedMatchNumber = validMatchNumbers.length > 0 
        ? Math.max(...validMatchNumbers)
        : 0;
      
      // Generate remaining matches using the enhanced method
      let remainingMatches;
      try {
        // Validate completed matches data structure
        const validatedCompletedMatches = completedMatches.map(match => ({
          ...match,
          players: Array.isArray(match.players) ? match.players : [],
          matchNumber: typeof match.matchNumber === 'number' ? match.matchNumber : 0
        }));
        
        console.log(`🔍 Validated completed matches:`, validatedCompletedMatches.map(m => 
          `Match ${m.matchNumber}: ${m.players?.length || 0} players`
        ));
        
        remainingMatches = DoublesSchedulerService.generateRemainingMatches(
          Array.from(poll.openPlayEvent.confirmedPlayers), // All original players
          validatedCompletedMatches, // Validated completed matches
          lastCompletedMatchNumber + 1
        );
      } catch (regenerationError: any) {
        console.error('❌ Enhanced regeneration failed:', regenerationError.message);
        console.error('❌ Error stack:', regenerationError.stack);
        return res.status(400).json({
          success: false,
          error: `Failed to regenerate matches: ${regenerationError.message}`
        });
      }
      
      // Convert to the format expected by the rest of the function
      newMatches = remainingMatches.map((match: any) => ({
        court: match.court,
        matchNumber: match.matchNumber, // CRITICAL: Include matchNumber from enhanced regeneration
        players: match.players,
        team1: match.team1,
        team2: match.team2,
        status: match.status
      }));
      
      console.log(`✅ Generated exactly ${newMatches.length} remaining matches using enhanced regeneration`);
    }
    
    // Handle final match assignment
    if (newMatchesNeeded > 0) {
      // The new enhanced regeneration method already handles proper match numbering
      console.log(`🔢 Using matches with pre-assigned numbering from enhanced regeneration`);
      
      // Ensure all matches have proper format and numbering
      const renumberedMatches = newMatches.map((match: any) => {
        // Validate that match number is already set correctly by enhanced regeneration
        if (!match.matchNumber || isNaN(match.matchNumber) || match.matchNumber < 1) {
          throw new Error(`Invalid matchNumber from enhanced regeneration: ${match.matchNumber}`);
        }
        return {
          court: typeof match.court === 'string' ? 1 : match.court, // Ensure court is always a number
          matchNumber: match.matchNumber, // Already set by enhanced regeneration
          players: [...match.players],
          team1: [...match.team1],
          team2: [...match.team2],
          status: match.status
        };
      });
      
      // Combine completed matches with new matches
      poll.openPlayEvent.matches = [
        ...completedMatches, // Keep completed matches as-is
        ...renumberedMatches // Add new matches with proper numbering
      ];
      
      console.log(`🎯 Final result: ${completedMatches.length} preserved + ${renumberedMatches.length} new = ${poll.openPlayEvent.matches?.length || 0} total matches`);
    }
    
    // Validate final result matches the DoublesSchedulerService distribution
    const finalMatchCount = poll.openPlayEvent.matches?.length || 0;
    if (finalMatchCount === targetTotalMatches) {
      console.log(`✅ SUCCESS: Generated exactly ${finalMatchCount} matches as per DoublesSchedulerService for ${totalPlayers} players`);
    } else {
      console.log(`⚠️ WARNING: Generated ${finalMatchCount} matches but expected ${targetTotalMatches} for ${totalPlayers} players`);
    }
    
    // Final validation: Ensure no player exceeds 2 matches
    const finalPlayerMatchCount = new Map<string, number>();
    poll.openPlayEvent.confirmedPlayers.forEach(playerId => {
      finalPlayerMatchCount.set(playerId, 0);
    });
    
    poll.openPlayEvent.matches?.forEach(match => {
      match.players?.forEach((playerId: string) => {
        const currentCount = finalPlayerMatchCount.get(playerId) || 0;
        finalPlayerMatchCount.set(playerId, currentCount + 1);
      });
    });
    
    let maxMatchViolations = 0;
    console.log(`🔍 Final player match distribution:`);
    finalPlayerMatchCount.forEach((count, playerId) => {
      console.log(`  ${playerId}: ${count} matches`);
      if (count > 2) {
        maxMatchViolations++;
        console.log(`❌ VIOLATION: ${playerId} exceeds 2-match limit with ${count} matches`);
      }
    });
    
    if (maxMatchViolations === 0) {
      console.log(`✅ SUCCESS: All players respect the 2-match maximum limit`);
    } else {
      console.log(`❌ ERROR: ${maxMatchViolations} players exceed the 2-match limit`);
    }
    poll.openPlayEvent.matchesGenerated = true;
    
    // Normalize court field for all matches (fix any string values to numbers)
    if (poll.openPlayEvent.matches) {
      poll.openPlayEvent.matches = poll.openPlayEvent.matches.map((match: any) => ({
        ...match,
        court: typeof match.court === 'string' ? 1 : match.court
      }));
    }
    
    console.log('🔄 About to save poll with matches...');
    console.log('🔍 Final matches before save:', poll.openPlayEvent.matches?.map((m: any, i: number) => ({
      match: i,
      team1Length: m.team1?.length,
      team2Length: m.team2?.length,
      team1Valid: m.team1?.every((p: any) => p && typeof p === 'string'),
      team2Valid: m.team2?.every((p: any) => p && typeof p === 'string'),
      courtType: typeof m.court,
      courtValue: m.court
    })));
    
    await poll.save();
    console.log('✅ Poll saved successfully');
    await poll.populate('openPlayEvent.confirmedPlayers', 'username fullName');
    await poll.populate({
      path: 'openPlayEvent.matches.players',
      model: 'User',
      select: 'username fullName'
    });

    const preservedCount = completedMatches.length;
    const newCount = newMatchesNeeded;
    const totalMatches = poll.openPlayEvent.matches?.length || 0;
    
    const message = preservedCount > 0 
      ? `Matches regenerated using exact distribution table. ${preservedCount} completed matches preserved, ${newCount} new matches generated for ${totalPlayers} players (${totalMatches} total matches).`
      : `Matches generated using exact distribution table for ${totalPlayers} players (${totalMatches} matches total).`;

    return res.status(200).json({
      success: true,
      data: {
        matches: poll.openPlayEvent.matches,
        confirmedPlayers: poll.openPlayEvent.confirmedPlayers,
        preservedMatches: preservedCount,
        newMatches: newCount,
        totalMatches: totalMatches,
        distributionTable: { maxMatches: targetTotalMatches, playerCount: totalPlayers }
      },
      message: message
    });
  } catch (error: any) {
    console.error('💥 Error during match generation:', error);
    console.error('💥 Error name:', error.name);
    console.error('💥 Error stack:', error.stack);
    if (error.errors) {
      console.error('💥 Validation errors:', error.errors);
    }
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get Open Play events
export const getOpenPlayEvents = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filter: any = {
    'metadata.category': 'open_play'
  };

  // Show only active/closed for members
  if (req.user?.role === 'member') {
    filter.status = { $in: ['active', 'closed'] };
  }

  const events = await Poll.find(filter)
    .populate('createdBy', 'username fullName')
    .populate('openPlayEvent.confirmedPlayers', 'username fullName')
    .sort({ 'openPlayEvent.eventDate': -1 });

  // Manually populate match players for Open Play events
  console.log('🔍 getOpenPlayEvents: Starting manual populate for', events.length, 'events');
  for (const event of events) {
    if (event.openPlayEvent?.matches) {
      console.log('🔍 getOpenPlayEvents: Processing event with', event.openPlayEvent.matches.length, 'matches');
      const allPlayerIds: string[] = [];
      event.openPlayEvent.matches.forEach((match: any) => {
        if (match.players) {
          console.log('🔍 getOpenPlayEvents: Match has', match.players.length, 'players:', match.players);
          allPlayerIds.push(...match.players);
        }
      });
      
      if (allPlayerIds.length > 0) {
        const uniquePlayerIds = [...new Set(allPlayerIds)];
        console.log('🔍 getOpenPlayEvents: Looking up players:', uniquePlayerIds);
        const players = await User.find({
          _id: { $in: uniquePlayerIds.map((id: string) => new mongoose.Types.ObjectId(id)) }
        }).select('username fullName _id');
        console.log('🔍 getOpenPlayEvents: Found', players.length, 'players:', players.map(p => p.fullName || p.username));
        
        const playerMap: Record<string, any> = {};
        players.forEach((player: any) => {
          playerMap[player._id.toString()] = {
            _id: player._id,
            username: player.username,
            fullName: player.fullName
          };
        });
        
        // Replace player IDs with player objects
        event.openPlayEvent.matches.forEach((match: any) => {
          if (match.players) {
            match.players = match.players.map((playerId: string) => 
              playerMap[playerId] || { _id: playerId, username: 'Unknown', fullName: 'Unknown Player' }
            );
          }
        });
      }
    }
  }

  return res.status(200).json({
    success: true,
    data: events
  });
});

// Update match order for Open Play event (superadmin only)
export const updateMatchOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { matches } = req.body;

  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Only superadmins can update match order'
    });
  }

  const poll = await Poll.findById(id);
  
  if (!poll || !poll.openPlayEvent) {
    return res.status(404).json({
      success: false,
      error: 'Open Play event not found'
    });
  }

  if (!poll.openPlayEvent.matchesGenerated) {
    return res.status(400).json({
      success: false,
      error: 'Cannot update order - matches not generated yet'
    });
  }

  try {
    console.log('🔍 Received matches payload:', JSON.stringify(matches, null, 2));
    
    // Update the match order
    poll.openPlayEvent.matches = matches.map((match: any, index: number) => {
      const team1 = match.team1 && match.team1.length === 2 ? match.team1 : [match.players[0], match.players[1]];
      const team2 = match.team2 && match.team2.length === 2 ? match.team2 : [match.players[2], match.players[3]];
      
      console.log(`🔍 Match ${index + 1} team data:`, {
        originalTeam1: match.team1,
        originalTeam2: match.team2,
        finalTeam1: team1,
        finalTeam2: team2,
        playersLength: match.players?.length
      });
      
      return {
        court: typeof match.court === 'string' ? 1 : match.court, // Ensure court is always a number
        matchNumber: match.matchNumber,
        players: match.players,
        team1: team1,
        team2: team2,
        status: match.status || 'scheduled'
      };
    });
    
    // Ensure matchesGenerated flag remains true
    poll.openPlayEvent.matchesGenerated = true;
    
    // Final validation: ensure all court values are numbers before saving
    if (poll.openPlayEvent.matches) {
      poll.openPlayEvent.matches = poll.openPlayEvent.matches.map((match: any) => ({
        ...match,
        court: typeof match.court === 'string' ? 1 : match.court
      }));
    }
    
    await poll.save();

    return res.status(200).json({
      success: true,
      data: {
        matches: poll.openPlayEvent.matches
      },
      message: 'Match order updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating match order:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update match order'
    });
  }
});

// Remove player from future matches and regenerate incomplete matches only
export const removePlayerFromFutureMatches = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { playerId } = req.body;

  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Only superadmins can remove players from matches'
    });
  }

  if (!playerId) {
    return res.status(400).json({
      success: false,
      error: 'Player ID is required'
    });
  }

  const poll = await Poll.findById(id);
  
  if (!poll || !poll.openPlayEvent) {
    return res.status(404).json({
      success: false,
      error: 'Open Play event not found'
    });
  }

  if (!poll.openPlayEvent.matchesGenerated || !poll.openPlayEvent.matches) {
    return res.status(400).json({
      success: false,
      error: 'No matches generated yet'
    });
  }

  try {
    console.log(`🎾 Removing player ${playerId} from future matches in poll ${id}`);
    
    // Separate completed and incomplete matches
    const completedMatches = poll.openPlayEvent.matches.filter(match => match.status === 'completed');
    const incompleteMatches = poll.openPlayEvent.matches.filter(match => match.status !== 'completed');
    
    console.log(`📊 Found ${completedMatches.length} completed matches and ${incompleteMatches.length} incomplete matches`);
    
    // Get all players from incomplete matches, excluding the player to remove
    const remainingPlayers = new Set<string>();
    incompleteMatches.forEach(match => {
      match.players.forEach(player => {
        if (player !== playerId) {
          remainingPlayers.add(player);
        }
      });
    });
    
    const remainingPlayersArray = Array.from(remainingPlayers);
    console.log(`👥 Remaining players for regeneration: ${remainingPlayersArray.length}`);
    
    if (remainingPlayersArray.length < 4) {
      return res.status(400).json({
        success: false,
        error: `Cannot regenerate matches - need at least 4 players, but only ${remainingPlayersArray.length} remaining`
      });
    }
    
    // Generate new matches for remaining players using enhanced regeneration
    const { DoublesSchedulerService } = require('../services/DoublesSchedulerService');
    
    // Calculate the starting match number based on completed matches
    const lastCompletedMatchNumber = completedMatches.length > 0 
      ? Math.max(...completedMatches.map(m => m.matchNumber))
      : 0;
    
    // Use the new generateRemainingMatches method to avoid player conflicts
    let renumberedNewMatches;
    try {
      // Validate completed matches data structure
      const validatedCompletedMatches = completedMatches.map(match => ({
        ...match,
        players: Array.isArray(match.players) ? match.players : [],
        matchNumber: typeof match.matchNumber === 'number' ? match.matchNumber : 0
      }));
      
      console.log(`🔍 Validated completed matches for player removal:`, validatedCompletedMatches.map(m => 
        `Match ${m.matchNumber}: ${m.players?.length || 0} players`
      ));
      
      renumberedNewMatches = DoublesSchedulerService.generateRemainingMatches(
        Array.from(poll.openPlayEvent.confirmedPlayers), // All original players
        validatedCompletedMatches, // Validated completed matches
        lastCompletedMatchNumber + 1
      );
    } catch (regenerationError: any) {
      console.error('❌ Enhanced regeneration failed during player removal:', regenerationError.message);
      console.error('❌ Error stack:', regenerationError.stack);
      return res.status(400).json({
        success: false,
        error: `Failed to regenerate matches after player removal: ${regenerationError.message}`
      });
    }
    
    console.log(`🔢 Renumbered ${renumberedNewMatches.length} new matches starting from match ${lastCompletedMatchNumber + 1}`);
    
    // Combine completed matches with new matches
    poll.openPlayEvent.matches = [
      ...completedMatches,
      ...renumberedNewMatches
    ];
    
    // Update confirmed players list to reflect the removal
    if (poll.openPlayEvent.confirmedPlayers.includes(playerId)) {
      poll.openPlayEvent.confirmedPlayers = poll.openPlayEvent.confirmedPlayers.filter(id => id !== playerId);
      console.log(`✅ Removed ${playerId} from confirmed players list`);
      
      // Also remove the vote from poll options
      const yesOption = poll.options.find(option => option.text.toLowerCase() === 'yes');
      if (yesOption && yesOption.voters.includes(playerId)) {
        yesOption.voters = yesOption.voters.filter(id => id !== playerId);
        yesOption.votes = yesOption.voters.length;
        console.log(`✅ Removed ${playerId} vote from poll options`);
        
        // Handle payment removal/refund
        const existingPayment = await Payment.findOne({
          pollId: (poll._id as any).toString(),
          userId: playerId,
          status: { $in: ['pending', 'completed'] }
        });
        
        if (existingPayment) {
          // If payment was completed with credits, refund the credits
          if (existingPayment.status === 'completed' && (existingPayment.paymentMethod as any) === 'credits') {
            try {
              const CreditTransaction = require('../models/CreditTransaction');
              console.log(`💳 Auto-refunding ₱${existingPayment.amount} credits for player removal`);
              
              await (CreditTransaction as any).refundOpenPlay(
                playerId,
                (poll._id as any).toString(),
                existingPayment.amount
              );
              
              console.log(`✅ Successfully refunded ₱${existingPayment.amount} credits`);
            } catch (error) {
              console.error('Failed to auto-refund credits:', error);
            }
          }
          
          // Delete the payment record
          await Payment.deleteOne({ _id: existingPayment._id });
          console.log(`✅ Removed payment record for ${playerId}`);
        }
      }
    }
    
    await poll.save();
    console.log(`✅ Successfully updated poll with ${poll.openPlayEvent.matches.length} total matches`);
    
    return res.status(200).json({
      success: true,
      data: {
        completedMatches: completedMatches.length,
        newMatches: renumberedNewMatches.length,
        totalMatches: poll.openPlayEvent.matches.length,
        remainingPlayers: remainingPlayersArray.length,
        matches: poll.openPlayEvent.matches
      },
      message: `Player removed and ${renumberedNewMatches.length} matches regenerated. ${completedMatches.length} completed matches preserved.`
    });
  } catch (error: any) {
    console.error('❌ Error removing player from future matches:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove player from matches'
    });
  }
});

export const voteValidation = [
  body('optionIds')
    .isArray({ min: 1 })
    .withMessage('At least one option must be selected'),
  body('optionIds.*')
    .custom((value) => {
      // More lenient validation - check if it's a string that could be a valid ObjectId
      if (typeof value !== 'string' || value.length === 0) {
        throw new Error('Option ID must be a non-empty string');
      }
      // Allow any non-empty string for now - the actual validation will happen in the vote function
      return true;
    })
    .withMessage('Invalid option ID format')
];

export const createOpenPlayValidation = [
  body('eventDate')
    .isISO8601()
    .withMessage('Invalid event date'),
  body('startTime')
    .isInt({ min: 5, max: 22 })
    .withMessage('Start time must be between 5 and 22'),
  body('endTime')
    .isInt({ min: 5, max: 22 })
    .withMessage('End time must be between 5 and 22')
    .custom((endTime, { req }) => {
      if (endTime <= req.body.startTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be 5-200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be 10-1000 characters'),
  body('tournamentTier')
    .optional()
    .isIn(['100', '250', '500'])
    .withMessage('Tournament tier must be 100, 250, or 500')
];