// src/components/calendar/CalendarAddBottomSheet.jsx
import React, { useMemo, useState } from "react";
import "../../css/calendar/CalendarAddBottomSheet.css";
import api from "../../api/axios";
import CalendarTimePickerModal from "./CalendarTimePickerModal";

// 카테고리 옵션 (백엔드 enum 값에 맞춰 value는 필요시 수정)
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

  // 시간 선택 모달
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState("start"); // 'start' | 'end'

  const dateLabel = useMemo(() => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const weekdayNames = [
      "일요일",
      "월요일",
      "화요일",
      "수요일",
      "목요일",
      "금요일",
      "토요일",
    ];
    const weekday = weekdayNames[date.getDay()];
    return `${y}년 ${m}월 ${d}일 ${weekday}`;
  }, [date]);

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
    if (timePickerTarget === "start") {
      setStartTime(timeStr);
    } else {
      setEndTime(timeStr);
    }
    setTimePickerVisible(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    const dateStr = formatDate(date); // yyyy-MM-DD
    const makeIso = (time) => `${dateStr}T${time}:00`;

    const startAt = makeIso(startTime);
    const endAt = makeIso(endTime);

    setLoading(true);

    try {
      await api.post("/calendar/events", {
        title: title.trim(),
        description: memo.trim() || null,
        startAt,
        endAt,
        location: location.trim() || null,
        category,        // 예: "PRESENTATION" 등
        important: isImportant, // GET 응답에 있는 필드라 같이 전송
      });

      // 성공
      onAdded && onAdded();

      // 폼 초기화
      setTitle("");
      setLocation("");
      setMemo("");
      setStartTime("10:00");
      setEndTime("11:00");
      setCategory("LECTURE");
      setIsImportant(false);
      setError("");
    } catch (e) {
      console.error(e);
      const msg =
        e.response?.data?.error || "일정 추가 중 오류가 발생했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="calendar-add-overlay"
        onClick={handleClickBackdrop}
      >
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
              <label className="calendar-add-label">위치</label>
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

            {/* 에러 메시지 */}
            {error && (
              <div className="calendar-add-error">
                {error}
              </div>
            )}

            {/* 추가 버튼 */}
            <button
              type="submit"
              className="calendar-add-submit"
              disabled={loading}
            >
              {loading ? "추가 중..." : "추가"}
            </button>
          </form>
        </div>
      </div>

      {/* 시간 선택 모달 */}
      <CalendarTimePickerModal
        visible={timePickerVisible}
        initialTime={
          timePickerTarget === "start" ? startTime : endTime
        }
        onClose={() => setTimePickerVisible(false)}
        onConfirm={handleTimeConfirm}
      />
    </>
  );
}
