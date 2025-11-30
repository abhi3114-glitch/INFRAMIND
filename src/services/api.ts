import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface Service {
  _id: string;
  name: string;
  baseUrl: string;
  healthPath: string;
  expectedLatencyMinMs: number;
  expectedLatencyMaxMs: number;
  env: 'dev' | 'staging' | 'prod';
  createdAt: string;
  updatedAt: string;
}

export interface HealthRun {
  _id: string;
  serviceId: string;
  startedAt: string;
  finishedAt?: string;
  summaryStatus: 'healthy' | 'degraded' | 'unhealthy' | 'running';
  metrics?: {
    avgLatencyMs: number;
    p95LatencyMs: number;
    successRate: number;
    errorRate: number;
    timeoutCount: number;
    statusCodeCounts: Record<string, number>;
  };
  rawResults?: Array<{
    url: string;
    statusCode?: number;
    latencyMs?: number;
    error?: string;
    timestamp: string;
  }>;
  durationMs?: number;
}

export interface PredictionReport {
  _id: string;
  serviceId: string;
  healthRunId: string;
  title: string;
  summary: string;
  timeline: string[];
  riskLevel: 'low' | 'medium' | 'high';
  warnings: string[];
  suggestions: string[];
  generatedConfigs: {
    nginxRateLimitConfig?: string;
    dockerResourceConfig?: string;
    k8sResourcesConfig?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Services API
export const servicesApi = {
  getAll: (params?: { env?: string; page?: number; limit?: number }) =>
    api.get<{ services: Service[]; pagination: any }>('/services', { params }),
  
  getById: (id: string) =>
    api.get<{ service: Service; recentRuns: HealthRun[] }>(`/services/${id}`),
  
  create: (data: Omit<Service, '_id' | 'createdAt' | 'updatedAt'>) =>
    api.post<{ service: Service; message: string }>('/services', data),
  
  delete: (id: string) =>
    api.delete<{ message: string }>(`/services/${id}`),
  
  runHealthCheck: (id: string) =>
    api.post<{ healthRunId: string; message: string; status: string }>(`/services/${id}/run-health-check`),
  
  getRuns: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<{ runs: HealthRun[]; pagination: any }>(`/services/${id}/runs`, { params }),
};

// Health Runs API
export const healthRunsApi = {
  getAll: (params?: { 
    serviceId?: string; 
    status?: string; 
    page?: number; 
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) =>
    api.get<{ runs: HealthRun[]; pagination: any }>('/health-runs', { params }),
  
  getById: (id: string) =>
    api.get<{ healthRun: HealthRun; predictionReportId?: string }>(`/health-runs/${id}`),
  
  getRawResults: (id: string) =>
    api.get<{ serviceId: string; rawResults: any[] }>(`/health-runs/${id}/raw-results`),
};

// Reports API
export const reportsApi = {
  getAll: (params?: {
    serviceId?: string;
    riskLevel?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) =>
    api.get<{ reports: PredictionReport[]; pagination: any }>('/reports', { params }),
  
  getById: (id: string) =>
    api.get<{ report: PredictionReport }>(`/reports/${id}`),
  
  getByService: (serviceId: string) =>
    api.get<{ report: PredictionReport }>(`/reports/service/${serviceId}`),
  
  getShareable: (serviceId: string, runId: string) =>
    api.get<{ report: PredictionReport; shareableUrl: string; generatedAt: string }>(`/reports/${serviceId}/${runId}`),
};

export default api;