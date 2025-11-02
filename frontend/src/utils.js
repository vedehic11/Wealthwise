// Use a single SERVER_URL export. Automatically detects production vs development
// In production (Vercel), uses relative /api path
// In development, uses localhost
const getServerUrl = () => {
  // Check if we're in production (Vercel)
  if (import.meta.env.PROD) {
    // In production, backend is at /api (handled by Vercel routing)
    return import.meta.env.VITE_API_URL || '/api';
  }
  // In development, use localhost
  return import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
};

export const SERVER_URL = getServerUrl();
