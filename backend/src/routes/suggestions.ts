import express, { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import Suggestion from '../models/Suggestion';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { CreateSuggestionRequest, AdminResponseRequest, InternalNoteRequest } from '../types';

const router = express.Router();

// Validation rules
const createSuggestionValidation = [
  body('type')
    .isIn(['suggestion', 'complaint'])
    .withMessage('Type must be either suggestion or complaint'),
  body('category')
    .isIn(['facility', 'service', 'booking', 'payments', 'general', 'staff', 'maintenance'])
    .withMessage('Invalid category'),
  body('title')
    .isString()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags && tags.length > 10) {
        throw new Error('Cannot have more than 10 tags');
      }
      if (tags && tags.some((tag: string) => tag.length > 30)) {
        throw new Error('Each tag must be 30 characters or less');
      }
      return true;
    })
];

const adminResponseValidation = [
  body('response')
    .isString()
    .trim()
    .isLength({ min: 5, max: 2000 })
    .withMessage('Response must be between 5 and 2000 characters'),
  body('actionTaken')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Action taken cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['in_review', 'in_progress', 'resolved', 'closed'])
    .withMessage('Invalid status')
];

const internalNoteValidation = [
  body('note')
    .isString()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Note must be between 5 and 1000 characters')
];

// Create a new suggestion or complaint
router.post('/', createSuggestionValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const suggestionData: CreateSuggestionRequest = req.body;

  // Auto-escalate complaints to higher priority
  let priority = suggestionData.priority || 'medium';
  if (suggestionData.type === 'complaint') {
    if (priority === 'low') priority = 'medium';
    if (['staff', 'facility', 'maintenance'].includes(suggestionData.category) && priority === 'medium') {
      priority = 'high';
    }
  }

  try {
    const suggestion = await Suggestion.create({
      userId: req.user._id,
      type: suggestionData.type,
      category: suggestionData.category,
      priority,
      title: suggestionData.title,
      description: suggestionData.description,
      isAnonymous: suggestionData.isAnonymous || false,
      tags: suggestionData.tags || [],
      status: 'open'
    });

    // Populate user data for response (unless anonymous)
    const populatedSuggestion = await Suggestion.findById(suggestion._id)
      .populate('userId', 'fullName username')
      .exec();

    console.log(`📝 ${suggestionData.type} created: ${suggestionData.title} by ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: `${suggestionData.type === 'complaint' ? 'Complaint' : 'Suggestion'} submitted successfully`,
      data: populatedSuggestion
    });
  } catch (error) {
    console.error('Error creating suggestion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create suggestion'
    });
  }
}));

// Get suggestions/complaints (members see their own, admins see all)
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      status,
      priority,
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query based on user role
    let query: any = {};

    // Members can only see their own suggestions
    if (req.user.role === 'member') {
      query.userId = req.user._id;
    }

    // Apply filters
    if (type && (type === 'suggestion' || type === 'complaint')) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get suggestions with pagination
    const suggestions = await Suggestion.find(query)
      .populate('userId', 'fullName username')
      .populate('adminResponse.responderId', 'fullName username')
      .populate('internalNotes.adminId', 'fullName username')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .exec();

    const totalCount = await Suggestion.countDocuments(query);

    // Filter out user data for anonymous suggestions (except for admins)
    const filteredSuggestions = suggestions.map(suggestion => {
      const suggestionObj = suggestion.toObject();
      if (suggestion.isAnonymous && req.user!.role === 'member') {
        suggestionObj.userId = undefined as any;
        suggestionObj.user = undefined as any;
      }
      return suggestionObj;
    });

    res.json({
      success: true,
      data: filteredSuggestions,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suggestions'
    });
  }
}));

// Get statistics (admin only)
router.get('/stats', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  try {
    const [generalStats, categoryStats] = await Promise.all([
      Suggestion.getStatistics(),
      Suggestion.getCategoryStats()
    ]);

    res.json({
      success: true,
      data: {
        general: generalStats[0] || {},
        categories: categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching suggestion stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
}));

// Get a single suggestion by ID
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const suggestion = await Suggestion.findById(req.params.id)
      .populate('userId', 'fullName username')
      .populate('adminResponse.responderId', 'fullName username')
      .populate('internalNotes.adminId', 'fullName username')
      .exec();

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: 'Suggestion not found'
      });
    }

    // Check permissions
    const isOwner = suggestion.userId.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Filter out user data for anonymous suggestions (for non-admins)
    let suggestionData = suggestion.toObject();
    if (suggestion.isAnonymous && !isAdmin) {
      suggestionData.userId = undefined as any;
      suggestionData.user = undefined as any;
    }

    res.json({
      success: true,
      data: suggestionData
    });
  } catch (error) {
    console.error('Error fetching suggestion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suggestion'
    });
  }
}));

// Update suggestion status (admin only)
router.patch('/:id/status', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  const { status } = req.body;

  if (!['in_review', 'in_progress', 'resolved', 'closed'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status'
    });
  }

  try {
    const suggestion = await Suggestion.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('userId', 'fullName username');

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: 'Suggestion not found'
      });
    }

    console.log(`📝 Suggestion status updated to ${status} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: suggestion
    });
  } catch (error) {
    console.error('Error updating suggestion status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    });
  }
}));

// Add admin response (admin only)
router.post('/:id/response', adminResponseValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  const responseData: AdminResponseRequest = req.body;

  try {
    const updateData: any = {
      adminResponse: {
        responderId: req.user._id,
        response: responseData.response,
        responseDate: new Date(),
        actionTaken: responseData.actionTaken
      },
      updatedAt: new Date()
    };

    if (responseData.status) {
      updateData.status = responseData.status;
    }

    const suggestion = await Suggestion.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('userId', 'fullName username')
      .populate('adminResponse.responderId', 'fullName username');

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: 'Suggestion not found'
      });
    }

    console.log(`📝 Admin response added to suggestion ${req.params.id} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Response added successfully',
      data: suggestion
    });
  } catch (error) {
    console.error('Error adding admin response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add response'
    });
  }
}));

// Add internal note (admin only)
router.post('/:id/notes', internalNoteValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  const noteData: InternalNoteRequest = req.body;

  try {
    const suggestion = await Suggestion.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          internalNotes: {
            adminId: req.user._id,
            note: noteData.note,
            timestamp: new Date()
          }
        },
        updatedAt: new Date()
      },
      { new: true }
    )
      .populate('userId', 'fullName username')
      .populate('internalNotes.adminId', 'fullName username');

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: 'Suggestion not found'
      });
    }

    console.log(`📝 Internal note added to suggestion ${req.params.id} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Note added successfully',
      data: suggestion
    });
  } catch (error) {
    console.error('Error adding internal note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add note'
    });
  }
}));

// Delete suggestion (owner or admin only)
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const suggestion = await Suggestion.findById(req.params.id);

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: 'Suggestion not found'
      });
    }

    // Check permissions - owner can delete if status is 'open', admins can always delete
    const isOwner = suggestion.userId.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    if (!isAdmin && (!isOwner || suggestion.status !== 'open')) {
      return res.status(403).json({
        success: false,
        error: 'Can only delete your own open suggestions'
      });
    }

    await Suggestion.findByIdAndDelete(req.params.id);

    console.log(`📝 Suggestion deleted: ${req.params.id} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Suggestion deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete suggestion'
    });
  }
}));

export default router;