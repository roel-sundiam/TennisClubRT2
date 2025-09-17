import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPageView extends Document {
  userId?: string;
  sessionId: string;
  page: string;
  path: string;
  referrer?: string;
  userAgent: string;
  ipAddress: string;
  timestamp: Date;
  duration?: number; // Time spent on page in milliseconds
  deviceType: 'desktop' | 'tablet' | 'mobile';
  browser: string;
  os: string;
}

export interface IUserActivity extends Document {
  userId: string;
  sessionId: string;
  action: string;
  component: string;
  details?: any;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

export interface ISessionInfo extends Document {
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  actions: number;
  ipAddress: string;
  userAgent: string;
  deviceInfo: {
    type: 'desktop' | 'tablet' | 'mobile';
    browser: string;
    os: string;
  };
}

// Page View Schema
const pageViewSchema = new Schema<IPageView>({
  userId: {
    type: String,
    ref: 'User',
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  page: {
    type: String,
    required: true,
    index: true
  },
  path: {
    type: String,
    required: true,
    index: true
  },
  referrer: {
    type: String
  },
  userAgent: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  duration: {
    type: Number // Duration in milliseconds
  },
  deviceType: {
    type: String,
    enum: ['desktop', 'tablet', 'mobile'],
    required: true,
    index: true
  },
  browser: {
    type: String,
    required: true,
    index: true
  },
  os: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// User Activity Schema
const userActivitySchema = new Schema<IUserActivity>({
  userId: {
    type: String,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true,
    enum: [
      'login',
      'logout',
      'register',
      'book_court',
      'cancel_reservation',
      'make_payment',
      'view_schedule',
      'update_profile',
      'submit_suggestion',
      'vote_poll',
      'request_coins',
      'search',
      'filter',
      'download',
      'export',
      'click_button',
      'form_submit',
      'navigation',
      'partner_click'
    ]
  },
  component: {
    type: String,
    required: true,
    index: true
  },
  details: {
    type: Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Session Info Schema
const sessionInfoSchema = new Schema<ISessionInfo>({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    ref: 'User',
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    index: true
  },
  duration: {
    type: Number // Duration in milliseconds
  },
  pageViews: {
    type: Number,
    default: 0
  },
  actions: {
    type: Number,
    default: 0
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  deviceInfo: {
    type: {
      type: String,
      enum: ['desktop', 'tablet', 'mobile'],
      required: true
    },
    browser: {
      type: String,
      required: true
    },
    os: {
      type: String,
      required: true
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
pageViewSchema.index({ timestamp: -1, userId: 1 });
pageViewSchema.index({ page: 1, timestamp: -1 });
pageViewSchema.index({ sessionId: 1, timestamp: -1 });

userActivitySchema.index({ timestamp: -1, userId: 1 });
userActivitySchema.index({ action: 1, timestamp: -1 });
userActivitySchema.index({ component: 1, timestamp: -1 });

sessionInfoSchema.index({ startTime: -1, userId: 1 });
sessionInfoSchema.index({ duration: -1 });

// Static methods for analytics
pageViewSchema.statics.getPopularPages = function(limit: number = 10, dateFrom?: Date, dateTo?: Date) {
  const matchConditions: any = {};
  if (dateFrom || dateTo) {
    matchConditions.timestamp = {};
    if (dateFrom) matchConditions.timestamp.$gte = dateFrom;
    if (dateTo) matchConditions.timestamp.$lte = dateTo;
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$page',
        views: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        avgDuration: { $avg: '$duration' },
        lastVisit: { $max: '$timestamp' }
      }
    },
    {
      $project: {
        page: '$_id',
        views: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        avgDuration: { $round: ['$avgDuration', 0] },
        lastVisit: 1,
        _id: 0
      }
    },
    { $sort: { views: -1 } },
    { $limit: limit }
  ]);
};

pageViewSchema.statics.getPageViewStats = function(dateFrom?: Date, dateTo?: Date) {
  const matchConditions: any = {};
  if (dateFrom || dateTo) {
    matchConditions.timestamp = {};
    if (dateFrom) matchConditions.timestamp.$gte = dateFrom;
    if (dateTo) matchConditions.timestamp.$lte = dateTo;
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalViews: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueSessions: { $addToSet: '$sessionId' },
        avgDuration: { $avg: '$duration' },
        deviceBreakdown: {
          $push: '$deviceType'
        },
        browserBreakdown: {
          $push: '$browser'
        }
      }
    },
    {
      $project: {
        totalViews: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        uniqueSessions: { $size: '$uniqueSessions' },
        avgDuration: { $round: ['$avgDuration', 0] },
        _id: 0
      }
    }
  ]);
};

userActivitySchema.statics.getActivityStats = function(dateFrom?: Date, dateTo?: Date) {
  const matchConditions: any = {};
  if (dateFrom || dateTo) {
    matchConditions.timestamp = {};
    if (dateFrom) matchConditions.timestamp.$gte = dateFrom;
    if (dateTo) matchConditions.timestamp.$lte = dateTo;
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        action: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        _id: 0
      }
    },
    { $sort: { count: -1 } }
  ]);
};

sessionInfoSchema.statics.getEngagementStats = function(dateFrom?: Date, dateTo?: Date) {
  const matchConditions: any = {};
  if (dateFrom || dateTo) {
    matchConditions.startTime = {};
    if (dateFrom) matchConditions.startTime.$gte = dateFrom;
    if (dateTo) matchConditions.startTime.$lte = dateTo;
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        avgPageViews: { $avg: '$pageViews' },
        avgActions: { $avg: '$actions' },
        bounceRate: {
          $avg: { $cond: [{ $eq: ['$pageViews', 1] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        totalSessions: 1,
        avgDuration: { $round: ['$avgDuration', 0] },
        avgPageViews: { $round: ['$avgPageViews', 2] },
        avgActions: { $round: ['$avgActions', 2] },
        bounceRate: { $round: [{ $multiply: ['$bounceRate', 100] }, 1] },
        _id: 0
      }
    }
  ]);
};

export const PageView = mongoose.model<IPageView>('PageView', pageViewSchema);
export const UserActivity = mongoose.model<IUserActivity>('UserActivity', userActivitySchema);
export const SessionInfo = mongoose.model<ISessionInfo>('SessionInfo', sessionInfoSchema);