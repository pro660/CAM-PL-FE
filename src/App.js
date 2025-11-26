// src/App.jsx
import React from "react";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LoadingProvider } from "./context/LoadingContext.jsx"; 
import AppRouter from "./routes/Router.jsx";

function App() {
  return (
    <LoadingProvider>      {/* ✅ 전역 로딩 컨텍스트 */}
      <AuthProvider>       {/* ✅ 인증 컨텍스트 */}
        <AppRouter />
      </AuthProvider>
    </LoadingProvider>
  );
}

export default App;
