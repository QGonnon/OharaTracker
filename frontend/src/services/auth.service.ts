import axios from 'axios';
import { API_BASE } from './api';

const API_URL = `${API_BASE}/auth/`;

class AuthService {
  login(user: any) {
    return axios
      .post(API_URL + 'signin', {
        email: user.email,
        password: user.password
      })
      .then(response => {
        if (response.data.accessToken) {
          localStorage.setItem('user', JSON.stringify(response.data));
        }

        return response.data;
      });
  }

  logout() {
    localStorage.removeItem('user');
  }

  register(user: any) {
    return axios.post(API_URL + 'signup', {
      username: user.username,
      email: user.email,
      password: user.password
    });
  }

  getMe() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const headers = user?.accessToken ? { Authorization: `Bearer ${user.accessToken}` } : {};
    return axios.get(API_URL + 'me', { headers }).then(r => r.data);
  }

  updateProfile(data: { username?: string; email?: string; }) {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const headers = user?.accessToken ? { Authorization: `Bearer ${user.accessToken}` } : {};
    return axios.put(API_URL + 'profile', data, { headers }).then(response => {
      if (response.data.accessToken) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    });
  }

  changePassword(data: { currentPassword: string; newPassword: string }) {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const headers = user?.accessToken ? { Authorization: `Bearer ${user.accessToken}` } : {};
    return axios.post(API_URL + 'change-password', data, { headers }).then(r => r.data);
  }

  googleLogin(credential: string) {
    return axios
      .post(API_URL + 'google', {
        credential: credential
      })
      .then(response => {
        if (response.data.accessToken) {
          localStorage.setItem('user', JSON.stringify(response.data));
        }

        return response.data;
      });
  }
}

export default new AuthService();

