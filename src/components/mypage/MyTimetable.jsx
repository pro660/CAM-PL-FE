import React, { useMemo } from "react";
import "../../css/mypage/MyTimetable.css";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const DAY_LABELS = ["월", "화", "수", "목", "금"];

const START_HOUR = 9;   // 9시
const END_HOUR = 18;    // 6시
const SLOT_MINUTES = 30; // 30분 단위
const TOTAL_SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES; // 18칸

function buildBlocks(courses = []) {
  const blocks = [];

  courses.forEach((course) => {
    if (!Array.isArray(course.times)) return;

    course.times.forEach((t, idx) => {
      const dayIndex = DAYS.indexOf(t.dayOfWeek);
      if (dayIndex === -1) return;

      const [sh, sm] = t.startTime.split(":").map(Number);
      const [eh, em] = t.endTime.split(":").map(Number);
      if (Number.isNaN(sh) || Number.isNaN(eh)) return;

      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;
      const duration = Math.max(endMinutes - startMinutes, SLOT_MINUTES);
      const startOffset = Math.max(startMinutes - START_HOUR * 60, 0);

      const startSlot = Math.floor(startOffset / SLOT_MINUTES);
      const spanSlots = Math.ceil(duration / SLOT_MINUTES);

      blocks.push({
        id: `${course.id}-${idx}`,
        title: course.name,
        room: t.room,
        dayIndex,
        startRow: startSlot + 1,
        rowSpan: spanSlots,
      });
    });
  });

  return blocks;
}

export default function MyTimetable({ courses = [] }) {
  const blocks = useMemo(() => buildBlocks(courses), [courses]);

  // 9, 10, 11, 12, 1, 2, 3, 4, 5, 6
  const timeLabels = useMemo(() => {
    const arr = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const display = h <= 12 ? h : h - 12;
      arr.push(display);
    }
    return arr;
  }, []);

  return (
    <div className="mypage-timetable">
      <div className="mypage-timetable-inner">
        {/* 요일 헤더 */}
        <div className="mypage-timetable-header-row">
          <div className="mypage-timetable-header-time-empty" />
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="mypage-timetable-day-label"
            >
              {label}
            </div>
          ))}
        </div>

        {/* 본문: 왼쪽 시간 / 오른쪽 강의 그리드 */}
        <div className="mypage-timetable-main">
          <div className="mypage-timetable-times">
            {timeLabels.map((t) => (
              <div
                key={t}
                className="mypage-timetable-time"
              >
                {t}
              </div>
            ))}
          </div>

          <div
            className="mypage-timetable-grid"
            style={{
              gridTemplateRows: `repeat(${TOTAL_SLOTS}, minmax(0, 1fr))`,
            }}
          >
            {blocks.map((block) => (
              <div
                key={block.id}
                className="mypage-timetable-block"
                style={{
                  gridColumn: block.dayIndex + 1,
                  gridRow: `${block.startRow} / span ${block.rowSpan}`,
                }}
              >
                <div className="mypage-timetable-block-title">
                  {block.title}
                </div>
                {block.room && (
                  <div className="mypage-timetable-block-room">
                    {block.room}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
