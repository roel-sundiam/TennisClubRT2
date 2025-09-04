const mongoose = require('mongoose');
require('dotenv').config();

async function findInfo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔍 Searching for September 7 Open Play and Catereena...');
    
    const Poll = require('./src/models/Poll').default;
    const User = require('./src/models/User').default;
    
    // Find Catereena Canlas
    const catereena = await User.findOne({
      $or: [
        { fullName: { $regex: 'catereena.*canlas', $options: 'i' } },
        { username: { $regex: 'catereena', $options: 'i' } }
      ]
    }).select('_id username fullName');
    
    if (!catereena) {
      console.log('❌ Catereena Canlas not found. Searching similar names:');
      const similarUsers = await User.find({
        $or: [
          { fullName: { $regex: 'cater|canlas', $options: 'i' } },
          { username: { $regex: 'cater', $options: 'i' } }
        ]
      }).select('_id username fullName');
      
      console.log('Similar users found:');
      similarUsers.forEach(user => {
        console.log('- ' + (user.fullName || user.username) + ' (ID: ' + user._id + ')');
      });
    } else {
      console.log('✅ Found Catereena: ' + (catereena.fullName || catereena.username) + ' (ID: ' + catereena._id + ')');
    }
    
    // Find September 7 Open Play
    const polls = await Poll.find({
      'metadata.category': 'open_play'
    }).select('_id title openPlayEvent.eventDate openPlayEvent.confirmedPlayers openPlayEvent.matches').sort({ 'openPlayEvent.eventDate': -1 });
    
    console.log('\n📅 Recent Open Play events:');
    for (const poll of polls.slice(0, 5)) {
      console.log('');
      console.log('ID: ' + poll._id);
      console.log('Title: ' + poll.title);
      console.log('Date: ' + poll.openPlayEvent?.eventDate);
      console.log('Confirmed Players: ' + (poll.openPlayEvent?.confirmedPlayers?.length || 0));
      console.log('Total Matches: ' + (poll.openPlayEvent?.matches?.length || 0));
      
      if (poll.openPlayEvent?.matches) {
        console.log('Match Status:');
        poll.openPlayEvent.matches.forEach((match, index) => {
          console.log('  Match ' + match.matchNumber + ': ' + match.status);
        });
      }
      
      if (catereena && poll.openPlayEvent?.confirmedPlayers?.includes(catereena._id.toString())) {
        console.log('🎯 Catereena IS in this event!');
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findInfo();