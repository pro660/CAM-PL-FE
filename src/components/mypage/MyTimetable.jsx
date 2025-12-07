// src/components/mypage/MyTimetable.jsx
import React, { useMemo } from "react";
import "../../css/mypage/MyTimetable.css";

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const DAY_LABELS = ["월", "화", "수", "목", "금"];

const START_HOUR = 9; // 9시
const END_HOUR = 18; // 18시(6시)

// 🔥 화면에 보이는 시간칸은 9~6까지 "10칸"이라서 10시간 기준으로 스케일
const TOTAL_MINUTES = (END_HOUR - START_HOUR + 1) * 60; // 10 * 60 = 600

// 왼쪽에 표시할 시간 라벨: 9 ~ 6
const TIME_LABELS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

// 🔥 백엔드에서 내려오는 itemId 위치를 유연하게 처리
function resolveItemId(course, time) {
  // 과목 기준 itemId
  if (course?.itemId != null) return course.itemId;
  if (course?.timetableItemId != null) return course.timetableItemId;

  // 혹시 time 쪽에 내려오는 경우 대비
  if (time?.itemId != null) return time.itemId;
  if (time?.timetableItemId != null) return time.timetableItemId;

  return null;
}

function buildDayColumns(courses = []) {
  const columns = DAY_ORDER.map(() => []);

  courses.forEach((course) => {
    if (!Array.isArray(course.times)) return;

    course.times.forEach((t, idx) => {
      const dayIndex = DAY_ORDER.indexOf(t.dayOfWeek);
      if (dayIndex === -1) return;

      const [sh, sm] = t.startTime.split(":").map(Number);
      const [eh, em] = t.endTime.split(":").map(Number);
      if (Number.isNaN(sh) || Number.isNaN(eh)) return;

      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;

      const minMinutes = START_HOUR * 60;
      const maxMinutes = END_HOUR * 60;

      // 9~18시 범위 안으로 클램프
      const clampedStart = Math.max(startMinutes, minMinutes);
      const clampedEnd = Math.min(endMinutes, maxMinutes);
      if (clampedEnd <= clampedStart) return;

      // 🔥 세로 길이 비율(9~6 = 10칸 기준)
      const topPercent =
        ((clampedStart - minMinutes) / TOTAL_MINUTES) * 100;
      const heightPercent =
        ((clampedEnd - clampedStart) / TOTAL_MINUTES) * 100;

      const itemId = resolveItemId(course, t);

      columns[dayIndex].push({
        // React key용 id (course 기준 고유값)
        id: `${course.id}-${idx}-${t.dayOfWeek}-${t.startTime}`,
        // ✅ 시간표 삭제용 itemId
        itemId,
        title: course.name,
        room: t.room,
        timeLabel: `${t.startTime.slice(0, 5)} ~ ${t.endTime.slice(0, 5)}`,
        topPercent,
        heightPercent,
      });
    });
  });

  return columns;
}

export default function MyTimetable({
  courses = [],
  previewCourse = null,
  onBlockClick,
}) {
  // 실제 내 시간표 강의
  const dayColumns = useMemo(
    () => buildDayColumns(courses),
    [courses]
  );

  // 🔥 선택된 강의 미리보기용 (흐릿한 블록)
  const previewColumns = useMemo(() => {
    if (!previewCourse) {
      // DAY_ORDER 길이에 맞춰 빈 배열 유지
      return DAY_ORDER.map(() => []);
    }
    return buildDayColumns([previewCourse]);
  }, [previewCourse]);

  // ✅ 강의가 하나라도 있는지 여부
  const hasAnyLecture = useMemo(
    () => dayColumns.some((blocks) => blocks.length > 0),
    [dayColumns]
  );

  // ✅ 미리보기 블록이 있는지 여부
  const hasPreview = useMemo(
    () => previewColumns.some((blocks) => blocks.length > 0),
    [previewColumns]
  );

  return (
    <div className="mypage-timetable-card">
      <div className="mypage-timetable">
        {/* 상단 요일 헤더 줄 */}
        <div className="mypage-timetable-header-row">
          <div className="mypage-timetable-header-cell mypage-timetable-header-cell-time" />
          {DAY_LABELS.map((label) => (
            <div key={label} className="mypage-timetable-header-cell">
              {label}
            </div>
          ))}
        </div>

        {/* 본문: 왼쪽 시간축 + 오른쪽 요일 그리드 */}
        <div className="mypage-timetable-body">
          {/* 왼쪽 시간축 */}
          <div className="mypage-timetable-time-col">
            {TIME_LABELS.map((t) => (
              <div key={t} className="mypage-timetable-time-slot">
                {t}
              </div>
            ))}
          </div>

          {/* 오른쪽 5일 그리드 */}
          <div
            className={
              "mypage-timetable-grid" +
              (!hasAnyLecture && !hasPreview
                ? " mypage-timetable-grid-empty"
                : "")
            }
          >
            {DAY_ORDER.map((dayKey, dayIdx) => {
              const blocks = dayColumns[dayIdx] || [];
              const previewBlocks = previewColumns[dayIdx] || [];

              return (
                <div
                  key={dayKey}
                  className="mypage-timetable-day-column"
                >
                  {/* 🔥 선택된 강의 미리보기 (흐릿한 블록) */}
                  {previewBlocks.map((block) => (
                    <div
                      key={`preview-${block.id}`}
                      className="mypage-timetable-preview-block"
                      style={{
                        top: `${block.topPercent}%`,
                        height: `${block.heightPercent}%`,
                      }}
                    />
                  ))}

                  {/* 실제 시간표 강의 블록 */}
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      className="mypage-timetable-class-block"
                      style={{
                        top: `${block.topPercent}%`,
                        height: `${block.heightPercent}%`,
                      }}
                      // ✅ 클릭 시 무조건 부모에 전달 → 부모에서 모달 오픈
                      onClick={() =>
                        onBlockClick &&
                        onBlockClick({
                          itemId: block.itemId,
                          title: block.title,
                          timeLabel: block.timeLabel,
                        })
                      }
                    >
                      <div className="mypage-timetable-class-title">
                        {block.title}
                      </div>
                      {block.room && (
                        <div className="mypage-timetable-class-location">
                          {block.room}
                        </div>
                      )}
                      <div className="mypage-timetable-class-time">
                        {block.timeLabel}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* ✅ 강의도 없고 미리보기도 없을 때만 표시되는 안내 문구 */}
            {!hasAnyLecture && !hasPreview && (
              <div className="mypage-timetable-empty-text">
                강의를 추가해 나만의 시간표를 만드세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
