#!/usr/bin/env node

// Test script to validate improved player name matching and pricing calculations

// Mock data for testing
const memberNames = [
  'helen sundiam',
  'adrian raphael choi', 
  'bi angeles',
  'carlos naguit',
  'dan castro',
  'derek twano',
  'roel sundiam'
];

// Enhanced string similarity function (matches our implementation)
function calculateStringSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : (maxLen - matrix[len1][len2]) / maxLen;
}

// Enhanced player categorization (matches our implementation)
function categorizePlayer(playerName, memberNames) {
  const cleanPlayerName = playerName.toLowerCase().trim();
  const isFoundInMembers = memberNames.includes(cleanPlayerName);
  
  if (isFoundInMembers) {
    return { isMember: true, matchType: 'exact', matchedName: cleanPlayerName };
  } else {
    // Enhanced fuzzy matching with multiple strategies
    let matchFound = false;
    let bestMatch = '';
    let bestSimilarity = 0;
    let matchType = '';
    
    for (const memberName of memberNames) {
      // Strategy 1: Levenshtein similarity (relaxed threshold)
      const similarity = calculateStringSimilarity(cleanPlayerName, memberName);
      if (similarity > 0.6 && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = memberName;
        matchFound = true;
        matchType = 'fuzzy';
      }
      
      // Strategy 2: Check if input is contained within member name (partial match)
      if (!matchFound && memberName.includes(cleanPlayerName) && cleanPlayerName.length > 2) {
        bestMatch = memberName;
        matchFound = true;
        matchType = 'partial';
        break;
      }
      
      // Strategy 3: Check if any word in member name matches input
      if (!matchFound) {
        const memberWords = memberName.split(' ');
        const inputWords = cleanPlayerName.split(' ');
        const wordMatch = memberWords.some(mWord => 
          inputWords.some(iWord => {
            if (iWord.length > 2 && mWord.length > 2) {
              return calculateStringSimilarity(iWord, mWord) > 0.8;
            }
            return false;
          })
        );
        
        if (wordMatch) {
          bestMatch = memberName;
          matchFound = true;
          matchType = 'word';
          break;
        }
      }
    }
    
    if (matchFound) {
      return { 
        isMember: true, 
        matchType, 
        matchedName: bestMatch, 
        similarity: bestSimilarity || undefined 
      };
    } else {
      return { isMember: false, matchType: 'none' };
    }
  }
}

// Test scenarios
const testScenarios = [
  {
    name: "Original Problem Scenario",
    players: ["Player 1", "Player 2", "Player 3"],
    expected: { members: 0, nonMembers: 3, totalCost: 150 }
  },
  {
    name: "Exact Name Matches",
    players: ["Helen Sundiam", "Roel Sundiam", "Dan Castro"],
    expected: { members: 3, nonMembers: 0, totalCost: 60 }
  },
  {
    name: "Case Insensitive Matches",
    players: ["helen sundiam", "ROEL SUNDIAM", "dan castro"],
    expected: { members: 3, nonMembers: 0, totalCost: 60 }
  },
  {
    name: "Partial Name Matches",
    players: ["Helen", "Roel", "Dan"],
    expected: { members: 3, nonMembers: 0, totalCost: 60 }
  },
  {
    name: "Mixed Matches",
    players: ["Helen Sundiam", "Unknown Player", "Dan"],
    expected: { members: 2, nonMembers: 1, totalCost: 90 }
  },
  {
    name: "Fuzzy Matches (typos)",
    players: ["Helen Sundia", "Roel Sundiem", "Dan Castros"],
    expected: { members: 3, nonMembers: 0, totalCost: 60 }
  }
];

console.log('🧪 TESTING IMPROVED PLAYER NAME MATCHING & PRICING');
console.log('=' .repeat(60));

const offPeakFeePerMember = 20;
const offPeakFeePerNonMember = 50;

testScenarios.forEach((scenario, index) => {
  console.log(`\n🔍 Test ${index + 1}: ${scenario.name}`);
  console.log(`Players: [${scenario.players.join(', ')}]`);
  
  let memberCount = 0;
  let nonMemberCount = 0;
  
  scenario.players.forEach(player => {
    const result = categorizePlayer(player, memberNames);
    if (result.isMember) {
      memberCount++;
      console.log(`  ✅ "${player}" → MEMBER (${result.matchType}${result.matchedName ? `, matched: "${result.matchedName}"` : ''}${result.similarity ? `, similarity: ${result.similarity.toFixed(2)}` : ''})`);
    } else {
      nonMemberCount++;
      console.log(`  ❌ "${player}" → NON-MEMBER`);
    }
  });
  
  const totalCost = (memberCount * offPeakFeePerMember) + (nonMemberCount * offPeakFeePerNonMember);
  
  console.log(`\n📊 Results:`);
  console.log(`  Members: ${memberCount}, Non-Members: ${nonMemberCount}`);
  console.log(`  Total Cost: ₱${totalCost} (${memberCount} × ₱${offPeakFeePerMember} + ${nonMemberCount} × ₱${offPeakFeePerNonMember})`);
  
  const isExpected = memberCount === scenario.expected.members && 
                    nonMemberCount === scenario.expected.nonMembers && 
                    totalCost === scenario.expected.totalCost;
  
  console.log(`  Expected: ${scenario.expected.members} members, ${scenario.expected.nonMembers} non-members, ₱${scenario.expected.totalCost}`);
  console.log(`  Result: ${isExpected ? '✅ PASS' : '❌ FAIL'}`);
});

console.log('\n' + '=' .repeat(60));
console.log('🎯 SUMMARY:');
console.log('The improved matching system should now correctly identify:');
console.log('- Exact matches (case-insensitive)');
console.log('- Partial matches (e.g., "Helen" matches "Helen Sundiam")'); 
console.log('- Word matches (e.g., "Sundiam" matches "Roel Sundiam")');
console.log('- Fuzzy matches for typos (60% similarity threshold)');
console.log('\nThis should fix the ₱120 vs ₱60 pricing discrepancy!');