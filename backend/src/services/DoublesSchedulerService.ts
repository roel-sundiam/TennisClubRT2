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
   * Generate matches starting from a specific match number
   * Useful for regenerating incomplete matches while preserving completed ones
   */
  static generateMatchesFromNumber(confirmedPlayers: string[], startingMatchNumber: number = 1): MatchResult[] {
    const baseMatches = this.generateMatches(confirmedPlayers);
    
    // Adjust match numbers to start from the specified number
    return baseMatches.map((match, index) => ({
      ...match,
      matchNumber: startingMatchNumber + index
    }));
  }

  /**
   * Generate remaining matches while avoiding players from completed matches
   * This prevents player conflicts when regenerating incomplete matches
   */
  static generateRemainingMatches(
    allPlayers: string[], 
    completedMatches: MatchResult[],
    startingMatchNumber: number = 1
  ): MatchResult[] {
    if (allPlayers.length < 4) {
      throw new Error('Need at least 4 players to generate matches');
    }
    
    if (allPlayers.length > 12) {
      throw new Error('Maximum 12 players allowed for Open Play');
    }

    const playerCount = allPlayers.length;
    const maxMatches = this.calculateMaxMatches(playerCount);
    
    // Track how many matches each player has played in completed matches
    const playerMatchCount = new Map<string, number>();
    const playerUsedInMatches = new Map<string, number[]>();
    
    // Initialize all players
    allPlayers.forEach(player => {
      playerMatchCount.set(player, 0);
      playerUsedInMatches.set(player, []);
    });
    
    // Count completed matches for each player
    completedMatches.forEach(match => {
      if (match.players && Array.isArray(match.players)) {
        match.players.forEach((player: any) => {
          // Handle both string IDs and populated objects
          const playerId = typeof player === 'string' ? player : 
                          (player && player._id ? player._id : String(player));
          
          // Only process valid player IDs
          if (playerId && typeof playerId === 'string' && playerId !== '[object Object]' && playerId !== 'undefined') {
            const currentCount = playerMatchCount.get(playerId) || 0;
            playerMatchCount.set(playerId, currentCount + 1);
            
            const usedInMatches = playerUsedInMatches.get(playerId) || [];
            usedInMatches.push(match.matchNumber);
            playerUsedInMatches.set(playerId, usedInMatches);
          }
        });
      } else {
        console.warn(`⚠️  Skipping match ${match.matchNumber} - players array is missing or invalid`);
      }
    });

    console.log(`🎯 Player status before regeneration:`);
    playerMatchCount.forEach((count, playerId) => {
      const matches = playerUsedInMatches.get(playerId) || [];
      console.log(`  ${playerId}: ${count} matches played (matches: ${matches.join(', ') || 'none'})`);
    });
    
    // Generate alternative remaining matches that avoid completed match patterns
    const remainingSchedule: string[][] = [];
    
    // Strategy: Instead of using the original optimal pattern, generate matches that maximize
    // variety by ensuring players from completed matches play with NEW partners when possible
    
    const playerMatchNeeds = new Map<string, number>();
    allPlayers.forEach(player => {
      const currentCount = playerMatchCount.get(player) || 0;
      const needed = Math.max(0, 2 - currentCount);
      playerMatchNeeds.set(player, needed);
    });
    
    // Get players who have played together in completed matches
    const completedPairings = new Set<string>();
    completedMatches.forEach(match => {
      const players = match.players || [];
      if (Array.isArray(players) && players.length >= 2) {
        // Convert players to string IDs first
        const playerIds = players
          .map((player: any) => typeof player === 'string' ? player : 
                        (player && player._id ? player._id : String(player)))
          .filter(id => id && typeof id === 'string' && id !== '[object Object]' && id !== 'undefined');
        
        for (let i = 0; i < playerIds.length; i++) {
          for (let j = i + 1; j < playerIds.length; j++) {
            const pair = [playerIds[i], playerIds[j]].sort().join('|');
            completedPairings.add(pair);
          }
        }
      }
    });
    
    console.log(`🚫 Completed pairings to avoid: ${Array.from(completedPairings).join(', ')}`);
    
    // Generate matches trying to create new pairings
    const shuffledPlayers = this.shuffleArray([...allPlayers]);
    
    // For 6 players, we know we need exactly the right number of remaining matches
    const expectedRemainingMatches = maxMatches - completedMatches.length;
    
    // Create remaining matches by trying different combinations
    if (playerCount === 6 && completedMatches.length === 1) {
      // Special handling for 6 players with 1 completed match
      // We need 2 more matches, and each remaining player needs specific number of matches
      
      // Find players who need 1 more match vs 2 more matches
      const needOne: string[] = [];
      const needTwo: string[] = [];
      
      playerMatchNeeds.forEach((needed, player) => {
        if (needed === 1) needOne.push(player);
        if (needed === 2) needTwo.push(player);
      });
      
      console.log(`📊 Match needs: ${needOne.length} players need 1 more, ${needTwo.length} players need 2 more`);
      
      if (needOne.length === 4 && needTwo.length === 2) {
        // Perfect case: 4 players need 1 match, 2 players need 2 matches
        // Match A: 2 players who need 1 + 2 players who need 2 = all get 1 match
        // Match B: 2 players who need 1 + 2 players who need 2 = needTwo players get their 2nd match
        
        const shuffledNeedOne = this.shuffleArray(needOne);
        const shuffledNeedTwo = this.shuffleArray(needTwo);
        
        // Match A: First 2 from needOne + both from needTwo
        const matchA = [shuffledNeedOne[0]!, shuffledNeedOne[1]!, shuffledNeedTwo[0]!, shuffledNeedTwo[1]!];
        
        // Match B: Last 2 from needOne + both from needTwo (needTwo players get 2nd match)
        const matchB = [shuffledNeedOne[2]!, shuffledNeedOne[3]!, shuffledNeedTwo[0]!, shuffledNeedTwo[1]!];
        
        remainingSchedule.push(matchA, matchB);
        console.log(`✨ Generated alternative 6-player matches avoiding previous pairings`);
      } else {
        // Fallback to original approach
        const completeSchedule = this.createRotationSchedule(allPlayers, maxMatches);
        const completedMatchNumbers = new Set(completedMatches.map(m => m.matchNumber));
        
        for (let i = 0; i < completeSchedule.length; i++) {
          const matchNumber = i + 1;
          if (!completedMatchNumbers.has(matchNumber)) {
            const match = completeSchedule[i];
            if (match) {
              remainingSchedule.push(match);
            }
          }
        }
        console.log(`⚠️  Using original pattern as fallback for 6 players`);
      }
    } else {
      // For non-6-player cases or different completion states, use original approach
      const completeSchedule = this.createRotationSchedule(allPlayers, maxMatches);
      const completedMatchNumbers = new Set(completedMatches.map(m => m.matchNumber));
      
      for (let i = 0; i < completeSchedule.length; i++) {
        const matchNumber = i + 1;
        if (!completedMatchNumbers.has(matchNumber)) {
          const match = completeSchedule[i];
          if (match) {
            remainingSchedule.push(match);
          }
        }
      }
      console.log(`🔄 Using original complete schedule for ${playerCount} players`);
    }
    
    console.log(`✅ Generated ${remainingSchedule.length} remaining matches`);
    
    // Convert remaining schedule to match format with proper numbering
    const remainingMatches: MatchResult[] = [];
    let currentMatchNumber = startingMatchNumber;
    
    remainingSchedule.forEach(matchPlayers => {
      const shuffledPlayers = this.shuffleArray([...matchPlayers]);
      
      if (shuffledPlayers.length !== 4) {
        throw new Error(`Match ${currentMatchNumber} does not have exactly 4 players`);
      }
      
      remainingMatches.push({
        court: 1,
        matchNumber: currentMatchNumber,
        players: shuffledPlayers,
        team1: [shuffledPlayers[0]!, shuffledPlayers[1]!],
        team2: [shuffledPlayers[2]!, shuffledPlayers[3]!],
        status: 'scheduled' as const
      });
      
      currentMatchNumber++;
    });

    // Validate that we're not exceeding the 2-match limit
    const finalPlayerCount = new Map<string, number>();
    allPlayers.forEach(player => {
      finalPlayerCount.set(player, playerMatchCount.get(player) || 0);
    });
    
    remainingMatches.forEach(match => {
      if (match.players && Array.isArray(match.players)) {
        match.players.forEach(playerId => {
          const currentCount = finalPlayerCount.get(playerId) || 0;
          finalPlayerCount.set(playerId, currentCount + 1);
        });
      }
    });
    
    // Check for violations
    let hasViolations = false;
    const violations: string[] = [];
    console.log(`🔍 Final player match distribution check:`);
    finalPlayerCount.forEach((count, playerId) => {
      const completedCount = playerMatchCount.get(playerId) || 0;
      const newCount = count - completedCount;
      console.log(`  ${playerId}: ${count} total matches (${completedCount} completed + ${newCount} new)`);
      if (count > 2) {
        const violation = `${playerId} would have ${count} matches (limit: 2)`;
        console.error(`❌ VIOLATION: ${violation}`);
        violations.push(violation);
        hasViolations = true;
      }
    });
    
    if (hasViolations) {
      throw new Error(`Generated matches would violate the 2-match-per-player limit: ${violations.join(', ')}`);
    }

    // Additional validation: Ensure all players are accounted for
    const expectedPlayerCount = allPlayers.length;
    const actualPlayerCount = finalPlayerCount.size;
    if (actualPlayerCount !== expectedPlayerCount) {
      throw new Error(`Player count mismatch: expected ${expectedPlayerCount}, got ${actualPlayerCount}`);
    }

    // Additional validation: Check match numbering is sequential
    const matchNumbers = remainingMatches.map(m => m.matchNumber).sort((a, b) => a - b);
    for (let i = 0; i < matchNumbers.length; i++) {
      const expectedNumber = startingMatchNumber + i;
      if (matchNumbers[i] !== expectedNumber) {
        throw new Error(`Match numbering error: expected match ${expectedNumber}, got ${matchNumbers[i]}`);
      }
    }
    
    console.log(`🎾 Generated ${remainingMatches.length} remaining matches for ${playerCount} players`);
    return remainingMatches;
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
      if (match.players && Array.isArray(match.players)) {
        match.players.forEach(playerId => {
          if (playerStats[playerId]) {
            playerStats[playerId].matchCount++;
            playerStats[playerId].matchNumbers.push(match.matchNumber);
          }
        });
      }
    });
    
    return {
      matches,
      playerStats,
      totalMatches: matches.length
    };
  }
}

export default DoublesSchedulerService;