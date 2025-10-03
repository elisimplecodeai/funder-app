import { ISOAccount, ISOAccountsResponse } from '@/types/iso';
import apiClient from './client';
import useAuthStore from '@/lib/store/auth';
import { env } from '@/config/env';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  data: T;
}

// General function to get all ISO accounts (similar to funder accounts)
export async function getISOAccounts(page: number = 1, limit: number = 100): Promise<ISOAccountsResponse> {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.get<ApiResponse<{
      docs: ISOAccount[],
      pagination: {
        page: number;
        limit: number;
        totalPages: number;
        totalResults: number;
      }
    }>>(env.api.endpoints.iso.getISOAccounts + `?${queryParams.toString()}`, true, accessToken);


    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch ISO accounts');
    }

    return {
      success: true,
      data: {
        docs: response.data.docs,
        pagination: response.data.pagination
      }
    };
  } catch (error) {
    console.error('Error fetching ISO accounts:', error);
    throw error;
  }
}

export async function getISOAccountsByISOId(isoId: string, page: number = 1, limit: number = 100): Promise<ISOAccountsResponse> {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      iso: isoId,
    });

    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const response = await apiClient.get<ApiResponse<{
      docs: ISOAccount[],
      pagination: {
        page: number;
        limit: number;
        totalPages: number;
        totalResults: number;
      }
    }>>(env.api.endpoints.iso.getISOAccounts + `?${queryParams.toString()}`, true, accessToken);


    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch ISO accounts');
    }

    return {
      success: true,
      data: {
        docs: response.data.docs,
        pagination: response.data.pagination
      }
    };
  } catch (error) {
    console.error('Error fetching ISO accounts:', error);
    throw error;
  }
} 