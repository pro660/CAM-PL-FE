// src/pages/review/CourseReviewPage.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../css/review/CourseReviewPage.css";

import api from "../../api/axios";
import { useLoading } from "../../context/LoadingContext.jsx";

import CourseReviewHeaderSection from "./CourseReviewHeaderSection.jsx";
import CourseReviewListSection from "./CourseReviewListSection.jsx";
import CourseReviewWriteSection from "./CourseReviewWriteSection.jsx";

// 리뷰 배열로부터 평균/개수 계산
const calcRatingStats = (reviews) => {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return { ratingAvg: 0, ratingCount: 0 };
  }
  const ratings = reviews
    .map((r) => (typeof r.rating === "number" ? r.rating : null))
    .filter((v) => v !== null);

  if (ratings.length === 0) {
    return { ratingAvg: 0, ratingCount: 0 };
  }

  const sum = ratings.reduce((acc, v) => acc + v, 0);
  const avg = sum / ratings.length;
  return { ratingAvg: avg, ratingCount: ratings.length };
};

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

  // 수정 중인 리뷰(내 리뷰)
  const [editingReview, setEditingReview] = useState(null);
  const isEditing = !!editingReview;

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

  const canSubmit = useMemo(() => {
    return newRating > 0 && newContent.trim().length > 0 && !submitting;
  }, [newRating, newContent, submitting]);

  /** 내 리뷰 수정 아이콘 클릭 */
  const handleEditReview = (review) => {
    setEditingReview(review);
    setNewRating(review.rating || 0);
    setNewContent(review.content || "");
    // 필요하면 여기서 스크롤 이동도 가능
    // document.getElementById("course-review-write")?.scrollIntoView({ behavior: "smooth" });
  };

  /** 내 리뷰 삭제 아이콘 클릭 */
  const handleDeleteReview = async (review) => {
    if (!courseId) return;

    const confirmed = window.confirm(
      "해당 강의평을 삭제하시겠습니까?"
    ); // 기존 공통 모달로 대체 가능
    if (!confirmed) return;

    try {
      setSubmitting(true);
      await api.delete(`/courses/reviews/me/${courseId}`);

      setReviews((prev) => {
        const next = prev.filter((r) => r.id !== review.id);

        setCourse((prevCourse) => {
          if (!prevCourse) return prevCourse;
          const stats = calcRatingStats(next);
          return {
            ...prevCourse,
            ratingAvg: stats.ratingAvg,
            ratingCount: stats.ratingCount,
          };
        });

        return next;
      });

      // 삭제 대상이 현재 수정 중인 리뷰라면 수정 모드도 해제
      if (editingReview && editingReview.id === review.id) {
        setEditingReview(null);
        setNewContent("");
        setNewRating(0);
      }

      alert("강의평이 삭제되었어요.");
    } catch (err) {
      console.error("강의평 삭제 실패:", err);
      alert("강의평 삭제 중 오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  /** 새 리뷰 등록 */
  const submitCreateReview = async () => {
    if (!courseId) return;

    const trimmed = newContent.trim();
    if (!newRating || !trimmed) {
      alert("별점과 내용을 모두 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        rating: newRating,
        content: trimmed,
      };

      const res = await api.post(`/courses/reviews/${courseId}`, body);
      const created = res.data ?? body;

      // mine 플래그를 강제로 true로 설정(백엔드에서도 내려주면 덮어쓰기 됨)
      const createdWithMine = { ...created, mine: true };

      setReviews((prev) => {
        const next = [createdWithMine, ...prev];

        setCourse((prevCourse) => {
          if (!prevCourse) return prevCourse;
          const stats = calcRatingStats(next);
          return {
            ...prevCourse,
            ratingAvg: stats.ratingAvg,
            ratingCount: stats.ratingCount,
          };
        });

        return next;
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

  /** 내 리뷰 수정 */
  const submitUpdateReview = async () => {
    if (!courseId) return;

    const trimmed = newContent.trim();
    if (!newRating || !trimmed) {
      alert("별점과 내용을 모두 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        rating: newRating,
        content: trimmed,
      };

      // 수정 API: PUT /courses/reviews/{courseId}
      const res = await api.put(`/courses/reviews/${courseId}`, body);
      const updated = res.data ?? {
        ...(editingReview || {}),
        rating: newRating,
        content: trimmed,
      };

      setReviews((prev) => {
        const next = prev.map((r) =>
          r.id === updated.id ? { ...r, ...updated } : r
        );

        setCourse((prevCourse) => {
          if (!prevCourse) return prevCourse;
          const stats = calcRatingStats(next);
          return {
            ...prevCourse,
            ratingAvg: stats.ratingAvg,
            ratingCount: stats.ratingCount,
          };
        });

        return next;
      });

      setEditingReview(null);
      setNewContent("");
      setNewRating(0);

      alert("강의평이 수정되었어요.");
    } catch (err) {
      console.error("강의평 수정 실패:", err);
      alert("강의평 수정 중 오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  /** 평가하기 / 수정하기 버튼 클릭 */
  const handleSubmitReview = async () => {
    if (isEditing) {
      await submitUpdateReview();
    } else {
      await submitCreateReview();
    }
  };

  const submitButtonLabel = (() => {
    if (submitting) {
      return isEditing ? "수정 중..." : "등록 중...";
    }
    return isEditing ? "수정하기" : "평가하기";
  })();

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
          {/* 간단한 화살표 (←) */}
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
              onDeleteReview={handleDeleteReview}
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
    </div>
  );
}
