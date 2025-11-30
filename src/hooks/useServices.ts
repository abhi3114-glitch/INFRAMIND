import { useState, useEffect } from 'react';
import { servicesApi, Service } from '../services/api';
import toast from 'react-hot-toast';

export const useServices = (env?: string) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await servicesApi.getAll({ env, limit: 50 });
      setServices(response.data.services);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch services');
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const createService = async (serviceData: Omit<Service, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await servicesApi.create(serviceData);
      setServices(prev => [response.data.service, ...prev]);
      toast.success('Service created successfully');
      return response.data.service;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create service');
      throw err;
    }
  };

  const deleteService = async (id: string) => {
    try {
      await servicesApi.delete(id);
      setServices(prev => prev.filter(s => s._id !== id));
      toast.success('Service deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete service');
      throw err;
    }
  };

  const runHealthCheck = async (id: string) => {
    try {
      const response = await servicesApi.runHealthCheck(id);
      toast.success('Health check started');
      return response.data.healthRunId;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start health check');
      throw err;
    }
  };

  useEffect(() => {
    fetchServices();
  }, [env]);

  return {
    services,
    loading,
    error,
    refetch: fetchServices,
    createService,
    deleteService,
    runHealthCheck,
  };
};