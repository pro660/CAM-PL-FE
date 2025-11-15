// src/pages/login/FindAccountPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/login/FindAccountPage.css";
import LogoImg from "../../images/loginpage/logo.svg";
import api from "../../api/axios";

export default function FindAccountPage() {
  const navigate = useNavigate();

  // 탭: "아이디 찾기" | "비밀번호 재설정"
  const [mode, setMode] = useState("findId"); // 'findId' | 'resetPw'

  // 이메일 (앞부분 + 도메인)
  const [emailLocal, setEmailLocal] = useState("");
  const [emailDomain, setEmailDomain] = useState("naver.com");
  const [useCustomDomain, setUseCustomDomain] = useState(false);
  const [customDomain, setCustomDomain] = useState("");

  // 인증번호 관련
  const [emailCode, setEmailCode] = useState("");
  const [emailStep, setEmailStep] = useState("idle"); // idle | codeSent | verified
  const [sendingCode, setSendingCode] = useState(false);

  // 결과 / 상태
  const [foundLoginId, setFoundLoginId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fullEmail = useCustomDomain
    ? `${emailLocal}@${customDomain}`
    : `${emailLocal}@${emailDomain}`;

  const handleBack = () => {
    navigate("/login");
  };

  /* ---------- 탭 전환 ---------- */
  const switchMode = (nextMode) => {
    setMode(nextMode);
    // 탭 전환 시 상태 초기화
    setError("");
    setFoundLoginId(null);
    setEmailCode("");
    setEmailStep("idle");
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
        purpose: mode === "findId" ? "FIND_ID" : "RESET_PASSWORD",
      });
      setEmailStep("codeSent");
    } catch (e) {
      console.error(e);
      const msg =
        e.response?.data?.error || "인증번호 전송 중 오류가 발생했습니다.";
      setError(msg);
    } finally {
      setSendingCode(false);
    }
  };

  const handleResendCode = async () => {
    await handleSendCode();
  };

  /* ---------- 인증번호 '확인' : 여기서 서버에 코드 검증 ---------- */
  const handleVerifyCodeClick = async () => {
    if (!emailCode) {
      setError("인증번호를 입력해주세요.");
      return;
    }
    if (!emailLocal || (!emailDomain && !customDomain)) {
      setError("이메일을 먼저 입력해주세요.");
      return;
    }

    setError("");

    try {
      // 이메일 인증번호 검증 API
      // 성공하면 에러 없이 응답, 실패하면 400 + { error: "..." }
      await api.post("/auth/recovery/find-id", {
        email: fullEmail,
        code: emailCode,
      });

      // 여기까지 왔다는 건 코드가 유효하다는 뜻
      setEmailStep("verified");
    } catch (e) {
      console.error(e);
      const msg =
        e.response?.data?.error || "인증번호 확인 중 오류가 발생했습니다.";
      setError(msg);
      setEmailStep("codeSent"); // 다시 시도 가능 상태
    }
  };

  /* ---------- 하단 메인 버튼(아이디 찾기 / 비번 재설정) ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFoundLoginId(null);

    if (!emailLocal || (!emailDomain && !customDomain)) {
      setError("이메일을 입력해주세요.");
      return;
    }
    if (!emailCode) {
      setError("인증번호를 입력해주세요.");
      return;
    }
    // ✅ 여기서 emailStep이 verified인지 체크 → 잘못된 코드면 아예 진행 불가
    if (emailStep !== "verified") {
      setError("먼저 인증번호 확인 버튼을 눌러, 코드를 검증해주세요.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "findId") {
        // 아이디 찾기 API (코드 검증 + 아이디 반환)
        const { data } = await api.post("/auth/recovery/find-id", {
          email: fullEmail,
          code: emailCode,
        });

        if (data?.loginId) {
          setFoundLoginId(data.loginId);
          setError("");
        } else {
          setFoundLoginId(null);
          setError("해당 이메일로 가입된 아이디를 찾을 수 없습니다.");
        }
      } else {
        // 비밀번호 재설정: 여기까지 온 시점에 이미 코드 검증 완료
        // → 비밀번호 설정 페이지로 이동
        navigate("/login/reset-password", {
          state: { email: fullEmail, code: emailCode },
        });
      }
    } catch (e) {
      console.error(e);
      const msg =
        e.response?.data?.error || "요청 처리 중 오류가 발생했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoLogin = () => {
    navigate("/login/form", {
      state: { loginId: foundLoginId || "" },
    });
  };

  return (
    <div className="find-page">
      <div className="find-inner">
        {/* 상단 헤더 (뒤로가기 + 로고) */}
        <header className="find-header">
          <button
            type="button"
            className="find-back-button"
            onClick={handleBack}
            aria-label="뒤로가기"
          >
            <span className="find-back-icon" />
          </button>

          <div className="find-logo-area">
            <div className="find-logo-circle">
              <img
                src={LogoImg}
                alt="캠플 로고"
                className="find-logo-image"
              />
            </div>
          </div>
        </header>

        {/* 탭 영역 */}
        <div className="find-tabs">
          <button
            type="button"
            className={
              mode === "findId"
                ? "find-tab find-tab-active"
                : "find-tab find-tab-inactive"
            }
            onClick={() => switchMode("findId")}
          >
            아이디 찾기
          </button>
          <button
            type="button"
            className={
              mode === "resetPw"
                ? "find-tab find-tab-active"
                : "find-tab find-tab-inactive"
            }
            onClick={() => switchMode("resetPw")}
          >
            비밀번호 재설정
          </button>
        </div>
        <div className="find-tab-indicator">
          <div
            className={
              mode === "findId"
                ? "find-tab-bar find-tab-bar-left"
                : "find-tab-bar find-tab-bar-right"
            }
          />
        </div>

        {/* 폼 영역 */}
        <form className="find-form" onSubmit={handleSubmit}>
          {mode === "findId" && foundLoginId ? (
            <>
              {/* ✅ 아이디 찾기 결과 화면 */}
              <p className="find-result-message">
                정보와 일치하는 아이디입니다.
              </p>
              <div className="find-result-box">{foundLoginId}</div>

              {error && <div className="find-error">{error}</div>}

              <button
                type="button"
                className="find-submit-button"
                onClick={handleGoLogin}
              >
                로그인 하러가기
              </button>
            </>
          ) : (
            <>
              {/* 이메일 + 인증번호 입력 UI */}
              <label className="find-label" htmlFor="find-email-local">
                이메일
              </label>

              <div className="find-email-row">
                <div className="find-input-wrapper find-email-local-wrapper">
                  <input
                    id="find-email-local"
                    type="text"
                    value={emailLocal}
                    onChange={(e) => {
                      setEmailLocal(e.target.value);
                      setEmailStep("idle");
                    }}
                    placeholder="이메일"
                    className="find-input"
                    autoComplete="off"
                  />
                </div>
                <span className="find-email-at">@</span>
                <div className="find-email-domain-wrapper">
                  {!useCustomDomain ? (
                    <select
                      className="find-email-select"
                      value={emailDomain}
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          setUseCustomDomain(true);
                          setEmailDomain("");
                        } else {
                          setUseCustomDomain(false);
                          setEmailDomain(e.target.value);
                          setEmailStep("idle");
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
                      className="find-email-custom-input"
                      placeholder="도메인 입력"
                      value={customDomain}
                      onChange={(e) => {
                        setCustomDomain(e.target.value);
                        setEmailStep("idle");
                      }}
                    />
                  )}
                </div>
              </div>

              {/* 인증번호 발송 */}
              <button
                type="button"
                className="find-send-code-button"
                onClick={handleSendCode}
                disabled={sendingCode}
              >
                {sendingCode ? "전송중..." : "인증번호 발송"}
              </button>

              {/* 인증번호 입력 + 확인 */}
              <div className="find-code-row">
                <div className="find-input-wrapper find-code-input-wrapper">
                  <input
                    type="text"
                    value={emailCode}
                    onChange={(e) => {
                      setEmailCode(e.target.value);
                      if (emailStep === "verified") setEmailStep("codeSent");
                    }}
                    placeholder="인증번호를 입력하세요."
                    className="find-input"
                  />
                </div>
                <button
                  type="button"
                  className={
                    emailStep === "verified"
                      ? "find-code-confirm-button find-code-confirm-button-done"
                      : "find-code-confirm-button"
                  }
                  onClick={handleVerifyCodeClick}
                >
                  {emailStep === "verified" ? "확인완료" : "확인"}
                </button>
              </div>

              {/* 에러 메시지 */}
              {error && <div className="find-error">{error}</div>}

              {/* 하단 버튼 */}
              <button
                type="submit"
                className="find-submit-button"
                disabled={loading}
              >
                {loading
                  ? mode === "findId"
                    ? "아이디 찾는 중..."
                    : "처리 중..."
                  : mode === "findId"
                  ? "아이디 찾기"
                  : "비밀번호 재설정"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
