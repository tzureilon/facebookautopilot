import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token interceptor
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: any) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  // Questionnaire endpoints
  async createQuestionnaire(data: any) {
    const response = await this.client.post('/questionnaire', data);
    return response.data;
  }

  async getQuestionnaires() {
    const response = await this.client.get('/questionnaire');
    return response.data;
  }

  async getQuestionnaire(id: string) {
    const response = await this.client.get(`/questionnaire/${id}`);
    return response.data;
  }

  async updateQuestionnaire(id: string, data: any) {
    const response = await this.client.put(`/questionnaire/${id}`, data);
    return response.data;
  }

  async submitQuestionnaire(id: string) {
    const response = await this.client.post(`/questionnaire/${id}/submit`);
    return response.data;
  }

  async deleteQuestionnaire(id: string) {
    const response = await this.client.delete(`/questionnaire/${id}`);
    return response.data;
  }

  async uploadAsset(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post('/questionnaire/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Campaign endpoints
  async createCampaign(questionnaireId: string) {
    const response = await this.client.post('/campaigns', { questionnaireId });
    return response.data;
  }

  async getCampaigns() {
    const response = await this.client.get('/campaigns');
    return response.data;
  }

  async getCampaign(id: string) {
    const response = await this.client.get(`/campaigns/${id}`);
    return response.data;
  }

  async updateCampaignStatus(id: string, status: string) {
    const response = await this.client.put(`/campaigns/${id}/status`, { status });
    return response.data;
  }

  async deleteCampaign(id: string) {
    const response = await this.client.delete(`/campaigns/${id}`);
    return response.data;
  }

  // Analytics endpoints
  async getDashboard() {
    const response = await this.client.get('/analytics/dashboard');
    return response.data;
  }

  async getCampaignAnalytics(campaignId: string) {
    const response = await this.client.get(`/analytics/campaigns/${campaignId}`);
    return response.data;
  }

  async syncCampaignMetrics(campaignId: string) {
    const response = await this.client.post(`/analytics/campaigns/${campaignId}/sync`);
    return response.data;
  }

  async getAlerts() {
    const response = await this.client.get('/analytics/alerts');
    return response.data;
  }

  async acknowledgeAlert(alertId: string) {
    const response = await this.client.put(`/analytics/alerts/${alertId}/acknowledge`);
    return response.data;
  }

  async getActions() {
    const response = await this.client.get('/analytics/actions');
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
