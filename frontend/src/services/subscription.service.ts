import axios from 'axios';
import authHeader from './auth-header';
import { API_BASE } from './api';

class SubscriptionService {
  async createCheckoutSession(plan: 'lite' | 'pro'): Promise<{ url: string }> {
    const response = await axios.post(
      `${API_BASE}/stripe/create-checkout-session`,
      { plan },
      { headers: authHeader() }
    );
    return response.data;
  }

  async createPlanChangeSession(plan: 'lite' | 'pro'): Promise<{ url: string }> {
    const response = await axios.post(
      `${API_BASE}/stripe/create-plan-change-session`,
      { plan },
      { headers: authHeader() }
    );
    return response.data;
  }

  async createPortalSession(): Promise<{ url: string }> {
    const response = await axios.post(
      `${API_BASE}/stripe/create-portal-session`,
      {},
      { headers: authHeader() }
    );
    return response.data;
  }
}

export default new SubscriptionService();
