import { Routes, Route } from "react-router-dom";
import { MarketingHome } from "./pages/MarketingHome";
import { AppShell } from "./components/AppNav";
import { RequireAuth } from "./components/RequireAuth";
import { RequireHousehold } from "./components/RequireHousehold";
import { HouseholdSetupScreen } from "./pages/HouseholdSetupScreen";
import { HomeScreen } from "./pages/app/HomeScreen";
import { RequestsScreen } from "./pages/app/RequestsScreen";
import { TasksScreen } from "./pages/app/TasksScreen";
import { NotesScreen } from "./pages/app/NotesScreen";
import { NotificationsScreen } from "./pages/app/NotificationsScreen";
import { RewardsScreen } from "./pages/app/RewardsScreen";
import { ProfileScreen } from "./pages/app/ProfileScreen";
import { SignupChooserScreen } from "./pages/auth/SignupChooserScreen";
import { SignupScreen } from "./pages/auth/SignupScreen";
import { LoginScreen } from "./pages/auth/LoginScreen";
import { NotFoundScreen } from "./pages/NotFoundScreen";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketingHome />} />
      <Route path="/signup" element={<SignupChooserScreen />} />
      <Route path="/signup/:role" element={<SignupScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route
        path="/app/setup"
        element={
          <RequireAuth>
            <HouseholdSetupScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <RequireHousehold>
              <AppShell />
            </RequireHousehold>
          </RequireAuth>
        }
      >
        <Route index element={<HomeScreen />} />
        <Route path="requests" element={<RequestsScreen />} />
        <Route path="tasks" element={<TasksScreen />} />
        <Route path="notes" element={<NotesScreen />} />
        <Route path="notifications" element={<NotificationsScreen />} />
        <Route path="rewards" element={<RewardsScreen />} />
        <Route path="profile" element={<ProfileScreen />} />
      </Route>
      <Route path="*" element={<NotFoundScreen />} />
    </Routes>
  );
}

export default App;
