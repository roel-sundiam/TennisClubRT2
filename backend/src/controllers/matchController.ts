import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import Poll from '../models/Poll';
import SeedingService from '../services/seedingService';
import { body, param, validationResult } from 'express-validator';

// Simple async handler
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => Promise.resolve(fn(req, res, next)).catch(next);

// Record match result and award seeding points
export const recordMatchResult = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log(`🔍 DEBUGGING: Recording match result - Poll: ${req.params.pollId}, Match: ${req.params.matchNumber}`);
  console.log(`🔍 DEBUGGING: Request body:`, req.body);
  console.log(`🔍 DEBUGGING: User:`, req.user?.username, req.user?.role);

  const { pollId, matchNumber } = req.params;
  const { winningTeam, score } = req.body;

  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    console.log(`❌ DEBUGGING: Access denied - User role: ${req.user?.role}`);
    res.status(403).json({
      success: false,
      error: 'Only admins can record match results'
    });
    return;
  }

  // Find the Open Play event
  console.log(`🔍 DEBUGGING: Looking for poll with ID: ${pollId}`);
  const poll = await Poll.findById(pollId);
  if (!poll || !poll.openPlayEvent) {
    console.log(`❌ DEBUGGING: Poll not found or not an open play event`);
    res.status(404).json({
      success: false,
      error: 'Open Play event not found'
    });
    return;
  }

  console.log(`✅ DEBUGGING: Found poll: ${poll.title}, Tournament Tier: ${poll.openPlayEvent.tournamentTier}`);
  console.log(`🔍 DEBUGGING: Poll has ${poll.openPlayEvent.matches?.length || 0} matches`);

  // Find the specific match
  const matchNumberInt = parseInt(matchNumber || '0');
  const match = poll.openPlayEvent.matches?.find(m => m.matchNumber === matchNumberInt);
  if (!match) {
    console.log(`❌ DEBUGGING: Match ${matchNumberInt} not found in poll`);
    console.log(`🔍 DEBUGGING: Available matches:`, poll.openPlayEvent.matches?.map(m => ({ num: m.matchNumber, status: m.status })));
    res.status(404).json({
      success: false,
      error: 'Match not found'
    });
    return;
  }

  console.log(`✅ DEBUGGING: Found match ${matchNumberInt}:`, {
    status: match.status,
    team1: match.team1,
    team2: match.team2,
    players: match.players
  });

  // Validate winning team
  if (![1, 2].includes(winningTeam)) {
    console.log(`❌ DEBUGGING: Invalid winning team: ${winningTeam}`);
    res.status(400).json({
      success: false,
      error: 'Winning team must be 1 or 2'
    });
    return;
  }

  console.log(`🔍 DEBUGGING: Updating match using atomic MongoDB operation...`);
  try {
    // Use atomic update instead of saving the entire document
    const updateResult = await Poll.updateOne(
      { 
        _id: pollId,
        'openPlayEvent.matches.matchNumber': matchNumberInt 
      },
      {
        $set: {
          'openPlayEvent.matches.$.winningTeam': winningTeam,
          'openPlayEvent.matches.$.score': score,
          'openPlayEvent.matches.$.status': 'completed'
        }
      }
    );
    
    console.log(`✅ DEBUGGING: Match updated successfully:`, updateResult);
    
    if (updateResult.modifiedCount === 0) {
      console.error(`❌ DEBUGGING: No documents were modified`);
      res.status(400).json({
        success: false,
        error: 'Failed to update match result'
      });
      return;
    }

    // Update the local match object for the response
    match.winningTeam = winningTeam;
    match.score = score;
    match.status = 'completed';
    
  } catch (saveError) {
    console.error(`❌ DEBUGGING: Error updating match:`, saveError);
    res.status(500).json({
      success: false,
      error: 'Failed to save match result',
      details: saveError instanceof Error ? saveError.message : 'Unknown error'
    });
    return;
  }

  // Determine winners and participants for seeding points
  // If team1/team2 are empty, split the players array (4 players -> 2 teams of 2)
  let winningPlayers, losingPlayers;
  
  if (match.team1 && match.team1.length > 0 && match.team2 && match.team2.length > 0) {
    // Use existing team assignments
    winningPlayers = winningTeam === 1 ? match.team1 : match.team2;
    losingPlayers = winningTeam === 1 ? match.team2 : match.team1;
  } else if (match.players && match.players.length === 4) {
    // Split players array: first 2 = team 1, last 2 = team 2
    const team1 = [match.players[0], match.players[1]];
    const team2 = [match.players[2], match.players[3]];
    winningPlayers = winningTeam === 1 ? team1 : team2;
    losingPlayers = winningTeam === 1 ? team2 : team1;
  } else {
    console.log(`❌ DEBUGGING: Invalid match structure - no teams or insufficient players`);
    res.status(400).json({
      success: false,
      error: 'Invalid match structure'
    });
    return;
  }
  
  const allParticipants = [...winningPlayers, ...losingPlayers];

  console.log(`🔍 DEBUGGING: Team assignments:`, {
    winningTeam,
    winningPlayers,
    losingPlayers,
    allParticipants
  });

  // Award seeding points based on tournament tier
  const tournamentTier = poll.openPlayEvent.tournamentTier;
  const tierPoints = {
    '100': { winner: 10, participant: 5 },
    '250': { winner: 25, participant: 15 },
    '500': { winner: 50, participant: 30 }
  }[tournamentTier];

  console.log(`🔍 DEBUGGING: Points to award - Tier ${tournamentTier}: Winners get ${tierPoints.winner}, Participants get ${tierPoints.participant}`);

  // Award points to winners
  console.log(`🔍 DEBUGGING: Awarding winner points...`);
  for (const winnerId of winningPlayers) {
    if (winnerId && typeof winnerId === 'string') {
      await SeedingService.awardPoints(winnerId, tierPoints.winner, `Won ${tournamentTier} Series match`);
    } else {
      console.warn(`❌ DEBUGGING: Invalid winner ID:`, winnerId);
    }
  }

  // Award participation points to losers
  console.log(`🔍 DEBUGGING: Awarding participation points...`);
  for (const loserId of losingPlayers) {
    if (loserId && typeof loserId === 'string') {
      await SeedingService.awardPoints(loserId, tierPoints.participant, `Participated in ${tournamentTier} Series match`);
    } else {
      console.warn(`❌ DEBUGGING: Invalid loser ID:`, loserId);
    }
  }

  console.log(`🏆 Match ${matchNumber} completed - Tier ${tournamentTier}: Team ${winningTeam} wins! Points awarded.`);

  res.json({
    success: true,
    message: 'Match result recorded and points awarded successfully',
    data: {
      match: match,
      pointsAwarded: {
        winners: winningPlayers.map(id => ({ playerId: id, points: tierPoints.winner })),
        participants: losingPlayers.map(id => ({ playerId: id, points: tierPoints.participant }))
      }
    }
  });
});

// Get matches for an Open Play event
export const getOpenPlayMatches = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { pollId } = req.params;

  const poll = await Poll.findById(pollId)
    .populate('openPlayEvent.matches.players', 'username fullName')
    .populate('openPlayEvent.matches.team1', 'username fullName')
    .populate('openPlayEvent.matches.team2', 'username fullName');

  if (!poll || !poll.openPlayEvent) {
    res.status(404).json({
      success: false,
      error: 'Open Play event not found'
    });
    return;
  }

  res.json({
    success: true,
    data: {
      eventTitle: poll.title,
      tournamentTier: poll.openPlayEvent.tournamentTier,
      matches: poll.openPlayEvent.matches || [],
      matchesGenerated: poll.openPlayEvent.matchesGenerated
    }
  });
});

// Validation middleware
export const recordMatchResultValidation = [
  param('pollId')
    .isMongoId()
    .withMessage('Invalid poll ID'),
  param('matchNumber')
    .isInt({ min: 1, max: 6 })
    .withMessage('Match number must be between 1 and 6'),
  body('winningTeam')
    .isInt({ min: 1, max: 2 })
    .withMessage('Winning team must be 1 or 2'),
  body('score')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Score must be a string with maximum 50 characters')
];

export const getOpenPlayMatchesValidation = [
  param('pollId')
    .isMongoId()
    .withMessage('Invalid poll ID')
];