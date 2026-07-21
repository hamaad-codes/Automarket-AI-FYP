// Centralized API configuration for AutoMarket AI
// In production (Render/Vercel), VITE_API_URL will be set to the live backend URL.
// In local development, it falls back to http://localhost:5001.

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Socket.io connects to the root backend URL (without /api)
export const SOCKET_URL = API_BASE_URL.endsWith('/api')
  ? API_BASE_URL.slice(0, -4)
  : API_BASE_URL;
