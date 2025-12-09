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

// 공통 모달 스타일 재사용
import "../../css/calendar/Delete_schdule.css";
import NosmileImg from "../../images/calendar/nosmile.svg";

/** 강의평 삭제 확인 모달 */
function ReviewDeleteModal({ visible, loading, onConfirm, onCancel }) {
  if (!visible) return null;

  return (
    <div className="delete-schedule-overlay">
      <div className="delete-schedule-modal">
        <div className="delete-schedule-icon-wrap">
          <img
            src={NosmileImg}
            alt="삭제 안내 아이콘"
            className="delete-schedule-icon"
          />
        </div>

        <p className="delete-schedule-message">
          해당 강의평을 삭제하시겠습니까?
        </p>

        <div className="delete-schedule-buttons">
          <button
            type="button"
            className="delete-schedule-confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "삭제 중..." : "확인"}
          </button>
          <button
            type="button"
            className="delete-schedule-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

/** 강의평 등록/수정/삭제 완료 안내 모달 */
function ReviewResultModal({ visible, message, onClose }) {
  if (!visible) return null;

  return (
    <div className="delete-schedule-overlay">
      <div className="delete-schedule-modal">
        <div className="delete-schedule-icon-wrap">
          <img
            src={NosmileImg}
            alt="안내 아이콘"
            className="delete-schedule-icon"
          />
        </div>

        <p className="delete-schedule-message">{message}</p>

        <div className="delete-schedule-buttons">
          <button
            type="button"
            className="delete-schedule-confirm"
            onClick={onClose}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

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

  // 수정 모드 여부 (수정 대상 리뷰 id)
  const [editingReviewId, setEditingReviewId] = useState(null);

  // 삭제 모달 상태
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTargetReview, setDeleteTargetReview] = useState(null);

  // 결과 모달(등록/수정/삭제 완료)
  const [resultModal, setResultModal] = useState({
    visible: false,
    message: "",
  });

  const courseName = course?.name || "강의명";

  /** 강의 + 강의평 전체 조회 (리스트 재호출) */
  const loadCourse = useCallback(
    async () => {
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
    },
    [courseId, showLoading, hideLoading]
  );

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const handleBack = () => {
    navigate(-1);
  };

  const isEditing = useMemo(
    () => editingReviewId !== null,
    [editingReviewId]
  );

  const canSubmit = useMemo(
    () =>
      newRating > 0 &&
      newContent.trim().length > 0 &&
      !submitting,
    [newRating, newContent, submitting]
  );

  /** 리스트에서 "수정" 아이콘 클릭 */
  const handleEditReviewClick = (review) => {
    if (!review) return;
    setEditingReviewId(review.id ?? 0);
    setNewContent(review.content || "");
    setNewRating(review.rating || 0);
  };

  /** 리스트에서 "삭제" 아이콘 클릭 */
  const handleDeleteReviewClick = (review) => {
    if (!review) return;
    setDeleteTargetReview(review);
    setDeleteModalOpen(true);
  };

  /** 삭제 모달에서 "취소" */
  const handleCancelDeleteReview = () => {
    if (deleteLoading) return;
    setDeleteModalOpen(false);
    setDeleteTargetReview(null);
  };

  /** 삭제 모달에서 "확인" → 삭제 API + 리스트 재호출 + 완료 모달 */
  const handleConfirmDeleteReview = async () => {
    if (!courseId || !deleteTargetReview) return;
    if (deleteLoading) return;

    setDeleteLoading(true);
    try {
      // 삭제 API
      await api.delete(`/courses/reviews/me/${courseId}`);

      // 삭제 모달 먼저 닫기
      setDeleteModalOpen(false);
      setDeleteTargetReview(null);

      // 리스트 재호출 (여기서 로더가 뜨고, 끝나면 사라짐)
      await loadCourse();

      // 만약 수정 중이던 리뷰를 삭제했으면 입력 초기화
      setEditingReviewId(null);
      setNewContent("");
      setNewRating(0);

      // 로딩이 다 끝난 뒤 완료 모달 표시
      setResultModal({
        visible: true,
        message: "강의평이 삭제되었습니다.",
      });
    } catch (err) {
      console.error("강의평 삭제 실패:", err);
      alert("강의평 삭제 중 오류가 발생했어요.");
    } finally {
      setDeleteLoading(false);
    }
  };

  /** 평가하기 / 수정하기 버튼 클릭 */
  const handleSubmitReview = async () => {
    if (!courseId) return;
    if (!newRating || !newContent.trim()) {
      alert("별점과 내용을 모두 입력해주세요.");
      return;
    }

    setSubmitting(true);
    const body = {
      rating: newRating,
      content: newContent.trim(),
    };

    try {
      if (isEditing) {
        // 수정
        await api.put(`/courses/reviews/${courseId}`, body);
      } else {
        // 신규 등록
        await api.post(`/courses/reviews/${courseId}`, body);
      }

      // 등록/수정 후 -> 리스트 재호출
      // (여기서 로더가 뜨고, 다 끝난 다음에 모달이 뜨게 순서 보장)
      await loadCourse();

      // 입력값/수정 상태 초기화
      setNewContent("");
      setNewRating(0);
      setEditingReviewId(null);

      // 로딩이 끝난 후 성공 모달
      setResultModal({
        visible: true,
        message: isEditing
          ? "강의평이 수정되었습니다!"
          : "강의평이 등록되었습니다!",
      });
    } catch (err) {
      console.error(
        isEditing ? "강의평 수정 실패:" : "강의평 등록 실패:",
        err
      );
      alert(
        isEditing
          ? "강의평 수정 중 오류가 발생했어요."
          : "강의평 등록 중 오류가 발생했어요."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseResultModal = () => {
    setResultModal({ visible: false, message: "" });
  };

  const buttonLabel = useMemo(() => {
    if (submitting) {
      return isEditing ? "수정 중..." : "등록 중...";
    }
    return isEditing ? "수정하기" : "평가하기";
  }, [submitting, isEditing]);

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
              onEditReview={handleEditReviewClick}
              onDeleteReview={handleDeleteReviewClick}
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
                {buttonLabel}
              </button>
            </div>
          </>
        )}
      </main>

      {/* 강의평 삭제 확인 모달 */}
      <ReviewDeleteModal
        visible={deleteModalOpen}
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteReview}
        onCancel={handleCancelDeleteReview}
      />

      {/* 등록/수정/삭제 완료 모달 */}
      <ReviewResultModal
        visible={resultModal.visible}
        message={resultModal.message}
        onClose={handleCloseResultModal}
      />
    </div>
  );
}
