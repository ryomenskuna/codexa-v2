const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const getAuthToken = () => {
  return localStorage.getItem("token");
};

const buildHeaders = (extra = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...extra,
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const handleResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (data && data.message) || `Request failed with status ${response.status}`;

    if (response.status === 401) {
      // Token invalid/expired – clear and let UI react
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    throw new Error(message);
  }

  return data;
};

export const apiClient = {
  get: async (path) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });
    return handleResponse(res);
  },

  post: async (path, body) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: buildHeaders(),
      credentials: "include",
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
};

