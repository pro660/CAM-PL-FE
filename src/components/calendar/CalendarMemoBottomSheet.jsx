// src/components/calendar/CalendarMemoBottomSheet.jsx
import React, { useEffect, useState } from "react";
import "../../css/calendar/CalendarMemoBottomSheet.css";

import EMPTY_MEMO_ICON from "../../images/calendar/nomemo.svg";
import EDIT_ICON from "../../images/calendar/edit.svg";
import Trash_ICON from "../../images/calendar/trash.svg";

// 삭제 확인 팝업
import Delete_schdule from "./Delete_schdule";

function getCategoryLabel(category) {
  switch (category) {
    case "LECTURE":
      return "강의";
    case "EXAM":
      return "시험";
    case "PRESENTATION":
      return "발표";
    case "TEAM":
      return "팀플";
    case "MEETING":
      return "미팅";
    case "ASSIGNMENT":
      return "과제";
    case "MEAL":
      return "식사";
    case "REST":
      return "휴식";
    case "GATHERING":
      return "모임";
    default:
      return "일정";
  }
}

function formatTimeRange(startIso, endIso) {
  if (!startIso || !endIso) return "";
  const s = new Date(startIso);
  const e = new Date(endIso);

  const toTime = (d) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;

  return `${toTime(s)} ~ ${toTime(e)}`;
}

export default function CalendarMemoBottomSheet({
  visible,
  event,
  onClose,
  onSave,
  onRequestEdit,
  // 삭제 완료 시 CalendarPage에 알려줄 콜백
  onDeleted,
}) {
  const [memoText, setMemoText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // MANUAL 일정만 수정/삭제 가능하게
  const canModify = !!event && event.origin === "MANUAL";

  // 팝업 열릴 때 기본 메모값 설정 (description 우선)
  useEffect(() => {
    if (!visible || !event) return;
    const base = event.description ?? event.memo ?? "";
    setMemoText(base);
  }, [visible, event]);

  if (!visible || !event) return null;

  const handleChange = (e) => {
    // 현재는 readOnly지만, 혹시 나중을 위해 그대로 둠
    setMemoText(e.target.value);
  };

  // 바깥 영역 클릭 → 저장 없이 그냥 닫기
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      if (onClose) onClose();
    }
  };

  const handleBackClick = () => {
    if (onClose) onClose();
  };

  const isEmpty = memoText.trim().length === 0;

  // 수정 아이콘 클릭 → (필요하면 저장) 후 일정 수정 시트로 이동
  const handleClickEdit = () => {
    const trimmed = memoText.trim();

    if (canModify && onSave) {
      onSave(trimmed); // CalendarPage에서 description 업데이트 + API 호출
    }

    if (canModify && onRequestEdit) {
      const nextEvent = {
        ...event,
        description: trimmed,
        memo: trimmed,
      };
      onRequestEdit(nextEvent);
    } else if (onClose) {
      // 수정 불가 일정이면 그냥 닫기
      onClose();
    }
  };

  // 쓰레기통 아이콘 클릭 → 삭제 확인 팝업 열기
  const handleClickDelete = (e) => {
    e.stopPropagation();
    if (!canModify) return;
    setShowDeleteModal(true);
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
  };

  // 삭제 성공 후 처리: CalendarPage에 알리고, 메모 시트 닫기
  const handleDeleted = (deletedId) => {
    setShowDeleteModal(false);
    if (onDeleted) onDeleted(deletedId);
    if (onClose) onClose();
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
                  onClick={handleBackClick}
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

              {/* 아이콘 영역 (MANUAL 일정에서만 노출) */}
              {canModify && (
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
              )}
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

      {/* 삭제 확인 팝업 */}
      <Delete_schdule
        visible={showDeleteModal}
        eventId={event.id}
        onClose={handleDeleteModalClose}
        onDeleted={handleDeleted}
      />
    </>
  );
}
