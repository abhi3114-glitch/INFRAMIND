import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Server, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  BarChart3,
  Zap
} from 'lucide-react';
import { useServices } from '../hooks/useServices';
import { useHealthRuns } from '../hooks/useHealthRuns';
import { useReports } from '../hooks/useReports';
import { StatusBadge } from '../components/ui/StatusBadge';
import { RiskBadge } from '../components/ui/RiskBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatDate, formatLatency, formatPercentage } from '../lib/utils';

export const Dashboard: React.FC = () => {
  const { services, loading: servicesLoading } = useServices();
  const { runs, loading: runsLoading } = useHealthRuns();
  const { reports, loading: reportsLoading } = useReports();

  const stats = React.useMemo(() => {
    const totalServices = services.length;
    const healthyServices = services.filter(s => {
      const latestRun = runs.find(r => r.serviceId === s._id);
      return latestRun?.summaryStatus === 'healthy';
    }).length;
    
    const recentRuns = runs.slice(0, 10);
    const avgSuccessRate = recentRuns.length > 0 
      ? recentRuns.reduce((sum, run) => sum + (run.metrics?.successRate || 0), 0) / recentRuns.length
      : 0;

    const highRiskReports = reports.filter(r => r.riskLevel === 'high').length;

    return {
      totalServices,
      healthyServices,
      avgSuccessRate,
      highRiskReports,
    };
  }, [services, runs, reports]);

  const recentActivity = React.useMemo(() => {
    const activities = [
      ...runs.slice(0, 5).map(run => ({
        id: run._id,
        type: 'health_check' as const,
        title: `Health check completed`,
        serviceId: run.serviceId,
        status: run.summaryStatus,
        timestamp: run.finishedAt || run.startedAt,
      })),
      ...reports.slice(0, 3).map(report => ({
        id: report._id,
        type: 'report' as const,
        title: `AI report generated`,
        serviceId: report.serviceId,
        riskLevel: report.riskLevel,
        timestamp: report.createdAt,
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return activities.slice(0, 8);
  }, [runs, reports]);

  if (servicesLoading || runsLoading || reportsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Services</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.totalServices}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg">
              <Server className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/services" className="text-sm text-primary-600 hover:text-primary-700">
              Manage services →
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Healthy Services</p>
              <p className="text-3xl font-bold text-success-600">{stats.healthyServices}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-success-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-secondary-500">
              {stats.totalServices > 0 ? Math.round((stats.healthyServices / stats.totalServices) * 100) : 0}% of all services
            </span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Avg Success Rate</p>
              <p className="text-3xl font-bold text-primary-600">{formatPercentage(stats.avgSuccessRate)}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-secondary-500">
              Last 10 health checks
            </span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">High Risk Alerts</p>
              <p className="text-3xl font-bold text-danger-600">{stats.highRiskReports}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-danger-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-danger-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/reports?risk=high" className="text-sm text-danger-600 hover:text-danger-700">
              View reports →
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Services Overview */}
        <div className="card">
          <div className="p-6 border-b border-secondary-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary-900">Services Overview</h3>
              <Link to="/services" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {services.length === 0 ? (
              <div className="text-center py-8">
                <Server className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                <p className="text-secondary-600">No services registered yet</p>
                <Link to="/services" className="btn-primary mt-4">
                  Add your first service
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {services.slice(0, 5).map((service) => {
                  const latestRun = runs.find(r => r.serviceId === service._id);
                  return (
                    <div key={service._id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-secondary-200">
                          <Activity className="w-5 h-5 text-secondary-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-secondary-900">{service.name}</h4>
                          <p className="text-sm text-secondary-600">{service.env} • {service.baseUrl}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {latestRun ? (
                          <StatusBadge status={latestRun.summaryStatus} />
                        ) : (
                          <span className="text-sm text-secondary-500">No checks</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="p-6 border-b border-secondary-200">
            <h3 className="text-lg font-semibold text-secondary-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                <p className="text-secondary-600">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const service = services.find(s => s._id === activity.serviceId);
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full flex-shrink-0">
                        {activity.type === 'health_check' ? (
                          <Activity className="w-4 h-4 text-primary-600" />
                        ) : (
                          <BarChart3 className="w-4 h-4 text-primary-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-secondary-900">
                          {activity.title} for <span className="font-medium">{service?.name || 'Unknown Service'}</span>
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-secondary-500">
                            {formatDate(activity.timestamp)}
                          </span>
                          {'status' in activity && (
                            <StatusBadge status={activity.status} size="sm" />
                          )}
                          {'riskLevel' in activity && (
                            <RiskBadge risk={activity.riskLevel} size="sm" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/services" className="flex items-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg mr-3">
              <Server className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h4 className="font-medium text-primary-900">Add New Service</h4>
              <p className="text-sm text-primary-700">Register a new service for monitoring</p>
            </div>
          </Link>

          <Link to="/reports" className="flex items-center p-4 bg-success-50 rounded-lg hover:bg-success-100 transition-colors">
            <div className="flex items-center justify-center w-10 h-10 bg-success-100 rounded-lg mr-3">
              <BarChart3 className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <h4 className="font-medium text-success-900">View Reports</h4>
              <p className="text-sm text-success-700">Browse AI-generated reliability reports</p>
            </div>
          </Link>

          <button className="flex items-center p-4 bg-warning-50 rounded-lg hover:bg-warning-100 transition-colors">
            <div className="flex items-center justify-center w-10 h-10 bg-warning-100 rounded-lg mr-3">
              <Zap className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <h4 className="font-medium text-warning-900">Run Health Checks</h4>
              <p className="text-sm text-warning-700">Trigger health checks for all services</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};