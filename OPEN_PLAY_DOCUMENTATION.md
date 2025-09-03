# Open Play Court Process Documentation

## Overview

**Open Play** is an organized tennis event system that allows club members to join scheduled group sessions with automatically generated matches. The system handles registration, match generation, and court scheduling to create fair and balanced tennis sessions.

### Key Features
- **Automated Registration**: Members vote Yes/No to participate
- **Fair Match Generation**: Algorithm ensures balanced player distribution
- **Court Management**: Automatically blocks time slots to prevent conflicts
- **Real-time Updates**: Live player count and registration status
- **Sequential Matches**: Doubles matches played consecutively on Court 1 (count varies by players)

## System Architecture

### Core Components
1. **Poll System** - Handles member registration via voting
2. **Match Generator** - Creates fair doubles matches from confirmed players
3. **Court Scheduler** - Blocks time slots during Open Play events
4. **Payment Integration** - Manages fixed ₱120 player fees

### Data Models
- **Poll** with `openPlayEvent` embedded document
- **User** integration for player tracking
- **Time slot blocking** for court reservations

## Process Flow

### 1. Event Creation (Admin/Superadmin)
```
Admin → Create Open Play Poll → Set date/time/capacity → Activate poll
```

**Details:**
- Admin creates poll with category `'open_play'`
- Sets event date, start/end times (5 AM - 10 PM range)
- Fixed fee: ₱120 per player
- Maximum capacity: 12 players
- Registration deadline (poll end date)

### 2. Member Registration
```
Member → View Open Play event → Vote Yes/No → Registration confirmed
```

**Features:**
- Real-time player count display (X/12 players)
- Vote changes allowed until registration closes
- Professional UI with event details
- Automatic confirmation when voting "Yes"

### 3. Automatic Management
```
System → Monitor registration → Auto-close at capacity → Block time slots
```

**Automated Actions:**
- Poll closes when 12 players register
- Time slots automatically blocked for regular reservations
- "Yes" voters become confirmed players
- Email notifications (if configured)

### 4. Match Generation (Superadmin Only)
```
Superadmin → Generate matches → Algorithm creates optimal matches → Players assigned
```

**Algorithm Details:**
- Requires minimum 4 confirmed players
- Creates optimal number of doubles matches based on player count (4 players each)
- Fair rotation ensures even match distribution per player
- Randomization prevents predictable pairings

### 5. Event Execution
```
Players → Follow match schedule → Sequential matches → Event completion
```

**Structure:**
- All matches on Court 1
- Sequential play (number of matches varies by player count)
- Approximately 1 hour per match
- Total event duration varies based on matches generated

## Business Rules

### Pricing
- **Fixed Fee**: ₱120 per player (regardless of match count)
- **Payment Required**: Before event participation
- **No Refunds**: Once matches are generated

### Capacity Management
- **Minimum Players**: 4 (to generate matches)
- **Maximum Players**: 12 (generates 6 doubles matches)
- **Auto-closure**: Poll closes when capacity reached

### Fair Rotation Algorithm
**Match Count Formula**: `Math.floor((players × 2) ÷ 4)`

**Match Distribution Table**:
| Players | Max Matches | Player Distribution |
|---------|-------------|-------------------|
| 4       | 2          | All players get 2 matches |
| 5       | 2          | 4 players get 2, 1 gets 1 match |
| 6       | 3          | All players get 2 matches |
| 7       | 3          | 5 players get 2, 2 get 1 match |
| 8       | 4          | All players get 2 matches |
| 9       | 4          | 7 players get 2, 2 get 1 match |
| 10      | 5          | All players get 2 matches |
| 11      | 5          | 9 players get 2, 2 get 1 match |
| 12      | 6          | All players get 2 matches |

**Rules**:
- Each match requires exactly 4 players
- Each player plays maximum 2 matches
- Fair distribution prioritizes equal participation

### Court Scheduling
- **Time Slot Blocking**: Prevents regular reservations during Open Play
- **Single Court**: Always uses Court 1
- **Sequential Matches**: No overlap or parallel play

## User Interfaces

### For Members (`polls.component.ts`)
- **Event Display**: Professional cards with event details
- **Registration**: Large Yes/No voting buttons
- **Status Tracking**: Current registration status and player count
- **Match Viewing**: See generated matches and opponents

### For Admins
- **Event Creation**: Create Open Play polls
- **Registration Monitoring**: View confirmed players
- **Match Generation**: Trigger match creation (superadmin only)

### Visual Elements
- **Progress Bars**: Show registration progress (X/12)
- **Status Badges**: Active, Closed, Full indicators  
- **Match Cards**: Display match number, court, and players
- **Time Formatting**: 12-hour format with AM/PM

## Technical Implementation

### Key Files
- **Backend Model**: `/backend/src/models/Poll.ts:10-31` (Open Play interface)
- **Frontend Component**: `/frontend/src/app/components/polls/polls.component.ts` (UI interface)
- **Match Algorithm**: `/backend/src/services/DoublesSchedulerService.ts` (Core generation logic)
- **Controller**: `/backend/src/controllers/pollController.ts:722-780` (generateMatches API)
- **Poll Integration**: `/backend/src/models/Poll.ts:571-589` (Poll.generateMatches method)

### Database Schema
```typescript
interface IOpenPlayEvent {
  eventDate: Date;
  startTime: number;        // 5-22 (5 AM to 10 PM)
  endTime: number;          // 5-22 (5 AM to 10 PM)  
  playerFee: number;        // ₱120 per player
  maxPlayers: number;       // 12 players max
  confirmedPlayers: string[]; // User IDs who voted "yes"
  matches?: Array<{
    court: number;          // Always 1 (single court)
    matchNumber: number;    // Sequential match number (varies by player count)
    players: string[];      // 4 player IDs per match
  }>;
  matchesGenerated: boolean;
  blockedTimeSlots: number[]; // Array of blocked time slots
}
```

### Match Generation Algorithm
The system uses `DoublesSchedulerService` for optimal match generation:

```typescript
// Algorithm Implementation
class DoublesSchedulerService {
  static generateMatches(confirmedPlayers: string[]): MatchResult[] {
    const playerCount = confirmedPlayers.length;
    const maxMatches = this.calculateMaxMatches(playerCount);
    
    // Generate specific rotation schedules for each player count
    const rotationSchedule = this.createRotationSchedule(confirmedPlayers, maxMatches);
    
    return rotationSchedule.map((matchPlayers, index) => ({
      court: 1,
      matchNumber: index + 1,
      players: matchPlayers,
      team1: [matchPlayers[0], matchPlayers[1]],
      team2: [matchPlayers[2], matchPlayers[3]],
      status: 'scheduled'
    }));
  }

  private static calculateMaxMatches(playerCount: number): number {
    // Returns the values from our distribution table above
    const matchCounts = {
      4: 2, 5: 2, 6: 3, 7: 3, 8: 4, 
      9: 4, 10: 5, 11: 5, 12: 6
    };
    return matchCounts[playerCount] || Math.floor(playerCount / 2);
  }
}
```

**Key Features**:
- Pre-calculated optimal rotations for each player count
- Ensures fair opponent distribution
- Randomized team assignments within matches
- Prevents players from appearing twice in same match

## API Endpoints

### Core Endpoints
- `GET /api/polls/active` - Get active Open Play events
- `POST /api/polls` - Create new Open Play poll (admin)
- `POST /api/polls/:id/vote` - Register for Open Play event
- `POST /api/polls/:id/generate-matches` - Generate matches (superadmin)
- `GET /api/polls/:id` - Get specific Open Play details

### Request/Response Examples
```typescript
// Create Open Play Event
POST /api/polls
{
  "title": "Sunday Morning Open Play",
  "description": "Join us for doubles matches!",
  "eventDate": "2025-01-15",
  "startTime": 8,
  "endTime": 14,
  "endDate": "2025-01-14T23:59:59Z"
}

// Register for Event  
POST /api/polls/:id/vote
{
  "optionIds": ["option_id_for_yes"]
}

// Generate Matches (superadmin only)
POST /api/polls/:id/generate-matches
// Returns: { matches: [...], confirmedPlayers: [...] }
```

## Troubleshooting

### Common Issues

**1. Poll Won't Close at Capacity**
- Check `maxPlayers` setting in poll
- Verify post-save middleware is running
- Confirm "Yes" option vote counting

**2. Matches Not Generated**
- Ensure minimum 4 confirmed players
- Verify superadmin role permissions
- Check `matchesGenerated` flag status

**3. Time Slots Not Blocked**
- Confirm pre-save middleware execution
- Verify `blockedTimeSlots` array population
- Check reservation conflict prevention

**4. Vote Changes Not Working**
- Open Play events allow vote changes by default
- Check `allowMultipleVotes` isn't set to false
- Verify poll is still active status

### Error Messages
- `"Need at least 4 players to generate matches"` - Wait for more registrations
- `"Maximum 12 players allowed"` - Capacity reached, poll should auto-close
- `"Only superadmins can generate matches"` - Check user role permissions
- `"Poll is not currently accepting votes"` - Check poll active status and dates

## Best Practices

### For Admins
1. **Set Clear Deadlines**: End poll at least 1 hour before event start
2. **Monitor Registration**: Check player count regularly
3. **Generate Early**: Create matches as soon as minimum players reached
4. **Communicate Changes**: Notify players of any modifications

### For Development
1. **Test All Player Counts**: Verify correct match generation for 4-12 players
2. **Algorithm Validation**: Ensure DoublesSchedulerService follows distribution table
3. **Edge Case Testing**: Test minimum (4) and maximum (12) player scenarios
4. **Validate Time Slots**: Ensure no conflicts with regular reservations  
5. **Monitor Performance**: Match generation should be fast for all player counts
6. **Error Handling**: Graceful failures in match algorithm

**Testing Examples**:
```bash
# Test 7 players (should generate 3 matches)
node test-doubles-scheduler.js

# Expected output: 3 matches, 5 players get 2 matches, 2 players get 1 match
```

### For Players
1. **Register Early**: Popular time slots fill quickly
2. **Check Schedule**: Review match assignments before event day
3. **Payment Ready**: Ensure membership fees and event fees paid
4. **Arrive Prepared**: Bring equipment and be ready for multiple matches

---

*This documentation covers the complete Open Play Court Process as implemented in the Tennis Club RT2 system. For technical support or feature requests, contact the development team.*