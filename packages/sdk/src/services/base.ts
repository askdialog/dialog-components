import { config } from '../config';

export const getBaseApiUrl = (): string => {
  return config.baseApiUrl;
};
