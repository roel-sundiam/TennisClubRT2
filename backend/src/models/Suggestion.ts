import mongoose, { Schema, Document, Model } from 'mongoose';
import { Suggestion as ISuggestion } from '../types';

export interface ISuggestionDocument extends Omit<ISuggestion, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

interface ISuggestionModel extends Model<ISuggestionDocument> {
  getStatistics(): Promise<any[]>;
  getCategoryStats(): Promise<any[]>;
}

const suggestionSchema = new Schema<ISuggestionDocument>({
  userId: {
    type: String,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: {
      values: ['suggestion', 'complaint'],
      message: 'Type must be either suggestion or complaint'
    },
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['facility', 'service', 'booking', 'payments', 'general', 'staff', 'maintenance'],
      message: 'Invalid category'
    },
    index: true
  },
  priority: {
    type: String,
    required: true,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be low, medium, high, or urgent'
    },
    default: 'medium',
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ['open', 'in_review', 'in_progress', 'resolved', 'closed'],
      message: 'Invalid status'
    },
    default: 'open',
    index: true
  },
  isAnonymous: {
    type: Boolean,
    default: false,
    index: true
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true,
      max: [5000000, 'File size cannot exceed 5MB']
    }
  }],
  adminResponse: {
    responderId: {
      type: String,
      ref: 'User'
    },
    response: {
      type: String,
      trim: true,
      maxlength: [2000, 'Response cannot exceed 2000 characters']
    },
    responseDate: {
      type: Date
    },
    actionTaken: {
      type: String,
      trim: true,
      maxlength: [500, 'Action taken cannot exceed 500 characters']
    }
  },
  internalNotes: [{
    adminId: {
      type: String,
      ref: 'User',
      required: true
    },
    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Note cannot exceed 1000 characters']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  resolutionDate: {
    type: Date,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
suggestionSchema.index({ createdAt: -1 });
suggestionSchema.index({ type: 1, status: 1 });
suggestionSchema.index({ priority: -1, createdAt: -1 });
suggestionSchema.index({ category: 1, status: 1 });
suggestionSchema.index({ userId: 1, createdAt: -1 });

// Virtual to populate user information
suggestionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate admin response user
suggestionSchema.virtual('adminResponse.responder', {
  ref: 'User',
  localField: 'adminResponse.responderId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate internal notes admin users
suggestionSchema.virtual('internalNotes.admin', {
  ref: 'User',
  localField: 'internalNotes.adminId',
  foreignField: '_id'
});

// Pre-save middleware to set resolution date when status changes to resolved/closed
suggestionSchema.pre('save', function(next) {
  const suggestion = this as ISuggestionDocument;
  if (suggestion.isModified('status')) {
    if (suggestion.status === 'resolved' || suggestion.status === 'closed') {
      if (!suggestion.resolutionDate) {
        suggestion.resolutionDate = new Date();
      }
    }
  }
  next();
});

// Static method to get statistics
suggestionSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalSuggestions: { $sum: 1 },
        openCount: {
          $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
        },
        inReviewCount: {
          $sum: { $cond: [{ $eq: ['$status', 'in_review'] }, 1, 0] }
        },
        inProgressCount: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        resolvedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        closedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
        },
        suggestionCount: {
          $sum: { $cond: [{ $eq: ['$type', 'suggestion'] }, 1, 0] }
        },
        complaintCount: {
          $sum: { $cond: [{ $eq: ['$type', 'complaint'] }, 1, 0] }
        },
        urgentCount: {
          $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
        },
        highPriorityCount: {
          $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Static method to get category breakdown
suggestionSchema.statics.getCategoryStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        openCount: {
          $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
        },
        resolvedCount: {
          $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

const Suggestion = mongoose.model<ISuggestionDocument, ISuggestionModel>('Suggestion', suggestionSchema);
export default Suggestion;