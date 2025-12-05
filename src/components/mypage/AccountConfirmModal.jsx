// src/components/mypage/AccountConfirmModal.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/calendar/Delete_schdule.css"; // 🔥 스타일 재사용
import api from "../../api/axios";

import NosmileImg from "../../images/calendar/nosmile.svg";

const AccountConfirmModal = ({ mode, visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!visible) return null;

  const isLogout = mode === "logout";

  const message = isLogout
    ? "로그아웃 하시겠습니까?"
    : "정말 탈퇴하시겠습니까?";

  const confirmLabel = loading
    ? isLogout
      ? "로그아웃 중..."
      : "탈퇴 중..."
    : "확인";

  const handleCancel = () => {
    if (loading) return;
    onClose?.();
  };

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (isLogout) {
        // 🔥 로그아웃 API 호출
        await api.post("/auth/logout");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      } else {
        // 🔥 회원탈퇴 API 호출
        await api.delete("/auth/unregister");
        localStorage.clear();
      }

      // 팝업 먼저 닫고
      onClose?.();
      // 로그인 화면으로 이동
      navigate("/login", { replace: true });
    } catch (e) {
      console.error(isLogout ? "로그아웃 실패:" : "탈퇴 실패:", e);
      alert(
        isLogout
          ? "로그아웃 중 오류가 발생했어요. 다시 시도해주세요."
          : "탈퇴 처리 중 오류가 발생했어요. 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delete-schedule-overlay">
      <div className="delete-schedule-modal">
        {/* 위쪽 아이콘 */}
        <div className="delete-schedule-icon-wrap">
          <img
            src={NosmileImg}
            alt="확인 안내 아이콘"
            className="delete-schedule-icon"
          />
        </div>

        {/* 안내 문구 */}
        <p className="delete-schedule-message">{message}</p>

        {/* 버튼 영역 */}
        <div className="delete-schedule-buttons">
          <button
            type="button"
            className="delete-schedule-confirm"
            onClick={handleConfirm}
            disabled={loading}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            className="delete-schedule-cancel"
            onClick={handleCancel}
            disabled={loading}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountConfirmModal;
