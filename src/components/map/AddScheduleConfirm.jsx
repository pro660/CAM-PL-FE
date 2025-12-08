// src/components/map/AddScheduleConfirm.jsx
import React from "react";
// 기존 삭제 팝업과 동일 스타일 재사용
import "../../css/calendar/Delete_schdule.css";
import NosmileImg from "../../images/calendar/nosmile.svg"; // 아이콘은 나중에 바꿔도 됨

export default function AddScheduleConfirm({
  visible,
  place,
  onConfirm,
  onCancel,
}) {
  if (!visible) return null;

  const title = place?.name || "";

  return (
    <div className="delete-schedule-overlay">
      <div className="delete-schedule-modal">
        {/* 위쪽 아이콘 */}
        <div className="delete-schedule-icon-wrap">
          <img
            src={NosmileImg}
            alt="일정 추가 안내 아이콘"
            className="delete-schedule-icon"
          />
        </div>

        {/* 안내 문구 */}
        <p className="delete-schedule-message">
          {title
            ? `"${title}"에 일정을 추가하시겠습니까?`
            : "일정을 추가하시겠습니까?"}
        </p>

        {/* 버튼 영역 */}
        <div className="delete-schedule-buttons">
          <button
            type="button"
            className="delete-schedule-confirm"
            onClick={onConfirm}
          >
            추가하기
          </button>
          <button
            type="button"
            className="delete-schedule-cancel"
            onClick={onCancel}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
