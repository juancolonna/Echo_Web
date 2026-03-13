import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API;

if (!baseURL) {
  throw new Error('NEXT_PUBLIC_API is not defined in environment variables');
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

let csrfToken: string | null = null;

export const setCsrfToken = (token: string | null) => {
  csrfToken = token;
};

export const hasCsrfToken = () => Boolean(csrfToken);

api.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase();
  const needsCsrf = method && ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  if (needsCsrf && csrfToken) {
    config.headers = config.headers || {};
    config.headers["X-CSRF-Token"] = csrfToken;
  }

  return config;
});

export default api;