// src/components/calendar/CalendarMemoBottomSheet.jsx
import React, { useEffect, useState } from "react";
import "../../css/calendar/CalendarMemoBottomSheet.css";

import EMPTY_MEMO_ICON from "../../images/calendar/nomemo.svg";
import EDIT_ICON from "../../images/calendar/edit.svg";
import Trash_ICON from "../../images/calendar/trash.svg";

// 🔥 새로 import
import Delete_schdule from "./Delete_schdule";

function getCategoryLabel(category) {
  // ... (생략: 기존 그대로)
}

function formatTimeRange(startIso, endIso) {
  // ... (생략: 기존 그대로)
}

export default function CalendarMemoBottomSheet({
  visible,
  event,
  onClose,
  onSave,
  onRequestEdit,
}) {
  const [memoText, setMemoText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false); // 🔥 추가

  useEffect(() => {
    if (!visible || !event) return;
    const base = event.description ?? event.memo ?? "";
    setMemoText(base);
  }, [visible, event]);

  if (!visible || !event) return null;

  const handleChange = (e) => {
    setMemoText(e.target.value);
  };

  const commitAndClose = () => {
    const trimmed = memoText.trim();
    if (onSave) onSave(trimmed);
    if (onClose) onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      commitAndClose();
    }
  };

  const isEmpty = memoText.trim().length === 0;

  const handleClickEdit = () => {
    const trimmed = memoText.trim();
    if (onSave) onSave(trimmed);
    if (onRequestEdit) {
      onRequestEdit(event);
    } else if (onClose) {
      onClose();
    }
  };

  // 🔥 쓰레기통 눌렀을 때: 삭제 팝업 open
  const handleClickDelete = (e) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  // 🔥 삭제 팝업 닫기
  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
  };

  // 🔥 삭제 성공 후 처리 (목록 갱신은 부모가 하도록)
  const handleDeleted = () => {
    setShowDeleteModal(false);
    if (onClose) onClose(); // 메모 시트 닫기
  };

  return (
    <>
      <div
        className="calendar-memo-overlay"
        onClick={handleOverlayClick}
      >
        <div className="calendar-memo-sheet">
          {/* 상단: 선택 일정 카드 */}
          <div className="calendar-event-item calendar-memo-event-card">
            <div className="calendar-event-main">
              <div className="calendar-event-header">
                <span className="calendar-event-tag">
                  {getCategoryLabel(event.category)}
                </span>
                <button
                  type="button"
                  className="calendar-memo-back-button"
                  onClick={commitAndClose}
                >
                  뒤로
                </button>
              </div>
              <div className="calendar-event-title">{event.title}</div>
              {event.location && (
                <div className="calendar-event-location">
                  {event.location}
                </div>
              )}
              <div className="calendar-event-time">
                {formatTimeRange(event.startAt, event.endAt)}
              </div>
            </div>
          </div>

          {/* 하단: 메모 카드 */}
          <div className="calendar-memo-card">
            <div className="calendar-memo-card-header">
              <span className="calendar-memo-card-title">
                해당 일정의 메모입니다.
              </span>

              {/* 아이콘 영역 */}
              <div className="calendar-memo-actions">
                {/* 삭제 아이콘 */}
                <img
                  src={Trash_ICON}
                  alt="메모 삭제"
                  className="calendar-memo-delete-icon"
                  onClick={handleClickDelete}
                />

                {/* 수정 아이콘 */}
                <img
                  src={EDIT_ICON}
                  alt="메모 수정"
                  className="calendar-memo-edit-icon"
                  onClick={handleClickEdit}
                />
              </div>
            </div>

            <div className="calendar-memo-textbox-wrapper">
              <textarea
                className="calendar-memo-textarea"
                value={memoText}
                onChange={handleChange}
                readOnly
              />
              {isEmpty && (
                <div className="calendar-memo-empty">
                  <img
                    src={EMPTY_MEMO_ICON}
                    alt="메모 없음"
                    className="calendar-memo-empty-icon"
                  />
                  <p className="calendar-memo-empty-text">
                    작성된 메모가 없습니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 여기서 실제로 Delete_schdule를 렌더링해야 팝업이 보임 */}
      <Delete_schdule
        visible={showDeleteModal}
        eventId={event.id}
        onClose={handleDeleteModalClose}
        onDeleted={handleDeleted}
      />
    </>
  );
}
