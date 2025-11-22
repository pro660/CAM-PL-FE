// src/components/calendar/CalendarMemoBottomSheet.jsx
import React, { useEffect, useState } from "react";
import "../../css/calendar/CalendarMemoBottomSheet.css";

// 카테고리 라벨 (기존 + 추가 카테고리 포함)
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
}) {
  const [memoText, setMemoText] = useState("");

  // 열릴 때마다 현재 이벤트의 메모 불러오기 (state + localStorage)
  useEffect(() => {
    if (!visible || !event) return;

    let baseText = event.memo || "";

    try {
      const stored = window.localStorage.getItem(
        `calendarMemo:${event.id}`
      );
      if (stored !== null) {
        baseText = stored;
      }
    } catch (e) {
      // localStorage 사용 불가해도 그냥 무시
    }

    setMemoText(baseText);
  }, [visible, event]);

  if (!visible || !event) return null;

  const handleChange = (e) => {
    setMemoText(e.target.value);
  };

  // 뒤로 버튼 눌렀을 때: 프론트에서만 메모 저장 후 닫기
  const handleBack = () => {
    const trimmed = memoText.trim();

    try {
      window.localStorage.setItem(
        `calendarMemo:${event.id}`,
        trimmed
      );
    } catch (e) {
      // 실패해도 앱이 깨지진 않게
    }

    if (onSave) {
      onSave(trimmed);
    }

    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="calendar-memo-overlay">
      <div className="calendar-memo-wrapper">
        {/* 상단: 선택된 일정 카드 (오늘의 일정 카드 레이아웃 그대로, 오른쪽은 '뒤로') */}
        <div className="calendar-memo-top-card">
          <div className="calendar-event-item">
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
                <div className="calendar-event-location">
                  {event.location}
                </div>
              )}
              <div className="calendar-event-time">
                {formatTimeRange(event.startAt, event.endAt)}
              </div>
            </div>
          </div>
        </div>

        {/* 하단: 메모 박스 */}
        <div className="calendar-memo-panel">
          <div className="calendar-memo-panel-header">
            <span className="calendar-memo-panel-title">
              해당 일정의 메모입니다.
            </span>
            <button
              type="button"
              className="calendar-memo-edit-button"
              // 아이콘은 그냥 장식용이니까 동작 필요 없음
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
    </div>
  );
}
