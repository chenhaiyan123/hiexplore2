
import { Project } from '../types';
import { MOCK_PROJECTS } from '../constants';

const API_BASE_URL = 'https://www.hiexplore.com/api';

/**
 * HiExplore Data Unification Service
 * Tries to fetch from main site API, falls back to local data.
 */
export const api = {
  getProjects: async (): Promise<Project[]> => {
    try {
      // 尝试从你的主站 API 获取数据
      // 注意：这需要你的主站配置 CORS 允许 app.hiexplore.com 访问
      // const response = await fetch(`${API_BASE_URL}/projects`);
      // if (!response.ok) throw new Error('API Error');
      // return await response.json();
      
      // 目前默认：返回内置的高保真数据（确保 App 独立运行时不白屏）
      return new Promise((resolve) => setTimeout(() => resolve(MOCK_PROJECTS), 300));
    } catch (error) {
      console.warn("API unavailable, using local data.");
      return MOCK_PROJECTS;
    }
  },

  login: async (phone: string, code: string): Promise<any> => {
    try {
        // 这里可以调用主站的登录接口
        // const response = await fetch(`${API_BASE_URL}/auth/login`, { method: 'POST', ... });
        
        // Mock Login Success
        return { success: true, user: { id: 'u_' + phone, name: 'HiExplore User' } };
    } catch (error) {
        return { success: false };
    }
  }
};