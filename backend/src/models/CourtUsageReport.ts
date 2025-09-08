import mongoose, { Schema, Document } from 'mongoose';

export interface ICourtUsageReport extends Document {
  memberName: string;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  totalAmount: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

const courtUsageReportSchema = new Schema<ICourtUsageReport>({
  memberName: {
    type: String,
    required: [true, 'Member name is required'],
    trim: true,
    maxlength: [100, 'Member name cannot exceed 100 characters']
  },
  january: {
    type: Number,
    default: 0,
    min: [0, 'Monthly amount cannot be negative']
  },
  february: {
    type: Number,
    default: 0,
    min: [0, 'Monthly amount cannot be negative']
  },
  march: {
    type: Number,
    default: 0,
    min: [0, 'Monthly amount cannot be negative']
  },
  april: {
    type: Number,
    default: 0,
    min: [0, 'Monthly amount cannot be negative']
  },
  may: {
    type: Number,
    default: 0,
    min: [0, 'Monthly amount cannot be negative']
  },
  june: {
    type: Number,
    default: 0,
    min: [0, 'Monthly amount cannot be negative']
  },
  july: {
    type: Number,
    default: 0,
    min: [0, 'Monthly amount cannot be negative']
  },
  august: {
    type: Number,
    default: 0,
    min: [0, 'Monthly amount cannot be negative']
  },
  september: {
    type: Number,
    default: 0,
    min: [0, 'Monthly amount cannot be negative']
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

// Pre-save middleware to calculate total amount
courtUsageReportSchema.pre('save', function(next) {
  if (this.isModified(['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september'])) {
    this.totalAmount = this.january + this.february + this.march + this.april + this.may + 
                     this.june + this.july + this.august + this.september;
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

// Instance method to update monthly amount
courtUsageReportSchema.methods.updateMonth = function(month: string, amount: number) {
  const monthField = month.toLowerCase();
  if (this.schema.paths[monthField]) {
    (this as any)[monthField] = amount;
    return this.save();
  }
  throw new Error(`Invalid month: ${month}`);
};

const CourtUsageReport = mongoose.model<ICourtUsageReport>('CourtUsageReport', courtUsageReportSchema);

export default CourtUsageReport;