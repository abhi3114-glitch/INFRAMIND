import { Worker, Queue, Job } from 'bullmq';
import { redisClient } from '../config/redis.js';
import { Service } from '../models/Service.js';
import { HealthRun } from '../models/HealthRun.js';
import { PredictionReport } from '../models/PredictionReport.js';
import { performHealthCheck } from '../services/healthCheckService.js';
import { generateAIReport } from '../services/aiReportService.js';

export interface HealthCheckJobData {
  serviceId: string;
  healthRunId: string;
}

// Create queue
const healthCheckQueue = new Queue('health-check', {
  connection: redisClient,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Create worker
let worker: Worker | null = null;

export const startWorker = async (): Promise<void> => {
  if (worker) {
    console.log('Worker already running');
    return;
  }

  worker = new Worker(
    'health-check',
    async (job: Job<HealthCheckJobData>) => {
      const { serviceId, healthRunId } = job.data;
      
      console.log(`🔍 Starting health check for service ${serviceId}, run ${healthRunId}`);
      
      try {
        // Get service details
        const service = await Service.findById(serviceId);
        if (!service) {
          throw new Error(`Service ${serviceId} not found`);
        }

        // Get health run
        const healthRun = await HealthRun.findById(healthRunId);
        if (!healthRun) {
          throw new Error(`Health run ${healthRunId} not found`);
        }

        // Perform health check
        console.log(`🏥 Running health probes for ${service.name}`);
        const results = await performHealthCheck(service);

        // Update health run with results
        healthRun.finishedAt = new Date();
        healthRun.summaryStatus = results.summaryStatus;
        healthRun.metrics = results.metrics;
        healthRun.rawResults = results.rawResults;
        await healthRun.save();

        console.log(`📊 Health check completed for ${service.name}: ${results.summaryStatus}`);

        // Generate AI report
        console.log(`🤖 Generating AI report for ${service.name}`);
        const aiReport = generateAIReport({
          service: service.toObject(),
          metrics: results.metrics
        });

        // Save prediction report
        const predictionReport = new PredictionReport({
          serviceId: service._id,
          healthRunId: healthRun._id,
          title: aiReport.title,
          summary: aiReport.summary,
          timeline: aiReport.timeline,
          riskLevel: aiReport.riskLevel,
          warnings: aiReport.warnings,
          suggestions: aiReport.suggestions,
          generatedConfigs: aiReport.generatedConfigs
        });

        await predictionReport.save();

        console.log(`✅ AI report generated for ${service.name} with risk level: ${aiReport.riskLevel}`);

        return {
          healthRunId,
          summaryStatus: results.summaryStatus,
          reportId: predictionReport._id,
          riskLevel: aiReport.riskLevel
        };

      } catch (error) {
        console.error(`❌ Health check failed for service ${serviceId}:`, error);
        
        // Update health run as failed
        await HealthRun.findByIdAndUpdate(healthRunId, {
          finishedAt: new Date(),
          summaryStatus: 'unhealthy'
        });

        throw error;
      }
    },
    {
      connection: redisClient,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('❌ Worker error:', err);
  });

  console.log('🚀 Health check worker started');
};

export const addHealthCheckJob = async (data: HealthCheckJobData): Promise<Job> => {
  return healthCheckQueue.add('health-check', data, {
    delay: 1000, // Small delay to ensure DB consistency
  });
};

export const getQueueStats = async () => {
  return {
    waiting: await healthCheckQueue.getWaiting(),
    active: await healthCheckQueue.getActive(),
    completed: await healthCheckQueue.getCompleted(),
    failed: await healthCheckQueue.getFailed(),
  };
};

// Graceful shutdown
process.on('SIGINT', async () => {
  if (worker) {
    await worker.close();
    console.log('🛑 Health check worker stopped');
  }
});