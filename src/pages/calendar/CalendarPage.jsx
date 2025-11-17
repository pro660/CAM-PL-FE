// src/pages/calendar/CalendarPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../../css/calendar/CalendarPage.css";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_NAMES_LONG = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
];

// yyyy-MM
function formatYearMonth(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// yyyy-MM-DD
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// month 기준 달력 그리드용 배열 (주 단위)
function buildCalendarGrid(baseMonth) {
  const year = baseMonth.getFullYear();
  const month = baseMonth.getMonth(); // 0~11

  const first = new Date(year, month, 1);
  const firstWeekday = first.getDay(); // 0(일)~6(토)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  // 앞쪽 빈 칸 (이전달)
  for (let i = 0; i < firstWeekday; i++) {
    cells.push(null);
  }
  // 1 ~ daysInMonth
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }
  // 뒤쪽 빈 칸 (다음달)
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function getCategoryLabel(category) {
  switch (category) {
    case "LECTURE":
      return "강의";
    case "EXAM":
      return "시험";
    case "PRESENTATION":
      return "발표";
    default:
      return "일정";
  }
}

function formatTimeRange(startIso, endIso) {
  const s = new Date(startIso);
  const e = new Date(endIso);

  const toTime = (d) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;

  return `${toTime(s)} ~ ${toTime(e)}`;
}

export default function CalendarPage() {
  const navigate = useNavigate();

  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [monthEvents, setMonthEvents] = useState([]);
  const [monthLoading, setMonthLoading] = useState(false);

  const [dayEvents, setDayEvents] = useState([]);
  const [dayLoading, setDayLoading] = useState(false);

  const [error, setError] = useState("");

  const yearMonthLabel = `${currentMonth.getFullYear()}년 ${
    currentMonth.getMonth() + 1
  }월`;

  const selectedDateLabel = (() => {
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth() + 1;
    const d = selectedDate.getDate();
    const weekday = DAY_NAMES_LONG[selectedDate.getDay()];
    return `${y}년 ${m}월 ${d}일 ${weekday}`;
  })();

  const calendarWeeks = useMemo(
    () => buildCalendarGrid(currentMonth),
    [currentMonth]
  );

  // 월 단위 이벤트 맵 (yyyy-MM-DD -> true)
  const eventDateMap = useMemo(() => {
    const map = {};
    if (!monthEvents || monthEvents.length === 0) return map;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth(); // 0~11
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    monthEvents.forEach((ev) => {
      const start = new Date(ev.startAt);
      const end = new Date(ev.endAt);

      // 해당 월 범위와 겹치는 구간만 계산
      const d = new Date(
        Math.max(start.getTime(), firstOfMonth.getTime())
      );
      const endClamped = new Date(
        Math.min(end.getTime(), lastOfMonth.getTime())
      );

      while (d.getTime() <= endClamped.getTime()) {
        const key = formatDate(d);
        map[key] = true;
        d.setDate(d.getDate() + 1);
      }
    });

    return map;
  }, [monthEvents, currentMonth]);

  /* ---------- 월 변경 ---------- */
  const changeMonth = (offset) => {
    setCurrentMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
      return next;
    });
  };

  // currentMonth 바뀌면 selectedDate도 같은 달로 맞춰주기
  useEffect(() => {
    setSelectedDate((prev) => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const day = Math.min(prev.getDate(), daysInMonth);
      return new Date(year, month, day);
    });
  }, [currentMonth]);

  /* ---------- 월 이벤트 로딩 ---------- */
  useEffect(() => {
    const ym = formatYearMonth(currentMonth);

    setMonthLoading(true);
    setError("");

    api
      .get("/calendar/events", { params: { ym } })
      .then((res) => {
        setMonthEvents(res.data || []);
      })
      .catch((e) => {
        console.error(e);
        setError("달력 정보를 불러오는 중 오류가 발생했습니다.");
      })
      .finally(() => {
        setMonthLoading(false);
      });
  }, [currentMonth]);

  /* ---------- 선택 날짜 일정 로딩 ---------- */
  useEffect(() => {
    const dateStr = formatDate(selectedDate);

    setDayLoading(true);
    setError("");

    api
      .get("/calendar/day", { params: { date: dateStr } })
      .then((res) => {
        setDayEvents(res.data || []);
      })
      .catch((e) => {
        console.error(e);
        setError("해당 날짜의 일정을 불러오는 중 오류가 발생했습니다.");
      })
      .finally(() => {
        setDayLoading(false);
      });
  }, [selectedDate]);

  const handleSelectDate = (day) => {
    if (!day) return;
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    setSelectedDate(new Date(y, m, day));
  };

  const handleClickAdd = () => {
    // 일정 추가 페이지 라우트는 이후에 실제 경로로 변경하면 됨
    navigate("/calendar/add");
  };

  const isSameDate = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  return (
    <div className="calendar-page">
      {/* 상단: 연/월 + 화살표 */}
      <section className="calendar-top">
        <button
          type="button"
          className="calendar-month-button"
          onClick={() => changeMonth(-1)}
          aria-label="이전 달"
        >
          ‹
        </button>
        <h2 className="calendar-month-label">{yearMonthLabel}</h2>
        <button
          type="button"
          className="calendar-month-button"
          onClick={() => changeMonth(1)}
          aria-label="다음 달"
        >
          ›
        </button>
      </section>

      {/* 달력 영역 */}
      <section className="calendar-card">
        {/* 요일 헤더 */}
        <div className="calendar-weekdays">
          {DAY_NAMES.map((name, idx) => (
            <div
              key={name}
              className={`calendar-weekday ${
                idx === 0
                  ? "sun"
                  : idx === 6
                  ? "sat"
                  : ""
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        {/* 일자 그리드 */}
        <div className="calendar-days">
          {calendarWeeks.map((week, wi) =>
            week.map((day, di) => {
              if (day === null) {
                return <div key={`${wi}-${di}`} className="calendar-day empty" />;
              }

              const cellDate = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                day
              );
              const isToday = isSameDate(cellDate, today);
              const isSelected = isSameDate(cellDate, selectedDate);
              const dateKey = formatDate(cellDate);
              const hasEvent = !!eventDateMap[dateKey];

              return (
                <button
                  type="button"
                  key={`${wi}-${di}`}
                  className={`calendar-day ${
                    isSelected ? "selected" : ""
                  } ${isToday ? "today" : ""}`}
                  onClick={() => handleSelectDate(day)}
                >
                  <span className="calendar-day-number">{day}</span>
                  {hasEvent && <span className="calendar-day-dot" />}
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* 바텀시트 영역 */}
      <section className="calendar-bottom-sheet">
        <div className="calendar-bottom-handle" />
        <div className="calendar-bottom-header">{selectedDateLabel}</div>

        {error && <div className="calendar-error-text">{error}</div>}

        {dayLoading ? (
          <div className="calendar-empty-text">일정을 불러오는 중입니다...</div>
        ) : dayEvents.length === 0 ? (
          <div className="calendar-empty-text">
            아직 등록된 일정이 없습니다.
          </div>
        ) : (
          <ul className="calendar-event-list">
            {dayEvents.map((ev) => (
              <li key={ev.id} className="calendar-event-item">
                <div className="calendar-event-main">
                  <div className="calendar-event-header">
                    <span className="calendar-event-tag">
                      {getCategoryLabel(ev.category)}
                    </span>
                    {/* 수정 아이콘/메모 버튼 자리 */}
                    <button
                      type="button"
                      className="calendar-event-memo-button"
                    >
                      메모
                    </button>
                  </div>
                  <div className="calendar-event-title">{ev.title}</div>
                  {ev.location && (
                    <div className="calendar-event-location">
                      {ev.location}
                    </div>
                  )}
                  <div className="calendar-event-time">
                    {formatTimeRange(ev.startAt, ev.endAt)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 플로팅 + 버튼 */}
      <button
        type="button"
        className="calendar-fab"
        onClick={handleClickAdd}
        aria-label="일정 추가"
      >
        +
      </button>
    </div>
  );
}
