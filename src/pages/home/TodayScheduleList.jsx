import React from "react";

const TodayScheduleList = ({ schedules = [], loading }) => {
  const hasSchedules = schedules.length > 0;

  // "00:00 ~ 00:00" 이거나 빈 문자열이면 실제 표시용 시간은 비우기
  const getDisplayTime = (timeRange) => {
    if (!timeRange) return "";
    const raw = String(timeRange);
    const normalized = raw.replace(/\s/g, "");
    if (!normalized) return "";
    if (normalized === "00:00~00:00") return "";
    return raw;
  };

  return (
    <section className="home-section home-schedule-section">
      <h2 className="home-section-title">오늘의 일정</h2>

      {loading ? (
        <p className="home-card-time" style={{ marginTop: "0.3rem" }}>
          오늘의 일정을 불러오는 중이에요...
        </p>
      ) : hasSchedules ? (
        <div className="home-section-card-list">
          {schedules.map((schedule) => {
            const displayTime = getDisplayTime(schedule.timeRange);
            const hasTime = !!displayTime;

            return (
              <article
                key={schedule.id}
                className="home-card home-schedule-card"
              >
                {/* 왼쪽 카테고리 pill */}
                <div className="home-card-header">
                  <span className="home-pill home-pill-category">
                    {schedule.category}
                  </span>
                </div>

                {/* 오른쪽: 제목 / 장소 / 시간(또는 빈 줄) */}
                <div className="home-card-body">
                  <h3 className="home-card-title">{schedule.title}</h3>
                  {schedule.place && (
                    <p className="home-card-subtext">{schedule.place}</p>
                  )}

                  {/* ⭐ 항상 시간 줄은 렌더링하되,
                      시간이 없으면 내용만 숨겨서 높이 유지 */}
                  <p
                    className={
                      "home-card-time" +
                      (hasTime ? "" : " home-card-time--empty")
                    }
                  >
                    {hasTime ? displayTime : "\u00A0"}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="home-card-time" style={{ marginTop: "0.3rem" }}>
          오늘은 등록된 일정이 없어요.
        </p>
      )}
    </section>
  );
};

export default TodayScheduleList;
