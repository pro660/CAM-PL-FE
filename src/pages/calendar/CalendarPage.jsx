// src/pages/calendar/CalendarPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../css/calendar/CalendarPage.css";
import api from "../../api/axios";
import CalendarAddBottomSheet from "../../components/calendar/CalendarAddBottomSheet";
import CalendarMemoBottomSheet from "../../components/calendar/CalendarMemoBottomSheet";
import { useLoading } from "../../context/LoadingContext.jsx";

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
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

// 카테고리 라벨
function getCategoryLabel(category, type, origin) {
  if (type === "SCHOOL") return "학사";
  if (origin === "TIMETABLE" || type === "LECTURE") return "강의";

  const koreanLabels = [
    "강의",
    "시험",
    "발표",
    "팀플",
    "미팅",
    "과제",
    "식사",
    "휴식",
    "모임",
    "일정",
  ];
  if (category && koreanLabels.includes(category)) return category;
  if (!category) return "일정";

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
    case "MEAL":
      return "식사";
    case "REST":
      return "휴식";
    case "ASSIGNMENT":
      return "과제";
    case "GATHERING":
      return "모임";
    default:
      return category;
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
  const { showLoading, hideLoading } = useLoading();
  const location = useLocation();
  const navigate = useNavigate();

  const today = useMemo(() => new Date(), []);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [monthEvents, setMonthEvents] = useState([]);
  const [monthLoading, setMonthLoading] = useState(false);
  const [error, setError] = useState("");

  // Map → Calendar로 넘어올 때 프리필 정보 저장
  const [prefillFromPlace, setPrefillFromPlace] = useState(null);

  // 일정 추가 바텀시트
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  // 새 일정 추가/수정/삭제 후 재로딩용
  const [monthReloadKey, setMonthReloadKey] = useState(0);

  // 메모 팝업
  const [isMemoOpen, setIsMemoOpen] = useState(false);
  const [selectedMemoEvent, setSelectedMemoEvent] = useState(null);

  // 일정 수정 모드용
  const [editingEvent, setEditingEvent] = useState(null);

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

  // location.state에 fromPlaceRecommend 있으면 한 번만 처리
  useEffect(() => {
    const state = location.state;
    if (state?.fromPlaceRecommend) {
      setPrefillFromPlace(state.fromPlaceRecommend);
      setEditingEvent(null); // 장소 추천에서 들어올 때는 항상 새 일정 추가
      setIsAddSheetOpen(true);

      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // 월 단위 이벤트 맵 (달력 점)
  const eventDateMap = useMemo(() => {
    const map = {};
    if (!Array.isArray(monthEvents) || monthEvents.length === 0) return map;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    monthEvents.forEach((ev) => {
      if (!ev.startAt) return;

      const start = new Date(ev.startAt);
      if (isNaN(start.getTime())) return;

      const startDateOnly = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );

      let endDateOnly;
      if (ev.endAt) {
        const end = new Date(ev.endAt);
        if (isNaN(end.getTime())) return;
        endDateOnly = new Date(
          end.getFullYear(),
          end.getMonth(),
          end.getDate()
        );
      } else {
        endDateOnly = new Date(startDateOnly);
      }

      let lastDateForDot;
      if (startDateOnly.getTime() === endDateOnly.getTime()) {
        lastDateForDot = new Date(startDateOnly);
      } else {
        lastDateForDot = new Date(endDateOnly);
        lastDateForDot.setDate(lastDateForDot.getDate() - 1);
      }

      const rangeStart = new Date(
        Math.max(startDateOnly.getTime(), firstOfMonth.getTime())
      );
      const rangeEnd = new Date(
        Math.min(lastDateForDot.getTime(), lastOfMonth.getTime())
      );

      if (rangeEnd.getTime() < rangeStart.getTime()) return;

      const isTimetable = ev.origin === "TIMETABLE";

      for (
        let d = new Date(rangeStart);
        d.getTime() <= rangeEnd.getTime();
        d.setDate(d.getDate() + 1)
      ) {
        const key = formatDate(d);

        if (!map[key]) {
          map[key] = { hasTimetable: false, hasOther: false };
        }

        if (isTimetable) map[key].hasTimetable = true;
        else map[key].hasOther = true;
      }
    });

    return map;
  }, [monthEvents, currentMonth]);

  // 선택 날짜의 일정 리스트
  const dayEvents = useMemo(() => {
    if (!Array.isArray(monthEvents) || monthEvents.length === 0) return [];

    const selectedDateOnly = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    return monthEvents.filter((ev) => {
      if (!ev.startAt) return false;

      const start = new Date(ev.startAt);
      if (isNaN(start.getTime())) return false;

      const startDateOnly = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );

      let endDateOnly;
      if (ev.endAt) {
        const end = new Date(ev.endAt);
        if (isNaN(end.getTime())) return false;
        endDateOnly = new Date(
          end.getFullYear(),
          end.getMonth(),
          end.getDate()
        );
      } else {
        endDateOnly = new Date(startDateOnly);
      }

      let lastDateForEvent;
      if (startDateOnly.getTime() === endDateOnly.getTime()) {
        lastDateForEvent = new Date(startDateOnly);
      } else {
        lastDateForEvent = new Date(endDateOnly);
        lastDateForEvent.setDate(lastDateForEvent.getDate() - 1);
      }

      const sd = selectedDateOnly.getTime();
      return sd >= startDateOnly.getTime() && sd <= lastDateForEvent.getTime();
    });
  }, [monthEvents, selectedDate]);

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
    let cancelled = false;

    setMonthLoading(true);
    setError("");
    showLoading();

    api
      .get("/calendar/events", { params: { ym } })
      .then((res) => {
        if (cancelled) return;
        const body = res.data ?? [];
        const events = Array.isArray(body)
          ? body
          : body.events || body.items || [];
        setMonthEvents(events);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error(e);
        setError("달력 정보를 불러오는 중 오류가 발생했습니다.");
      })
      .finally(() => {
        if (!cancelled) setMonthLoading(false);
        hideLoading();
      });

    return () => {
      cancelled = true;
    };
  }, [currentMonth, monthReloadKey, showLoading, hideLoading]);

  const handleSelectDate = (day) => {
    if (!day) return;
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    setSelectedDate(new Date(y, m, day));
    setIsMemoOpen(false);
    setSelectedMemoEvent(null);
  };

  // 새 일정 추가 버튼
  const handleClickAdd = () => {
    setEditingEvent(null); // 새 일정 추가 모드
    setIsAddSheetOpen(true);
  };

  const handleAddSheetClose = () => {
    setIsAddSheetOpen(false);
    setPrefillFromPlace(null);
    setEditingEvent(null);
  };

  const handleEventAdded = () => {
    setMonthReloadKey((v) => v + 1);
    setIsAddSheetOpen(false);
    setPrefillFromPlace(null);
    setEditingEvent(null);
  };

  // 일정 수정 완료 시
  const handleEventUpdated = () => {
    setMonthReloadKey((v) => v + 1);
    setIsAddSheetOpen(false);
    setPrefillFromPlace(null);
    setEditingEvent(null);
  };

  const handleOpenMemo = (event) => {
    setSelectedMemoEvent(event);
    setIsMemoOpen(true);
  };

  const handleMemoClose = () => {
    setIsMemoOpen(false);
    setSelectedMemoEvent(null);
  };

  const handleMemoSaved = (memoText) => {
    if (!selectedMemoEvent) return;
    const id = selectedMemoEvent.id;

    setMonthEvents((prev) =>
      prev.map((ev) =>
        ev.id === id ? { ...ev, memo: memoText, description: memoText } : ev
      )
    );
  };

  // 🔥 메모 시트 → "수정" 아이콘 클릭 시
  const handleRequestEditFromMemo = (event) => {
    if (!event) return;

    setIsMemoOpen(false);
    setSelectedMemoEvent(null);

    if (event.startAt) {
      const d = new Date(event.startAt);
      if (!Number.isNaN(d.getTime())) {
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        setCurrentMonth(monthStart);
        setSelectedDate(
          new Date(d.getFullYear(), d.getMonth(), d.getDate())
        );
      }
    }

    setEditingEvent(event);
    setIsAddSheetOpen(true);
  };

  // 🔥 삭제 완료 시: 프론트 목록에서 제거 + API 재호출 트리거
  const handleEventDeleted = (deletedId) => {
    setMonthEvents((prev) => prev.filter((ev) => ev.id !== deletedId));
    setMonthReloadKey((v) => v + 1);
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
        <h2 className="calendar-month-label">
          {yearMonthLabel}
          {monthLoading && (
            <span className="calendar-month-loading"> · 불러오는 중</span>
          )}
        </h2>
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
        <div className="calendar-weekdays">
          {DAY_NAMES.map((name, idx) => (
            <div
              key={name}
              className={`calendar-weekday ${
                idx === 0 ? "sun" : idx === 6 ? "sat" : ""
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        <div className="calendar-days">
          {calendarWeeks.map((week, wi) =>
            week.map((day, di) => {
              if (day === null) {
                return (
                  <div key={`${wi}-${di}`} className="calendar-day empty" />
                );
              }

              const cellDate = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                day
              );
              const isToday = isSameDate(cellDate, today);
              const isSelected = isSameDate(cellDate, selectedDate);
              const dateKey = formatDate(cellDate);
              const dotInfo = eventDateMap[dateKey] || {
                hasTimetable: false,
                hasOther: false,
              };

              const hasTimetable = dotInfo.hasTimetable;
              const hasOther = dotInfo.hasOther;

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

                  {(hasTimetable || hasOther) && (
                    <div className="calendar-day-dots">
                      {hasTimetable && (
                        <span className="calendar-day-dot timetable" />
                      )}
                      {hasOther && (
                        <span className="calendar-day-dot other" />
                      )}
                    </div>
                  )}
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

        {monthLoading ? (
          <div className="calendar-empty-text">
            일정을 불러오는 중입니다...
          </div>
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
                      {getCategoryLabel(ev.category, ev.type, ev.origin)}
                    </span>
                    <button
                      type="button"
                      className="calendar-event-memo-button"
                      onClick={() => handleOpenMemo(ev)}
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
                  {ev.startAt && ev.endAt && (
                    <div className="calendar-event-time">
                      {formatTimeRange(ev.startAt, ev.endAt)}
                    </div>
                  )}
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

      {/* 일정 추가 / 수정 바텀시트 */}
      <CalendarAddBottomSheet
        visible={isAddSheetOpen}
        date={selectedDate}
        onClose={handleAddSheetClose}
        onAdded={handleEventAdded}
        initialLocation={prefillFromPlace?.location || ""}
        initialCategory={prefillFromPlace?.category || "LECTURE"}
        editingEvent={editingEvent}
        onUpdated={handleEventUpdated}
      />

      {/* 메모 팝업 */}
      <CalendarMemoBottomSheet
        visible={isMemoOpen}
        event={selectedMemoEvent}
        onClose={handleMemoClose}
        onSave={handleMemoSaved}
        onRequestEdit={handleRequestEditFromMemo}
        onDeleted={handleEventDeleted}   {/* 🔥 여기! */}
      />
    </div>
  );
}
