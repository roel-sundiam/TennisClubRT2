import { Schema, model, Document } from 'mongoose';

interface IPushSubscription extends Document {
  userId: Schema.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    unique: true
  },
  keys: {
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for efficient user subscription queries
pushSubscriptionSchema.index({ userId: 1, isActive: 1 });

export const PushSubscription = model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);
export type { IPushSubscription };