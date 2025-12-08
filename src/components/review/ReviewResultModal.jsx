// src/components/review/ReviewResultModal.jsx
import React from "react";
import "../../css/calendar/Delete_schdule.css";
import NosmileImg from "../../images/calendar/nosmile.svg";

export default function ReviewResultModal({ visible, message, onClose }) {
  if (!visible) return null;

  return (
    <div className="delete-schedule-overlay">
      <div className="delete-schedule-modal">
        {/* 위쪽 아이콘 */}
        <div className="delete-schedule-icon-wrap">
          <img
            src={NosmileImg}
            alt="안내 아이콘"
            className="delete-schedule-icon"
          />
        </div>

        {/* 메시지 */}
        <p className="delete-schedule-message">{message}</p>

        {/* 버튼 한 개만 사용 */}
        <div className="delete-schedule-buttons">
          <button
            type="button"
            className="delete-schedule-confirm"
            onClick={onClose}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
