import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '';

export const api = axios.create({ baseURL: baseURL + '/api' });

export interface Worker {
  id: number;
  name: string;
  phone: string;
  status: 'IDLE' | 'WORKING';
  workingSince?: string;
  intro?: string;
  profileFilled: boolean;
  skills?: any[];
  brands?: any[];
}
