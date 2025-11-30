import { useState, useEffect } from 'react';
import { healthRunsApi, HealthRun } from '../services/api';
import toast from 'react-hot-toast';

export const useHealthRuns = (serviceId?: string) => {
  const [runs, setRuns] = useState<HealthRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const response = await healthRunsApi.getAll({ 
        serviceId, 
        limit: 20 
      });
      setRuns(response.data.runs);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch health runs');
      toast.error('Failed to load health runs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [serviceId]);

  return {
    runs,
    loading,
    error,
    refetch: fetchRuns,
  };
};