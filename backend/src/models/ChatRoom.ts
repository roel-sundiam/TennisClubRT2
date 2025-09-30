import mongoose, { Schema, Document } from 'mongoose';
import { ChatRoom as IChatRoom } from '../types';

export interface IChatRoomDocument extends Omit<IChatRoom, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const chatRoomSchema = new Schema<IChatRoomDocument>({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    minlength: [1, 'Room name must be at least 1 character long'],
    maxlength: [100, 'Room name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: [true, 'Room type is required'],
    enum: {
      values: ['general', 'admin', 'announcement'],
      message: 'Room type must be general, admin, or announcement'
    },
    default: 'general',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  participantRoles: {
    type: [String],
    enum: {
      values: ['member', 'admin', 'superadmin'],
      message: 'Participant role must be member, admin, or superadmin'
    },
    default: ['member', 'admin', 'superadmin']
  },
  createdBy: {
    type: String,
    required: [true, 'Creator is required'],
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

// Indexes for better query performance
chatRoomSchema.index({ type: 1, isActive: 1 });
chatRoomSchema.index({ createdAt: -1 });
chatRoomSchema.index({ participantRoles: 1, isActive: 1 });

// Static method to find rooms for user role
chatRoomSchema.statics.findRoomsForRole = function(userRole: string) {
  return this.find({
    isActive: true,
    participantRoles: { $in: [userRole] }
  }).sort({ type: 1, createdAt: 1 });
};

// Virtual for participant count (will be populated separately)
chatRoomSchema.virtual('participantCount', {
  ref: 'ChatParticipant',
  localField: '_id',
  foreignField: 'roomId',
  count: true,
  match: { isActive: true }
});

const ChatRoom = mongoose.model<IChatRoomDocument>('ChatRoom', chatRoomSchema);

export default ChatRoom;