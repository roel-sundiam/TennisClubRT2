/**
 * DoublesSchedulerService - Tennis doubles match scheduler with max 2 matches per player
 * Replaces the existing generateMatches logic with optimized rotation algorithms
 */

export interface MatchResult {
  court: number;
  matchNumber: number;
  players: string[];
  team1: string[];
  team2: string[];
  status: 'scheduled' | 'in_progress' | 'completed';
}

export interface RotationResult {
  matches: MatchResult[];
  playerStats: {
    [playerId: string]: {
      matchCount: number;
      matchNumbers: number[];
    };
  };
  totalMatches: number;
}

export class DoublesSchedulerService {
  
  /**
   * Generate optimal doubles matches with max 2 matches per player constraint
   * @param confirmedPlayers Array of player IDs
   * @returns Array of match objects with proper team assignments
   */
  static generateMatches(confirmedPlayers: string[]): MatchResult[] {
    if (confirmedPlayers.length < 4) {
      throw new Error('Need at least 4 players to generate matches');
    }
    
    if (confirmedPlayers.length > 12) {
      throw new Error('Maximum 12 players allowed for Open Play');
    }

    const playerCount = confirmedPlayers.length;
    const maxMatches = this.calculateMaxMatches(playerCount);
    
    // Create rotation schedule
    const rotationSchedule = this.createRotationSchedule(confirmedPlayers, maxMatches);
    
    // Convert to match format
    const matches: MatchResult[] = rotationSchedule.map((matchPlayers, index) => {
      const shuffledPlayers = this.shuffleArray([...matchPlayers]);
      
      // Ensure we have exactly 4 players
      if (shuffledPlayers.length !== 4) {
        throw new Error(`Match ${index + 1} does not have exactly 4 players`);
      }
      
      return {
        court: 1,
        matchNumber: index + 1,
        players: shuffledPlayers,
        team1: [shuffledPlayers[0]!, shuffledPlayers[1]!],
        team2: [shuffledPlayers[2]!, shuffledPlayers[3]!],
        status: 'scheduled' as const
      };
    });

    console.log(`🎾 Generated ${matches.length} doubles matches for ${playerCount} players`);
    return matches;
  }

  /**
   * Calculate maximum possible matches for given player count
   * Each player can play maximum 2 matches
   */
  private static calculateMaxMatches(playerCount: number): number {
    // For even player counts: all players get exactly 2 matches
    // For odd player counts: some players get 1 match, others get 2
    
    const matchCounts: Record<number, number> = {
      4: 2,   // 2 matches: all players get 2 matches
      5: 2,   // 2 matches: 1 player gets 1 match, 4 get 2
      6: 3,   // 3 matches: all players get 2 matches  
      7: 3,   // 3 matches: 2 players get 1 match, 5 get 2
      8: 4,   // 4 matches: all players get 2 matches
      9: 4,   // 4 matches: 2 players get 1 match, 7 get 2
      10: 5,  // 5 matches: all players get 2 matches
      11: 5,  // 5 matches: 2 players get 1 match, 9 get 2
      12: 6   // 6 matches: all players get 2 matches
    };

    return matchCounts[playerCount] || Math.floor(playerCount / 2);
  }

  /**
   * Create rotation schedule ensuring fair distribution
   */
  private static createRotationSchedule(players: string[], maxMatches: number): string[][] {
    const playerCount = players.length;
    const schedule: string[][] = [];
    
    // Track how many matches each player has played
    const playerMatchCount = new Map<string, number>();
    players.forEach(player => playerMatchCount.set(player, 0));
    
    // Generate matches based on player count
    switch (playerCount) {
      case 4:
        return this.generate4PlayerSchedule(players);
      case 5:
        return this.generate5PlayerSchedule(players);
      case 6:
        return this.generate6PlayerSchedule(players);
      case 7:
        return this.generate7PlayerSchedule(players);
      case 8:
        return this.generate8PlayerSchedule(players);
      case 9:
        return this.generate9PlayerSchedule(players);
      case 10:
        return this.generate10PlayerSchedule(players);
      case 11:
        return this.generate11PlayerSchedule(players);
      case 12:
        return this.generate12PlayerSchedule(players);
      default:
        throw new Error(`Unsupported player count: ${playerCount}`);
    }
  }

  /**
   * 4 players - 2 matches (all play 2 matches)
   */
  private static generate4PlayerSchedule(players: string[]): string[][] {
    if (players.length !== 4) throw new Error('Expected 4 players');
    const [p1, p2, p3, p4] = players as [string, string, string, string];
    return [
      [p1, p2, p3, p4],      // Match 1: (P1,P2) vs (P3,P4)
      [p1, p3, p2, p4]       // Match 2: (P1,P3) vs (P2,P4)
    ];
  }

  /**
   * 5 players - 2 matches (P1,P2,P3 play 2; P4,P5 play 1)
   */
  private static generate5PlayerSchedule(players: string[]): string[][] {
    if (players.length !== 5) throw new Error('Expected 5 players');
    const [p1, p2, p3, p4, p5] = players as [string, string, string, string, string];
    return [
      [p1, p2, p3, p4],      // Match 1: (P1,P2) vs (P3,P4) [P5 sits]
      [p1, p5, p2, p3]       // Match 2: (P1,P5) vs (P2,P3) [P4 sits]
    ];
  }

  /**
   * 6 players - 3 matches (all play 2 matches)
   */
  private static generate6PlayerSchedule(players: string[]): string[][] {
    if (players.length !== 6) throw new Error('Expected 6 players');
    const [p1, p2, p3, p4, p5, p6] = players as [string, string, string, string, string, string];
    return [
      [p1, p2, p3, p4],      // Match 1: (P1,P2) vs (P3,P4)
      [p5, p6, p1, p3],      // Match 2: (P5,P6) vs (P1,P3)  
      [p2, p4, p5, p6]       // Match 3: (P2,P4) vs (P5,P6)
    ];
  }

  /**
   * 7 players - 3 matches (P1-P5 play 2; P6,P7 play 1)
   */
  private static generate7PlayerSchedule(players: string[]): string[][] {
    if (players.length !== 7) throw new Error('Expected 7 players');
    const [p1, p2, p3, p4, p5, p6, p7] = players as [string, string, string, string, string, string, string];
    return [
      [p1, p2, p3, p4],      // Match 1: (P1,P2) vs (P3,P4) [P5,P6,P7 sit]
      [p5, p6, p1, p3],      // Match 2: (P5,P6) vs (P1,P3) [P2,P4,P7 sit]  
      [p7, p2, p4, p5]       // Match 3: (P7,P2) vs (P4,P5) [P1,P3,P6 sit]
    ];
  }

  /**
   * 8 players - 4 matches (all play 2 matches)
   */
  private static generate8PlayerSchedule(players: string[]): string[][] {
    if (players.length !== 8) throw new Error('Expected 8 players');
    const [p1, p2, p3, p4, p5, p6, p7, p8] = players as [string, string, string, string, string, string, string, string];
    return [
      [p1, p2, p3, p4],      // Match 1: (P1,P2) vs (P3,P4)
      [p5, p6, p7, p8],      // Match 2: (P5,P6) vs (P7,P8)
      [p1, p5, p2, p6],      // Match 3: (P1,P5) vs (P2,P6)
      [p3, p7, p4, p8]       // Match 4: (P3,P7) vs (P4,P8)
    ];
  }

  /**
   * 9 players - 4 matches (P1-P7 play 2; P8,P9 play 1)
   */
  private static generate9PlayerSchedule(players: string[]): string[][] {
    if (players.length !== 9) throw new Error('Expected 9 players');
    const [p1, p2, p3, p4, p5, p6, p7, p8, p9] = players as [string, string, string, string, string, string, string, string, string];
    return [
      [p1, p2, p3, p4],      // Match 1: (P1,P2) vs (P3,P4) [P5-P9 sit]
      [p5, p6, p7, p8],      // Match 2: (P5,P6) vs (P7,P8) [P1-P4,P9 sit]
      [p9, p1, p5, p7],      // Match 3: (P9,P1) vs (P5,P7) [P2-P4,P6,P8 sit]
      [p2, p3, p6, p8]       // Match 4: (P2,P3) vs (P6,P8) [P1,P4,P5,P7,P9 sit]
    ];
  }

  /**
   * 10 players - 5 matches (all play 2 matches)
   */
  private static generate10PlayerSchedule(players: string[]): string[][] {
    if (players.length !== 10) throw new Error('Expected 10 players');
    const [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10] = players as [string, string, string, string, string, string, string, string, string, string];
    return [
      [p1, p2, p3, p4],      // Match 1: (P1,P2) vs (P3,P4)
      [p5, p6, p7, p8],      // Match 2: (P5,P6) vs (P7,P8)
      [p9, p10, p1, p5],     // Match 3: (P9,P10) vs (P1,P5)
      [p2, p6, p3, p7],      // Match 4: (P2,P6) vs (P3,P7)
      [p4, p8, p9, p10]      // Match 5: (P4,P8) vs (P9,P10)
    ];
  }

  /**
   * 11 players - 5 matches (P1-P9 play 2; P10,P11 play 1)
   */
  private static generate11PlayerSchedule(players: string[]): string[][] {
    if (players.length !== 11) throw new Error('Expected 11 players');
    const [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11] = players as [string, string, string, string, string, string, string, string, string, string, string];
    return [
      [p1, p2, p3, p4],      // Match 1: (P1,P2) vs (P3,P4) [P5-P11 sit]
      [p5, p6, p7, p8],      // Match 2: (P5,P6) vs (P7,P8) [P1-P4,P9-P11 sit]
      [p9, p10, p1, p5],     // Match 3: (P9,P10) vs (P1,P5) [P2-P4,P6-P8,P11 sit]
      [p11, p2, p3, p6],     // Match 4: (P11,P2) vs (P3,P6) [P1,P4,P5,P7-P10 sit]
      [p4, p7, p8, p9]       // Match 5: (P4,P7) vs (P8,P9) [P1-P3,P5,P6,P10,P11 sit]
    ];
  }

  /**
   * 12 players - 6 matches (all play 2 matches)
   */
  private static generate12PlayerSchedule(players: string[]): string[][] {
    if (players.length !== 12) throw new Error('Expected 12 players');
    const [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12] = players as [string, string, string, string, string, string, string, string, string, string, string, string];
    return [
      [p1, p2, p3, p4],      // Match 1: (P1,P2) vs (P3,P4)
      [p5, p6, p7, p8],      // Match 2: (P5,P6) vs (P7,P8)
      [p9, p10, p11, p12],   // Match 3: (P9,P10) vs (P11,P12)
      [p1, p5, p9, p11],     // Match 4: (P1,P5) vs (P9,P11)
      [p2, p6, p10, p12],    // Match 5: (P2,P6) vs (P10,P12)
      [p3, p7, p4, p8]       // Match 6: (P3,P7) vs (P4,P8)
    ];
  }

  /**
   * Utility function to shuffle array
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      const jValue = shuffled[j];
      if (temp !== undefined && jValue !== undefined) {
        shuffled[i] = jValue;
        shuffled[j] = temp;
      }
    }
    return shuffled;
  }

  /**
   * Get detailed rotation analysis for debugging
   */
  static analyzeRotation(confirmedPlayers: string[]): RotationResult {
    const matches = this.generateMatches(confirmedPlayers);
    
    // Calculate player statistics
    const playerStats: { [playerId: string]: { matchCount: number; matchNumbers: number[] } } = {};
    
    confirmedPlayers.forEach(playerId => {
      playerStats[playerId] = { matchCount: 0, matchNumbers: [] };
    });
    
    matches.forEach(match => {
      match.players.forEach(playerId => {
        if (playerStats[playerId]) {
          playerStats[playerId].matchCount++;
          playerStats[playerId].matchNumbers.push(match.matchNumber);
        }
      });
    });
    
    return {
      matches,
      playerStats,
      totalMatches: matches.length
    };
  }
}

export default DoublesSchedulerService;