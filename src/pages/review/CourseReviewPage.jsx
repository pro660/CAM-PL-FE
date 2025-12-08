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

// ✅ 공통 모달 (등록/수정/삭제 완료용)
import ReviewResultModal from "../../components/review/ReviewResultModal.jsx";
// ✅ 강의평 삭제 확인 모달
import CourseReviewDeleteModal from "../../components/review/CourseReviewDeleteModal.jsx";

export default function CourseReviewPage() {
  const { courseId } = useParams(); // ex) /course-review/:courseId
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // 작성/수정 폼
  const [newContent, setNewContent] = useState("");
  const [newRating, setNewRating] = useState(0); // 0 ~ 5, 0.5 단위
  const [submitting, setSubmitting] = useState(false);

  // 어떤 리뷰를 수정 중인지 (null이면 새로 작성 모드)
  const [editingReview, setEditingReview] = useState(null);

  // 삭제 모달 상태
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 결과 모달 상태 (등록/수정/삭제 공용)
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const courseName = course?.name || "강의명";

  /** 강의 + 강의평 전체 재조회 */
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

  const isEditMode = !!editingReview;

  const canSubmit = useMemo(() => {
    return newRating > 0 && newContent.trim().length > 0 && !submitting;
  }, [newRating, newContent, submitting]);

  /** 리스트에서 "수정" 아이콘 클릭 */
  const handleEditReview = (review) => {
    if (!review) return;
    setEditingReview(review);
    setNewRating(review.rating || 0);
    setNewContent(review.content || "");
  };

  /** 리스트에서 "삭제" 아이콘 클릭 */
  const handleRequestDeleteReview = (review) => {
    if (!review) return;
    setDeleteTarget(review);
    setShowDeleteModal(true);
  };

  /** 삭제 모달에서 "삭제하기" 버튼 */
  const handleConfirmDeleteReview = async () => {
    if (!courseId || !deleteTarget) return;
    setDeleteLoading(true);

    try {
      // ✅ 강의평 삭제 API
      await api.delete(`/courses/reviews/me/${courseId}`);

      // ✅ 삭제 후 강의 + 강의평 재조회
      await loadCourse();

      // 만약 삭제한 리뷰를 수정 중이었다면 폼 초기화
      if (editingReview && editingReview.id === deleteTarget.id) {
        setEditingReview(null);
        setNewContent("");
        setNewRating(0);
      }

      setResultMessage("강의평이 삭제되었습니다!");
      setShowResultModal(true);
    } catch (err) {
      console.error("강의평 삭제 실패:", err);
      alert("강의평 삭제 중 오류가 발생했어요.");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  /** 삭제 모달에서 "취소" 버튼 */
  const handleCancelDeleteReview = () => {
    if (deleteLoading) return;
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  /** 평가하기 / 수정하기 버튼 클릭 */
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

      if (isEditMode) {
        // ✅ 수정 API
        await api.put(`/courses/reviews/${courseId}`, body);

        // ✅ 수정 후 강의 + 강의평 재조회
        await loadCourse();

        setResultMessage("강의평이 수정되었습니다!");
      } else {
        // ✅ 등록 API
        await api.post(`/courses/reviews/${courseId}`, body);

        // ✅ 등록 후 강의 + 강의평 재조회
        await loadCourse();

        setResultMessage("강의평이 등록되었습니다!");
      }

      // 폼 초기화
      setNewContent("");
      setNewRating(0);
      setEditingReview(null);

      // 결과 모달 노출
      setShowResultModal(true);
    } catch (err) {
      console.error("강의평 저장 실패:", err);
      alert(
        isEditMode
          ? "강의평 수정 중 오류가 발생했어요."
          : "강의평 등록 중 오류가 발생했어요."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /** 결과 모달 닫기 */
  const handleCloseResultModal = () => {
    setShowResultModal(false);
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
              onDeleteReview={handleRequestDeleteReview}
            />

            {/* 3. 강의평 쓰기 섹션 */}
            <CourseReviewWriteSection
              content={newContent}
              onContentChange={setNewContent}
              rating={newRating}
              onRatingChange={setNewRating}
            />

            {/* 하단 버튼: 작성/수정 공용 */}
            <div className="course-review-submit-wrap">
              <button
                type="button"
                className="course-review-submit-btn"
                onClick={handleSubmitReview}
                disabled={!canSubmit}
              >
                {submitting
                  ? isEditMode
                    ? "수정 중..."
                    : "등록 중..."
                  : isEditMode
                  ? "수정하기"
                  : "평가하기"}
              </button>
            </div>
          </>
        )}
      </main>

      {/* ✅ 삭제 확인 모달 (강의평 삭제) */}
      <CourseReviewDeleteModal
        visible={showDeleteModal}
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteReview}
        onCancel={handleCancelDeleteReview}
      />

      {/* ✅ 등록/수정/삭제 결과 모달 (확인 버튼 1개) */}
      <ReviewResultModal
        visible={showResultModal}
        message={resultMessage}
        onClose={handleCloseResultModal}
      />
    </div>
  );
}
