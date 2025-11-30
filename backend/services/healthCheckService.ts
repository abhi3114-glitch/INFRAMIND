import axios, { AxiosResponse } from 'axios';
import { IService } from '../models/Service.js';
import { IHealthMetrics } from '../models/HealthRun.js';

export interface HealthCheckResult {
  summaryStatus: 'healthy' | 'degraded' | 'unhealthy';
  metrics: IHealthMetrics;
  rawResults: Array<{
    url: string;
    statusCode?: number;
    latencyMs?: number;
    error?: string;
    timestamp: Date;
  }>;
}

export const performHealthCheck = async (service: IService): Promise<HealthCheckResult> => {
  const healthUrl = `${service.baseUrl}${service.healthPath}`;
  const burstSize = parseInt(process.env.DEFAULT_BURST_SIZE || '20');
  const timeoutMs = parseInt(process.env.DEFAULT_TIMEOUT_MS || '10000');
  
  console.log(`🔍 Testing ${service.name} at ${healthUrl}`);
  
  const rawResults: Array<{
    url: string;
    statusCode?: number;
    latencyMs?: number;
    error?: string;
    timestamp: Date;
  }> = [];

  // Perform burst test
  const promises = Array.from({ length: burstSize }, async (_, index) => {
    const startTime = Date.now();
    const timestamp = new Date();
    
    try {
      const response: AxiosResponse = await axios.get(healthUrl, {
        timeout: timeoutMs,
        validateStatus: () => true, // Accept all status codes
        headers: {
          'User-Agent': 'InfraMind-HealthChecker/1.0',
          'X-Health-Check': 'true'
        }
      });

      const latencyMs = Date.now() - startTime;
      
      const result = {
        url: healthUrl,
        statusCode: response.status,
        latencyMs,
        timestamp
      };
      
      rawResults.push(result);
      return result;
      
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      
      const result = {
        url: healthUrl,
        statusCode: error.response?.status,
        latencyMs: error.code === 'ECONNABORTED' ? timeoutMs : latencyMs,
        error: error.message,
        timestamp
      };
      
      rawResults.push(result);
      return result;
    }
  });

  // Wait for all requests to complete
  await Promise.allSettled(promises);

  // Calculate metrics
  const metrics = calculateMetrics(rawResults, service);
  
  // Determine summary status
  const summaryStatus = determineSummaryStatus(metrics, service);

  console.log(`📊 Health check results for ${service.name}:`, {
    summaryStatus,
    avgLatency: `${metrics.avgLatencyMs.toFixed(2)}ms`,
    successRate: `${(metrics.successRate * 100).toFixed(1)}%`,
    errorRate: `${(metrics.errorRate * 100).toFixed(1)}%`
  });

  return {
    summaryStatus,
    metrics,
    rawResults
  };
};

const calculateMetrics = (
  results: Array<{
    url: string;
    statusCode?: number;
    latencyMs?: number;
    error?: string;
    timestamp: Date;
  }>,
  service: IService
): IHealthMetrics => {
  const validResults = results.filter(r => r.latencyMs !== undefined);
  const latencies = validResults.map(r => r.latencyMs!).sort((a, b) => a - b);
  
  const successCount = results.filter(r => 
    r.statusCode && r.statusCode >= 200 && r.statusCode < 300
  ).length;
  
  const errorCount = results.filter(r => 
    r.error || (r.statusCode && (r.statusCode >= 400 || r.statusCode < 200))
  ).length;
  
  const timeoutCount = results.filter(r => 
    r.error && (r.error.includes('timeout') || r.error.includes('ECONNABORTED'))
  ).length;

  // Calculate status code distribution
  const statusCodeCounts = new Map<string, number>();
  results.forEach(r => {
    if (r.statusCode) {
      const code = r.statusCode.toString();
      statusCodeCounts.set(code, (statusCodeCounts.get(code) || 0) + 1);
    } else if (r.error) {
      statusCodeCounts.set('error', (statusCodeCounts.get('error') || 0) + 1);
    }
  });

  const avgLatencyMs = latencies.length > 0 
    ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length 
    : 0;

  const p95Index = Math.floor(latencies.length * 0.95);
  const p95LatencyMs = latencies.length > 0 ? latencies[p95Index] || latencies[latencies.length - 1] : 0;

  const successRate = results.length > 0 ? successCount / results.length : 0;
  const errorRate = results.length > 0 ? errorCount / results.length : 0;

  return {
    avgLatencyMs,
    p95LatencyMs,
    successRate,
    errorRate,
    timeoutCount,
    statusCodeCounts
  };
};

const determineSummaryStatus = (
  metrics: IHealthMetrics,
  service: IService
): 'healthy' | 'degraded' | 'unhealthy' => {
  // Unhealthy conditions
  if (metrics.errorRate > 0.5) return 'unhealthy'; // More than 50% errors
  if (metrics.timeoutCount > 5) return 'unhealthy'; // More than 5 timeouts
  if (metrics.successRate < 0.5) return 'unhealthy'; // Less than 50% success

  // Degraded conditions
  if (metrics.errorRate > 0.1) return 'degraded'; // More than 10% errors
  if (metrics.p95LatencyMs > service.expectedLatencyMaxMs * 1.5) return 'degraded'; // 50% above expected max
  if (metrics.avgLatencyMs > service.expectedLatencyMaxMs) return 'degraded'; // Above expected max
  if (metrics.successRate < 0.9) return 'degraded'; // Less than 90% success

  // Healthy
  return 'healthy';
};