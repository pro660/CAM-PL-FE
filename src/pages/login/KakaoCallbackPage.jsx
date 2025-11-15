// src/pages/login/KakaoCallbackPage.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/login/KakaoCallbackPage.css";
import { useAuth } from "../../context/AuthContext";

export default function KakaoCallbackPage() {
  const navigate = useNavigate();
  const { loginWithRefresh } = useAuth();

  useEffect(() => {
  (async () => {
    try {
      const res = await loginWithRefresh();   // 내부에서 /auth/refresh 호출
      console.log("refresh 성공:", res);
      navigate("/", { replace: true });
    } catch (e) {
      console.error("카카오 로그인 처리 중 오류", e);
      alert(
        "카카오 로그인 처리 중 오류가 발생했습니다.\n" +
        "브라우저 개발자도구 Network에서 /auth/refresh 응답을 캡처해서 백엔드에 보내줘."
      );
      navigate("/login", { replace: true });
    }
  })();
}, [loginWithRefresh, navigate]);

  return (
    <div className="kakao-callback-page">
      <div className="kakao-callback-inner">
        <p className="kakao-callback-text">카카오 로그인 처리 중입니다...</p>
      </div>
    </div>
  );
}
