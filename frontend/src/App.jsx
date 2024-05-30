import { Routes, Route, Outlet } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import { useState } from "react";
import { ColorModeContext, useMode } from "../theme"
import { TaskProvider } from "./context/TaskContext";
import { UserProvider } from "./context/UserContext";
import { DataProvider } from "./context/DataContext";
import Topbar from "./components/navbar/Topbar";
import Sidebar from "./components/navbar/Sidebar";
import Navbar from "./components/navbar/Navbar";
import { Container } from "./components/ui";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CssBaseline, ThemeProvider } from "@mui/material";
import TeamPage from "./pages/TeamPage"
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TasksPage from "./pages/TasksPage";
import RegisterFormPage from "./pages/RegisterFormPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import LineChart from "./pages/LineChart";
import Dashboard from "./pages/Dashboard";
import HistoryPage from "./pages/HistoryPage";
import LogPage from "./pages/LogPage";

function App() {
  const { isAuth, loading } = useAuth();
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app">
          <Sidebar isSidebar={isSidebar} />
          <main className="content">
            <Topbar setIsSidebar={setIsSidebar} />
            <Container>
              <Routes>
                <Route
                  element={<ProtectedRoute isAllowed={!isAuth} redirectTo="/login" />}
                >
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/login" element={<LoginPage />} />
                </Route>
                <Route
                  element={<ProtectedRoute isAllowed={isAuth} redirectTo="/profile" />}
                >
                  <Route element={
                    <UserProvider>
                      <Outlet />
                    </UserProvider>
                  }
                  >
                    <Route path="/users" element={<TeamPage />} />
                  </Route>
                  <Route element={
                    <DataProvider>
                      <Outlet />
                    </DataProvider>
                  }
                  >
                    <Route path="/history" element={<HistoryPage />}></Route>
                    <Route path="/userslog" element={<LogPage />}></Route>
                    <Route path="/line" element={<LineChart />}></Route>
                    <Route path="/dashboard" element={<Dashboard />} />
                  </Route>
                  <Route path="/signup" element={<RegisterPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/users/:id/edit" element={<RegisterFormPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Container>
          </main>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;