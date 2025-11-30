import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Filter, 
  Search, 
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useReports } from '../hooks/useReports';
import { useServices } from '../hooks/useServices';
import { RiskBadge } from '../components/ui/RiskBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate, truncateText } from '../lib/utils';

export const Reports: React.FC = () => {
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { reports, loading } = useReports();
  const { services } = useServices();

  const filteredReports = reports.filter(report => {
    const matchesRisk = !riskFilter || report.riskLevel === riskFilter;
    const matchesService = !serviceFilter || report.serviceId === serviceFilter;
    const matchesSearch = !searchQuery || 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesRisk && matchesService && matchesSearch;
  });

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-danger-600" />;
      case 'medium':
        return <Clock className="w-5 h-5 text-warning-600" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      default:
        return <FileText className="w-5 h-5 text-secondary-600" />;
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
      <div>
        <h2 className="text-2xl font-bold text-secondary-900">AI Reports</h2>
        <p className="text-secondary-600">AI-generated reliability reports and insights</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
          <input
            type="text"
            placeholder="Search reports..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-secondary-500" />
            <select
              className="input w-auto"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>
          
          <select
            className="input w-auto"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
          >
            <option value="">All Services</option>
            {services.map(service => (
              <option key={service._id} value={service._id}>
                {service.name} ({service.env})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-secondary-400" />}
          title="No reports found"
          description={searchQuery || riskFilter || serviceFilter ? 
            "Try adjusting your search or filters" : 
            "AI reports will appear here after running health checks"
          }
          action={
            <Link to="/services" className="btn-primary">
              View Services
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6">
          {filteredReports.map((report) => {
            const service = services.find(s => s._id === report.serviceId);
            return (
              <div key={report._id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getRiskIcon(report.riskLevel)}
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900">
                        {report.title}
                      </h3>
                      <p className="text-sm text-secondary-600">
                        {service?.name} ({service?.env}) • {formatDate(report.createdAt)}
                      </p>
                    </div>
                  </div>
                  <RiskBadge risk={report.riskLevel} />
                </div>

                <p className="text-secondary-700 mb-4">
                  {truncateText(report.summary, 200)}
                </p>

                {/* Warnings and Suggestions Preview */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {report.warnings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-danger-700 mb-2">
                        ⚠️ Warnings ({report.warnings.length})
                      </h4>
                      <ul className="text-sm text-secondary-600 space-y-1">
                        {report.warnings.slice(0, 2).map((warning, index) => (
                          <li key={index} className="truncate">• {warning}</li>
                        ))}
                        {report.warnings.length > 2 && (
                          <li className="text-secondary-500">
                            +{report.warnings.length - 2} more...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {report.suggestions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-primary-700 mb-2">
                        💡 Suggestions ({report.suggestions.length})
                      </h4>
                      <ul className="text-sm text-secondary-600 space-y-1">
                        {report.suggestions.slice(0, 2).map((suggestion, index) => (
                          <li key={index} className="truncate">• {suggestion}</li>
                        ))}
                        {report.suggestions.length > 2 && (
                          <li className="text-secondary-500">
                            +{report.suggestions.length - 2} more...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
                  <div className="flex items-center space-x-4 text-sm text-secondary-500">
                    <span>{report.timeline.length} timeline events</span>
                    <span>•</span>
                    <span>
                      {Object.keys(report.generatedConfigs).length} config files
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/reports/${report._id}`}
                      className="btn-secondary"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Report
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};