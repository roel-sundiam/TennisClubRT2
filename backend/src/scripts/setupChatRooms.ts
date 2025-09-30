import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';
import ChatRoom from '../models/ChatRoom';
import ChatParticipant from '../models/ChatParticipant';
import User from '../models/User';

dotenv.config();

async function setupChatRooms() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDatabase();
    console.log('✅ MongoDB connected successfully');

    // Find or create a superadmin user to be the creator
    let superAdmin = await User.findOne({ role: 'superadmin' });
    
    if (!superAdmin) {
      console.log('⚠️  No superadmin found. Please run "npm run create-superadmin" first.');
      process.exit(1);
    }

    console.log('👤 Using superadmin:', superAdmin.username);

    // Create default chat rooms if they don't exist
    const defaultRooms = [
      {
        name: 'General Chat',
        description: 'Main chat room for all club members',
        type: 'general' as const,
        participantRoles: ['member', 'admin', 'superadmin']
      }
    ];

    for (const roomData of defaultRooms) {
      // Check if room already exists
      const existingRoom = await ChatRoom.findOne({ 
        name: roomData.name,
        type: roomData.type 
      });

      if (existingRoom) {
        console.log(`💬 Chat room "${roomData.name}" already exists`);
        continue;
      }

      // Create new room
      const room = new ChatRoom({
        ...roomData,
        createdBy: superAdmin._id
      });

      await room.save();
      console.log(`✅ Created chat room: "${roomData.name}"`);

      // Add superadmin as participant
      try {
        await (ChatParticipant as any).joinRoom(room._id.toString(), superAdmin._id.toString(), 'admin');
        console.log(`👤 Added ${superAdmin.username} as participant to "${roomData.name}"`);
      } catch (error) {
        console.log(`⚠️  Could not add superadmin as participant to "${roomData.name}":`, error);
      }
    }

    // Auto-join all existing approved users to General Chat
    const generalChatRoom = await ChatRoom.findOne({ 
      name: 'General Chat', 
      type: 'general' 
    });

    if (generalChatRoom) {
      console.log('👥 Adding all approved members to General Chat...');
      
      const approvedUsers = await User.find({
        isApproved: true,
        isActive: true
      });

      let joinedCount = 0;
      for (const user of approvedUsers) {
        try {
          await (ChatParticipant as any).joinRoom(
            generalChatRoom._id.toString(), 
            user._id.toString(), 
            user.role === 'superadmin' || user.role === 'admin' ? 'admin' : 'member'
          );
          joinedCount++;
        } catch (error) {
          // User might already be a participant, which is fine
          console.log(`⚠️  Could not add ${user.username} to General Chat (might already be a member)`);
        }
      }

      console.log(`✅ Added ${joinedCount} users to General Chat`);
    }

    console.log('🎉 Chat rooms setup completed successfully!');
    console.log('\n📋 Summary:');
    
    const rooms = await ChatRoom.find({ isActive: true }).sort({ type: 1, name: 1 });
    for (const room of rooms) {
      const participantCount = await ChatParticipant.countDocuments({ 
        roomId: room._id, 
        isActive: true 
      });
      console.log(`   💬 ${room.name} (${room.type}) - ${participantCount} participants`);
    }

  } catch (error) {
    console.error('❌ Error setting up chat rooms:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the setup
setupChatRooms();