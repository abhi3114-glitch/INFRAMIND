import { useState, useEffect } from 'react';
import { reportsApi, PredictionReport } from '../services/api';
import toast from 'react-hot-toast';

export const useReports = (serviceId?: string) => {
  const [reports, setReports] = useState<PredictionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await reportsApi.getAll({ 
        serviceId, 
        limit: 20 
      });
      setReports(response.data.reports);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch reports');
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [serviceId]);

  return {
    reports,
    loading,
    error,
    refetch: fetchReports,
  };
};