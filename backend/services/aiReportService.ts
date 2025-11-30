import { IService } from '../models/Service.js';
import { IHealthMetrics } from '../models/HealthRun.js';

export interface AIReportInput {
  service: IService;
  metrics: IHealthMetrics;
}

export interface AIReportOutput {
  title: string;
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  timeline: string[];
  warnings: string[];
  suggestions: string[];
  generatedConfigs: {
    nginxRateLimitConfig?: string;
    dockerResourceConfig?: string;
    k8sResourcesConfig?: string;
  };
}

export const generateAIReport = (input: AIReportInput): AIReportOutput => {
  const { service, metrics } = input;
  
  console.log(`🤖 Generating AI report for ${service.name}`);
  
  // TODO: Replace with actual LLM integration (OpenAI, Claude, etc.)
  // This is a sophisticated heuristic-based implementation for MVP
  
  const riskLevel = determineRiskLevel(metrics, service);
  const warnings = generateWarnings(metrics, service);
  const suggestions = generateSuggestions(metrics, service, warnings);
  const timeline = generateTimeline(metrics, service);
  const generatedConfigs = generateInfraConfigs(metrics, service, riskLevel);
  
  const title = generateTitle(service, riskLevel, metrics);
  const summary = generateSummary(service, metrics, riskLevel, warnings.length);

  return {
    title,
    summary,
    riskLevel,
    timeline,
    warnings,
    suggestions,
    generatedConfigs
  };
};

const determineRiskLevel = (metrics: IHealthMetrics, service: IService): 'low' | 'medium' | 'high' => {
  let riskScore = 0;

  // Error rate scoring
  if (metrics.errorRate > 0.3) riskScore += 3;
  else if (metrics.errorRate > 0.1) riskScore += 2;
  else if (metrics.errorRate > 0.05) riskScore += 1;

  // Latency scoring
  const latencyRatio = metrics.p95LatencyMs / service.expectedLatencyMaxMs;
  if (latencyRatio > 2) riskScore += 3;
  else if (latencyRatio > 1.5) riskScore += 2;
  else if (latencyRatio > 1.2) riskScore += 1;

  // Timeout scoring
  if (metrics.timeoutCount > 5) riskScore += 2;
  else if (metrics.timeoutCount > 2) riskScore += 1;

  // Success rate scoring
  if (metrics.successRate < 0.7) riskScore += 3;
  else if (metrics.successRate < 0.9) riskScore += 2;
  else if (metrics.successRate < 0.95) riskScore += 1;

  // Rate limiting check (no 429s under load might indicate missing protection)
  const has429s = metrics.statusCodeCounts.get('429') || 0;
  if (has429s === 0 && metrics.errorRate < 0.1) {
    riskScore += 1; // Potential missing rate limiting
  }

  if (riskScore >= 6) return 'high';
  if (riskScore >= 3) return 'medium';
  return 'low';
};

const generateWarnings = (metrics: IHealthMetrics, service: IService): string[] => {
  const warnings: string[] = [];

  if (metrics.errorRate > 0.2) {
    warnings.push(`High error rate detected: ${(metrics.errorRate * 100).toFixed(1)}% of requests failed`);
  }

  if (metrics.p95LatencyMs > service.expectedLatencyMaxMs * 1.5) {
    warnings.push(`P95 latency (${metrics.p95LatencyMs}ms) is 50% above expected maximum (${service.expectedLatencyMaxMs}ms)`);
  }

  if (metrics.timeoutCount > 3) {
    warnings.push(`${metrics.timeoutCount} requests timed out during load testing`);
  }

  if (metrics.successRate < 0.8) {
    warnings.push(`Low success rate: only ${(metrics.successRate * 100).toFixed(1)}% of requests succeeded`);
  }

  const has429s = metrics.statusCodeCounts.get('429') || 0;
  const has5xxs = Array.from(metrics.statusCodeCounts.entries())
    .filter(([code]) => code.startsWith('5'))
    .reduce((sum, [, count]) => sum + count, 0);

  if (has429s === 0 && metrics.errorRate < 0.1) {
    warnings.push('No rate limiting detected - service may be vulnerable to traffic spikes');
  }

  if (has5xxs > 0) {
    warnings.push(`${has5xxs} server errors (5xx) detected - indicates internal service issues`);
  }

  const avgLatencyMs = metrics.avgLatencyMs;
  if (avgLatencyMs > service.expectedLatencyMaxMs) {
    warnings.push(`Average latency (${avgLatencyMs.toFixed(1)}ms) exceeds expected maximum (${service.expectedLatencyMaxMs}ms)`);
  }

  return warnings;
};

const generateSuggestions = (
  metrics: IHealthMetrics, 
  service: IService, 
  warnings: string[]
): string[] => {
  const suggestions: string[] = [];

  // Rate limiting suggestions
  const has429s = metrics.statusCodeCounts.get('429') || 0;
  if (has429s === 0 && metrics.errorRate < 0.1) {
    suggestions.push('Implement NGINX rate limiting to protect against traffic spikes and DDoS attacks');
    suggestions.push('Configure application-level rate limiting with appropriate burst allowances');
  }

  // Performance suggestions
  if (metrics.p95LatencyMs > service.expectedLatencyMaxMs) {
    suggestions.push('Consider scaling up CPU resources or optimizing database queries');
    suggestions.push('Implement caching layer (Redis/Memcached) for frequently accessed data');
    suggestions.push('Review and optimize slow API endpoints identified in monitoring');
  }

  // Reliability suggestions
  if (metrics.errorRate > 0.1) {
    suggestions.push('Implement circuit breaker pattern for external dependencies');
    suggestions.push('Add comprehensive error handling and graceful degradation');
    suggestions.push('Set up automated alerting for error rate spikes');
  }

  // Resource suggestions
  if (metrics.timeoutCount > 2) {
    suggestions.push('Increase container memory limits and CPU requests');
    suggestions.push('Implement connection pooling and optimize database connections');
    suggestions.push('Consider horizontal pod autoscaling based on CPU/memory usage');
  }

  // Monitoring suggestions
  if (warnings.length > 2) {
    suggestions.push('Set up comprehensive monitoring with Prometheus and Grafana');
    suggestions.push('Implement structured logging with correlation IDs');
    suggestions.push('Create runbooks for common failure scenarios');
  }

  // Infrastructure suggestions
  suggestions.push('Implement health check endpoints with detailed status information');
  suggestions.push('Set up automated deployment rollback on health check failures');

  return suggestions;
};

const generateTimeline = (metrics: IHealthMetrics, service: IService): string[] => {
  const timeline: string[] = [];
  const now = new Date();

  timeline.push(`${now.toISOString()}: Health check initiated for ${service.name} (${service.env})`);
  
  if (metrics.successRate > 0.9) {
    timeline.push(`${now.toISOString()}: Service responding normally with ${(metrics.successRate * 100).toFixed(1)}% success rate`);
  } else {
    timeline.push(`${now.toISOString()}: Service showing degraded performance with ${(metrics.successRate * 100).toFixed(1)}% success rate`);
  }

  if (metrics.avgLatencyMs > service.expectedLatencyMaxMs) {
    timeline.push(`${now.toISOString()}: Latency spike detected - average ${metrics.avgLatencyMs.toFixed(1)}ms vs expected ${service.expectedLatencyMaxMs}ms`);
  }

  if (metrics.errorRate > 0.1) {
    timeline.push(`${now.toISOString()}: Error rate elevated at ${(metrics.errorRate * 100).toFixed(1)}% - investigating root cause`);
  }

  timeline.push(`${now.toISOString()}: Analysis complete - risk assessment and recommendations generated`);

  return timeline;
};

const generateInfraConfigs = (
  metrics: IHealthMetrics, 
  service: IService, 
  riskLevel: 'low' | 'medium' | 'high'
): {
  nginxRateLimitConfig?: string;
  dockerResourceConfig?: string;
  k8sResourcesConfig?: string;
} => {
  const configs: any = {};

  // NGINX Rate Limiting Config
  const has429s = metrics.statusCodeCounts.get('429') || 0;
  if (has429s === 0) {
    const rateLimit = riskLevel === 'high' ? '10r/s' : riskLevel === 'medium' ? '20r/s' : '50r/s';
    const burstSize = riskLevel === 'high' ? '20' : riskLevel === 'medium' ? '40' : '100';
    
    configs.nginxRateLimitConfig = `# NGINX Rate Limiting Configuration
# Add to your nginx.conf or site configuration

http {
    # Define rate limiting zones
    limit_req_zone $binary_remote_addr zone=${service.name}_rate_limit:10m rate=${rateLimit};
    limit_req_zone $binary_remote_addr zone=${service.name}_burst:10m rate=100r/s;
    
    server {
        location ${service.healthPath} {
            # Apply rate limiting
            limit_req zone=${service.name}_rate_limit burst=${burstSize} nodelay;
            limit_req zone=${service.name}_burst burst=200 nodelay;
            
            # Return 429 with custom message
            limit_req_status 429;
            
            # Proxy to your service
            proxy_pass ${service.baseUrl};
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}`;
  }

  // Docker Resource Configuration
  const memoryLimit = riskLevel === 'high' ? '1g' : riskLevel === 'medium' ? '512m' : '256m';
  const cpuLimit = riskLevel === 'high' ? '1.0' : riskLevel === 'medium' ? '0.5' : '0.25';
  
  configs.dockerResourceConfig = `# Docker Compose Resource Configuration
# Add to your docker-compose.yml

version: '3.8'
services:
  ${service.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}:
    image: your-app-image
    deploy:
      resources:
        limits:
          cpus: '${cpuLimit}'
          memory: ${memoryLimit}
        reservations:
          cpus: '${parseFloat(cpuLimit) / 2}'
          memory: ${memoryLimit === '1g' ? '512m' : memoryLimit === '512m' ? '256m' : '128m'}
    environment:
      - NODE_ENV=${service.env}
      - MAX_CONNECTIONS=100
      - TIMEOUT_MS=${service.expectedLatencyMaxMs}
    healthcheck:
      test: ["CMD", "curl", "-f", "${service.baseUrl}${service.healthPath}"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s`;

  // Kubernetes Resource Configuration
  const k8sMemoryLimit = riskLevel === 'high' ? '1Gi' : riskLevel === 'medium' ? '512Mi' : '256Mi';
  const k8sCpuLimit = riskLevel === 'high' ? '1000m' : riskLevel === 'medium' ? '500m' : '250m';
  
  configs.k8sResourcesConfig = `# Kubernetes Deployment Configuration
# Apply with: kubectl apply -f deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${service.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}
  labels:
    app: ${service.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}
    env: ${service.env}
spec:
  replicas: ${riskLevel === 'high' ? 3 : riskLevel === 'medium' ? 2 : 1}
  selector:
    matchLabels:
      app: ${service.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}
  template:
    metadata:
      labels:
        app: ${service.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}
    spec:
      containers:
      - name: app
        image: your-app-image
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "${k8sMemoryLimit === '1Gi' ? '512Mi' : k8sMemoryLimit === '512Mi' ? '256Mi' : '128Mi'}"
            cpu: "${parseInt(k8sCpuLimit) / 2}m"
          limits:
            memory: "${k8sMemoryLimit}"
            cpu: "${k8sCpuLimit}"
        livenessProbe:
          httpGet:
            path: ${service.healthPath}
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: ${service.healthPath}
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        env:
        - name: NODE_ENV
          value: "${service.env}"
        - name: MAX_CONNECTIONS
          value: "100"`;

  return configs;
};

const generateTitle = (
  service: IService, 
  riskLevel: 'low' | 'medium' | 'high', 
  metrics: IHealthMetrics
): string => {
  const riskEmoji = riskLevel === 'high' ? '🔴' : riskLevel === 'medium' ? '🟡' : '🟢';
  const statusText = metrics.successRate > 0.95 ? 'Healthy' : metrics.successRate > 0.8 ? 'Degraded' : 'Critical';
  
  return `${riskEmoji} ${service.name} (${service.env}) - ${statusText} - Risk Level: ${riskLevel.toUpperCase()}`;
};

const generateSummary = (
  service: IService, 
  metrics: IHealthMetrics, 
  riskLevel: 'low' | 'medium' | 'high',
  warningCount: number
): string => {
  const successPercentage = (metrics.successRate * 100).toFixed(1);
  const avgLatency = metrics.avgLatencyMs.toFixed(1);
  
  let summary = `InfraMind completed a comprehensive reliability assessment of ${service.name} in the ${service.env} environment. `;
  
  if (riskLevel === 'high') {
    summary += `🚨 HIGH RISK detected with ${warningCount} critical issues identified. `;
  } else if (riskLevel === 'medium') {
    summary += `⚠️ MEDIUM RISK detected with ${warningCount} issues requiring attention. `;
  } else {
    summary += `✅ LOW RISK - service is performing within acceptable parameters. `;
  }
  
  summary += `During load testing, the service achieved a ${successPercentage}% success rate with an average response time of ${avgLatency}ms. `;
  
  if (metrics.errorRate > 0.1) {
    summary += `Error rate of ${(metrics.errorRate * 100).toFixed(1)}% indicates potential stability issues. `;
  }
  
  if (metrics.p95LatencyMs > service.expectedLatencyMaxMs) {
    summary += `P95 latency of ${metrics.p95LatencyMs}ms exceeds expected maximum of ${service.expectedLatencyMaxMs}ms. `;
  }
  
  summary += `Preventive infrastructure configurations and monitoring recommendations have been generated to improve reliability and prevent future outages.`;
  
  return summary;
};

// TODO: Future LLM Integration Point
// This function shows where to integrate with OpenAI, Claude, or other LLM services
/*
const generateLLMReport = async (input: AIReportInput): Promise<AIReportOutput> => {
  // Example OpenAI integration:
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const prompt = `
    As a Senior SRE and DevOps engineer, analyze this service health data and generate a comprehensive reliability report:
    
    Service: ${input.service.name} (${input.service.env})
    URL: ${input.service.baseUrl}${input.service.healthPath}
    Expected Latency: ${input.service.expectedLatencyMinMs}-${input.service.expectedLatencyMaxMs}ms
    
    Metrics:
    - Success Rate: ${(input.metrics.successRate * 100).toFixed(1)}%
    - Error Rate: ${(input.metrics.errorRate * 100).toFixed(1)}%
    - Avg Latency: ${input.metrics.avgLatencyMs.toFixed(1)}ms
    - P95 Latency: ${input.metrics.p95LatencyMs}ms
    - Timeouts: ${input.metrics.timeoutCount}
    - Status Codes: ${JSON.stringify(Object.fromEntries(input.metrics.statusCodeCounts))}
    
    Generate:
    1. Risk level assessment (low/medium/high)
    2. Specific warnings about current issues
    3. Actionable suggestions for improvement
    4. NGINX rate limiting configuration
    5. Docker resource limits
    6. Kubernetes deployment specs
    7. Timeline of events
    8. Executive summary
  `;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });
  
  // Parse LLM response and structure it according to AIReportOutput interface
  return parseLLMResponse(response.choices[0].message.content);
};
*/