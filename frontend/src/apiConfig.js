const RAW_API_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');
const DEFAULT_PROD_API_ORIGIN = 'https://foodhub.mooo.com';

export const API_BASE_URL = RAW_API_URL || (import.meta.env.PROD ? DEFAULT_PROD_API_ORIGIN : '');

export const buildApiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
};