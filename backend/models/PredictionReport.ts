import mongoose, { Document, Schema } from 'mongoose';

export interface IGeneratedConfigs {
  nginxRateLimitConfig?: string;
  dockerResourceConfig?: string;
  k8sResourcesConfig?: string;
}

export interface IPredictionReport extends Document {
  serviceId: mongoose.Types.ObjectId;
  healthRunId: mongoose.Types.ObjectId;
  title: string;
  summary: string;
  timeline: string[];
  riskLevel: 'low' | 'medium' | 'high';
  warnings: string[];
  suggestions: string[];
  generatedConfigs: IGeneratedConfigs;
  createdAt: Date;
  updatedAt: Date;
}

const PredictionReportSchema = new Schema<IPredictionReport>({
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  healthRunId: {
    type: Schema.Types.ObjectId,
    ref: 'HealthRun',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  summary: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  timeline: [{
    type: String,
    trim: true,
    maxlength: 300
  }],
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  warnings: [{
    type: String,
    trim: true,
    maxlength: 300
  }],
  suggestions: [{
    type: String,
    trim: true,
    maxlength: 500
  }],
  generatedConfigs: {
    nginxRateLimitConfig: { type: String },
    dockerResourceConfig: { type: String },
    k8sResourcesConfig: { type: String }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
PredictionReportSchema.index({ serviceId: 1, createdAt: -1 });
PredictionReportSchema.index({ healthRunId: 1 }, { unique: true });
PredictionReportSchema.index({ riskLevel: 1 });

export const PredictionReport = mongoose.model<IPredictionReport>('PredictionReport', PredictionReportSchema);