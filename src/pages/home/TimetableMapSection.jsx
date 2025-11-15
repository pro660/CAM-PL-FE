// src/components/home/TimetableMapSection.jsx
import React, { useState, useEffect } from "react";
import NaverMap from "../../components/home/NaverMap";
import api from "../../api/axios";

const weekdayLabels = ["월", "화", "수", "목", "금"];
const timeSlots = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
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
      return dayStr; // 이미 "월" 같은 값일 수도 있으니 그대로 반환
  }
};

const TimetableMapSection = ({ onTodayLecturesChange }) => {
  const [activeView, setActiveView] = useState("timetable"); // "timetable" | "map"
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  // 오늘 요일 (한 글자)
  const today = new Date();
  const weekdayNamesOne = ["일", "월", "화", "수", "목", "금", "토"];
  const todayLabel = weekdayNamesOne[today.getDay()]; // "월" ~ "일"

  // 시간표 API 호출 + 데이터 정규화
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const res = await api.get("/timetable");
        const rawData = res.data || [];

        console.log("timetable api raw data:", rawData);

        // 백엔드 응답 형식을 정규화
        const normalized = rawData.map((item) => ({
          id: item.id,
          day: item.day
            ? item.day
            : item.dayOfWeek
            ? mapApiDayToKor(item.dayOfWeek)
            : "",
          startTime: item.startTime,
          endTime: item.endTime,
          title: item.title || item.subjectName || "",
          location: item.location || item.classroom || "",
        }));

        setTimetable(normalized);

        // === 오늘의 강의 리스트 계산해서 부모(HomePage)로 전달 ===
        if (onTodayLecturesChange) {
          const todays = normalized.filter((cls) => cls.day === todayLabel);
          const todayLectureItems = todays.map((cls) => ({
            id: cls.id,
            buildingLabel: "강의실", // 추후 백엔드에서 건물 정보 오면 교체
            title: cls.title,
            locationDetail: cls.location,
            timeRange: `${cls.startTime} ~ ${cls.endTime}`,
          }));
          onTodayLecturesChange(todayLectureItems);
        }
      } catch (error) {
        console.error("시간표 조회 실패:", error);
        if (onTodayLecturesChange) onTodayLecturesChange([]); // 실패 시 오늘 강의 초기화
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [onTodayLecturesChange, todayLabel]);

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
          // ===== 네이버 지도 화면 =====
          <NaverMap />
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
                  <div className="home-timetable-header-cell time-col"></div>
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
                    {timeSlots.map((t) => (
                      <div
                        key={t}
                        className="home-timetable-time-slot"
                      >
                        {t}
                      </div>
                    ))}
                  </div>

                  {/* 오른쪽 요일별 칸 */}
                  <div className="home-timetable-grid">
                    {weekdayLabels.map((day) => (
                      <div
                        key={day}
                        className="home-timetable-day-column"
                      >
                        {timetable
                          .filter((cls) => cls.day === day) // "월" / "화" ...
                          .map((cls) => {
                            const startMin = timeToMinutes(cls.startTime);
                            const endMin = timeToMinutes(cls.endTime);
                            const baseMin = timeToMinutes(timeSlots[0]); // 09:00 기준
                            const unit = 60; // 1칸 = 60분

                            const top =
                              ((startMin - baseMin) / unit) * 2.5;
                            const height =
                              ((endMin - startMin) / unit) * 2.5;

                            return (
                              <div
                                key={cls.id}
                                className="home-timetable-class-block"
                                style={{
                                  top: `${top}rem`,
                                  height: `${height}rem`,
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
                    ))}
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
