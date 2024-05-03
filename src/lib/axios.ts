import Axios, { InternalAxiosRequestConfig } from 'axios';

import { env } from '@/config/env';
import { useNotificationStore } from '@/stores/notifications';
import storage from '@/utils/storage';

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  const token = storage.getToken();
  if (token) {
    if (config.headers) {
      config.headers.authorization = `${token}`;
    }
  }
  if (config.headers) {
    config.headers.Accept = 'application/json';
  }
  return config;
}

export const axios = Axios.create({
  baseURL: env.API_URL,
});

axios.interceptors.request.use(authRequestInterceptor);
axios.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || error.message;
    useNotificationStore.getState().addNotification({
      type: 'error',
      title: 'Error',
      message,
    });

    return Promise.reject(error);
  }
);
