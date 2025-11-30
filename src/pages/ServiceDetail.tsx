import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  ExternalLink, 
  Activity,
  Clock,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { servicesApi, healthRunsApi, Service, HealthRun } from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate, formatLatency, formatPercentage } from '../lib/utils';
import toast from 'react-hot-toast';

export const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [runs, setRuns] = useState<HealthRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningHealthCheck, setRunningHealthCheck] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const [serviceRes, runsRes] = await Promise.all([
          servicesApi.getById(id),
          servicesApi.getRuns(id, { limit: 20 })
        ]);
        
        setService(serviceRes.data.service);
        setRuns(runsRes.data.runs);
      } catch (error: any) {
        toast.error('Failed to load service details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleRunHealthCheck = async () => {
    if (!service) return;
    
    try {
      setRunningHealthCheck(true);
      const response = await servicesApi.runHealthCheck(service._id);
      toast.success('Health check started');
      
      // Refresh runs after a delay
      setTimeout(async () => {
        const runsRes = await servicesApi.getRuns(service._id, { limit: 20 });
        setRuns(runsRes.data.runs);
      }, 2000);
    } catch (error: any) {
      toast.error('Failed to start health check');
    } finally {
      setRunningHealthCheck(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!service) {
    return (
      <EmptyState
        title="Service not found"
        description="The service you're looking for doesn't exist or has been deleted."
        action={
          <Link to="/services" className="btn-primary">
            Back to Services
          </Link>
        }
      />
    );
  }

  const latestRun = runs[0];
  const healthyRuns = runs.filter(r => r.summaryStatus === 'healthy').length;
  const avgSuccessRate = runs.length > 0 
    ? runs.reduce((sum, run) => sum + (run.metrics?.successRate || 0), 0) / runs.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/services" className="btn-ghost">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-secondary-900">{service.name}</h1>
          <p className="text-secondary-600">{service.baseUrl}{service.healthPath}</p>
        </div>
        <button
          onClick={handleRunHealthCheck}
          disabled={runningHealthCheck}
          className="btn-primary"
        >
          {runningHealthCheck ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Run Health Check
        </button>
      </div>

      {/* Service Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900">Current Status</h3>
            {latestRun && <StatusBadge status={latestRun.summaryStatus} />}
          </div>
          {latestRun ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-600">Last Check:</span>
                <span className="font-medium">{formatDate(latestRun.finishedAt || latestRun.startedAt)}</span>
              </div>
              {latestRun.metrics && (
                <>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Success Rate:</span>
                    <span className="font-medium">{formatPercentage(latestRun.metrics.successRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Avg Latency:</span>
                    <span className="font-medium">{formatLatency(latestRun.metrics.avgLatencyMs)}</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-secondary-500 text-sm">No health checks yet</p>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900">Reliability</h3>
            <TrendingUp className="w-5 h-5 text-success-600" />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary-600">Healthy Runs:</span>
              <span className="font-medium">{healthyRuns}/{runs.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600">Avg Success Rate:</span>
              <span className="font-medium">{formatPercentage(avgSuccessRate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600">Environment:</span>
              <span className="font-medium capitalize">{service.env}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900">Configuration</h3>
            <ExternalLink className="w-5 h-5 text-primary-600" />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary-600">Min Latency:</span>
              <span className="font-medium">{service.expectedLatencyMinMs}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600">Max Latency:</span>
              <span className="font-medium">{service.expectedLatencyMaxMs}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600">Created:</span>
              <span className="font-medium">{formatDate(service.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Health Runs History */}
      <div className="card">
        <div className="p-6 border-b border-secondary-200">
          <h3 className="text-lg font-semibold text-secondary-900">Health Check History</h3>
        </div>
        <div className="p-6">
          {runs.length === 0 ? (
            <EmptyState
              icon={<Activity className="w-8 h-8 text-secondary-400" />}
              title="No health checks yet"
              description="Run your first health check to see results here"
              action={
                <button onClick={handleRunHealthCheck} className="btn-primary">
                  <Play className="w-4 h-4 mr-2" />
                  Run Health Check
                </button>
              }
            />
          ) : (
            <div className="space-y-4">
              {runs.map((run) => (
                <div key={run._id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <StatusBadge status={run.summaryStatus} />
                    <div>
                      <p className="font-medium text-secondary-900">
                        {formatDate(run.startedAt)}
                      </p>
                      {run.metrics && (
                        <p className="text-sm text-secondary-600">
                          {formatPercentage(run.metrics.successRate)} success • {formatLatency(run.metrics.avgLatencyMs)} avg
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {run.durationMs && (
                      <span className="text-sm text-secondary-500">
                        {Math.round(run.durationMs / 1000)}s
                      </span>
                    )}
                    <Link
                      to={`/health-runs/${run._id}`}
                      className="btn-secondary btn-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};