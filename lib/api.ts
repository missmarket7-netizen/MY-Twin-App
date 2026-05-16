import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RelationshipDims } from '../store/useTwinStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 
  (Platform.OS === 'android' 
      ? 'http://10.0.2.2:8000' 
      : 'http://localhost:8000');

export const API = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token Management
let _token = '';

export function setToken(token: string) {
  _token = token;
}

API.interceptors.request.use(async (config) => {
  if (_token) {
    config.headers.Authorization = `Bearer ${_token}`;
  } else {
    try {
      const session = await AsyncStorage.getItem('supabase.auth.token');
      if (session) {
        const parsed = JSON.parse(session);
        const token = parsed?.access_token || parsed?.currentSession?.access_token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      console.warn('Failed to get token from AsyncStorage');
    }
  }
  return config;
});

// Response Interceptor للـ Error Handling
API.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

// ====================== Main Chat Function ======================
// ✅ تستقبل RelationshipDims مباشرة – لا حاجة للتحويل
export const askTwin = async (
  message: string,
  twinName: string,
  bond: number,
  dims: RelationshipDims,
  calm: boolean = false
) => {
  try {
    const { data } = await API.post(
      '/api/chat',
      {
        message,
        twin_name: twinName,
        bond_level: bond,
        relationship_dims: dims,
      },
      {
        headers: {
          'X-Calm-Mode': String(calm),
        },
      }
    );
    return data;
  } catch (error) {
    const err = error as AxiosError;
    if (err.response?.status === 429) {
      throw new Error("المحادثات كتير دلوقتي، استنى شوية ونكمل 🥺");
    }
    if (err.response?.status === 401) {
      throw new Error("انتهت صلاحية الجلسة، سجل دخول تاني");
    }
    throw new Error("حصل خطأ في الاتصال... جرب تاني");
  }
};

// ====================== Other Functions ======================

export const startTrial = async (email: string, phone: string, deviceId: string) => {
  const { data } = await API.post('/api/trial/start', {
    email,
    phone,
    device_id: deviceId,
  });
  return data;
};

export const transcribeAudio = async (audioUri: string) => {
  // هيتم تنفيذه بعدين
};

export const saveMemory = async (memory: any) => {
  return API.post('/api/memory/save', memory);
};

export default API;
