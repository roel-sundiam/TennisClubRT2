import { Response } from 'express';
import ChatRoom from '../models/ChatRoom';
import ChatMessage from '../models/ChatMessage';
import ChatParticipant from '../models/ChatParticipant';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { webSocketService, ChatMessageEvent } from '../services/websocketService';
import { 
  CreateChatRoomRequest, 
  SendMessageRequest, 
  UpdateChatParticipantRequest,
  ChatRoomWithUnreadCount 
} from '../types';

// Get all chat rooms for current user
export const getChatRooms = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!._id;
  const userRole = req.user!.role;

  // Find rooms that user can access based on their role
  const rooms = await (ChatRoom as any).findRoomsForRole(userRole);
  
  // Get participant info and unread counts for each room
  const roomsWithInfo = await Promise.all(
    rooms.map(async (room: any) => {
      let participant = await (ChatParticipant as any).getParticipantWithUnreadCount(room._id, userId);
      
      // If user is not a participant but has access to the room, auto-join them
      if (!participant && room.participantRoles.includes(userRole)) {
        console.log(`🔄 Auto-joining user ${userId} to room ${room.name}`);
        try {
          await (ChatParticipant as any).joinRoom(room._id.toString(), userId, userRole === 'superadmin' || userRole === 'admin' ? 'admin' : 'member');
          participant = await (ChatParticipant as any).getParticipantWithUnreadCount(room._id, userId);
        } catch (error) {
          console.error(`❌ Failed to auto-join user ${userId} to room ${room.name}:`, error);
        }
      }
      
      const participantCount = await ChatParticipant.countDocuments({ 
        roomId: room._id, 
        isActive: true 
      });
      
      // Get last message for each room
      const lastMessage = await ChatMessage.findOne({
        roomId: room._id,
        isDeleted: false
      })
      .populate('userId', 'username fullName')
      .sort({ createdAt: -1 });

      return {
        ...room.toObject(),
        unreadCount: participant?.unreadCount || 0,
        participantCount,
        lastMessage: lastMessage || null,
        isParticipant: !!participant
      } as ChatRoomWithUnreadCount;
    })
  );

  res.json({
    success: true,
    data: roomsWithInfo
  });
});

// Get messages for a specific room
export const getRoomMessages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { roomId } = req.params;
  const { limit = 50, before } = req.query;
  const userId = req.user!._id;

  // Check if user is participant of this room
  const participant = await ChatParticipant.findOne({
    roomId,
    userId,
    isActive: true
  });

  if (!participant) {
    res.status(403).json({
      success: false,
      error: 'You are not a participant of this chat room'
    });
    return;
  }

  const beforeDate = before ? new Date(before as string) : undefined;
  const messages = await (ChatMessage as any).getRecentMessages(
    roomId, 
    parseInt(limit as string), 
    beforeDate
  );

  // Manually populate user data for each message
  const User = (await import('../models/User')).default;
  const populatedMessages = await Promise.all(
    messages.map(async (message: any) => {
      const user = await User.findById(message.userId).select('username fullName profilePicture role');
      const messageObj = message.toObject();
      
      messageObj.user = user ? {
        _id: user._id.toString(),
        username: user.username,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        role: user.role
      } : {
        _id: message.userId,
        username: 'Unknown',
        fullName: 'Unknown User',
        profilePicture: undefined,
        role: 'member'
      };
      
      return messageObj;
    })
  );

  res.json({
    success: true,
    data: populatedMessages.reverse() // Return chronological order
  });
});

// Send a message to a room
export const sendMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { roomId } = req.params;
  const { content, type = 'text', replyTo }: SendMessageRequest = req.body;
  const userId = req.user!._id;
  const userRole = req.user!.role;

  // Check if user is participant of this room
  const participant = await ChatParticipant.findOne({
    roomId,
    userId,
    isActive: true
  });

  if (!participant) {
    res.status(403).json({
      success: false,
      error: 'You are not a participant of this chat room'
    });
    return;
  }

  // Check if user can send announcement messages
  if (type === 'announcement' && !['admin', 'superadmin'].includes(userRole)) {
    res.status(403).json({
      success: false,
      error: 'Only admins can send announcement messages'
    });
    return;
  }

  // Validate reply message exists if replyTo is provided
  if (replyTo) {
    const replyMessage = await ChatMessage.findOne({
      _id: replyTo,
      roomId,
      isDeleted: false
    });

    if (!replyMessage) {
      res.status(400).json({
        success: false,
        error: 'Reply message not found or deleted'
      });
      return;
    }
  }

  // Create the message
  const message = new ChatMessage({
    roomId,
    userId,
    content,
    type,
    replyTo: replyTo || null
  });

  await message.save();

  // Manually populate user info since we're using String fields
  const user = await import('../models/User');
  const messageUser = await user.default.findById(message.userId).select('username fullName profilePicture role');

  // Emit WebSocket event for real-time updates
  const messageEvent: ChatMessageEvent = {
    type: 'new_message',
    data: {
      _id: message._id.toString(),
      roomId: message.roomId,
      userId: message.userId.toString(),
      user: messageUser ? {
        _id: messageUser._id.toString(),
        username: messageUser.username,
        fullName: messageUser.fullName,
        profilePicture: messageUser.profilePicture,
        role: messageUser.role
      } : {
        _id: message.userId,
        username: 'Unknown',
        fullName: 'Unknown User',
        profilePicture: undefined,
        role: 'member'
      },
      content: message.content,
      type: message.type,
      isEdited: message.isEdited,
      editedAt: message.editedAt?.toISOString(),
      isDeleted: message.isDeleted,
      deletedAt: message.deletedAt?.toISOString(),
      deletedBy: message.deletedBy,
      replyTo: message.replyTo,
      metadata: message.metadata,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString()
    },
    timestamp: new Date().toISOString(),
    message: `New message from ${messageUser?.fullName || 'Unknown User'}`
  };

  webSocketService.emitChatMessage(messageEvent);

  res.status(201).json({
    success: true,
    data: {
      ...message.toObject(),
      user: messageUser ? {
        _id: messageUser._id.toString(),
        username: messageUser.username,
        fullName: messageUser.fullName,
        profilePicture: messageUser.profilePicture,
        role: messageUser.role
      } : null
    }
  });
});

// Join a chat room
export const joinRoom = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { roomId } = req.params;
  const userId = req.user!._id;
  const userRole = req.user!.role;

  // Check if room exists and user can access it
  const room = await ChatRoom.findOne({
    _id: roomId,
    isActive: true,
    participantRoles: { $in: [userRole] }
  });

  if (!room) {
    res.status(404).json({
      success: false,
      error: 'Chat room not found or access denied'
    });
    return;
  }

  // Check if user is already a participant
  const existingParticipant = await ChatParticipant.findOne({
    roomId,
    userId,
    isActive: true
  });

  // Join the room
  const participant = await (ChatParticipant as any).joinRoom(roomId, userId);

  // Skip creating system join messages to keep chat cleaner
  // Users join automatically without announcement

  res.json({
    success: true,
    data: participant
  });
});

// Leave a chat room
export const leaveRoom = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { roomId } = req.params;
  const userId = req.user!._id;

  const participant = await (ChatParticipant as any).leaveRoom(roomId, userId);

  if (!participant) {
    res.status(404).json({
      success: false,
      error: 'You are not a participant of this room'
    });
    return;
  }

  // Skip creating system leave messages to keep chat cleaner

  res.json({
    success: true,
    data: participant
  });
});

// Update participant settings (mark as read, toggle notifications)
export const updateParticipant = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { roomId } = req.params;
  const { lastReadAt, notifications }: UpdateChatParticipantRequest = req.body;
  const userId = req.user!._id;

  const updateData: any = {};
  
  if (lastReadAt !== undefined) {
    updateData.lastReadAt = lastReadAt ? new Date(lastReadAt) : new Date();
  }
  
  if (notifications !== undefined) {
    updateData.notifications = notifications;
  }

  const participant = await ChatParticipant.findOneAndUpdate(
    { roomId, userId, isActive: true },
    { $set: updateData },
    { new: true }
  );

  if (!participant) {
    res.status(404).json({
      success: false,
      error: 'Participant not found'
    });
    return;
  }

  res.json({
    success: true,
    data: participant
  });
});

// Get room participants
export const getRoomParticipants = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { roomId } = req.params;
  const userId = req.user!._id;

  // Check if user is participant of this room
  const userParticipant = await ChatParticipant.findOne({
    roomId,
    userId,
    isActive: true
  });

  if (!userParticipant) {
    res.status(403).json({
      success: false,
      error: 'You are not a participant of this chat room'
    });
    return;
  }

  const participants = await (ChatParticipant as any).getRoomParticipants(roomId, true);

  res.json({
    success: true,
    data: participants
  });
});

// Create new chat room (admin only)
export const createChatRoom = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name, description, type, participantRoles }: CreateChatRoomRequest = req.body;
  const userId = req.user!._id;
  const userRole = req.user!.role;

  // Only admins can create rooms
  if (!['admin', 'superadmin'].includes(userRole)) {
    res.status(403).json({
      success: false,
      error: 'Only admins can create chat rooms'
    });
    return;
  }

  const room = new ChatRoom({
    name,
    description,
    type,
    participantRoles: participantRoles || ['member', 'admin', 'superadmin'],
    createdBy: userId
  });

  await room.save();

  // Automatically join the creator
  await (ChatParticipant as any).joinRoom(room._id, userId, 'admin');

  // Create system message for room creation
  const systemMessage = new ChatMessage({
    roomId: room._id,
    userId,
    content: `${req.user!.fullName} created this chat room`,
    type: 'system',
    metadata: {
      systemType: 'room_created'
    }
  });

  await systemMessage.save();

  res.status(201).json({
    success: true,
    data: room
  });
});

// Delete/Edit message (admin or message author)
export const updateMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { messageId } = req.params;
  const { content, isDeleted } = req.body;
  const userId = req.user!._id;
  const userRole = req.user!.role;

  const message = await ChatMessage.findById(messageId);

  if (!message) {
    res.status(404).json({
      success: false,
      error: 'Message not found'
    });
    return;
  }

  // Check permission: message author or admin
  const isAuthor = message.userId.toString() === userId.toString();
  const isAdmin = ['admin', 'superadmin'].includes(userRole);

  if (!isAuthor && !isAdmin) {
    res.status(403).json({
      success: false,
      error: 'You can only edit your own messages or admin messages'
    });
    return;
  }

  const updateData: any = {};

  if (content !== undefined && !message.isDeleted) {
    updateData.content = content;
  }

  if (isDeleted !== undefined && (isAuthor || isAdmin)) {
    updateData.isDeleted = isDeleted;
    if (isDeleted) {
      updateData.deletedAt = new Date();
      updateData.deletedBy = userId;
    }
  }

  const updatedMessage = await ChatMessage.findByIdAndUpdate(
    messageId,
    { $set: updateData },
    { new: true }
  ).populate('userId', 'username fullName profilePicture role');

  res.json({
    success: true,
    data: updatedMessage
  });
});