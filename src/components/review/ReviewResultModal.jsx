// src/components/review/ReviewResultModal.jsx
import React from "react";
import "../../css/review/ReviewResultModal.css";

export default function ReviewResultModal({ visible, message, onClose }) {
  if (!visible) return null;

  return (
    <div className="review-result-overlay">
      <div className="review-result-modal">
        {/* 위쪽 아이콘 영역 (배경 이미지는 CSS에서 지정) */}
        <div className="review-result-icon-wrap">
          <div className="review-result-icon" />
        </div>

        {/* 메시지 */}
        <p className="review-result-message">{message}</p>

        {/* 확인 버튼 */}
        <button
          type="button"
          className="review-result-button"
          onClick={onClose}
        >
          확인
        </button>
      </div>
    </div>
  );
}
