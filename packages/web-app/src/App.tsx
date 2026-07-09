import { Routes, Route } from "react-router-dom";
import { MarketingHome } from "./pages/MarketingHome";
import { AppShell } from "./components/AppNav";
import { RequireAuth } from "./components/RequireAuth";
import { TodayScreen } from "./pages/app/TodayScreen";
import { ProgressScreen } from "./pages/app/ProgressScreen";
import { LibraryScreen } from "./pages/app/LibraryScreen";
import { ProfileScreen } from "./pages/app/ProfileScreen";
import { SignupScreen } from "./pages/auth/SignupScreen";
import { LoginScreen } from "./pages/auth/LoginScreen";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketingHome />} />
      <Route path="/signup" element={<SignupScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<TodayScreen />} />
        <Route path="progress" element={<ProgressScreen />} />
        <Route path="library" element={<LibraryScreen />} />
        <Route path="library/:date" element={<TodayScreen />} />
        <Route path="profile" element={<ProfileScreen />} />
      </Route>
    </Routes>
  );
}

export default App;
