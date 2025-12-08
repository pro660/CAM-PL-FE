// src/pages/review/CourseReviewListSection.jsx
import React, { useMemo } from "react";
import "../../css/review/CourseReviewListSection.css";
import StarRatingDisplay from "../../components/review/StarRatingDisplay.jsx";

// ✅ 다른 곳과 맞춘 경로 (images)
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
            const key = review.id || review.createdAt;

            // 🔍 나중에 백엔드에서 mine/isMine/ownedByMe 같은 필드를 확정해주면
            // 여기에서 다시 isMine 조건을 걸면 됨.
            // const isMine = review.mine === true; 이런 식으로.

            return (
              <article key={key} className="cr-review-card">
                {/* 상단: 별점 + 수정/삭제 아이콘 */}
                <div className="cr-review-card-top">
                  <div className="cr-review-rating-row">
                    <StarRatingDisplay value={review.rating || 0} />
                  </div>

                  {/* 🔥 지금은 아이콘이 잘 뜨는지 확인하기 위해 항상 노출 */}
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
