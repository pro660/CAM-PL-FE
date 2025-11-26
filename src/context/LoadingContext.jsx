// src/context/LoadingContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

const LoadingContext = createContext({
  isLoading: false,    // 화면에 로더를 보여줄지 여부
  showLoading: () => {},
  hideLoading: () => {},
});

const MIN_LOADER_DURATION = 1000; // ✅ 최소 1초 (ms 단위)

export function LoadingProvider({ children }) {
  const [count, setCount] = useState(0);      // 실제 진행 중인 요청 개수
  const [visible, setVisible] = useState(false); // 로더 노출 여부

  const startTimeRef = useRef(null); // 첫 로딩 시작 시각
  const timerRef = useRef(null);     // 최소 노출 타이머

  const showLoading = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  const hideLoading = useCallback(() => {
    setCount((c) => Math.max(0, c - 1));
  }, []);

  // count 변화에 따라 visible 제어 (최소 1초 보장)
  useEffect(() => {
    // 1) 로딩이 하나 이상 진행 중인 경우
    if (count > 0) {
      // 로딩 세션이 처음 시작된 시점
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
        setVisible(true); // 바로 로더 켜기
      }

      // 새로운 요청이 들어오면 남아 있던 타이머 제거
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // 2) 여기서부터는 count === 0 (더 이상 진행 중인 요청 없음)

    // 로딩이 켜진 적도 없으면 바로 종료
    if (startTimeRef.current === null) {
      setVisible(false);
      return;
    }

    const elapsed = Date.now() - startTimeRef.current;
    const remain = MIN_LOADER_DURATION - elapsed;

    if (remain <= 0) {
      // 이미 최소 시간 지난 상태 → 바로 끄기
      setVisible(false);
      startTimeRef.current = null;
    } else {
      // 아직 최소 1초 안 됨 → 남은 시간만큼 더 보여주고 끄기
      timerRef.current = setTimeout(() => {
        setVisible(false);
        startTimeRef.current = null;
        timerRef.current = null;
      }, remain);
    }
  }, [count]);

  // 언마운트시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const value = {
    isLoading: visible,      // ✅ Layout/Router에서는 이 값으로 Loader 표시
    showLoading,
    hideLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}
