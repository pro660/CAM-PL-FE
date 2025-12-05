// src/pages/review/CourseReviewPage.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../css/review/CourseReviewPage.css";

import api from "../../api/axios";
import { useLoading } from "../../context/LoadingContext.jsx";

import CourseReviewHeaderSection from "./CourseReviewHeaderSection.jsx";
import CourseReviewListSection from "./CourseReviewListSection.jsx";
import CourseReviewWriteSection from "./CourseReviewWriteSection.jsx";

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

  /** 평가하기 버튼 클릭 */
  const handleSubmitReview = async () => {
    if (!courseId) return;
    if (!newRating || !newContent.trim()) {
      alert("별점과 내용을 모두 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        rating: newRating,
        content: newContent.trim(),
      };

      const res = await api.post(`/courses/reviews/${courseId}`, body);
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
          (prevAvg * prevCount + (created.rating ?? newRating)) / newCount;
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
          <div className="course-review-loading">강의 정보를 불러오는 중이에요...</div>
        ) : !course ? (
          <div className="course-review-loading">강의 정보를 찾을 수 없어요.</div>
        ) : (
          <>
            {/* 1. 과목 정보 섹션 */}
            <CourseReviewHeaderSection course={course} />

            {/* 2. 강의평 리스트 섹션 */}
            <CourseReviewListSection
              reviews={reviews}
              semesterCode={course.semesterCode}
            />

            {/* 3. 강의평 쓰기 섹션 */}
            <CourseReviewWriteSection
              content={newContent}
              onContentChange={setNewContent}
              rating={newRating}
              onRatingChange={setNewRating}
            />

            {/* 하단 평가하기 버튼 */}
            <div className="course-review-submit-wrap">
              <button
                type="button"
                className="course-review-submit-btn"
                onClick={handleSubmitReview}
                disabled={!canSubmit}
              >
                {submitting ? "등록 중..." : "평가하기"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
