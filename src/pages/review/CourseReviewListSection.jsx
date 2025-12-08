import React, { useMemo } from "react";
import "../../css/review/CourseReviewListSection.css";
import StarRatingDisplay from "../../components/review/StarRatingDisplay.jsx";

import TrashIcon from "../../images/calendar/trash.svg"
import PenIcon from "../../images/calendar/edit.svg"

const formatSemesterLabel = (semesterCode) => {
  if (!semesterCode) return "";
  const [yearStr, semStr] = semesterCode.split("-");
  if (!yearStr || !semStr) return "";
  const shortYear = yearStr.slice(2); // 2025 -> 25
  const semLabel =
    semStr === "1"
      ? "1학기"
      : semStr === "2"
      ? "2학기"
      : `${semStr}학기`;
  return `${shortYear}년 ${semLabel} 수강자`;
};

export default function CourseReviewListSection({
  reviews = [],
  semesterCode,
}) {
  const semesterLabel = useMemo(
    () => formatSemesterLabel(semesterCode),
    [semesterCode]
  );

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime; // 최신순
    });
  }, [reviews]);

  return (
    <section className="cr-list-wrapper">
      <h3 className="cr-section-title">강의평</h3>

      {sortedReviews.length === 0 ? (
        <p className="cr-list-empty-text">
          아직 등록된 강의평이 없어요.
        </p>
      ) : (
        <div className="cr-review-list">
          {sortedReviews.map((review) => (
            <article
              key={review.id || review.createdAt}
              className="cr-review-card"
            >
              <div className="cr-review-rating-row">
                {/* ⭐ 공용 별 컴포넌트 사용 (기본 클래스 = 리스트용) */}
                <StarRatingDisplay value={review.rating || 0} />
                <img src={TrashIcon} alt="쓰레기통 아이콘"/>
                <img src={PenIcon} alt="펜 아이콘"/>
              </div>
              {semesterLabel && (
                <div className="cr-review-semester">
                  {semesterLabel}
                </div>
              )}
              <p className="cr-review-content">
                {review.content || ""}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
