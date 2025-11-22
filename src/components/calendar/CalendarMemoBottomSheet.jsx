// src/components/calendar/CalendarMemoBottomSheet.jsx
import React, { useEffect, useState } from "react";
import "../../css/calendar/CalendarMemoBottomSheet.css";

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

export default function CalendarMemoBottomSheet({ event, onClose, onSave }) {
  const [memoText, setMemoText] = useState("");

  // event 바뀌거나 처음 열릴 때 memo 초기화
  useEffect(() => {
    if (!event) return;

    let baseText = event.memo || "";

    try {
      const stored = window.localStorage.getItem(
        `calendarMemo:${event.id}`
      );
      if (stored !== null) {
        baseText = stored;
      }
    } catch (e) {
      // localStorage 접근 실패해도 무시
    }

    setMemoText(baseText);
  }, [event]);

  if (!event) return null;

  const handleChange = (e) => {
    setMemoText(e.target.value);
  };

  const handleBack = () => {
    const trimmed = memoText.trim();

    try {
      window.localStorage.setItem(`calendarMemo:${event.id}`, trimmed);
    } catch (e) {
      // ignore
    }

    if (onSave) {
      onSave(trimmed);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="calendar-memo-section">
      {/* 상단 선택 일정 카드 (기존 카드 스타일 그대로, 우측은 '뒤로') */}
      <div className="calendar-event-item calendar-memo-top-card">
        <div className="calendar-event-main">
          <div className="calendar-event-header">
            <span className="calendar-event-tag">
              {getCategoryLabel(event.category)}
            </span>
            <button
              type="button"
              className="calendar-memo-back-button"
              onClick={handleBack}
            >
              뒤로
            </button>
          </div>
          <div className="calendar-event-title">{event.title}</div>
          {event.location && (
            <div className="calendar-event-location">{event.location}</div>
          )}
          <div className="calendar-event-time">
            {formatTimeRange(event.startAt, event.endAt)}
          </div>
        </div>
      </div>

      {/* 하단 메모 카드 */}
      <div className="calendar-memo-card">
        <div className="calendar-memo-card-header">
          <span className="calendar-memo-card-title">
            해당 일정의 메모입니다.
          </span>
          <button
            type="button"
            className="calendar-memo-edit-button"
          >
            <span className="calendar-memo-edit-icon">✏</span>
          </button>
        </div>

        <div className="calendar-memo-textbox-wrapper">
          <textarea
            className="calendar-memo-textarea"
            value={memoText}
            onChange={handleChange}
            placeholder="이 일정에 대한 메모를 자유롭게 적어보세요."
          />
        </div>
      </div>
    </div>
  );
}
