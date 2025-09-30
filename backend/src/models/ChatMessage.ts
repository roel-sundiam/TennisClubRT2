import mongoose, { Schema, Document } from 'mongoose';
import { ChatMessage as IChatMessage } from '../types';

export interface IChatMessageDocument extends Omit<IChatMessage, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const chatMessageSchema = new Schema<IChatMessageDocument>({
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
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    minlength: [1, 'Message content must be at least 1 character long'],
    maxlength: [2000, 'Message content cannot exceed 2000 characters']
  },
  type: {
    type: String,
    required: [true, 'Message type is required'],
    enum: {
      values: ['text', 'system', 'announcement'],
      message: 'Message type must be text, system, or announcement'
    },
    default: 'text',
    index: true
  },
  isEdited: {
    type: Boolean,
    default: false,
    index: true
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: String,
    default: null
  },
  replyTo: {
    type: String,
    default: null,
    index: true
  },
  attachments: [{
    filename: {
      type: String,
      required: true,
      trim: true
    },
    path: {
      type: String,
      required: true,
      trim: true
    },
    mimetype: {
      type: String,
      required: true,
      trim: true
    },
    size: {
      type: Number,
      required: true,
      min: [0, 'File size cannot be negative'],
      max: [10 * 1024 * 1024, 'File size cannot exceed 10MB'] // 10MB limit
    }
  }],
  metadata: {
    systemType: {
      type: String,
      enum: {
        values: ['user_joined', 'user_left', 'room_created'],
        message: 'System type must be user_joined, user_left, or room_created'
      }
    },
    mentions: [{
      type: String
    }]
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

// Compound indexes for better query performance
chatMessageSchema.index({ roomId: 1, createdAt: -1 }); // For message history
chatMessageSchema.index({ roomId: 1, isDeleted: 1, createdAt: -1 }); // For active messages
chatMessageSchema.index({ userId: 1, createdAt: -1 }); // For user message history
chatMessageSchema.index({ replyTo: 1 }); // For threaded conversations
chatMessageSchema.index({ 'metadata.mentions': 1, createdAt: -1 }); // For mention notifications

// Pre-save middleware to handle message validation
chatMessageSchema.pre('save', async function(next) {
  const message = this as IChatMessageDocument;

  // Auto-detect mentions in content
  if (message.type === 'text' && message.content) {
    const mentionPattern = /@([a-zA-Z0-9_]+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionPattern.exec(message.content)) !== null) {
      mentions.push(match[1]);
    }
    
    if (mentions.length > 0) {
      try {
        // Import User model to avoid circular dependencies
        const User = mongoose.models.User || require('./User').default;
        const mentionedUsers = await (User as any).find({
          username: { $in: mentions },
          isActive: true,
          isApproved: true
        }).select('_id');
        
        if (!message.metadata) {
          message.metadata = {};
        }
        message.metadata.mentions = mentionedUsers.map((user: any) => user._id);
      } catch (error) {
        console.error('Error processing mentions:', error);
      }
    }
  }

  // Set editedAt if message is being edited
  if (!message.isNew && message.isModified('content')) {
    message.isEdited = true;
    message.editedAt = new Date();
  }

  next();
});

// Static method to get recent messages for a room
chatMessageSchema.statics.getRecentMessages = async function(roomId: string, limit: number = 50, before?: Date) {
  const query: any = {
    roomId: roomId,
    isDeleted: false
  };
  
  if (before) {
    query.createdAt = { $lt: before };
  }
  
  // Just return the raw messages for now - user population will be handled at controller level
  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get unread count for user
chatMessageSchema.statics.getUnreadCount = function(roomId: string, lastReadAt?: Date) {
  if (!lastReadAt) {
    return this.countDocuments({
      roomId: roomId,
      isDeleted: false
    });
  }
  
  return this.countDocuments({
    roomId: roomId,
    isDeleted: false,
    createdAt: { $gt: lastReadAt }
  });
};

const ChatMessage = mongoose.model<IChatMessageDocument>('ChatMessage', chatMessageSchema);

export default ChatMessage;