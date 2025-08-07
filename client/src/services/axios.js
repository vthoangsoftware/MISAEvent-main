import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin',
    // Các headers khác nếu cần thiết
  },
});

export default apiClient;