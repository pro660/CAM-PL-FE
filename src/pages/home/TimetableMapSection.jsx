// src/pages/home/TimetableMapSection.jsx
import React, { useState, useEffect } from "react";
import NaverMap from "../../components/home/NaverMap";
import api from "../../api/axios";
import { useLoading } from "../../context/LoadingContext.jsx"; // ✅ 전역 로더 훅 추가

// 요일(표시용)
const weekdayLabels = ["월", "화", "수", "목", "금"];

// 시간축: 9시 ~ 19시(7시) → 10시간 구간
const START_HOUR = 9;
const END_HOUR = 19; // 7시까지 경계
const HOUR_SPAN = END_HOUR - START_HOUR; // 10
const TOTAL_MINUTES = HOUR_SPAN * 60; // 600분

// 왼쪽에 찍을 시간 숫자들 (9,10,11,12,13,14,15,16,17,18 → 10개)
const TIME_LABELS = Array.from({ length: HOUR_SPAN }, (_, i) => START_HOUR + i);

// 24시간 → 화면에 찍을 숫자(13 ⇒ 1, 14 ⇒ 2 ...)
const formatHourLabel = (hour24) => {
  if (hour24 === 12) return "12";
  if (hour24 > 12) return String(hour24 - 12);
  return String(hour24);
};

// "13:30" / "13:30:00" → 분
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hStr, mStr] = timeStr.split(":"); // 초는 버림
  const h = Number(hStr) || 0;
  const m = Number(mStr) || 0;
  return h * 60 + m;
};

// 영어 요일 → 한글 한 글자 ("월", "화"...) 매핑 (백엔드 포맷 대비용)
const mapApiDayToKor = (dayStr) => {
  if (!dayStr) return "";
  const upper = dayStr.toUpperCase();
  switch (upper) {
    case "MONDAY":
    case "MON":
      return "월";
    case "TUESDAY":
    case "TUE":
      return "화";
    case "WEDNESDAY":
    case "WED":
      return "수";
    case "THURSDAY":
    case "THU":
      return "목";
    case "FRIDAY":
    case "FRI":
      return "금";
    case "SATURDAY":
    case "SAT":
      return "토";
    case "SUNDAY":
    case "SUN":
      return "일";
    default:
      return dayStr;
  }
};

const TimetableMapSection = ({ onTodayLecturesChange, markers = [] }) => {
  const { showLoading, hideLoading } = useLoading(); // ✅ 전역 로더 제어
  const [activeView, setActiveView] = useState("timetable"); // "timetable" | "map"
  const [timetable, setTimetable] = useState([]); // 평탄화된 강의 리스트
  const [loading, setLoading] = useState(true);

  // 오늘 요일 (한 글자)
  const today = new Date();
  const weekdayNamesOne = ["일", "월", "화", "수", "목", "금", "토"];
  const todayLabel = weekdayNamesOne[today.getDay()]; // "월" ~ "일"

  // ✅ 전체 강의 유무
  const hasLectures = timetable.length > 0;

  // 시간표 API 호출 + 데이터 정규화
  useEffect(() => {
    let cancelled = false;

    const fetchTimetable = async () => {
      showLoading(); // ✅ 전역 로더 +1
      try {
        const res = await api.get("/timetable");
        const body = res.data ?? {};
        const courses = Array.isArray(body.courses) ? body.courses : [];

        // 백엔드 응답을 평탄화해서 [ { day, startTime, endTime, title, location } ... ] 형태로 변환
        const normalized = [];

        courses.forEach((course) => {
          if (!Array.isArray(course.times)) return;

          course.times.forEach((t, idx) => {
            const dayKor = mapApiDayToKor(t.dayOfWeek);
            if (!weekdayLabels.includes(dayKor)) return; // 월~금만

            normalized.push({
              id: `${course.id}-${idx}-${t.dayOfWeek}-${t.startTime}`,
              day: dayKor, // "월"~"금"
              startTime: t.startTime.slice(0, 5), // "13:30"
              endTime: t.endTime.slice(0, 5),
              title: course.name,
              location: t.room || "",
            });
          });
        });

        if (!cancelled) {
          setTimetable(normalized);

          // === 오늘의 강의 리스트 계산해서 부모(HomePage)로 전달 ===
          if (onTodayLecturesChange) {
            const todays = normalized.filter((cls) => cls.day === todayLabel);
            const todayLectureItems = todays.map((cls) => ({
              id: cls.id,
              buildingLabel: "강의실", // TODO: 건물명 파싱해서 바꾸기
              title: cls.title,
              locationDetail: cls.location,
              timeRange: `${cls.startTime} ~ ${cls.endTime}`,
            }));
            onTodayLecturesChange(todayLectureItems);
          }
        }
      } catch (error) {
        console.error("시간표 조회 실패:", error);
        if (!cancelled && onTodayLecturesChange) {
          onTodayLecturesChange([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
        hideLoading(); // ✅ 전역 로더 -1
      }
    };

    fetchTimetable();

    return () => {
      cancelled = true;
    };
  }, [onTodayLecturesChange, todayLabel, showLoading, hideLoading]);

  const isMap = activeView === "map";

  return (
    <section className="home-timetable-map-section">
      <div className="home-timetable-map-header">
        <div className="home-timetable-map-header-left" />
        <div className="home-timetable-map-header-right">
          <button
            type="button"
            className={`home-toggle-btn ${
              activeView === "timetable" ? "active" : ""
            }`}
            onClick={() => setActiveView("timetable")}
          >
            시간표보기
          </button>
          <button
            type="button"
            className={`home-toggle-btn ${
              activeView === "map" ? "active" : ""
            }`}
            onClick={() => setActiveView("map")}
          >
            지도보기
          </button>
        </div>
      </div>

      <div className="home-timetable-map-content">
        {isMap ? (
          // ===== 네이버 지도 화면 (홈용 마커 표시) =====
          <NaverMap markers={markers} />
        ) : (
          // ===== 시간표 화면 =====
          <div className="home-timetable">
            {loading ? (
              <div className="home-timetable-loading">
                시간표 불러오는 중...
              </div>
            ) : (
              <>
                {/* 요일 헤더 줄 */}
                <div className="home-timetable-header-row">
                  <div className="home-timetable-header-cell time-col" />
                  {weekdayLabels.map((day) => (
                    <div
                      key={day}
                      className="home-timetable-header-cell"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* 시간축 + 그리드 영역 */}
                <div className="home-timetable-body">
                  {/* 왼쪽 시간축 */}
                  <div className="home-timetable-time-col">
                    {TIME_LABELS.map((h) => (
                      <div
                        key={h}
                        className="home-timetable-time-slot"
                      >
                        {formatHourLabel(h)}
                      </div>
                    ))}
                  </div>

                  {/* 오른쪽 요일별 칸 / 또는 빈 메시지 */}
                  <div
                    className={`home-timetable-grid ${
                      !hasLectures ? "no-lectures" : ""
                    }`}
                  >
                    {hasLectures ? (
                      weekdayLabels.map((day) => (
                        <div
                          key={day}
                          className="home-timetable-day-column"
                        >
                          {timetable
                            .filter((cls) => cls.day === day)
                            .map((cls) => {
                              const startMin = timeToMinutes(cls.startTime);
                              const endMin = timeToMinutes(cls.endTime);

                              const minMinutes = START_HOUR * 60; // 9:00
                              const maxMinutes = END_HOUR * 60; // 19:00

                              // 9~19 범위로 클램프
                              const clampedStart = Math.max(
                                startMin,
                                minMinutes
                              );
                              const clampedEnd = Math.min(
                                endMin,
                                maxMinutes
                              );
                              if (clampedEnd <= clampedStart) return null;

                              // 전체 높이(10시간)를 100%로 보고, 퍼센트로 위치 계산
                              const topPercent =
                                ((clampedStart - minMinutes) /
                                  TOTAL_MINUTES) *
                                100;
                              const heightPercent =
                                ((clampedEnd - clampedStart) /
                                  TOTAL_MINUTES) *
                                100;

                              return (
                                <div
                                  key={cls.id}
                                  className="home-timetable-class-block"
                                  style={{
                                    top: `${topPercent}%`,
                                    height: `${heightPercent}%`,
                                  }}
                                >
                                  <div className="home-timetable-class-title">
                                    {cls.title}
                                  </div>
                                  <div className="home-timetable-class-location">
                                    {cls.location}
                                  </div>
                                  <div className="home-timetable-class-time">
                                    {cls.startTime} ~ {cls.endTime}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ))
                    ) : (
                      <div className="home-timetable-empty-message">
                        강의를 추가해 나만의 시간표를 만드세요.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default TimetableMapSection;
