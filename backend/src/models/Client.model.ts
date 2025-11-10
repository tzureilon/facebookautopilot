import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  agencyUserId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  industry?: string;
  metaCredentials: {
    accessToken: string;
    adAccountId: string;
    pixelId?: string;
    pageId?: string;
  };
  status: 'active' | 'inactive' | 'suspended';
  billingInfo?: {
    currency: string;
    monthlyBudget?: number;
    billingCycle?: 'monthly' | 'quarterly' | 'annual';
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    agencyUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      maxlength: [100, 'Client name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Client email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    website: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    metaCredentials: {
      accessToken: {
        type: String,
        required: [true, 'Meta access token is required'],
      },
      adAccountId: {
        type: String,
        required: [true, 'Meta ad account ID is required'],
        validate: {
          validator: function (v: string) {
            return /^act_\d+$/.test(v);
          },
          message: 'Ad account ID must be in format: act_XXXXX',
        },
      },
      pixelId: {
        type: String,
      },
      pageId: {
        type: String,
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    billingInfo: {
      currency: {
        type: String,
        default: 'USD',
        uppercase: true,
      },
      monthlyBudget: {
        type: Number,
        min: [0, 'Monthly budget cannot be negative'],
      },
      billingCycle: {
        type: String,
        enum: ['monthly', 'quarterly', 'annual'],
      },
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
ClientSchema.index({ agencyUserId: 1, status: 1 });
ClientSchema.index({ agencyUserId: 1, name: 1 });

// Virtual for sanitized client info (without sensitive credentials)
ClientSchema.virtual('sanitized').get(function () {
  return {
    _id: this._id,
    agencyUserId: this.agencyUserId,
    name: this.name,
    email: this.email,
    phone: this.phone,
    company: this.company,
    website: this.website,
    industry: this.industry,
    status: this.status,
    billingInfo: this.billingInfo,
    notes: this.notes,
    metaCredentials: {
      adAccountId: this.metaCredentials.adAccountId,
      hasAccessToken: !!this.metaCredentials.accessToken,
      pixelId: this.metaCredentials.pixelId,
      pageId: this.metaCredentials.pageId,
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
});

// Method to check if client belongs to a specific user
ClientSchema.methods.belongsToUser = function (userId: string): boolean {
  return this.agencyUserId.toString() === userId.toString();
};

export default mongoose.model<IClient>('Client', ClientSchema);
