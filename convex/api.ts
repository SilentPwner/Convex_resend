import { api as adminApi } from './admin';
export const api = {
  ...publicApi,
  admin: adminApi
};