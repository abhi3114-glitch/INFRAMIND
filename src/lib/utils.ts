import clsx, { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'healthy':
      return 'text-success-600 bg-success-50 border-success-200';
    case 'degraded':
      return 'text-warning-600 bg-warning-50 border-warning-200';
    case 'unhealthy':
      return 'text-danger-600 bg-danger-50 border-danger-200';
    case 'running':
      return 'text-primary-600 bg-primary-50 border-primary-200';
    default:
      return 'text-secondary-600 bg-secondary-50 border-secondary-200';
  }
}

export function getRiskColor(risk: string): string {
  switch (risk) {
    case 'low':
      return 'text-success-700 bg-success-50';
    case 'medium':
      return 'text-warning-700 bg-warning-50';
    case 'high':
      return 'text-danger-700 bg-danger-50';
    default:
      return 'text-secondary-700 bg-secondary-50';
  }
}

export function getEnvColor(env: string): string {
  switch (env) {
    case 'prod':
      return 'text-danger-700 bg-danger-50';
    case 'staging':
      return 'text-warning-700 bg-warning-50';
    case 'dev':
      return 'text-primary-700 bg-primary-50';
    default:
      return 'text-secondary-700 bg-secondary-50';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function downloadText(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}