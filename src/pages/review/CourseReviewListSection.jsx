// src/pages/review/CourseReviewListSection.jsx
import React, { useMemo } from "react";
import "../../css/review/CourseReviewListSection.css";
import StarRatingDisplay from "../../components/review/StarRatingDisplay.jsx";

// 실제 아이콘 경로 (프로젝트 구조 기준으로 맞게 사용)
import EDIT_ICON_SRC from "../../images/calendar/edit.svg";
import DELETE_ICON_SRC from "../../images/calendar/trash.svg";

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
  onEditReview,   // (review) => void
  onDeleteReview, // (review) => void
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
          {sortedReviews.map((review) => {
            // 🔥 백엔드에서 내려주는 mine 필드로 내 리뷰 여부 판단
            const isMine = review.mine === true;

            return (
              <article
                key={review.id || review.createdAt}
                className="cr-review-card"
              >
                {/* 상단: 별점 + (내 리뷰면) 수정/삭제 아이콘 */}
                <div className="cr-review-card-top">
                  <div className="cr-review-rating-row">
                    <StarRatingDisplay value={review.rating || 0} />
                  </div>

                  {isMine && (
                    <div className="cr-review-actions">
                      <button
                        type="button"
                        className="cr-review-icon-btn"
                        onClick={() => onEditReview?.(review)}
                        aria-label="강의평 수정"
                      >
                        <img
                          src={EDIT_ICON_SRC}
                          alt="수정"
                          className="cr-review-icon-img"
                        />
                      </button>
                      <button
                        type="button"
                        className="cr-review-icon-btn"
                        onClick={() => onDeleteReview?.(review)}
                        aria-label="강의평 삭제"
                      >
                        <img
                          src={DELETE_ICON_SRC}
                          alt="삭제"
                          className="cr-review-icon-img"
                        />
                      </button>
                    </div>
                  )}
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
            );
          })}
        </div>
      )}
    </section>
  );
}
