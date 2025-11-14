// src/api/axios.js
import axios from "axios";

const baseURL = process.env.REACT_APP_API_BASE_URL;

if (!baseURL) {
  console.warn("⚠️ REACT_APP_API_BASE_URL이 설정되어 있지 않습니다.");
}

const api = axios.create({
  baseURL,
});

/**
 * 요청 인터셉터
 * - localStorage에 저장된 accessToken을 Authorization 헤더에 자동으로 붙임
 */
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("camp_access_token");
    if (accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 (지금은 공통 로깅 정도만, 필요하면 확장)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 예: 401일 때 처리하고 싶으면 여기서
    // if (error.response?.status === 401) { ... }
    return Promise.reject(error);
  }
);

export default api;
