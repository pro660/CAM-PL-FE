import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../css/review/CourseReviewPage.css";

import api from "../../api/axios";
import { useLoading } from "../../context/LoadingContext.jsx";

import CourseInfoSection from "./CourseReviewHeaderSection.jsx";
import CourseReviewList from "./CourseReviewList.jsx";
import CourseReviewWrite from "./CourseReviewWrite.jsx";

export default function CourseReviewPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  const [course, setCourse] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(false);

  const [hasMyReview, setHasMyReview] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(0);

  // 강의 정보 불러오기
  useEffect(() => {
    const fetchCourse = async () => {
      setLoadingCourse(true);
      showLoading();
      try {
        const res = await api.get(`/courses/${courseId}`);
        const data = res.data;
        setCourse(data);

        // 서버가 hasMyReview 또는 isMine 같은 필드를 내려줄 경우 대비
        const hasMine =
          data?.hasMyReview === true ||
          (Array.isArray(data?.reviews) &&
            data.reviews.some((r) => r.isMine));
        if (hasMine) {
          setHasMyReview(true);
        }
      } catch (e) {
        console.error("강의 정보 불러오기 실패:", e);
      } finally {
        setLoadingCourse(false);
        hideLoading();
      }
    };

    fetchCourse();
  }, [courseId, showLoading, hideLoading]);

  const handleBack = () => {
    navigate(-1);
  };

  // 강의평 등록
  const handleSubmitReview = async () => {
    if (!course) return;

    if (hasMyReview) {
      alert("한 개의 강의평만 작성 가능합니다.");
      return;
    }

    if (!reviewRating || reviewRating < 0.5) {
      alert("별점을 선택해주세요.");
      return;
    }

    if (!reviewContent.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await api.post(`/courses/reviews/${course.id}`, {
        rating: reviewRating,
        content: reviewContent.trim(),
      });

      const newReview = res.data;

      setCourse((prev) => {
        if (!prev) return prev;
        const prevReviews = Array.isArray(prev.reviews)
          ? prev.reviews
          : [];
        const nextReviews = [newReview, ...prevReviews];

        const nextCount = nextReviews.length;
        const sumRating = nextReviews.reduce(
          (sum, r) => sum + (r.rating || 0),
          0
        );
        const nextAvg =
          nextCount > 0 ? sumRating / nextCount : 0;

        return {
          ...prev,
          reviews: nextReviews,
          ratingCount: nextCount,
          ratingAvg: nextAvg,
        };
      });

      setHasMyReview(true);
      setReviewContent("");
      setReviewRating(0);
      alert("강의평이 등록되었습니다.");
    } catch (e) {
      if (e.response?.status === 409) {
        // 이미 강의평이 있는 경우
        alert("한 개의 강의평만 작성 가능합니다.");
        setHasMyReview(true);
      } else {
        console.error("강의평 등록 실패:", e);
        alert("강의평 등록 중 오류가 발생했어요.");
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // 강의평 삭제
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("이 강의평을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await api.delete(`/courses/reviews/${reviewId}`);

      setCourse((prev) => {
        if (!prev) return prev;
        const prevReviews = Array.isArray(prev.reviews)
          ? prev.reviews
          : [];

        const nextReviews = prevReviews.filter(
          (r) => r.id !== reviewId
        );

        const nextCount = nextReviews.length;
        const sumRating = nextReviews.reduce(
          (sum, r) => sum + (r.rating || 0),
          0
        );
        const nextAvg =
          nextCount > 0 ? sumRating / nextCount : 0;

        return {
          ...prev,
          reviews: nextReviews,
          ratingCount: nextCount,
          ratingAvg: nextAvg,
        };
      });

      // 삭제된 리뷰가 내 것이라고 가정하고 다시 작성 가능하게
      setHasMyReview(false);
    } catch (e) {
      console.error("강의평 삭제 실패:", e);
      alert("강의평 삭제 중 오류가 발생했어요.");
    }
  };

  const ratingAvg = course?.ratingAvg ?? 0;
  const ratingCount = course?.ratingCount ?? 0;
  const reviews = course?.reviews ?? [];

  return (
    <div className="course-review-page">
      {/* 상단 커스텀 헤더 */}
      <header className="course-review-header">
        <button
          type="button"
          className="course-review-back-button"
          onClick={handleBack}
          aria-label="이전 페이지로"
        >
          {/* 여기 SVG 화살표 아이콘 넣어도 됨 */}
          <span className="course-review-back-arrow">←</span>
        </button>
        <h1 className="course-review-header-title">강의평</h1>
        <div className="course-review-header-right" />
      </header>

      <div className="course-review-page-content">
        <CourseInfoSection
          course={course}
          loading={loadingCourse}
          ratingAvg={ratingAvg}
          ratingCount={ratingCount}
        />

        <CourseReviewList
          reviews={reviews}
          semesterCode={course?.semesterCode}
          onDeleteReview={handleDeleteReview}
        />

        <CourseReviewWrite
          rating={reviewRating}
          onRatingChange={setReviewRating}
          content={reviewContent}
          onContentChange={setReviewContent}
          hasMyReview={hasMyReview}
        />
      </div>

      {/* 화면 하단 평가하기 버튼 */}
      <div className="course-review-submit-bar">
        <button
          type="button"
          className="course-review-submit-button"
          onClick={handleSubmitReview}
          disabled={submitLoading || hasMyReview}
        >
          {hasMyReview
            ? "이미 강의평을 작성하셨습니다"
            : submitLoading
            ? "등록 중..."
            : "평가하기"}
        </button>
      </div>
    </div>
  );
}
