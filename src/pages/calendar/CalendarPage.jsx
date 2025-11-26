// src/pages/calendar/CalendarPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../../css/calendar/CalendarPage.css";
import api from "../../api/axios";
import CalendarAddBottomSheet from "../../components/calendar/CalendarAddBottomSheet";
import CalendarMemoBottomSheet from "../../components/calendar/CalendarMemoBottomSheet";

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

// 카테고리 라벨
function getCategoryLabel(category) {
  if (!category) return "일정";

  // 이미 한글로 온 경우는 그대로 사용
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
  if (koreanLabels.includes(category)) {
    return category;
  }

  // 영문 코드 → 한글 매핑
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
      // 모르는 값이면 백엔드가 준 그대로 노출
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

  // 일정 추가 바텀시트
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  // 새 일정 추가 후 재로딩용
  const [monthReloadKey, setMonthReloadKey] = useState(0);
  const [dayReloadKey, setDayReloadKey] = useState(0);

  // 메모 팝업
  const [isMemoOpen, setIsMemoOpen] = useState(false);
  const [selectedMemoEvent, setSelectedMemoEvent] = useState(null);

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

  // ✅ 월 단위 이벤트 맵 (yyyy-MM-DD -> { hasTimetable: boolean, hasOther: boolean })
  // - startAt, endAt 둘 다 사용해서 "기간 전체"에 점을 찍음
  // - endAt은 하루(exclusive)라고 보고, multi-day면 endAt - 1일까지 표시
  // - 단, startAt과 endAt이 같은 날짜(당일 일정)는 그냥 그 하루에 점을 찍음
  const eventDateMap = useMemo(() => {
    const map = {};
    if (!Array.isArray(monthEvents) || monthEvents.length === 0) return map;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth(); // 0~11

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
        // endAt 없으면 그냥 당일 일정으로 처리
        endDateOnly = new Date(startDateOnly);
      }

      let lastDateForDot;

      // 🔥 당일 일정: startDate == endDate → 그 날짜만 찍기
      if (startDateOnly.getTime() === endDateOnly.getTime()) {
        lastDateForDot = new Date(startDateOnly);
      } else {
        // 🔥 여러 날에 걸친 일정: endAt 기준 하루 빼서 (exclusive) 마지막 날짜 계산
        lastDateForDot = new Date(endDateOnly);
        lastDateForDot.setDate(lastDateForDot.getDate() - 1);
      }

      // 이 달과 겹치는 구간으로 클램프
      const rangeStart = new Date(
        Math.max(startDateOnly.getTime(), firstOfMonth.getTime())
      );
      const rangeEnd = new Date(
        Math.min(lastDateForDot.getTime(), lastOfMonth.getTime())
      );

      // 이 달에 걸치는 날짜가 없으면 스킵
      if (rangeEnd.getTime() < rangeStart.getTime()) {
        return;
      }

      const isTimetable = ev.origin === "TIMETABLE";

      // rangeStart ~ rangeEnd 까지 하루씩 점 찍기
      for (
        let d = new Date(rangeStart);
        d.getTime() <= rangeEnd.getTime();
        d.setDate(d.getDate() + 1)
      ) {
        const key = formatDate(d);

        if (!map[key]) {
          map[key] = { hasTimetable: false, hasOther: false };
        }

        if (isTimetable) {
          map[key].hasTimetable = true;
        } else {
          map[key].hasOther = true;
        }
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
        // 응답이 배열이든 객체든 이벤트 배열로 정규화
        const body = res.data ?? [];
        const events = Array.isArray(body)
          ? body
          : body.events || body.items || [];
        setMonthEvents(events);
      })
      .catch((e) => {
        console.error(e);
        setError("달력 정보를 불러오는 중 오류가 발생했습니다.");
      })
      .finally(() => {
        setMonthLoading(false);
      });
  }, [currentMonth, monthReloadKey]);

  /* ---------- 선택 날짜 일정 로딩 ---------- */
  useEffect(() => {
    const dateStr = formatDate(selectedDate);

    setDayLoading(true);
    setError("");

    api
      .get("/calendar/day", { params: { date: dateStr } })
      .then((res) => {
        const body = res.data ?? [];
        const events = Array.isArray(body)
          ? body
          : body.events || body.items || [];
        setDayEvents(events);
      })
      .catch((e) => {
        console.error(e);
        setError("해당 날짜의 일정을 불러오는 중 오류가 발생했습니다.");
      })
      .finally(() => {
        setDayLoading(false);
      });
  }, [selectedDate, dayReloadKey]);

  const handleSelectDate = (day) => {
    if (!day) return;
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    setSelectedDate(new Date(y, m, day));
    setIsMemoOpen(false);
    setSelectedMemoEvent(null);
  };

  const handleClickAdd = () => {
    setIsAddSheetOpen(true);
  };

  const handleAddSheetClose = () => {
    setIsAddSheetOpen(false);
  };

  const handleEventAdded = () => {
    // 새 일정 추가 후 월/일 데이터 다시 불러오기
    setMonthReloadKey((v) => v + 1);
    setDayReloadKey((v) => v + 1);
    setIsAddSheetOpen(false);
  };

  // 메모 열기
  const handleOpenMemo = (event) => {
    setSelectedMemoEvent(event);
    setIsMemoOpen(true);
  };

  const handleMemoClose = () => {
    setIsMemoOpen(false);
    setSelectedMemoEvent(null);
  };

  // 메모 저장 (프론트에서만 처리, description도 같이 갱신)
  const handleMemoSaved = (memoText) => {
    if (!selectedMemoEvent) return;
    const id = selectedMemoEvent.id;

    setDayEvents((prev) =>
      prev.map((ev) =>
        ev.id === id
          ? { ...ev, memo: memoText, description: memoText }
          : ev
      )
    );
    setMonthEvents((prev) =>
      prev.map((ev) =>
        ev.id === id
          ? { ...ev, memo: memoText, description: memoText }
          : ev
      )
    );
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
        {/* 요일 헤더 */}
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

        {/* 일자 그리드 */}
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

        {dayLoading ? (
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
                      {getCategoryLabel(ev.category)}
                    </span>
                    {/* 메모 버튼 */}
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
                  <div className="calendar-event-time">
                    {formatTimeRange(ev.startAt, ev.endAt)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 플로팅 + 버튼 (하단 우측 고정) */}
      <button
        type="button"
        className="calendar-fab"
        onClick={handleClickAdd}
        aria-label="일정 추가"
      >
        +
      </button>

      {/* 일정 추가 바텀시트 */}
      <CalendarAddBottomSheet
        visible={isAddSheetOpen}
        date={selectedDate}
        onClose={handleAddSheetClose}
        onAdded={handleEventAdded}
      />

      {/* 메모 팝업 */}
      <CalendarMemoBottomSheet
        visible={isMemoOpen}
        event={selectedMemoEvent}
        onClose={handleMemoClose}
        onSave={handleMemoSaved}
      />
    </div>
  );
}
