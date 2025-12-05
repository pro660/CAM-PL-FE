// src/pages/mypage/CourseTimeFilterPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/mypage/CourseTimeFilterPage.css";

const DAY_LABELS = ["월", "화", "수", "목", "금"];
const START_HOUR = 9;              // 9시 시작
const ROW_COUNT = 10;              // 10칸 (9~19시 구간)
const VISIBLE_TIME_LABELS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

const WEEKDAY_KR_LONG = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
];

const DAY_ORDER_FOR_LABEL = ["월", "화", "수", "목", "금"];

function minutesToHHMM(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** 선택된 슬롯들 → 라벨 문자열 생성 */
function buildTimeFilterLabel(slots) {
  if (!slots || slots.length === 0) return "전체";

  const byDay = {};
  slots.forEach((s) => {
    if (!s || !s.day) return;
    if (!byDay[s.day]) byDay[s.day] = [];
    byDay[s.day].push({
      startMinutes: s.startMinutes,
      endMinutes: s.endMinutes,
    });
  });

  const parts = [];

  DAY_ORDER_FOR_LABEL.forEach((dayLabel) => {
    const arr = byDay[dayLabel];
    if (!arr || arr.length === 0) return;

    // 시작 시간 기준 정렬
    const sorted = arr.slice().sort((a, b) => a.startMinutes - b.startMinutes);
    const merged = [];
    let cur = sorted[0];

    // 서로 붙어 있는(연속된) 구간은 하나로 병합
    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      if (next.startMinutes === cur.endMinutes) {
        cur = {
          startMinutes: cur.startMinutes,
          endMinutes: next.endMinutes,
        };
      } else {
        merged.push(cur);
        cur = next;
      }
    }
    merged.push(cur);

    merged.forEach((w) => {
      parts.push(
        `${dayLabel} ${minutesToHHMM(w.startMinutes)}~${minutesToHHMM(
          w.endMinutes
        )}`
      );
    });
  });

  return parts.join(", ");
}

export default function CourseTimeFilterPage() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("CAM-PL 사용자");
  // 선택된 칸들: "dayIndex-rowIndex" 형태로 저장
  const [selectedCells, setSelectedCells] = useState(() => new Set());

  // camp_auth 에서 사용자 이름 로드
  useEffect(() => {
    try {
      const raw = localStorage.getItem("camp_auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.name) {
          setUserName(parsed.name);
        }
      }
    } catch (e) {
      console.error("camp_auth 파싱 실패:", e);
    }
  }, []);

  const today = useMemo(() => new Date(), []);
  const todayText = useMemo(() => {
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const weekday = WEEKDAY_KR_LONG[today.getDay()];
    return `오늘은 ${month}월 ${date}일 ${weekday}입니다.`;
  }, [today]);

  /** 칸 클릭 토글 */
  const handleSlotClick = (dayIndex, rowIndex) => {
    const key = `${dayIndex}-${rowIndex}`;
    setSelectedCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  /** 확인 버튼 클릭 → 로컬스토리지에 시간 필터 저장 + 마이페이지로 이동 */
  const handleConfirm = () => {
    const slots = [];

    selectedCells.forEach((key) => {
      const [dayIdxStr, rowIdxStr] = key.split("-");
      const dayIdx = Number(dayIdxStr);
      const rowIdx = Number(rowIdxStr);
      if (
        Number.isNaN(dayIdx) ||
        Number.isNaN(rowIdx) ||
        dayIdx < 0 ||
        dayIdx >= DAY_LABELS.length
      ) {
        return;
      }

      const startHour = START_HOUR + rowIdx; // 9 + rowIndex
      const startMinutes = startHour * 60;
      const endMinutes = (startHour + 1) * 60;

      slots.push({
        day: DAY_LABELS[dayIdx], // "월" ~ "금"
        startMinutes,
        endMinutes,
      });
    });

    if (slots.length === 0) {
      // 아무 것도 선택 안 했으면 시간 필터 해제
      localStorage.removeItem("course_time_filter");
    } else {
      const label = buildTimeFilterLabel(slots);
      localStorage.setItem(
        "course_time_filter",
        JSON.stringify({ slots, label })
      );
    }

    // 마이페이지에서 강의 추가 바텀시트 자동 오픈
    localStorage.setItem("mypage_open_course_sheet", "1");

    navigate("/mypage");
  };

  return (
    <div className="time-filter-page">
      <div className="time-filter-inner">
        {/* 상단 인사 / 날짜 / 확인 버튼 */}
        <header className="time-filter-header">
          <div>
            <p className="time-filter-hello">
              안녕하세요, {userName}님!
            </p>
            <p className="time-filter-date">{todayText}</p>
          </div>
          <button
            type="button"
            className="time-filter-confirm-btn"
            onClick={handleConfirm}
          >
            확인
          </button>
        </header>

        {/* 시간표 영역 */}
        <section className="time-filter-timetable-card">
          <div className="time-filter-timetable">
            {/* 상단 요일 헤더 */}
            <div className="time-filter-header-row">
              <div className="time-filter-header-cell time-filter-header-cell-time" />
              {DAY_LABELS.map((label) => (
                <div key={label} className="time-filter-header-cell">
                  {label}
                </div>
              ))}
            </div>

            {/* 본문: 왼쪽 시간축 + 오른쪽 선택 그리드 */}
            <div className="time-filter-body">
              {/* 왼쪽 시간축 */}
              <div className="time-filter-time-col">
                {VISIBLE_TIME_LABELS.map((label, idx) => (
                  <div key={idx} className="time-filter-time-slot">
                    {label}
                  </div>
                ))}
              </div>

              {/* 오른쪽 요일별 선택 그리드 */}
              <div className="time-filter-grid">
                {DAY_LABELS.map((_, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="time-filter-day-column"
                  >
                    {Array.from({ length: ROW_COUNT }).map((_, rowIdx) => {
                      const cellKey = `${dayIdx}-${rowIdx}`;
                      const isSelected = selectedCells.has(cellKey);
                      return (
                        <button
                          key={cellKey}
                          type="button"
                          className={
                            "time-filter-slot" +
                            (isSelected ? " selected" : "")
                          }
                          onClick={() =>
                            handleSlotClick(dayIdx, rowIdx)
                          }
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
