// src/api/axios.js
import axios from "axios";

const baseURL = process.env.REACT_APP_API_BASE_URL;

if (!baseURL) {
  console.warn("⚠️ REACT_APP_API_BASE_URL이 설정되어 있지 않습니다.");
}

// ✅ 쿠키 기반 인증용 axios 인스턴스
const api = axios.create({
  baseURL,
  withCredentials: true, // 쿠키 자동 포함 (카카오/일반 로그인 후 서버가 심어준 쿠키 전송)
});

// 요청 인터셉터
// - 지금은 추가 헤더 붙일 거 없으니 그대로 통과만 시킴
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터
// - 401, 403 등에 대한 공통 처리(로그, 알림 등)를 원하면 여기서
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 예: 인증 오류 로깅 정도만
    // if (error.response?.status === 401) {
    //   console.warn("인증이 필요합니다.");
    // }
    return Promise.reject(error);
  }
);

export default api;
