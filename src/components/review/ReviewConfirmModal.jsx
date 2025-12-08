// src/components/review/ReviewConfirmModal.jsx
import React from "react";
import "../../css/calendar/Delete_schdule.css";
import NosmileImg from "../../images/calendar/nosmile.svg";

/**
 * 리뷰용 공용 모달
 *
 * props:
 *  - visible: boolean
 *  - message: 모달 본문 텍스트
 *  - confirmText: 확인 버튼 텍스트 (기본: "확인")
 *  - cancelText: 취소 버튼 텍스트 (null/undefined 이면 버튼 숨김)
 *  - loading: 확인 버튼 로딩 상태 (비활성화)
 *  - onConfirm: 확인 클릭 핸들러
 *  - onCancel: 취소 클릭 핸들러
 */
export default function ReviewConfirmModal({
  visible,
  message,
  confirmText = "확인",
  cancelText = "취소",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!visible) return null;

  return (
    <div className="delete-schedule-overlay">
      <div className="delete-schedule-modal">
        <div className="delete-schedule-icon-wrap">
          <img
            src={NosmileImg}
            alt="알림 아이콘"
            className="delete-schedule-icon"
          />
        </div>

        <p className="delete-schedule-message">{message}</p>

        <div className="delete-schedule-buttons">
          <button
            type="button"
            className="delete-schedule-confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmText}
          </button>

          {cancelText && (
            <button
              type="button"
              className="delete-schedule-cancel"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
