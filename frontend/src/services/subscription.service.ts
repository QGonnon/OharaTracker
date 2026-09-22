import axios from 'axios';
import authHeader from './auth-header';
import { API_BASE } from './api';

// `locale` sert à Stripe pour construire l'URL de retour : les routes du site sont
// traduites et préfixées par la langue, donc le serveur ne peut pas la deviner.
class SubscriptionService {
  async createCheckoutSession(plan: 'lite' | 'pro', locale: string): Promise<{ url: string }> {
    const response = await axios.post(
      `${API_BASE}/stripe/create-checkout-session`,
      { plan, locale },
      { headers: authHeader() }
    );
    return response.data;
  }

  async createPlanChangeSession(plan: 'lite' | 'pro', locale: string): Promise<{ url: string }> {
    const response = await axios.post(
      `${API_BASE}/stripe/create-plan-change-session`,
      { plan, locale },
      { headers: authHeader() }
    );
    return response.data;
  }

  async createPortalSession(locale: string): Promise<{ url: string }> {
    const response = await axios.post(
      `${API_BASE}/stripe/create-portal-session`,
      { locale },
      { headers: authHeader() }
    );
    return response.data;
  }
}

export default new SubscriptionService();
