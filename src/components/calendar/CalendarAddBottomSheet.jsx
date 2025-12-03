// src/components/calendar/CalendarAddBottomSheet.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../../css/calendar/CalendarAddBottomSheet.css";
import api from "../../api/axios";
import CalendarTimePickerModal from "./CalendarTimePickerModal";

// 카테고리 옵션
const CATEGORY_OPTIONS = [
  { value: "LECTURE", label: "강의" },
  { value: "TEAM", label: "팀플" },
  { value: "ASSIGNMENT", label: "과제" },
  { value: "MEAL", label: "식사" },
  { value: "MEETING", label: "미팅" },
  { value: "REST", label: "휴식" },
  { value: "GATHERING", label: "모임" },
];

// yyyy-MM-DD
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function CalendarAddBottomSheet({
  visible,
  date,
  onClose,
  onAdded,
  initialLocation,
  initialCategory,
  // 🔥 추가: 수정 모드용 props
  editingEvent,      // 일정 객체 (수정 모드일 때만 사용)
  onUpdated,         // 수정 완료 콜백
}) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [memo, setMemo] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [category, setCategory] = useState("LECTURE");
  const [isImportant, setIsImportant] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState("start");

  // 🔥 기반 날짜: 수정 모드면 event.startAt, 아니면 props.date
  const baseDate = useMemo(() => {
    if (editingEvent?.startAt) {
      const d = new Date(editingEvent.startAt);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return date;
  }, [date, editingEvent]);

  const dateLabel = useMemo(() => {
    const y = baseDate.getFullYear();
    const m = baseDate.getMonth() + 1;
    const d = baseDate.getDate();
    const weekdayNames = [
      "일요일",
      "월요일",
      "화요일",
      "수요일",
      "목요일",
      "금요일",
      "토요일",
    ];
    const weekday = weekdayNames[baseDate.getDay()];
    return `${y}년 ${m}월 ${d}일 ${weekday}`;
  }, [baseDate]);

  // 바텀시트 열릴 때마다 form 초기화 + 프리필 적용
  useEffect(() => {
    if (!visible) return;

    setError("");
    setLoading(false);

    if (editingEvent) {
      // 🔥 수정 모드: 기존 일정 정보로 프리필
      setTitle(editingEvent.title || "");
      setLocation(editingEvent.location || "");
      const baseMemo = editingEvent.description ?? editingEvent.memo ?? "";
      setMemo(baseMemo);

      if (editingEvent.startAt) {
        setStartTime(editingEvent.startAt.slice(11, 16)); // "HH:MM"
      } else {
        setStartTime("10:00");
      }

      if (editingEvent.endAt) {
        setEndTime(editingEvent.endAt.slice(11, 16));
      } else {
        setEndTime("11:00");
      }

      const cat =
        editingEvent.category ||
        editingEvent.type ||
        initialCategory ||
        "LECTURE";
      setCategory(cat);
      setIsImportant(!!editingEvent.important);
    } else {
      // ➕ 추가 모드 (기존 로직 그대로)
      setTitle("");
      setMemo("");
      setStartTime("10:00");
      setEndTime("11:00");
      setIsImportant(false);

      setLocation(initialLocation || "");
      setCategory(initialCategory || "LECTURE");
    }
  }, [visible, editingEvent, initialLocation, initialCategory]);

  if (!visible) return null;

  const handleClickBackdrop = (e) => {
    if (e.target === e.currentTarget) {
      onClose && onClose();
    }
  };

  const openTimePicker = (target) => {
    setTimePickerTarget(target);
    setTimePickerVisible(true);
  };

  const handleTimeConfirm = (timeStr) => {
    if (timePickerTarget === "start") setStartTime(timeStr);
    else setEndTime(timeStr);
    setTimePickerVisible(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    const dateStr = formatDate(baseDate);
    const makeIso = (time) => `${dateStr}T${time}:00`;

    const startAt = makeIso(startTime);
    const endAt = makeIso(endTime);

    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        description: memo.trim() || null,
        startAt,
        endAt,
        location: location.trim() || null,
        category,
        important: isImportant,
      };

      if (editingEvent && editingEvent.id) {
        // 🔥 수정 모드: 일정 수정 API 호출 (엔드포인트는 백엔드에 맞게 조정)
        await api.put(`/calendar/events/${editingEvent.id}`, payload);
        onUpdated && onUpdated();
      } else {
        // ➕ 추가 모드
        await api.post("/calendar/events", payload);
        onAdded && onAdded();
      }
    } catch (e) {
      console.error(e);
      const msg =
        e.response?.data?.error ||
        (editingEvent
          ? "일정 수정 중 오류가 발생했습니다."
          : "일정 추가 중 오류가 발생했습니다.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 버튼 텍스트: 추가 / 수정
  const submitLabel = editingEvent ? "수정" : "추가";

  return (
    <>
      <div className="calendar-add-overlay" onClick={handleClickBackdrop}>
        <div className="calendar-add-sheet">
          {/* 상단 헤더 */}
          <header className="calendar-add-header">
            <div className="calendar-add-date">{dateLabel}</div>
            <button
              type="button"
              className="calendar-add-close"
              onClick={onClose}
            >
              뒤로
            </button>
          </header>

          {/* 폼 */}
          <form className="calendar-add-form" onSubmit={handleSubmit}>
            {/* 제목 */}
            <div className="calendar-add-field">
              <label className="calendar-add-label">제목</label>
              <input
                type="text"
                className="calendar-add-input"
                placeholder="제목을 입력하세요."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* 위치 */}
            <div className="calendar-add-field">
              <label className="calendar-add-label">위치</label>
              <input
                type="text"
                className="calendar-add-input"
                placeholder="위치를 입력하세요."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* 시간 */}
            <div className="calendar-add-field">
              <label className="calendar-add-label">시간</label>
              <div className="calendar-add-time-row">
                <div className="calendar-add-time-block">
                  <span className="calendar-add-time-label">시작시간</span>
                  <button
                    type="button"
                    className="calendar-add-time-input"
                    onClick={() => openTimePicker("start")}
                  >
                    {startTime}
                  </button>
                </div>
                <div className="calendar-add-time-block">
                  <span className="calendar-add-time-label">끝시간</span>
                  <button
                    type="button"
                    className="calendar-add-time-input"
                    onClick={() => openTimePicker("end")}
                  >
                    {endTime}
                  </button>
                </div>
              </div>
            </div>

            {/* 카테고리 */}
            <div className="calendar-add-field">
              <label className="calendar-add-label">일정 카테고리</label>
              <div className="calendar-add-category-row">
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    className={`calendar-add-category-chip ${
                      category === opt.value ? "active" : ""
                    }`}
                    onClick={() => setCategory(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 메모 */}
            <div className="calendar-add-field">
              <label className="calendar-add-label">메모</label>
              <textarea
                className="calendar-add-textarea"
                placeholder="상세 설명을 작성하세요."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>

            {/* 중요한 일정 여부 */}
            <div className="calendar-add-field calendar-add-important-field">
              <div className="calendar-add-important-texts">
                <span className="calendar-add-important-title">
                  중요한 일정인가요?
                </span>
                <span className="calendar-add-important-sub">
                  중요한 일정은 홈화면에서 D-Day로 보여드려요.
                </span>
              </div>
              <button
                type="button"
                className={`calendar-add-important-toggle ${
                  isImportant ? "on" : ""
                }`}
                onClick={() => setIsImportant((prev) => !prev)}
              >
                <span className="calendar-add-important-knob" />
              </button>
            </div>

            {error && <div className="calendar-add-error">{error}</div>}

            <button
              type="submit"
              className="calendar-add-submit"
              disabled={loading}
            >
              {loading ? `${submitLabel} 중...` : submitLabel}
            </button>
          </form>
        </div>
      </div>

      <CalendarTimePickerModal
        visible={timePickerVisible}
        initialTime={timePickerTarget === "start" ? startTime : endTime}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={handleTimeConfirm}
      />
    </>
  );
}
