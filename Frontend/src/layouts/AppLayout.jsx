import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar.jsx";
import { Header } from "../components/layout/Header.jsx";

/**
 * Main application shell layout.
 */
export function AppLayout() {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "#f9fafb"
      }}
    >
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden"
        }}
      >
        <Header />

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "2rem"
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
