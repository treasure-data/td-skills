/**
 * API Client for Metadata Management
 */

import axios from 'axios';
import type { FieldMetadata, DatabaseInfo, FilterOptions, UpdateRequest, ApiResponse } from '../types/metadata';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Get list of databases with table counts
 */
export const getDatabases = async (): Promise<DatabaseInfo[]> => {
  const response = await api.get<ApiResponse<DatabaseInfo[]>>('/metadata/databases');
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to fetch databases');
  }
  return response.data.data || [];
};

/**
 * Get tables for a specific database
 */
export const getTables = async (database: string): Promise<string[]> => {
  const response = await api.get<ApiResponse<string[]>>(`/metadata/databases/${database}/tables`);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to fetch tables');
  }
  return response.data.data || [];
};

/**
 * Get field metadata based on filters
 */
export const getFieldMetadata = async (filters: FilterOptions): Promise<FieldMetadata[]> => {
  const params = new URLSearchParams();
  if (filters.database) params.append('database', filters.database);
  if (filters.table) params.append('table', filters.table);

  const response = await api.get<ApiResponse<FieldMetadata[]>>(`/metadata/fields?${params.toString()}`);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to fetch field metadata');
  }
  return response.data.data || [];
};

/**
 * Update field metadata
 */
export const updateFieldMetadata = async (updates: UpdateRequest[]): Promise<{ updated: number; failed: number }> => {
  const response = await api.post<ApiResponse<{ updated: number; failed: number }>>('/metadata/fields/update', {
    updates,
  });
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to update field metadata');
  }
  return response.data.data || { updated: 0, failed: 0 };
};

export default api;
