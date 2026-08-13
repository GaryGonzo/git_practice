import { Routes, Route } from "react-router-dom";
import { MarketingHome } from "./pages/MarketingHome";
import { AppShell } from "./components/AppNav";
import { RequireAuth } from "./components/RequireAuth";
import { RequireAdmin } from "./components/RequireAdmin";
import { HomeScreen } from "./pages/app/HomeScreen";
import { TodayScreen } from "./pages/app/TodayScreen";
import { ProgressScreen } from "./pages/app/ProgressScreen";
import { LibraryScreen } from "./pages/app/LibraryScreen";
import { ProfileScreen } from "./pages/app/ProfileScreen";
import { LeaderboardScreen } from "./pages/app/LeaderboardScreen";
import { ToolsScreen } from "./pages/app/ToolsScreen";
import { MetronomeScreen } from "./pages/app/MetronomeScreen";
import { FairwayFinderScreen } from "./pages/app/FairwayFinderScreen";
import { AdminScreen } from "./pages/app/AdminScreen";
import { SignupScreen } from "./pages/auth/SignupScreen";
import { LoginScreen } from "./pages/auth/LoginScreen";
import { ForgotPasswordScreen } from "./pages/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "./pages/auth/ResetPasswordScreen";
import { NotFoundScreen } from "./pages/NotFoundScreen";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketingHome />} />
      <Route path="/signup" element={<SignupScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="/reset-password" element={<ResetPasswordScreen />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<HomeScreen />} />
        <Route path="today" element={<TodayScreen />} />
        <Route path="progress" element={<ProgressScreen />} />
        <Route path="library" element={<LibraryScreen />} />
        <Route path="library/:date" element={<TodayScreen />} />
        <Route path="leaderboard/:drillId/:date" element={<LeaderboardScreen />} />
        <Route path="tools" element={<ToolsScreen />} />
        <Route path="tools/metronome" element={<MetronomeScreen />} />
        <Route path="tools/fairway-finder" element={<FairwayFinderScreen />} />
        <Route path="profile" element={<ProfileScreen />} />
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminScreen />
            </RequireAdmin>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundScreen />} />
    </Routes>
  );
}

export default App;
