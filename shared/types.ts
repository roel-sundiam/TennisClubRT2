// Shared types between frontend and backend

// Analytics interfaces - used by both frontend and backend
export interface AnalyticsPageView {
  userId?: string;
  sessionId: string;
  page: string;
  path: string;
  referrer?: string;
  duration?: number;
}

export interface AnalyticsUserActivity {
  userId: string;
  sessionId: string;
  action: string;
  component: string;
  details?: any;
}

export interface AnalyticsStats {
  pageViews: {
    totalViews: number;
    uniqueUsers: number;
    uniqueSessions: number;
    avgDuration: number;
  };
  popularPages: Array<{
    page: string;
    views: number;
    uniqueUsers: number;
    avgDuration: number;
    lastVisit: Date;
  }>;
  userActivity: Array<{
    action: string;
    count: number;
    uniqueUsers: number;
  }>;
  partnerClickStats: Array<{
    partnerName: string;
    partnerType: string;
    partnerUrl: string;
    clicks: number;
    uniqueUsers: number;
  }>;
  engagement: {
    totalSessions: number;
    avgDuration: number;
    avgPageViews: number;
    avgActions: number;
    bounceRate: number;
  };
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  dateRange: {
    from: Date;
    to: Date;
  };
}

// Basic User interface - used by frontend
export interface User {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'member' | 'admin' | 'superadmin';
  coinBalance: number;
  seedPoints?: number;
  matchesWon?: number;
  matchesPlayed?: number;
}