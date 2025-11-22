// src/pages/auth/LoginPage.jsx (또는 기존 경로에 맞게 이름만 맞춰줘)
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/login/LoginPage.css";
import LogoImg from "../../images/loginpage/logo.svg";
import { AUTH_STORAGE_KEY } from "../../api/axios";

export default function LoginPage() {
  const navigate = useNavigate();

  // ✅ 예전에 쓰던 키들 자동 정리 (auth, camp_access_token, camp_user 등)
  useEffect(() => {
    // camp_auth만 남기고 나머지는 싹 제거
    const keepKeys = new Set([AUTH_STORAGE_KEY]);

    Object.keys(localStorage).forEach((key) => {
      if (!keepKeys.has(key) && key.startsWith("camp_")) {
        localStorage.removeItem(key);
      }
    });

    // 완전 옛날 이름까지 정리
    localStorage.removeItem("auth");
    localStorage.removeItem("camp_access_token");
    localStorage.removeItem("camp_user");
  }, []);

  // 빌드 시점에 환경변수에서 한 번만 읽어옴
  const apiBase = process.env.REACT_APP_API_BASE_URL || "";
  // 우선순위: KAKAO_AUTH_URL 직접 지정 > API_BASE_URL + 고정 path
  const kakaoAuthUrl =
    process.env.REACT_APP_KAKAO_AUTH_URL ||
    (apiBase ? `${apiBase}/oauth2/authorization/kakao` : "");

  const handleClickLogin = () => {
    navigate("/login/form");
  };

  const handleClickSignup = () => {
    navigate("/signup");
  };

  const handleClickKakao = () => {
    if (!kakaoAuthUrl) {
      console.error("⚠️ 카카오 로그인 URL이 설정되어 있지 않습니다.");
      alert("카카오 로그인 설정이 잘못되었습니다. 관리자에게 문의해주세요.");
      return;
    }

    // ✅ 카카오 로그인: 백엔드 OAuth 엔드포인트로 바로 이동
    window.location.href = kakaoAuthUrl;
  };

  return (
    <div className="login-page">
      <div className="login-inner">
        {/* 로고 영역 */}
        <div className="login-logo-area">
          <div className="login-logo-rings">
            <div className="login-logo-ring-inner" />
            <div className="login-logo-circle">
              <img
                src={LogoImg}
                alt="캠플 로고"
                className="login-logo-image"
              />
            </div>
          </div>
        </div>

        {/* 가운데 설명 텍스트 */}
        <div className="login-middle">
          <p className="login-description">
            캠플은 당신의 편리한 학교생활을 지향합니다.
          </p>
        </div>

        {/* 하단 영역 */}
        <div className="login-bottom">
          <div className="login-buttons">
            <div className="login-primary-wrapper">
              <button
                type="button"
                className="login-button-primary"
                onClick={handleClickLogin}
              >
                로그인
              </button>
              <button
                type="button"
                className="login-link-signup"
                onClick={handleClickSignup}
              >
                회원가입
              </button>
            </div>

            <button
              type="button"
              className="login-button-kakao"
              onClick={handleClickKakao}
            >
              <span className="login-kakao-icon" />
              <span className="login-kakao-text">카카오로 시작하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
