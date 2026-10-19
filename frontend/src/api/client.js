import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// 로그인 후 저장된 JWT 출입증이 있으면 모든 요청 헤더에 자동으로 붙여줍니다.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;