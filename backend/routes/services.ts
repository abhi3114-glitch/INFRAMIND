import express from 'express';
import { body, validationResult } from 'express-validator';
import { Service } from '../models/Service.js';
import { HealthRun } from '../models/HealthRun.js';
import { addHealthCheckJob } from '../workers/healthCheckWorker.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

// Validation rules
const serviceValidation = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('baseUrl').isURL().withMessage('Base URL must be a valid URL'),
  body('healthPath').trim().isLength({ min: 1, max: 100 }).withMessage('Health path must be 1-100 characters'),
  body('expectedLatencyMinMs').isInt({ min: 0, max: 60000 }).withMessage('Min latency must be 0-60000ms'),
  body('expectedLatencyMaxMs').isInt({ min: 0, max: 60000 }).withMessage('Max latency must be 0-60000ms'),
  body('env').isIn(['dev', 'staging', 'prod']).withMessage('Environment must be dev, staging, or prod')
];

// POST /api/services - Create a new service
router.post('/', serviceValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }

  const { name, baseUrl, healthPath, expectedLatencyMinMs, expectedLatencyMaxMs, env } = req.body;

  // Check if service with same name and env already exists
  const existingService = await Service.findOne({ name, env });
  if (existingService) {
    return res.status(409).json({ 
      message: `Service '${name}' already exists in '${env}' environment` 
    });
  }

  // Validate latency range
  if (expectedLatencyMaxMs <= expectedLatencyMinMs) {
    return res.status(400).json({ 
      message: 'Max latency must be greater than min latency' 
    });
  }

  const service = new Service({
    name,
    baseUrl: baseUrl.replace(/\/$/, ''), // Remove trailing slash
    healthPath: healthPath.startsWith('/') ? healthPath : `/${healthPath}`,
    expectedLatencyMinMs,
    expectedLatencyMaxMs,
    env
  });

  await service.save();

  res.status(201).json({
    message: 'Service created successfully',
    service
  });
}));

// GET /api/services - List all services
router.get('/', asyncHandler(async (req, res) => {
  const { env, page = 1, limit = 10 } = req.query;
  
  const filter: any = {};
  if (env && ['dev', 'staging', 'prod'].includes(env as string)) {
    filter.env = env;
  }

  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
  const skip = (pageNum - 1) * limitNum;

  const [services, total] = await Promise.all([
    Service.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Service.countDocuments(filter)
  ]);

  res.json({
    services,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
}));

// GET /api/services/:id - Get service details
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findById(id);
  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }

  // Get recent health runs
  const recentRuns = await HealthRun.find({ serviceId: id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('summaryStatus startedAt finishedAt metrics')
    .lean();

  res.json({
    service,
    recentRuns
  });
}));

// POST /api/services/:id/run-health-check - Trigger health check
router.post('/:id/run-health-check', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findById(id);
  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }

  // Check if there's already a running health check
  const runningCheck = await HealthRun.findOne({
    serviceId: id,
    summaryStatus: 'running'
  });

  if (runningCheck) {
    return res.status(409).json({ 
      message: 'Health check already running for this service',
      healthRunId: runningCheck._id
    });
  }

  // Create new health run
  const healthRun = new HealthRun({
    serviceId: id,
    startedAt: new Date(),
    summaryStatus: 'running'
  });

  await healthRun.save();

  // Add job to queue
  await addHealthCheckJob({
    serviceId: id.toString(),
    healthRunId: healthRun._id.toString()
  });

  res.json({
    message: 'Health check queued successfully',
    healthRunId: healthRun._id,
    status: 'queued'
  });
}));

// GET /api/services/:id/runs - Get health runs for a service
router.get('/:id/runs', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const service = await Service.findById(id);
  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }

  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
  const skip = (pageNum - 1) * limitNum;

  const [runs, total] = await Promise.all([
    HealthRun.find({ serviceId: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('serviceId', 'name env')
      .lean(),
    HealthRun.countDocuments({ serviceId: id })
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

// DELETE /api/services/:id - Delete a service
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findById(id);
  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }

  // Delete related health runs and reports
  await Promise.all([
    HealthRun.deleteMany({ serviceId: id }),
    // PredictionReport.deleteMany({ serviceId: id }) // Will be handled by cascade
  ]);

  await Service.findByIdAndDelete(id);

  res.json({ message: 'Service deleted successfully' });
}));

export default router;