import express from 'express';
import { PredictionReport } from '../models/PredictionReport.js';
import { HealthRun } from '../models/HealthRun.js';
import { Service } from '../models/Service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

// GET /api/reports/:id - Get prediction report details
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await PredictionReport.findById(id)
    .populate('serviceId', 'name baseUrl env')
    .populate('healthRunId', 'startedAt finishedAt summaryStatus metrics')
    .lean();

  if (!report) {
    return res.status(404).json({ message: 'Prediction report not found' });
  }

  res.json({ report });
}));

// GET /api/reports - Get all prediction reports with filtering
router.get('/', asyncHandler(async (req, res) => {
  const { 
    serviceId, 
    riskLevel, 
    page = 1, 
    limit = 20,
    startDate,
    endDate 
  } = req.query;

  const filter: any = {};
  
  if (serviceId) {
    filter.serviceId = serviceId;
  }
  
  if (riskLevel && ['low', 'medium', 'high'].includes(riskLevel as string)) {
    filter.riskLevel = riskLevel;
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

  const [reports, total] = await Promise.all([
    PredictionReport.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('serviceId', 'name env')
      .select('-generatedConfigs') // Exclude configs for list view
      .lean(),
    PredictionReport.countDocuments(filter)
  ]);

  res.json({
    reports,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
}));

// GET /api/reports/service/:serviceId - Get latest report for a service
router.get('/service/:serviceId', asyncHandler(async (req, res) => {
  const { serviceId } = req.params;

  // Verify service exists
  const service = await Service.findById(serviceId);
  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }

  const latestReport = await PredictionReport.findOne({ serviceId })
    .sort({ createdAt: -1 })
    .populate('serviceId', 'name baseUrl env')
    .populate('healthRunId', 'startedAt finishedAt summaryStatus metrics')
    .lean();

  if (!latestReport) {
    return res.status(404).json({ message: 'No reports found for this service' });
  }

  res.json({ report: latestReport });
}));

// GET /api/reports/:serviceId/:runId - Shareable report page data
router.get('/:serviceId/:runId', asyncHandler(async (req, res) => {
  const { serviceId, runId } = req.params;

  // Find the report by service and health run
  const report = await PredictionReport.findOne({ 
    serviceId, 
    healthRunId: runId 
  })
    .populate('serviceId', 'name baseUrl env expectedLatencyMinMs expectedLatencyMaxMs')
    .populate('healthRunId', 'startedAt finishedAt summaryStatus metrics rawResults')
    .lean();

  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }

  // Generate shareable URL
  const shareableUrl = `${req.protocol}://${req.get('host')}/report/${serviceId}/${runId}`;

  res.json({ 
    report,
    shareableUrl,
    generatedAt: new Date().toISOString()
  });
}));

export default router;