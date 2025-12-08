// src/pages/review/CourseReviewPage.jsx
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../css/review/CourseReviewPage.css";

import api from "../../api/axios";
import { useLoading } from "../../context/LoadingContext.jsx";

import CourseReviewHeaderSection from "./CourseReviewHeaderSection.jsx";
import CourseReviewListSection from "./CourseReviewListSection.jsx";
import CourseReviewWriteSection from "./CourseReviewWriteSection.jsx";
import ReviewConfirmModal from "../../components/review/ReviewConfirmModal.jsx";

export default function CourseReviewPage() {
  const { courseId } = useParams(); // ex) /course-review/:courseId
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newContent, setNewContent] = useState("");
  const [newRating, setNewRating] = useState(0); // 0 ~ 5, 0.5 단위
  const [submitting, setSubmitting] = useState(false);

  // 수정/삭제 관련 상태
  const [editingReview, setEditingReview] = useState(null);      // 내가 수정 중인 리뷰 객체
  const [deleteTargetReview, setDeleteTargetReview] = useState(null); // 삭제 대상 리뷰
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showEditSuccessModal, setShowEditSuccessModal] =
    useState(false);

  const courseName = course?.name || "강의명";

  const loadCourse = useCallback(async () => {
    if (!courseId) return;

    setLoading(true);
    showLoading();
    try {
      const res = await api.get(`/courses/${courseId}`);
      const data = res.data ?? {};
      setCourse(data);
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch (err) {
      console.error("강의 정보 조회 실패:", err);
      alert("강의 정보를 불러오는 중 오류가 발생했어요.");
    } finally {
      hideLoading();
      setLoading(false);
    }
  }, [courseId, showLoading, hideLoading]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const handleBack = () => {
    navigate(-1);
  };

  // 작성/수정 가능 조건
  const canSubmit = useMemo(() => {
    return (
      newRating > 0 &&
      newContent.trim().length > 0 &&
      !submitting
    );
  }, [newRating, newContent, submitting]);

  /** 리스트에서 "수정" 아이콘 클릭 */
  const handleEditReview = useCallback((review) => {
    setEditingReview(review);
    setNewContent(review.content || "");
    setNewRating(review.rating || 0);

    // 작성 섹션으로 스크롤 (옵션)
    const writeSection = document.querySelector(".cr-write-wrapper");
    if (writeSection) {
      writeSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  /** 리스트에서 "삭제" 아이콘 클릭 → 모달 오픈 */
  const handleDeleteReviewRequest = useCallback((review) => {
    setDeleteTargetReview(review);
  }, []);

  /** 삭제 모달에서 확인 클릭 → 삭제 API 호출 */
  const handleConfirmDeleteReview = useCallback(async () => {
    if (!courseId || !deleteTargetReview) return;

    setDeleteLoading(true);
    try {
      // 삭제 API: DELETE /api/courses/reviews/me/{courseId}
      await api.delete(`/courses/reviews/me/${courseId}`);

      const targetKey =
        deleteTargetReview.id || deleteTargetReview.createdAt;

      // 로컬 리뷰 목록에서 제거
      setReviews((prev) =>
        prev.filter(
          (r) => (r.id || r.createdAt) !== targetKey
        )
      );

      // 평균 / 개수 갱신
      setCourse((prev) => {
        if (!prev) return prev;
        const prevCount = prev.ratingCount || 0;
        const prevAvg = prev.ratingAvg || 0;
        const targetRating = deleteTargetReview.rating || 0;

        if (prevCount <= 1) {
          return {
            ...prev,
            ratingCount: 0,
            ratingAvg: 0,
          };
        }

        const newCount = prevCount - 1;
        const newAvg =
          (prevAvg * prevCount - targetRating) / newCount;

        return {
          ...prev,
          ratingCount: newCount,
          ratingAvg: newAvg,
        };
      });

      // 혹시 삭제 대상이 현재 수정 중인 리뷰라면 상태 리셋
      setEditingReview((prev) => {
        if (!prev) return prev;
        const prevKey = prev.id || prev.createdAt;
        return prevKey === targetKey ? null : prev;
      });

      setNewContent("");
      setNewRating(0);
    } catch (err) {
      console.error("강의평 삭제 실패:", err);
      alert("강의평 삭제 중 오류가 발생했어요.");
    } finally {
      setDeleteLoading(false);
      setDeleteTargetReview(null);
    }
  }, [courseId, deleteTargetReview]);

  /** 평가하기 / 수정하기 버튼 클릭 */
  const handleSubmitReview = async () => {
    if (!courseId) return;
    if (!newRating || !newContent.trim()) {
      alert("별점과 내용을 모두 입력해주세요.");
      return;
    }

    // === 수정 모드 ===
    if (editingReview) {
      setSubmitting(true);
      try {
        const body = {
          rating: newRating,
          content: newContent.trim(),
        };

        // 수정 API: PUT /api/courses/reviews/{courseId}
        const res = await api.put(
          `/courses/reviews/${courseId}`,
          body
        );
        const updated = res.data ?? {
          ...editingReview,
          ...body,
        };

        const targetKey =
          editingReview.id || editingReview.createdAt;

        // 로컬 리뷰 목록 갱신
        setReviews((prev) =>
          prev.map((r) =>
            (r.id || r.createdAt) === targetKey
              ? {
                  ...r,
                  rating: updated.rating,
                  content: updated.content,
                  createdAt:
                    updated.createdAt || r.createdAt,
                }
              : r
          )
        );

        // 평균 갱신: (기존 합 - old + new) / count
        setCourse((prev) => {
          if (!prev) return prev;
          const prevCount = prev.ratingCount || 0;
          const prevAvg = prev.ratingAvg || 0;
          if (prevCount <= 0) {
            return {
              ...prev,
              ratingCount: 1,
              ratingAvg: updated.rating,
            };
          }
          const oldRating = editingReview.rating || 0;
          const newAvg =
            (prevAvg * prevCount - oldRating + updated.rating) /
            prevCount;

          return {
            ...prev,
            ratingAvg: newAvg,
          };
        });

        setShowEditSuccessModal(true);
        setEditingReview(null);
        // newContent/newRating는 수정된 값 그대로 둠
      } catch (err) {
        console.error("강의평 수정 실패:", err);
        alert("강의평 수정 중 오류가 발생했어요.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // === 신규 등록 모드 ===
    setSubmitting(true);
    try {
      const body = {
        rating: newRating,
        content: newContent.trim(),
      };

      const res = await api.post(
        `/courses/reviews/${courseId}`,
        body
      );
      const created = res.data ?? body;

      // 로컬 리뷰 목록 맨 위에 추가
      setReviews((prev) => [created, ...prev]);

      // 평균 / 개수 갱신 (대략적으로 계산)
      setCourse((prev) => {
        if (!prev) return prev;
        const prevCount = prev.ratingCount || 0;
        const prevAvg = prev.ratingAvg || 0;
        const newCount = prevCount + 1;
        const newAvg =
          (prevAvg * prevCount +
            (created.rating ?? newRating)) /
          newCount;
        return {
          ...prev,
          ratingCount: newCount,
          ratingAvg: newAvg,
        };
      });

      setNewContent("");
      setNewRating(0);
      alert("강의평이 등록되었어요.");
    } catch (err) {
      console.error("강의평 등록 실패:", err);
      alert("강의평 등록 중 오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitButtonLabel = editingReview
    ? submitting
      ? "수정 중..."
      : "수정하기"
    : submitting
    ? "등록 중..."
    : "평가하기";

  return (
    <div className="course-review-page">
      {/* 상단 헤더 */}
      <header className="course-review-topbar">
        <button
          type="button"
          className="course-review-back-btn"
          onClick={handleBack}
          aria-label="이전 페이지로"
        >
          <span className="course-review-back-icon">←</span>
        </button>
        <h1 className="course-review-topbar-title">강의평</h1>
      </header>

      <main className="course-review-main">
        {loading && !course ? (
          <div className="course-review-loading">
            강의 정보를 불러오는 중이에요...
          </div>
        ) : !course ? (
          <div className="course-review-loading">
            강의 정보를 찾을 수 없어요.
          </div>
        ) : (
          <>
            {/* 1. 과목 정보 섹션 */}
            <CourseReviewHeaderSection course={course} />

            {/* 2. 강의평 리스트 섹션 */}
            <CourseReviewListSection
              reviews={reviews}
              semesterCode={course.semesterCode}
              onEditReview={handleEditReview}
              onDeleteReview={handleDeleteReviewRequest}
            />

            {/* 3. 강의평 쓰기 섹션 */}
            <CourseReviewWriteSection
              content={newContent}
              onContentChange={setNewContent}
              rating={newRating}
              onRatingChange={setNewRating}
            />

            {/* 하단 평가하기 / 수정하기 버튼 */}
            <div className="course-review-submit-wrap">
              <button
                type="button"
                className="course-review-submit-btn"
                onClick={handleSubmitReview}
                disabled={!canSubmit}
              >
                {submitButtonLabel}
              </button>
            </div>
          </>
        )}
      </main>

      {/* 삭제 확인 모달 */}
      <ReviewConfirmModal
        visible={!!deleteTargetReview}
        message="해당 강의평을 삭제하시겠습니까?"
        confirmText={deleteLoading ? "삭제 중..." : "삭제하기"}
        cancelText="취소"
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteReview}
        onCancel={() => {
          if (deleteLoading) return;
          setDeleteTargetReview(null);
        }}
      />

      {/* 수정 완료 모달 */}
      <ReviewConfirmModal
        visible={showEditSuccessModal}
        message="강의평이 수정되었습니다!"
        confirmText="확인"
        cancelText={null} // 취소 버튼 숨김
        loading={false}
        onConfirm={() => setShowEditSuccessModal(false)}
        onCancel={() => setShowEditSuccessModal(false)}
      />
    </div>
  );
}
