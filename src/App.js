// src/App.jsx
import React from "react";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppRouter from "./Router.jsx";

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
