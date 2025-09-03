import mongoose, { Schema, Document } from 'mongoose';

export interface ICoinTransactionDocument extends Document {
  userId: string;
  type: 'earned' | 'spent' | 'purchased' | 'refunded' | 'bonus' | 'penalty';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId?: string; // Payment ID, Reservation ID, etc.
  referenceType?: 'payment' | 'reservation' | 'purchase' | 'bonus' | 'admin_adjustment' | 'page_visit';
  metadata?: {
    source?: string;
    reason?: string;
    adminUserId?: string;
    originalAmount?: number;
    conversionRate?: number;
  };
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoinTransactionModel extends mongoose.Model<ICoinTransactionDocument> {
  createTransaction(
    userId: string,
    type: 'earned' | 'spent' | 'purchased' | 'refunded' | 'bonus' | 'penalty',
    amount: number,
    description: string,
    options?: {
      referenceId?: string;
      referenceType?: 'payment' | 'reservation' | 'purchase' | 'bonus' | 'admin_adjustment' | 'page_visit';
      metadata?: any;
    }
  ): Promise<ICoinTransactionDocument>;
  
  reverseTransaction(
    transactionId: string,
    reason: string,
    adminUserId: string
  ): Promise<ICoinTransactionDocument>;
}

const coinTransactionSchema = new Schema<ICoinTransactionDocument>({
  userId: {
    type: String,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  type: {
    type: String,
    enum: {
      values: ['earned', 'spent', 'purchased', 'refunded', 'bonus', 'penalty'],
      message: 'Type must be earned, spent, purchased, refunded, bonus, or penalty'
    },
    required: [true, 'Transaction type is required'],
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    validate: {
      validator: function(v: number) {
        return v !== 0;
      },
      message: 'Amount cannot be zero'
    }
  },
  balanceBefore: {
    type: Number,
    required: [true, 'Balance before is required'],
    min: [0, 'Balance cannot be negative']
  },
  balanceAfter: {
    type: Number,
    required: [true, 'Balance after is required'],
    min: [0, 'Balance cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  referenceId: {
    type: String,
    sparse: true,
    index: true
  },
  referenceType: {
    type: String,
    enum: {
      values: ['payment', 'reservation', 'purchase', 'bonus', 'admin_adjustment', 'page_visit'],
      message: 'Reference type must be payment, reservation, purchase, bonus, admin_adjustment, or page_visit'
    },
    sparse: true
  },
  metadata: {
    source: { type: String },
    reason: { type: String },
    adminUserId: { type: String, ref: 'User' },
    originalAmount: { type: Number },
    conversionRate: { type: Number }
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'completed', 'failed', 'reversed'],
      message: 'Status must be pending, completed, failed, or reversed'
    },
    default: 'completed',
    index: true
  },
  processedAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
coinTransactionSchema.index({ userId: 1, createdAt: -1 });
coinTransactionSchema.index({ userId: 1, type: 1 });
coinTransactionSchema.index({ status: 1, createdAt: -1 });
coinTransactionSchema.index({ referenceId: 1, referenceType: 1 });

// Pre-save middleware
coinTransactionSchema.pre('save', function(next) {
  const transaction = this;
  
  // Set processedAt when status changes to completed
  if (transaction.isModified('status') && transaction.status === 'completed' && !transaction.processedAt) {
    transaction.processedAt = new Date();
  }
  
  // Validate balance calculation
  if (transaction.type === 'earned' || transaction.type === 'purchased' || transaction.type === 'refunded' || transaction.type === 'bonus') {
    // Adding coins
    if (transaction.balanceAfter !== transaction.balanceBefore + Math.abs(transaction.amount)) {
      return next(new Error('Invalid balance calculation for credit transaction'));
    }
  } else {
    // Spending/penalty coins
    if (transaction.balanceAfter !== transaction.balanceBefore - Math.abs(transaction.amount)) {
      return next(new Error('Invalid balance calculation for debit transaction'));
    }
  }
  
  next();
});

// Virtual for transaction direction
coinTransactionSchema.virtual('direction').get(function(this: ICoinTransactionDocument) {
  return ['earned', 'purchased', 'refunded', 'bonus'].includes(this.type) ? 'credit' : 'debit';
});

// Virtual for formatted amount
coinTransactionSchema.virtual('formattedAmount').get(function(this: ICoinTransactionDocument) {
  const direction = this.amount >= 0 ? 'credit' : 'debit';
  const amount = Math.abs(this.amount);
  return direction === 'credit' ? `+${amount}` : `-${amount}`;
});

// Static method to create a coin transaction and update user balance
coinTransactionSchema.statics.createTransaction = async function(
  userId: string,
  type: string,
  amount: number,
  description: string,
  options: {
    referenceId?: string;
    referenceType?: string;
    metadata?: any;
    status?: string;
  } = {}
) {
  const User = mongoose.model('User');
  const session = await mongoose.startSession();
  
  try {
    return await session.withTransaction(async () => {
      // Get current user balance
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new Error('User not found');
      }
      
      const balanceBefore = user.coinBalance || 0;
      let balanceAfter: number;
      
      // Calculate new balance
      if (['earned', 'purchased', 'refunded', 'bonus'].includes(type)) {
        balanceAfter = balanceBefore + Math.abs(amount);
      } else {
        balanceAfter = balanceBefore - Math.abs(amount);
        
        // Check if user has sufficient balance
        if (balanceAfter < 0) {
          throw new Error('Insufficient coin balance');
        }
      }
      
      // Create transaction record
      const transactionStatus = options.status || 'completed';
      const transaction = new this({
        userId,
        type,
        amount,
        balanceBefore,
        balanceAfter,
        description,
        referenceId: options.referenceId,
        referenceType: options.referenceType,
        metadata: options.metadata,
        status: transactionStatus
      });
      
      await transaction.save({ session });
      
      // Only update user balance if transaction is completed
      if (transactionStatus === 'completed') {
        user.coinBalance = balanceAfter;
        await user.save({ session });
      }
      
      return transaction;
    });
  } finally {
    await session.endSession();
  }
};

// Static method to get user's coin transaction history
coinTransactionSchema.statics.getUserTransactions = function(
  userId: string, 
  page: number = 1, 
  limit: number = 10,
  type?: string
) {
  const filter: any = { userId };
  if (type) {
    filter.type = type;
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'username fullName email')
    .populate('metadata.adminUserId', 'username fullName');
};

// Static method to get coin statistics
coinTransactionSchema.statics.getCoinStats = async function(startDate?: Date, endDate?: Date) {
  const matchStage: any = {};
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalCoinsEarned: {
          $sum: {
            $cond: [
              { $in: ['$type', ['earned', 'purchased', 'refunded', 'bonus']] },
              '$amount',
              0
            ]
          }
        },
        totalCoinsSpent: {
          $sum: {
            $cond: [
              { $in: ['$type', ['spent', 'penalty']] },
              '$amount',
              0
            ]
          }
        },
        transactionsByType: {
          $push: {
            type: '$type',
            amount: '$amount'
          }
        }
      }
    }
  ]);
  
  const typeBreakdown = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  return {
    ...(stats[0] || {
      totalTransactions: 0,
      totalCoinsEarned: 0,
      totalCoinsSpent: 0
    }),
    typeBreakdown
  };
};

// Static method to reverse a transaction
coinTransactionSchema.statics.reverseTransaction = async function(transactionId: string, reason: string, adminUserId?: string) {
  const session = await mongoose.startSession();
  
  try {
    return await session.withTransaction(async () => {
      const originalTransaction = await this.findById(transactionId).session(session);
      if (!originalTransaction) {
        throw new Error('Transaction not found');
      }
      
      if (originalTransaction.status === 'reversed') {
        throw new Error('Transaction already reversed');
      }
      
      // Create reverse transaction
      const reverseType = originalTransaction.type === 'spent' ? 'refunded' : 
                         originalTransaction.type === 'earned' ? 'penalty' : 
                         originalTransaction.type === 'purchased' ? 'penalty' :
                         originalTransaction.type === 'refunded' ? 'spent' :
                         originalTransaction.type === 'bonus' ? 'penalty' : 'earned';
      
      const reverseTransaction = await (this as any).createTransaction(
        originalTransaction.userId,
        reverseType,
        Math.abs(originalTransaction.amount),
        `Reversal: ${reason}`,
        {
          referenceId: originalTransaction._id.toString(),
          referenceType: 'admin_adjustment',
          metadata: {
            reason,
            adminUserId,
            originalTransactionId: originalTransaction._id
          }
        }
      );
      
      // Mark original transaction as reversed
      originalTransaction.status = 'reversed';
      await originalTransaction.save({ session });
      
      return reverseTransaction;
    });
  } finally {
    await session.endSession();
  }
};

const CoinTransaction = mongoose.model<ICoinTransactionDocument, ICoinTransactionModel>('CoinTransaction', coinTransactionSchema);

export default CoinTransaction;