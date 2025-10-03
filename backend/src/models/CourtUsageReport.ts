import mongoose, { Schema, Document } from 'mongoose';

export interface ICourtUsageReport extends Document {
  memberName: string;
  monthlyAmounts: Map<string, number>; // Dynamic month storage: 'YYYY-MM' -> amount
  totalAmount: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Helper methods
  getMonthAmount(year: number, month: number): number;
  setMonthAmount(year: number, month: number, amount: number): void;
  getAllMonths(): Array<{key: string, amount: number, year: number, month: number}>;
}

const courtUsageReportSchema = new Schema<ICourtUsageReport>({
  memberName: {
    type: String,
    required: [true, 'Member name is required'],
    trim: true,
    maxlength: [100, 'Member name cannot exceed 100 characters']
  },
  monthlyAmounts: {
    type: Map,
    of: Number,
    default: new Map(),
    validate: {
      validator: function(map: Map<string, number>) {
        // Validate all amounts are non-negative
        for (const [key, value] of map) {
          if (value < 0) return false;
          // Validate key format (YYYY-MM)
          if (!/^\d{4}-\d{2}$/.test(key)) return false;
        }
        return true;
      },
      message: 'Invalid monthly amounts: keys must be YYYY-MM format and values must be non-negative'
    }
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total amount cannot be negative']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2024, 'Year must be 2024 or later'],
    max: [2030, 'Year must be 2030 or earlier'],
    default: 2025
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to calculate total amount from dynamic months
courtUsageReportSchema.pre('save', function(next) {
  if (this.isModified('monthlyAmounts')) {
    this.totalAmount = 0;
    for (const amount of this.monthlyAmounts.values()) {
      this.totalAmount += amount;
    }
  }
  next();
});

// Create unique compound index for member name and year
courtUsageReportSchema.index({ memberName: 1, year: 1 }, { unique: true });

// Index for efficient sorting by total amount
courtUsageReportSchema.index({ totalAmount: -1 });

// Static method to get report data for a specific year
courtUsageReportSchema.statics.getReportByYear = function(year: number = 2025) {
  return this.find({ year }).sort({ totalAmount: -1 });
};

// Instance methods for dynamic month handling
courtUsageReportSchema.methods.getMonthAmount = function(year: number, month: number): number {
  const key = `${year}-${month.toString().padStart(2, '0')}`;
  return this.monthlyAmounts.get(key) || 0;
};

courtUsageReportSchema.methods.setMonthAmount = function(year: number, month: number, amount: number): void {
  const key = `${year}-${month.toString().padStart(2, '0')}`;
  this.monthlyAmounts.set(key, amount);
  this.markModified('monthlyAmounts');
};

courtUsageReportSchema.methods.getAllMonths = function(): Array<{key: string, amount: number, year: number, month: number}> {
  const months: Array<{key: string, amount: number, year: number, month: number}> = [];
  for (const [key, amount] of this.monthlyAmounts) {
    const [yearStr, monthStr] = key.split('-');
    months.push({
      key,
      amount,
      year: parseInt(yearStr),
      month: parseInt(monthStr)
    });
  }
  return months.sort((a, b) => a.key.localeCompare(b.key));
};

// Legacy method for backward compatibility
courtUsageReportSchema.methods.updateMonth = function(monthName: string, amount: number) {
  // Parse month name like 'january', 'february', etc.
  const monthMap: {[key: string]: number} = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4,
    'may': 5, 'june': 6, 'july': 7, 'august': 8,
    'september': 9, 'october': 10, 'november': 11, 'december': 12
  };
  
  const monthNum = monthMap[monthName.toLowerCase()];
  if (!monthNum) {
    throw new Error(`Invalid month name: ${monthName}`);
  }
  
  this.setMonthAmount(this.year, monthNum, amount);
  return this.save();
};

const CourtUsageReport = mongoose.model<ICourtUsageReport>('CourtUsageReport', courtUsageReportSchema);

export default CourtUsageReport;