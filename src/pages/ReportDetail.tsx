import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Copy,
  ExternalLink,
  Clock,
  AlertTriangle,
  Lightbulb,
  Code,
  Server
} from 'lucide-react';
import { reportsApi, PredictionReport } from '../services/api';
import { RiskBadge } from '../components/ui/RiskBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate, copyToClipboard, downloadText } from '../lib/utils';
import toast from 'react-hot-toast';

export const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<PredictionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeConfigTab, setActiveConfigTab] = useState<string>('nginx');

  useEffect(() => {
    if (!id) return;
    
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await reportsApi.getById(id);
        setReport(response.data.report);
      } catch (error: any) {
        toast.error('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const handleCopyConfig = async (config: string, type: string) => {
    try {
      await copyToClipboard(config);
      toast.success(`${type} configuration copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownloadConfig = (config: string, type: string) => {
    const filename = `${type.toLowerCase()}-config-${Date.now()}.txt`;
    downloadText(config, filename);
    toast.success(`${type} configuration downloaded`);
  };

  const handleShareReport = async () => {
    if (!report) return;
    
    try {
      const shareUrl = `${window.location.origin}/report/${report.serviceId}/${report.healthRunId}`;
      await copyToClipboard(shareUrl);
      toast.success('Shareable link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy share link');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!report) {
    return (
      <EmptyState
        title="Report not found"
        description="The report you're looking for doesn't exist or has been deleted."
        action={
          <Link to="/reports" className="btn-primary">
            Back to Reports
          </Link>
        }
      />
    );
  }

  const configTabs = [
    { id: 'nginx', label: 'NGINX', config: report.generatedConfigs.nginxRateLimitConfig },
    { id: 'docker', label: 'Docker', config: report.generatedConfigs.dockerResourceConfig },
    { id: 'k8s', label: 'Kubernetes', config: report.generatedConfigs.k8sResourcesConfig },
  ].filter(tab => tab.config);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/reports" className="btn-ghost">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">{report.title}</h1>
            <p className="text-secondary-600">Generated {formatDate(report.createdAt)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleShareReport}
            className="btn-secondary"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </button>
          <RiskBadge risk={report.riskLevel} size="lg" />
        </div>
      </div>

      {/* Summary */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Executive Summary</h2>
        <p className="text-secondary-700 leading-relaxed">{report.summary}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Warnings */}
        {report.warnings.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-danger-600" />
              <h3 className="text-lg font-semibold text-secondary-900">
                Warnings ({report.warnings.length})
              </h3>
            </div>
            <ul className="space-y-3">
              {report.warnings.map((warning, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-2 h-2 bg-danger-500 rounded-full mt-2"></span>
                  <span className="text-secondary-700">{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {report.suggestions.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">
                Recommendations ({report.suggestions.length})
              </h3>
            </div>
            <ul className="space-y-3">
              {report.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></span>
                  <span className="text-secondary-700">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Timeline */}
      {report.timeline.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-secondary-600" />
            <h3 className="text-lg font-semibold text-secondary-900">Timeline</h3>
          </div>
          <div className="space-y-4">
            {report.timeline.map((event, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-3 h-3 bg-primary-500 rounded-full mt-1"></div>
                <div className="flex-1">
                  <p className="text-secondary-700">{event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Configurations */}
      {configTabs.length > 0 && (
        <div className="card">
          <div className="p-6 border-b border-secondary-200">
            <div className="flex items-center space-x-2 mb-4">
              <Code className="w-5 h-5 text-secondary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">
                Generated Infrastructure Configurations
              </h3>
            </div>
            
            <div className="flex space-x-1 bg-secondary-100 rounded-lg p-1">
              {configTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveConfigTab(tab.id)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeConfigTab === tab.id
                      ? 'bg-white text-secondary-900 shadow-sm'
                      : 'text-secondary-600 hover:text-secondary-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-6">
            {configTabs.map((tab) => (
              <div
                key={tab.id}
                className={activeConfigTab === tab.id ? 'block' : 'hidden'}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-secondary-900">
                    {tab.label} Configuration
                  </h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopyConfig(tab.config!, tab.label)}
                      className="btn-secondary btn-sm"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </button>
                    <button
                      onClick={() => handleDownloadConfig(tab.config!, tab.label)}
                      className="btn-secondary btn-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                  </div>
                </div>
                
                <pre className="bg-secondary-900 text-secondary-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{tab.config}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};