// src/components/calendar/Delete_schdule.jsx
import React, { useState } from "react";
import "../../css/calendar/Delete_schdule.css";
import api from "../../api/axios";

import NosmileImg from "../../images/calendar/nosmile.svg"

const Delete_schdule = ({ visible, eventId, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const handleCancel = () => {
    if (loading) return;
    onClose?.();
  };

  const handleConfirm = async () => {
    if (!eventId || loading) return;
    setLoading(true);

    try {
      await api.delete(`/calendar/events/${eventId}`);

      // 부모 쪽에서 리스트 갱신, 메모시트 닫기 등 처리
      onDeleted?.(eventId);
      onClose?.();
    } catch (e) {
      console.error("일정 삭제 실패:", e);
      // 실패해도 일단 팝업만 닫고 싶으면 여기서 onClose만 호출해도 됨
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delete-schedule-overlay">
      <div className="delete-schedule-modal">
        {/* 위쪽 아이콘 (svg 넣을 자리) */}
        <div className="delete-schedule-icon-wrap">
          {/* TODO: 실제 svg 경로로 교체 */}
          <img
            src={NosmileImg}
            alt="삭제 안내 아이콘"
            className="delete-schedule-icon"
          />
        </div>

        {/* 안내 문구 */}
        <p className="delete-schedule-message">
          해당 일정을 삭제하시겠습니까?
        </p>

        {/* 버튼 영역 */}
        <div className="delete-schedule-buttons">
          <button
            type="button"
            className="delete-schedule-confirm"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "삭제 중..." : "확인"}
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

export default Delete_schdule;
