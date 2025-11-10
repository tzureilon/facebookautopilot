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

    // Add auth token and client context interceptor
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add client ID to headers if selected
      const clientStorage = localStorage.getItem('client-storage');
      if (clientStorage) {
        try {
          const { state } = JSON.parse(clientStorage);
          if (state?.selectedClient?.id) {
            config.headers['x-client-id'] = state.selectedClient.id;
          }
        } catch (e) {
          // Ignore parse errors
        }
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

  // A/B Testing endpoints
  async createABTest(data: any) {
    const response = await this.client.post('/abtests', data);
    return response.data;
  }

  async getABTests() {
    const response = await this.client.get('/abtests');
    return response.data;
  }

  async getABTest(id: string) {
    const response = await this.client.get(`/abtests/${id}`);
    return response.data;
  }

  async getABTestsByCampaign(campaignId: string) {
    const response = await this.client.get(`/abtests/campaign/${campaignId}`);
    return response.data;
  }

  async startABTest(id: string) {
    const response = await this.client.post(`/abtests/${id}/start`);
    return response.data;
  }

  async pauseABTest(id: string) {
    const response = await this.client.post(`/abtests/${id}/pause`);
    return response.data;
  }

  async getABTestStatistics(id: string) {
    const response = await this.client.get(`/abtests/${id}/statistics`);
    return response.data;
  }

  async getABTestReport(id: string) {
    const response = await this.client.get(`/abtests/${id}/report`);
    return response.data;
  }

  async updateABTestMetrics(id: string) {
    const response = await this.client.post(`/abtests/${id}/update-metrics`);
    return response.data;
  }

  async deleteABTest(id: string) {
    const response = await this.client.delete(`/abtests/${id}`);
    return response.data;
  }

  // Alert Rules endpoints
  async createAlertRule(data: any) {
    const response = await this.client.post('/alerts/rules', data);
    return response.data;
  }

  async getAlertRules() {
    const response = await this.client.get('/alerts/rules');
    return response.data;
  }

  async getAlertRule(id: string) {
    const response = await this.client.get(`/alerts/rules/${id}`);
    return response.data;
  }

  async updateAlertRule(id: string, data: any) {
    const response = await this.client.put(`/alerts/rules/${id}`, data);
    return response.data;
  }

  async toggleAlertRule(id: string) {
    const response = await this.client.post(`/alerts/rules/${id}/toggle`);
    return response.data;
  }

  async testAlertRule(id: string) {
    const response = await this.client.post(`/alerts/rules/${id}/test`);
    return response.data;
  }

  async deleteAlertRule(id: string) {
    const response = await this.client.delete(`/alerts/rules/${id}`);
    return response.data;
  }

  // Alert Notifications endpoints
  async getAlertNotifications(status?: string) {
    const params = status ? { status } : {};
    const response = await this.client.get('/alerts/notifications', { params });
    return response.data;
  }

  async getAlertNotification(id: string) {
    const response = await this.client.get(`/alerts/notifications/${id}`);
    return response.data;
  }

  async markNotificationAsRead(id: string) {
    const response = await this.client.post(`/alerts/notifications/${id}/read`);
    return response.data;
  }

  async acknowledgeNotification(id: string) {
    const response = await this.client.post(`/alerts/notifications/${id}/acknowledge`);
    return response.data;
  }

  async resolveNotification(id: string) {
    const response = await this.client.post(`/alerts/notifications/${id}/resolve`);
    return response.data;
  }

  async markAllNotificationsAsRead() {
    const response = await this.client.post('/alerts/notifications/mark-all-read');
    return response.data;
  }

  async getUnreadNotificationCount() {
    const response = await this.client.get('/alerts/notifications/unread-count');
    return response.data;
  }

  // Notification Preferences endpoints
  async getNotificationPreferences() {
    const response = await this.client.get('/alerts/preferences');
    return response.data;
  }

  async updateNotificationPreferences(data: any) {
    const response = await this.client.put('/alerts/preferences', data);
    return response.data;
  }

  // Anomaly Detection endpoints
  async detectAnomalies() {
    const response = await this.client.get('/alerts/anomalies');
    return response.data;
  }

  // Client Management endpoints
  async getClients() {
    const response = await this.client.get('/clients');
    return response.data;
  }

  async getClient(id: string) {
    const response = await this.client.get(`/clients/${id}`);
    return response.data;
  }

  async getClientWithStats(id: string) {
    const response = await this.client.get(`/clients/${id}/stats`);
    return response.data;
  }

  async getClientsSummary() {
    const response = await this.client.get('/clients/summary');
    return response.data;
  }

  async createClient(data: any) {
    const response = await this.client.post('/clients', data);
    return response.data;
  }

  async updateClient(id: string, data: any) {
    const response = await this.client.put(`/clients/${id}`, data);
    return response.data;
  }

  async updateClientStatus(id: string, status: string) {
    const response = await this.client.put(`/clients/${id}/status`, { status });
    return response.data;
  }

  async updateClientSettings(id: string, settings: any) {
    const response = await this.client.put(`/clients/${id}/settings`, settings);
    return response.data;
  }

  async deleteClient(id: string) {
    const response = await this.client.delete(`/clients/${id}`);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
