// src/components/review/CourseReviewDeleteModal.jsx
import React from "react";
import "../../css/calendar/Delete_schdule.css";
import NosmileImg from "../../images/calendar/nosmile.svg";

export default function CourseReviewDeleteModal({
  visible,
  loading,
  onConfirm,
  onCancel,
}) {
  if (!visible) return null;

  return (
    <div className="delete-schedule-overlay">
      <div className="delete-schedule-modal">
        {/* 위쪽 아이콘 */}
        <div className="delete-schedule-icon-wrap">
          <img
            src={NosmileImg}
            alt="삭제 안내 아이콘"
            className="delete-schedule-icon"
          />
        </div>

        {/* 안내 문구 */}
        <p className="delete-schedule-message">
          해당 강의평을 삭제하시겠습니까?
        </p>

        {/* 버튼 영역 */}
        <div className="delete-schedule-buttons">
          <button
            type="button"
            className="delete-schedule-confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "삭제 중..." : "삭제하기"}
          </button>
          <button
            type="button"
            className="delete-schedule-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
