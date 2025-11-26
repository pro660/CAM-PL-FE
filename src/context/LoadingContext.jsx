// src/contexts/LoadingContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";

const LoadingContext = createContext({
  isLoading: false,
  showLoading: () => {},
  hideLoading: () => {},
});

export function LoadingProvider({ children }) {
  // 여러 API가 동시에 돌아갈 수 있으니까 카운트로 관리
  const [count, setCount] = useState(0);

  const showLoading = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  const hideLoading = useCallback(() => {
    setCount((c) => Math.max(0, c - 1));
  }, []);

  const value = {
    isLoading: count > 0,
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
