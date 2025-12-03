// src/components/calendar/CalendarMemoBottomSheet.jsx
import React, { useEffect, useState } from "react";
import "../../css/calendar/CalendarMemoBottomSheet.css";

import EMPTY_MEMO_ICON from "../../images/calendar/nomemo.svg";
import EDIT_ICON from "../../images/calendar/edit.svg";
import Trash_ICON from "../../images/calendar/trash.svg";

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
  // 🔥 추가: 수정 모드 진입 요청 콜백
  onRequestEdit,
}) {
  const [memoText, setMemoText] = useState("");

  // 팝업 열릴 때 기본 메모값 설정 (서버에서 온 description/memo만 사용)
  useEffect(() => {
    if (!visible || !event) return;

    const base = event.description ?? event.memo ?? "";
    setMemoText(base);
  }, [visible, event]);

  if (!visible || !event) return null;

  const handleChange = (e) => {
    // 🔒 이 컴포넌트에서는 수정 불가(readOnly)지만,
    // 혹시 실수로 readOnly 제거해도 state는 갱신되도록 남겨둠.
    setMemoText(e.target.value);
  };

  const commitAndClose = () => {
    const trimmed = memoText.trim();

    // 부모 state와 동기화 (월 이벤트 리스트 갱신용)
    if (onSave) onSave(trimmed);
    if (onClose) onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      // 회색 배경 클릭 시에도 저장 후 닫기
      commitAndClose();
    }
  };

  const isEmpty = memoText.trim().length === 0;

  const handleClickEdit = () => {
    const trimmed = memoText.trim();
    if (onSave) onSave(trimmed);

    // 🔥 일정 수정 모드 진입 요청
    if (onRequestEdit) {
      onRequestEdit(event);
    } else if (onClose) {
      onClose();
    }
  };

  return (
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

            {/* 🔥 쓰레기통 + 연필 아이콘 영역 */}
            <div className="calendar-memo-actions">
  
              <button
                type="button"
                className="calendar-memo-delete-button"
                aria-label="메모 삭제"
                style={"border: none; background: none;"}
              >
                <img
                  src={Trash_ICON}
                  alt="메모 삭제"
                  className="calendar-memo-delete-icon"
                />
              </button>

              <button
                type="button"
                className="calendar-memo-edit-button"
                aria-label="메모 수정"
                onClick={handleClickEdit}
              >
                <span className="calendar-memo-edit-icon">
                  <img src={EDIT_ICON} alt="수정 아이콘" />
                </span>
              </button>
            </div>
          </div>

          <div className="calendar-memo-textbox-wrapper">
            <textarea
              className="calendar-memo-textarea"
              value={memoText}
              onChange={handleChange}
              readOnly // 🔒 메모 바텀시트에서는 직접 수정 불가
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
  );
}
