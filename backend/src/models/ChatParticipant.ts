import mongoose, { Schema, Document } from 'mongoose';
import { ChatParticipant as IChatParticipant } from '../types';

export interface IChatParticipantDocument extends Omit<IChatParticipant, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const chatParticipantSchema = new Schema<IChatParticipantDocument>({
  roomId: {
    type: String,
    required: [true, 'Room ID is required'],
    index: true
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  joinedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastReadAt: {
    type: Date,
    default: null,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  notifications: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: {
      values: ['member', 'moderator', 'admin'],
      message: 'Participant role must be member, moderator, or admin'
    },
    default: 'member',
    index: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete (ret as any).__v;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Unique compound index to prevent duplicate participants
chatParticipantSchema.index({ roomId: 1, userId: 1 }, { unique: true });

// Indexes for better query performance
chatParticipantSchema.index({ roomId: 1, isActive: 1 });
chatParticipantSchema.index({ userId: 1, isActive: 1 });
chatParticipantSchema.index({ lastReadAt: 1 });

// Static method to join user to room
chatParticipantSchema.statics.joinRoom = async function(roomId: string, userId: string, role: string = 'member') {
  try {
    return await this.findOneAndUpdate(
      { roomId, userId },
      {
        $set: {
          isActive: true,
          joinedAt: new Date(),
          role: role
        },
        $setOnInsert: {
          notifications: true,
          lastReadAt: null
        }
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );
  } catch (error) {
    if ((error as any).code === 11000) {
      // User already in room, just activate
      return await this.findOneAndUpdate(
        { roomId, userId },
        {
          $set: {
            isActive: true,
            joinedAt: new Date()
          }
        },
        { new: true }
      );
    }
    throw error;
  }
};

// Static method to leave room
chatParticipantSchema.statics.leaveRoom = function(roomId: string, userId: string) {
  return this.findOneAndUpdate(
    { roomId, userId },
    {
      $set: {
        isActive: false
      }
    },
    { new: true }
  );
};

// Static method to update last read timestamp
chatParticipantSchema.statics.updateLastRead = function(roomId: string, userId: string) {
  return this.findOneAndUpdate(
    { roomId, userId, isActive: true },
    {
      $set: {
        lastReadAt: new Date()
      }
    },
    { new: true }
  );
};

// Static method to get participant with unread count
chatParticipantSchema.statics.getParticipantWithUnreadCount = async function(roomId: string, userId: string) {
  const participant = await this.findOne({
    roomId,
    userId,
    isActive: true
  });
  
  if (!participant) {
    return null;
  }
  
  // Import ChatMessage to avoid circular dependencies
  const ChatMessage = mongoose.models.ChatMessage || require('./ChatMessage').default;
  
  const unreadCount = await (ChatMessage as any).getUnreadCount(roomId, participant.lastReadAt);
  
  return {
    ...participant.toObject(),
    unreadCount
  };
};

// Static method to get all participants for a room
chatParticipantSchema.statics.getRoomParticipants = function(roomId: string, activeOnly: boolean = true) {
  const query: any = { roomId };
  if (activeOnly) {
    query.isActive = true;
  }
  
  return this.find(query)
    .populate('userId', 'username fullName profilePicture role isActive')
    .sort({ joinedAt: 1 });
};

// Virtual for calculating unread count (populated separately)
chatParticipantSchema.virtual('unreadCount').get(function(this: IChatParticipantDocument) {
  // This will be calculated and set by the service layer
  return (this as any)._unreadCount || 0;
});

const ChatParticipant = mongoose.model<IChatParticipantDocument>('ChatParticipant', chatParticipantSchema);

export default ChatParticipant;