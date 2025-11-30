import mongoose, { Document, Schema } from 'mongoose';

export interface IHealthMetrics {
  avgLatencyMs: number;
  p95LatencyMs: number;
  successRate: number;
  errorRate: number;
  timeoutCount: number;
  statusCodeCounts: Map<string, number>;
}

export interface IHealthRun extends Document {
  serviceId: mongoose.Types.ObjectId;
  startedAt: Date;
  finishedAt?: Date;
  summaryStatus: 'healthy' | 'degraded' | 'unhealthy' | 'running';
  metrics?: IHealthMetrics;
  rawResults?: Array<{
    url: string;
    statusCode?: number;
    latencyMs?: number;
    error?: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const HealthRunSchema = new Schema<IHealthRun>({
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  finishedAt: {
    type: Date
  },
  summaryStatus: {
    type: String,
    enum: ['healthy', 'degraded', 'unhealthy', 'running'],
    default: 'running'
  },
  metrics: {
    avgLatencyMs: { type: Number },
    p95LatencyMs: { type: Number },
    successRate: { type: Number, min: 0, max: 1 },
    errorRate: { type: Number, min: 0, max: 1 },
    timeoutCount: { type: Number, default: 0 },
    statusCodeCounts: {
      type: Map,
      of: Number,
      default: new Map()
    }
  },
  rawResults: [{
    url: { type: String, required: true },
    statusCode: { type: Number },
    latencyMs: { type: Number },
    error: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
HealthRunSchema.index({ serviceId: 1, createdAt: -1 });
HealthRunSchema.index({ summaryStatus: 1 });
HealthRunSchema.index({ startedAt: -1 });

// Virtual for duration
HealthRunSchema.virtual('durationMs').get(function(this: IHealthRun) {
  if (this.finishedAt && this.startedAt) {
    return this.finishedAt.getTime() - this.startedAt.getTime();
  }
  return null;
});

export const HealthRun = mongoose.model<IHealthRun>('HealthRun', HealthRunSchema);