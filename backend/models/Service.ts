import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  name: string;
  baseUrl: string;
  healthPath: string;
  expectedLatencyMinMs: number;
  expectedLatencyMaxMs: number;
  env: 'dev' | 'staging' | 'prod';
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  baseUrl: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Base URL must be a valid HTTP/HTTPS URL'
    }
  },
  healthPath: {
    type: String,
    required: true,
    default: '/health',
    trim: true
  },
  expectedLatencyMinMs: {
    type: Number,
    required: true,
    min: 0,
    max: 60000
  },
  expectedLatencyMaxMs: {
    type: Number,
    required: true,
    min: 0,
    max: 60000,
    validate: {
      validator: function(this: IService, v: number) {
        return v > this.expectedLatencyMinMs;
      },
      message: 'Max latency must be greater than min latency'
    }
  },
  env: {
    type: String,
    enum: ['dev', 'staging', 'prod'],
    default: 'dev'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
ServiceSchema.index({ name: 1, env: 1 }, { unique: true });
ServiceSchema.index({ createdAt: -1 });

export const Service = mongoose.model<IService>('Service', ServiceSchema);