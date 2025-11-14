// src/pages/login/SignupPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/login/SignupPage.css";
import LogoImg from "../../images/loginpage/logo.svg";
import EyeOpenIcon from "../../images/loginpage/icon-eye-open.svg";
import EyeClosedIcon from "../../images/loginpage/icon-eye-closed.svg";
import api from "../../api/axios";

export default function SignupPage() {
  const navigate = useNavigate();

  // 폼 상태들
  const [loginId, setLoginId] = useState("");
  const [idCheckStatus, setIdCheckStatus] = useState("idle"); // idle | checking | ok | fail

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [emailLocal, setEmailLocal] = useState("");
  const [emailDomain, setEmailDomain] = useState("naver.com");
  const [customDomain, setCustomDomain] = useState("");
  const [useCustomDomain, setUseCustomDomain] = useState(false);

  const [emailCode, setEmailCode] = useState("");
  const [emailStep, setEmailStep] = useState("idle"); // idle | codeSent | verified
  const [sendingCode, setSendingCode] = useState(false);

  const [locationAgree, setLocationAgree] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fullEmail = useCustomDomain
    ? `${emailLocal}@${customDomain}`
    : `${emailLocal}@${emailDomain}`;

  const handleBack = () => {
    navigate("/login");
  };

  /* ---------- 유효성 검증 ---------- */

  // 아이디: 4~12자, 영문 소문자 + 숫자
  const isValidLoginId = (value) => /^[a-z0-9]{4,12}$/.test(value);

  // 비밀번호: 6~20자, 대문자/소문자/숫자/특수문자 중 2가지 이상 조합
  const isValidPassword = (value) => {
    if (value.length < 6 || value.length > 20) return false;
    const hasLower = /[a-z]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasDigit = /[0-9]/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);
    const kinds = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean)
      .length;
    return kinds >= 2;
  };

  /* ---------- 아이디 중복확인 ---------- */
  const handleCheckId = async () => {
    if (!isValidLoginId(loginId)) {
      setError("아이디 형식을 다시 확인해주세요.");
      return;
    }

    setError("");
    setIdCheckStatus("checking");

    try {
      const { data } = await api.get("/auth/id/check", {
        params: { loginId },
      });

      if (data.available) {
        setIdCheckStatus("ok");
      } else {
        setIdCheckStatus("fail");
        setError("이미 사용 중인 아이디입니다.");
      }
    } catch (e) {
      console.error(e);
      setIdCheckStatus("idle");
      setError("아이디 중복확인 중 오류가 발생했습니다.");
    }
  };

  /* ---------- 이메일 인증번호 발송 ---------- */
  const handleSendCode = async () => {
    if (!emailLocal || (!emailDomain && !customDomain)) {
      setError("이메일을 입력해주세요.");
      return;
    }
    setError("");
    setSendingCode(true);

    try {
      await api.post("/auth/email/send-code", {
        email: fullEmail,
        purpose: "SIGNUP",
      });
      setEmailStep("codeSent");
    } catch (e) {
      console.error(e);
      setError("인증번호 전송 중 오류가 발생했습니다.");
    } finally {
      setSendingCode(false);
    }
  };

  /* ---------- 이메일 인증번호 재발송 ---------- */
  const handleResendCode = async () => {
    await handleSendCode();
  };

  /* ---------- 이메일 인증번호 '확인' (프론트 상태만 변경) ---------- */
  const handleVerifyCode = () => {
    if (!emailCode) {
      setError("인증번호를 입력해주세요.");
      return;
    }
    setError("");
    setEmailStep("verified");
  };

  /* ---------- 위치정보 동의 ---------- */
  const toggleLocationAgree = () => {
    setLocationAgree((prev) => !prev);
  };

  const openLocationModal = () => {
    setShowLocationModal(true);
  };

  const closeLocationModal = () => {
    setShowLocationModal(false);
  };

  const handleAgreeLocation = () => {
    setLocationAgree(true);
    setShowLocationModal(false);
  };

  /* ---------- 회원가입 ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidLoginId(loginId)) {
      setError("아이디는 4~12자의 영문 소문자/숫자 조합이어야 합니다.");
      return;
    }

    if (!isValidPassword(password)) {
      setError(
        "비밀번호는 6~20자, 영문 대소문자/숫자/특수문자 중 2가지 이상 조합이어야 합니다."
      );
      return;
    }

    if (password !== passwordConfirm) {
      setError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    if (!emailLocal || (!emailDomain && !customDomain)) {
      setError("이메일을 입력해주세요.");
      return;
    }

    if (!emailCode) {
      setError("이메일 인증번호를 입력해주세요.");
      return;
    }

    if (emailStep !== "verified") {
      setError("이메일 인증을 완료해주세요.");
      return;
    }

    if (!locationAgree) {
      setError("위치 정보 사용 동의에 체크해주세요.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/auth/signup", {
        loginId,
        email: fullEmail,
        password,
        passwordConfirm,
        code: emailCode,
      });

      if (data && data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      navigate("/login", { replace: true });
    } catch (e) {
      console.error(e);
      const msg =
        e.response?.data?.error || "회원가입 중 오류가 발생했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-inner">
        {/* 상단 헤더 (뒤로가기 + 로고 + 타이틀) */}
        <header className="signup-header">
          <button
            type="button"
            className="signup-back-button"
            onClick={handleBack}
            aria-label="뒤로가기"
          >
            <span className="signup-back-icon" />
          </button>

          <div className="signup-logo-area">
            <div className="signup-logo-circle">
              <img
                src={LogoImg}
                alt="캠플 로고"
                className="signup-logo-image"
              />
            </div>
            <p className="signup-title">회원가입</p>
          </div>
        </header>

        {/* 폼 영역 */}
        <form className="signup-form" onSubmit={handleSubmit}>
          {/* 아이디 */}
          <section className="signup-section">
            <label className="signup-label" htmlFor="signup-id">
              아이디
            </label>
            <div className="signup-id-row">
              <div className="signup-input-wrapper">
                <input
                  id="signup-id"
                  type="text"
                  value={loginId}
                  onChange={(e) => {
                    setLoginId(e.target.value);
                    setIdCheckStatus("idle");
                  }}
                  placeholder="아이디"
                  className="signup-input"
                  autoComplete="off"
                  required
                />
              </div>
              <button
                type="button"
                className="signup-id-check-button"
                onClick={handleCheckId}
              >
                {idCheckStatus === "checking"
                  ? "확인중..."
                  : idCheckStatus === "ok"
                  ? "사용가능"
                  : "중복확인"}
              </button>
            </div>
            <p className="signup-helper-text">
              4~12자 / 영문 소문자 (숫자 조합 가능)
            </p>
          </section>

          {/* 비밀번호 */}
          <section className="signup-section">
            <label className="signup-label" htmlFor="signup-password">
              비밀번호
            </label>

            {/* 비밀번호 입력 */}
            <div className="signup-input-wrapper">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="signup-input signup-input-password"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="signup-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                <img
                  src={showPassword ? EyeOpenIcon : EyeClosedIcon}
                  alt={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  className="signup-password-icon"
                />
              </button>
            </div>

            {/* 비밀번호 확인 */}
            <div className="signup-input-wrapper">
              <input
                id="signup-password-confirm"
                type={showPasswordConfirm ? "text" : "password"}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호 확인"
                className="signup-input signup-input-password"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="signup-password-toggle"
                onClick={() => setShowPasswordConfirm((prev) => !prev)}
              >
                <img
                  src={showPasswordConfirm ? EyeOpenIcon : EyeClosedIcon}
                  alt={
                    showPasswordConfirm ? "비밀번호 숨기기" : "비밀번호 보기"
                  }
                  className="signup-password-icon"
                />
              </button>
            </div>

            <p className="signup-helper-text">
              6~20자 / 영문 대문자, 소문자, 숫자, 특수문자 중 2가지 이상 조합
            </p>
          </section>

          {/* 이메일 */}
          <section className="signup-section">
            <label className="signup-label" htmlFor="signup-email-local">
              이메일
            </label>

            {/* 이메일 앞부분 + 도메인 */}
            <div className="signup-email-row">
              <div className="signup-input-wrapper signup-email-local-wrapper">
                <input
                  id="signup-email-local"
                  type="text"
                  value={emailLocal}
                  onChange={(e) => setEmailLocal(e.target.value)}
                  placeholder="이메일"
                  className="signup-input"
                  autoComplete="off"
                />
              </div>
              <span className="signup-email-at">@</span>
              <div className="signup-email-domain-wrapper">
                {!useCustomDomain ? (
                  <select
                    className="signup-email-select"
                    value={emailDomain}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setUseCustomDomain(true);
                        setEmailDomain("");
                      } else {
                        setEmailDomain(e.target.value);
                        setUseCustomDomain(false);
                      }
                    }}
                  >
                    <option value="naver.com">naver.com</option>
                    <option value="gmail.com">gmail.com</option>
                    <option value="hanmail.net">hanmail.net</option>
                    <option value="custom">직접입력</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    className="signup-email-custom-input"
                    placeholder="도메인 입력"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* 인증번호 받기 / 재발송 + 확인 */}
            {emailStep === "idle" && (
              <button
                type="button"
                className="signup-email-send-button"
                onClick={handleSendCode}
                disabled={sendingCode}
              >
                {sendingCode ? "전송중..." : "인증번호 받기"}
              </button>
            )}

            {emailStep !== "idle" && (
              <>
                {/* 인증번호 입력칸 */}
                <div className="signup-input-wrapper signup-email-code-wrapper">
                  <input
                    type="text"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    placeholder="인증번호를 입력해주세요."
                    className="signup-input"
                  />
                </div>

                <div className="signup-email-code-actions">
                  <button
                    type="button"
                    className="signup-email-resend-button"
                    onClick={handleResendCode}
                    disabled={sendingCode}
                  >
                    {sendingCode ? "전송중..." : "재발송"}
                  </button>
                  <button
                    type="button"
                    className="signup-email-verify-button"
                    onClick={handleVerifyCode}
                  >
                    {emailStep === "verified" ? "인증완료" : "인증번호 확인"}
                  </button>
                </div>
              </>
            )}
          </section>

          {/* 위치정보 사용 동의 */}
          <section className="signup-section signup-location-section">
            <div className="signup-location-row">
              {/* 체크박스: 클릭 시 체크 온/오프만 */}
              <button
                type="button"
                className="signup-location-checkbox-button"
                onClick={toggleLocationAgree}
                aria-label="위치 정보 사용 동의 체크"
              >
                <span
                  className={
                    locationAgree
                      ? "signup-location-checkbox signup-location-checkbox-checked"
                      : "signup-location-checkbox"
                  }
                >
                  {locationAgree && (
                    <span className="signup-location-check" />
                  )}
                </span>
              </button>

              {/* 텍스트 + 자세히 보기(팝업) */}
              <span className="signup-location-label">
                위치 정보 사용 동의
                <button
                  type="button"
                  className="signup-location-detail"
                  onClick={openLocationModal}
                >
                  자세히 보기
                </button>
              </span>
            </div>
          </section>

          {/* 에러 메시지 */}
          {error && <div className="signup-error">{error}</div>}

          {/* 가입 버튼 */}
          <button
            type="submit"
            className="signup-submit-button"
            disabled={loading}
          >
            {loading ? "가입 중..." : "가입"}
          </button>
        </form>
      </div>

      {/* 위치정보 동의 모달 */}
      {showLocationModal && (
        <div className="signup-modal-backdrop" onClick={closeLocationModal}>
          <div className="signup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="signup-modal-header">
              <h2 className="signup-modal-title">위치 정보 사용 동의</h2>
              <button
                type="button"
                className="signup-modal-close"
                onClick={closeLocationModal}
                aria-label="닫기"
              >
                <span className="signup-modal-close-icon" />
              </button>
            </div>

            <div className="signup-modal-body">
              <p>
                캠플이 사용자님의 캠쁠 생활을 더욱 스마트하게 지원해
                드릴 수 있도록 위치 정보 동의가 필요해요. ✨
              </p>
              <p>
                캠플은 사용자님의 현재 위치를 기반으로 캠퍼스 지도에서
                내 일정을 정확히 안내하고, AI가 가장 적절한 장소를 추천해
                드리는 핵심 기능을 제공합니다. 이 기능을 최대한 활용하시고
                더욱 개인화된 편리함을 경험하실 수 있도록 위치 정보
                사용에 동의해 주시면 감사하겠습니다.
              </p>
              <p>
                고객님의 소중한 위치 정보는 오직 캠플 서비스 개선을 위해서만
                안전하게 사용될 것을 약속드립니다. 🙂
              </p>
            </div>

            <button
              type="button"
              className="signup-modal-confirm-full"
              onClick={handleAgreeLocation}
            >
              동의하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
