import React from "react";
import { useNavigate } from "react-router-dom";
import "../../css/login/LoginPage.css";
import LogoImg from "../../images/loginpage/logo.svg";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleClickLogin = () => {
    navigate("/login/form");
  };

  const handleClickSignup = () => {
    navigate("/signup");
  };

  const handleClickKakao = () => {
    // 카카오 로그인 시작 (아래 3️⃣에서 env로 설명)
    window.location.href = process.env.REACT_APP_KAKAO_AUTH_URL;
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
