import express from 'express';
import { HealthRun } from '../models/HealthRun.js';
import { PredictionReport } from '../models/PredictionReport.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

// GET /api/health-runs/:id - Get health run details
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const healthRun = await HealthRun.findById(id)
    .populate('serviceId', 'name baseUrl env')
    .lean();

  if (!healthRun) {
    return res.status(404).json({ message: 'Health run not found' });
  }

  // Check if there's a prediction report for this run
  const predictionReport = await PredictionReport.findOne({ healthRunId: id })
    .select('_id title riskLevel')
    .lean();

  res.json({
    healthRun,
    predictionReportId: predictionReport?._id || null
  });
}));

// GET /api/health-runs - Get all health runs with filtering
router.get('/', asyncHandler(async (req, res) => {
  const { 
    serviceId, 
    status, 
    page = 1, 
    limit = 20,
    startDate,
    endDate 
  } = req.query;

  const filter: any = {};
  
  if (serviceId) {
    filter.serviceId = serviceId;
  }
  
  if (status && ['healthy', 'degraded', 'unhealthy', 'running'].includes(status as string)) {
    filter.summaryStatus = status;
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate as string);
    }
    if (endDate) {
      filter.createdAt.$lte = new Date(endDate as string);
    }
  }

  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
  const skip = (pageNum - 1) * limitNum;

  const [runs, total] = await Promise.all([
    HealthRun.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('serviceId', 'name env')
      .select('-rawResults') // Exclude raw results for performance
      .lean(),
    HealthRun.countDocuments(filter)
  ]);

  res.json({
    runs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
}));

// GET /api/health-runs/:id/raw-results - Get raw results for a health run
router.get('/:id/raw-results', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const healthRun = await HealthRun.findById(id)
    .select('rawResults serviceId')
    .populate('serviceId', 'name')
    .lean();

  if (!healthRun) {
    return res.status(404).json({ message: 'Health run not found' });
  }

  res.json({
    serviceId: healthRun.serviceId,
    rawResults: healthRun.rawResults || []
  });
}));

export default router;