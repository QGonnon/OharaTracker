import axios from 'axios';
import authHeader from './auth-header';

const getApiBase = (): string =>
  import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`;

class SubscriptionService {
  async createCheckoutSession(plan: 'lite' | 'pro'): Promise<{ url: string }> {
    const response = await axios.post(
      `${getApiBase()}/stripe/create-checkout-session`,
      { plan },
      { headers: authHeader() }
    );
    return response.data;
  }

  async createPortalSession(): Promise<{ url: string }> {
    const response = await axios.post(
      `${getApiBase()}/stripe/create-portal-session`,
      {},
      { headers: authHeader() }
    );
    return response.data;
  }
}

export default new SubscriptionService();
