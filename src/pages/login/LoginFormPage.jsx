// src/pages/login/LoginFormPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/login/LoginFormPage.css";
import LogoImg from "../../images/loginpage/logo.svg";
import api, { setAuth } from "../../api/axios"; // ✅ 단일 camp_auth 저장용

// 눈 아이콘 이미지
import EyeOpenIcon from "../../images/loginpage/icon-eye-open.svg";
import EyeClosedIcon from "../../images/loginpage/icon-eye-closed.svg";

export default function LoginFormPage() {
  const navigate = useNavigate();

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!id.trim() || !password.trim()) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      // ✅ 실제 로그인 API 호출
      const { data } = await api.post("/auth/login", {
        loginId: id.trim(),
        password,
      });

      // data 예시:
      // {
      //   "accessToken": "...",
      //   "id": 8,
      //   "loginId": "test1234",
      //   "name": "test1234",
      //   "email": "op9563_2@naver.com",
      //   "provider": "LOCAL"
      // }

      // ✅ 예전 키들 싹 정리 (한 번 정리해두면 스토리지 안 지저분해짐)
      localStorage.removeItem("auth");
      localStorage.removeItem("camp_access_token");
      localStorage.removeItem("camp_user");

      // ✅ camp_auth 하나에 accessToken + 유저 정보 통째로 저장
      setAuth(data);

      // 로그인 성공 → 홈으로 이동
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "아이디 또는 비밀번호를 확인해주세요.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClickFindAccount = () => {
    navigate("/login/find");
  };

  const handleClickSignup = () => {
    navigate("/signup");
  };

  const togglePasswordVisible = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="login-form-page">
      <div className="login-form-inner">
        {/* 상단 헤더 (뒤로가기 + 로고) */}
        <header className="login-form-header">
          <button
            type="button"
            className="login-form-back-button"
            onClick={handleBack}
            aria-label="뒤로가기"
          >
            <span className="login-form-back-icon" />
          </button>

          <div className="login-form-logo-area">
            <div className="login-form-logo-circle">
              <img
                src={LogoImg}
                alt="캠플 로고"
                className="login-form-logo-image"
              />
            </div>
          </div>
        </header>

        {/* 폼 영역 */}
        <form className="login-form-body" onSubmit={handleSubmit}>
          {/* 아이디 필드 */}
          <div className="login-form-field">
            <label className="login-form-label" htmlFor="login-id">
              아이디
            </label>
            <div className="login-form-input-wrapper">
              <input
                id="login-id"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="아이디를 입력해주세요."
                className="login-form-input"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* 비밀번호 필드 */}
          <div className="login-form-field">
            <label className="login-form-label" htmlFor="login-password">
              비밀번호
            </label>
            <div className="login-form-input-wrapper">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="login-form-input login-form-input-password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-form-password-toggle"
                onClick={togglePasswordVisible}
                aria-label={
                  showPassword ? "비밀번호 숨기기" : "비밀번호 보기"
                }
              >
                <img
                  src={showPassword ? EyeOpenIcon : EyeClosedIcon}
                  alt={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  className="login-form-password-icon"
                />
              </button>
            </div>
          </div>

          {error && <div className="login-form-error">{error}</div>}

          {/* 시작하기 버튼 */}
          <button
            type="submit"
            className="login-form-submit-button"
            disabled={loading}
          >
            {loading ? "시작하는 중..." : "시작하기"}
          </button>
        </form>

        {/* 아래 링크 영역 */}
        <div className="login-form-footer">
          <button
            type="button"
            className="login-form-link"
            onClick={handleClickFindAccount}
          >
            아이디/ 비밀번호 찾기
          </button>
          <button
            type="button"
            className="login-form-link"
            onClick={handleClickSignup}
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}
