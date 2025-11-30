import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Server, 
  Play, 
  Trash2, 
  ExternalLink,
  Filter,
  Search
} from 'lucide-react';
import { useServices } from '../hooks/useServices';
import { useHealthRuns } from '../hooks/useHealthRuns';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate, getEnvColor } from '../lib/utils';
import toast from 'react-hot-toast';

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

const CreateServiceModal: React.FC<CreateServiceModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: '',
    healthPath: '/health',
    expectedLatencyMinMs: 100,
    expectedLatencyMaxMs: 1000,
    env: 'dev' as 'dev' | 'staging' | 'prod'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        name: '',
        baseUrl: '',
        healthPath: '/health',
        expectedLatencyMinMs: 100,
        expectedLatencyMaxMs: 1000,
        env: 'dev'
      });
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Add New Service</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Service Name
            </label>
            <input
              type="text"
              required
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My API Service"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Base URL
            </label>
            <input
              type="url"
              required
              className="input"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder="https://api.example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Health Check Path
            </label>
            <input
              type="text"
              required
              className="input"
              value={formData.healthPath}
              onChange={(e) => setFormData({ ...formData, healthPath: e.target.value })}
              placeholder="/health"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Min Latency (ms)
              </label>
              <input
                type="number"
                required
                min="0"
                max="60000"
                className="input"
                value={formData.expectedLatencyMinMs}
                onChange={(e) => setFormData({ ...formData, expectedLatencyMinMs: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Max Latency (ms)
              </label>
              <input
                type="number"
                required
                min="0"
                max="60000"
                className="input"
                value={formData.expectedLatencyMaxMs}
                onChange={(e) => setFormData({ ...formData, expectedLatencyMaxMs: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Environment
            </label>
            <select
              className="input"
              value={formData.env}
              onChange={(e) => setFormData({ ...formData, env: e.target.value as 'dev' | 'staging' | 'prod' })}
            >
              <option value="dev">Development</option>
              <option value="staging">Staging</option>
              <option value="prod">Production</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Services: React.FC = () => {
  const [envFilter, setEnvFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { services, loading, createService, deleteService, runHealthCheck } = useServices(envFilter || undefined);
  const { runs } = useHealthRuns();

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.baseUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteService = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await deleteService(id);
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  const handleRunHealthCheck = async (id: string, name: string) => {
    try {
      await runHealthCheck(id);
      toast.success(`Health check started for ${name}`);
    } catch (error) {
      // Error handled in hook
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">Services</h2>
          <p className="text-secondary-600">Manage and monitor your registered services</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
          <input
            type="text"
            placeholder="Search services..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-secondary-500" />
          <select
            className="input w-auto"
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
          >
            <option value="">All Environments</option>
            <option value="dev">Development</option>
            <option value="staging">Staging</option>
            <option value="prod">Production</option>
          </select>
        </div>
      </div>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <EmptyState
          icon={<Server className="w-8 h-8 text-secondary-400" />}
          title="No services found"
          description={searchQuery || envFilter ? "Try adjusting your search or filters" : "Get started by adding your first service to monitor"}
          action={
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </button>
          }
        />
      ) : (
        <div className="grid gap-6">
          {filteredServices.map((service) => {
            const latestRun = runs.find(r => r.serviceId === service._id);
            return (
              <div key={service._id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-secondary-900">
                        {service.name}
                      </h3>
                      <span className={`badge ${getEnvColor(service.env)}`}>
                        {service.env}
                      </span>
                      {latestRun && (
                        <StatusBadge status={latestRun.summaryStatus} />
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-secondary-600">
                      <div className="flex items-center space-x-2">
                        <ExternalLink className="w-4 h-4" />
                        <span>{service.baseUrl}{service.healthPath}</span>
                      </div>
                      <div>
                        Expected latency: {service.expectedLatencyMinMs}ms - {service.expectedLatencyMaxMs}ms
                      </div>
                      <div>
                        Created: {formatDate(service.createdAt)}
                      </div>
                    </div>

                    {latestRun && latestRun.metrics && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <span className="text-xs text-secondary-500">Success Rate</span>
                          <div className="font-medium text-secondary-900">
                            {(latestRun.metrics.successRate * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-secondary-500">Avg Latency</span>
                          <div className="font-medium text-secondary-900">
                            {latestRun.metrics.avgLatencyMs.toFixed(0)}ms
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-secondary-500">P95 Latency</span>
                          <div className="font-medium text-secondary-900">
                            {latestRun.metrics.p95LatencyMs}ms
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-secondary-500">Last Check</span>
                          <div className="font-medium text-secondary-900">
                            {formatDate(latestRun.finishedAt || latestRun.startedAt)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleRunHealthCheck(service._id, service.name)}
                      className="btn-secondary"
                      title="Run Health Check"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <Link
                      to={`/services/${service._id}`}
                      className="btn-secondary"
                      title="View Details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteService(service._id, service.name)}
                      className="btn-danger"
                      title="Delete Service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Service Modal */}
      <CreateServiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createService}
      />
    </div>
  );
};