import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getChatRooms,
  getRoomMessages,
  sendMessage,
  joinRoom,
  leaveRoom,
  updateParticipant,
  getRoomParticipants,
  createChatRoom,
  updateMessage
} from '../controllers/chatController';
import { authenticateToken, requireApprovedUser } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireApprovedUser);

// Validation schemas
const roomIdValidation = [
  param('roomId')
    .isMongoId()
    .withMessage('Invalid room ID format')
];

const messageIdValidation = [
  param('messageId')
    .isMongoId()
    .withMessage('Invalid message ID format')
];

const createRoomValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Room name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('type')
    .isIn(['general', 'admin', 'announcement'])
    .withMessage('Room type must be general, admin, or announcement'),
  body('participantRoles')
    .optional()
    .isArray()
    .withMessage('Participant roles must be an array'),
  body('participantRoles.*')
    .optional()
    .isIn(['member', 'admin', 'superadmin'])
    .withMessage('Each participant role must be member, admin, or superadmin')
];

const sendMessageValidation = [
  ...roomIdValidation,
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  body('type')
    .optional()
    .isIn(['text', 'announcement'])
    .withMessage('Message type must be text or announcement'),
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid reply message ID format')
];

const updateParticipantValidation = [
  ...roomIdValidation,
  body('lastReadAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for lastReadAt'),
  body('notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications must be a boolean value')
];

const updateMessageValidation = [
  ...messageIdValidation,
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  body('isDeleted')
    .optional()
    .isBoolean()
    .withMessage('isDeleted must be a boolean value')
];

const getMessagesValidation = [
  ...roomIdValidation,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('before')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for before parameter')
];

// Routes

// Get all chat rooms for current user
router.get('/', getChatRooms);

// Create new chat room (admin only)
router.post('/', createRoomValidation, validateRequest, createChatRoom);

// Get messages for a specific room
router.get(
  '/:roomId/messages',
  getMessagesValidation,
  validateRequest,
  getRoomMessages
);

// Send message to a room
router.post(
  '/:roomId/messages',
  sendMessageValidation,
  validateRequest,
  sendMessage
);

// Join a chat room
router.post(
  '/:roomId/join',
  roomIdValidation,
  validateRequest,
  joinRoom
);

// Leave a chat room
router.post(
  '/:roomId/leave',
  roomIdValidation,
  validateRequest,
  leaveRoom
);

// Update participant settings (mark as read, toggle notifications)
router.patch(
  '/:roomId/participant',
  updateParticipantValidation,
  validateRequest,
  updateParticipant
);

// Get room participants
router.get(
  '/:roomId/participants',
  roomIdValidation,
  validateRequest,
  getRoomParticipants
);

// Update/delete message
router.patch(
  '/messages/:messageId',
  updateMessageValidation,
  validateRequest,
  updateMessage
);

export default router;