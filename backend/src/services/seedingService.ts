import User from '../models/User';
import Reservation from '../models/Reservation';
import { PlayerRanking, PlayerStats, MatchResult } from '../types';

export class SeedingService {
  // Point values for each tournament tier
  private static readonly POINT_VALUES = {
    '100': { winner: 10, participant: 5 },
    '250': { winner: 25, participant: 15 },
    '500': { winner: 50, participant: 30 }
  };

  /**
   * Process match results and award points to players
   */
  static async processMatchResults(reservationId: string, matchResults: MatchResult[]): Promise<void> {
    try {
      // Get the reservation to determine tournament tier
      const reservation = await Reservation.findById(reservationId);
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      if (reservation.pointsProcessed) {
        throw new Error('Points have already been processed for this reservation');
      }

      const tierPoints = this.POINT_VALUES[reservation.tournamentTier];
      
      // Process each match result
      for (const match of matchResults) {
        await this.awardPointsForMatch(match, tierPoints, reservation.tournamentTier);
      }

      // Mark reservation as points processed
      reservation.matchResults = matchResults;
      reservation.pointsProcessed = true;
      await reservation.save();

    } catch (error) {
      console.error('Error processing match results:', error);
      throw error;
    }
  }

  /**
   * Award points for a single match
   */
  private static async awardPointsForMatch(
    match: MatchResult,
    tierPoints: { winner: number; participant: number },
    tournamentTier: string
  ): Promise<void> {
    const { winnerId, participants } = match;

    // Award winner points
    await User.findByIdAndUpdate(
      winnerId,
      {
        $inc: {
          seedPoints: tierPoints.winner,
          matchesWon: 1,
          matchesPlayed: 1
        }
      }
    );

    // Award participation points to other players
    const otherParticipants = participants.filter(p => p !== winnerId);
    for (const participantId of otherParticipants) {
      await User.findByIdAndUpdate(
        participantId,
        {
          $inc: {
            seedPoints: tierPoints.participant,
            matchesPlayed: 1
          }
        }
      );
    }

    console.log(`📊 Points awarded - Tier ${tournamentTier}: Winner ${winnerId} (+${tierPoints.winner}), ${otherParticipants.length} participants (+${tierPoints.participant} each)`);
  }

  /**
   * Get current player rankings
   */
  static async getRankings(limit: number = 50): Promise<PlayerRanking[]> {
    try {
      console.log(`🔍 DEBUGGING: Getting rankings with limit: ${limit}`);
      
      const users = await User.find({
        isActive: true,
        isApproved: true,
        role: { $in: ['member', 'admin'] }
      })
      .select('username fullName seedPoints matchesWon matchesPlayed')
      .sort({ seedPoints: -1, matchesWon: -1, username: 1 })
      .limit(limit);

      console.log(`🔍 DEBUGGING: Found ${users.length} active approved users`);
      console.log(`🔍 DEBUGGING: Users with points:`, users.filter(u => u.seedPoints > 0).map(u => ({
        name: u.fullName || u.username,
        points: u.seedPoints,
        wins: u.matchesWon,
        played: u.matchesPlayed
      })));

      const rankings = users.map((user, index) => ({
        _id: user._id.toString(),
        username: user.username,
        fullName: user.fullName,
        seedPoints: user.seedPoints,
        matchesWon: user.matchesWon,
        matchesPlayed: user.matchesPlayed,
        winRate: user.matchesPlayed > 0 ? Math.round((user.matchesWon / user.matchesPlayed) * 100) / 100 : 0,
        rank: index + 1
      }));

      console.log(`🔍 DEBUGGING: Returning ${rankings.length} rankings`);
      return rankings;
    } catch (error) {
      console.error('Error getting rankings:', error);
      throw error;
    }
  }

  /**
   * Get detailed stats for a specific player
   */
  static async getPlayerStats(userId: string): Promise<PlayerStats | null> {
    try {
      const user = await User.findById(userId);
      if (!user || !user.isActive || !user.isApproved) {
        return null;
      }

      // Get player's rank
      const allRankings = await this.getRankings(1000); // Get all players for accurate ranking
      const playerRanking = allRankings.find(r => r._id === userId);
      
      // If player is not in rankings (no matches played), create default stats
      if (!playerRanking) {
        return {
          user: {
            ...user.toObject(),
            _id: user._id.toString()
          },
          rank: 0, // Unranked
          totalPlayers: allRankings.length,
          recentMatches: []
        };
      }

      // Get recent match history
      const recentReservations = await Reservation.find({
        $or: [
          { userId: userId },
          { 'matchResults.winnerId': userId },
          { 'matchResults.participants': userId }
        ],
        status: 'completed',
        pointsProcessed: true
      })
      .sort({ date: -1 })
      .limit(10)
      .populate('userId', 'username fullName');

      const recentMatches = [];
      for (const reservation of recentReservations) {
        if (reservation.matchResults) {
          for (const match of reservation.matchResults) {
            if (match.participants.includes(userId)) {
              const tierPoints = this.POINT_VALUES[reservation.tournamentTier];
              const isWinner = match.winnerId === userId;
              const opponents = match.participants.filter(p => p !== userId);
              
              recentMatches.push({
                date: reservation.date,
                tournamentTier: reservation.tournamentTier,
                result: isWinner ? 'won' as const : 'played' as const,
                points: isWinner ? tierPoints.winner : tierPoints.participant,
                opponents: opponents
              });
            }
          }
        }
      }

      return {
        user: {
          ...user.toObject(),
          _id: user._id.toString()
        },
        rank: playerRanking.rank,
        totalPlayers: allRankings.length,
        recentMatches: recentMatches.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting player stats:', error);
      throw error;
    }
  }

  /**
   * Recalculate all seed points from scratch (admin function)
   */
  static async recalculateAllPoints(): Promise<{ processed: number; errors: number }> {
    let processed = 0;
    let errors = 0;

    try {
      // Reset all user points
      await User.updateMany(
        {},
        {
          $set: {
            seedPoints: 0,
            matchesWon: 0,
            matchesPlayed: 0
          }
        }
      );

      // Get all completed reservations with match results
      const reservations = await Reservation.find({
        status: 'completed',
        matchResults: { $exists: true, $ne: [] }
      }).sort({ date: 1 });

      // Reprocess all match results
      for (const reservation of reservations) {
        try {
          if (reservation.matchResults && reservation.matchResults.length > 0) {
            const tierPoints = this.POINT_VALUES[reservation.tournamentTier];
            
            for (const match of reservation.matchResults) {
              await this.awardPointsForMatch(match, tierPoints, reservation.tournamentTier);
            }
            processed++;
          }
        } catch (error) {
          console.error(`Error reprocessing reservation ${reservation._id}:`, error);
          errors++;
        }
      }

      console.log(`🔄 Recalculation complete: ${processed} reservations processed, ${errors} errors`);
      return { processed, errors };
      
    } catch (error) {
      console.error('Error recalculating points:', error);
      throw error;
    }
  }

  /**
   * Award seeding points to a specific player
   */
  static async awardPoints(userId: string, points: number, reason: string): Promise<void> {
    try {
      console.log(`🔍 DEBUGGING: Attempting to award ${points} points to user ID: ${userId} for: ${reason}`);
      
      // First, check if user exists
      const user = await User.findById(userId);
      if (!user) {
        console.error(`❌ DEBUGGING: User with ID ${userId} not found!`);
        throw new Error(`User with ID ${userId} not found`);
      }
      
      console.log(`✅ DEBUGGING: Found user: ${user.fullName || user.username} (ID: ${userId})`);
      console.log(`🔍 DEBUGGING: User current stats - Points: ${user.seedPoints}, Wins: ${user.matchesWon}, Played: ${user.matchesPlayed}`);
      
      const updateResult = await User.findByIdAndUpdate(
        userId,
        {
          $inc: {
            seedPoints: points,
            matchesWon: reason.includes('Won') ? 1 : 0,
            matchesPlayed: 1
          }
        },
        { new: true } // Return updated document
      );

      if (updateResult) {
        console.log(`📊 DEBUGGING: Points successfully awarded to ${updateResult.fullName || updateResult.username}:`);
        console.log(`   - New Points: ${updateResult.seedPoints} (+${points})`);
        console.log(`   - New Wins: ${updateResult.matchesWon}`);
        console.log(`   - New Played: ${updateResult.matchesPlayed}`);
      } else {
        console.error(`❌ DEBUGGING: Failed to update user ${userId}`);
      }

      console.log(`📊 Points awarded to ${userId}: +${points} (${reason})`);
    } catch (error) {
      console.error('❌ DEBUGGING: Error awarding points:', error);
      throw error;
    }
  }

  /**
   * Get tournament tier statistics
   */
  static async getTournamentStats(): Promise<{
    totalMatches: number;
    matchesByTier: Record<string, number>;
    totalPointsAwarded: number;
    activeRankedPlayers: number;
  }> {
    try {
      const [matchStats, userStats] = await Promise.all([
        Reservation.aggregate([
          { $match: { status: 'completed', pointsProcessed: true } },
          {
            $group: {
              _id: '$tournamentTier',
              count: { $sum: 1 },
              matchCount: { $sum: { $size: { $ifNull: ['$matchResults', []] } } }
            }
          }
        ]),
        User.aggregate([
          { $match: { isActive: true, isApproved: true, matchesPlayed: { $gt: 0 } } },
          {
            $group: {
              _id: null,
              activeRankedPlayers: { $sum: 1 },
              totalPointsAwarded: { $sum: '$seedPoints' }
            }
          }
        ])
      ]);

      const matchesByTier: Record<string, number> = {};
      let totalMatches = 0;

      matchStats.forEach(stat => {
        matchesByTier[stat._id] = stat.matchCount;
        totalMatches += stat.matchCount;
      });

      const stats = userStats[0] || { activeRankedPlayers: 0, totalPointsAwarded: 0 };

      return {
        totalMatches,
        matchesByTier,
        totalPointsAwarded: stats.totalPointsAwarded,
        activeRankedPlayers: stats.activeRankedPlayers
      };
    } catch (error) {
      console.error('Error getting tournament stats:', error);
      throw error;
    }
  }
}

export default SeedingService;