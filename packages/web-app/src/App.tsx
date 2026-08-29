import { Routes, Route } from "react-router-dom";
import { MarketingHome } from "./pages/MarketingHome";
import { JoinChallengeScreen } from "./pages/JoinChallengeScreen";
import { StudioInviteScreen } from "./pages/StudioInviteScreen";
import { TermsScreen } from "./pages/TermsScreen";
import { AppShell } from "./components/AppNav";
import { RequireAuth } from "./components/RequireAuth";
import { RequireAdmin } from "./components/RequireAdmin";
import { HomeScreen } from "./pages/app/HomeScreen";
import { TodayScreen } from "./pages/app/TodayScreen";
import { ProgressScreen } from "./pages/app/ProgressScreen";
import { GolfableScoreDetailScreen } from "./pages/app/GolfableScoreDetailScreen";
import { LibraryScreen } from "./pages/app/LibraryScreen";
import { ProfileScreen } from "./pages/app/ProfileScreen";
import { MyBagScreen } from "./pages/app/MyBagScreen";
import { LeaderboardScreen } from "./pages/app/LeaderboardScreen";
import { ToolsScreen } from "./pages/app/ToolsScreen";
import { MetronomeScreen } from "./pages/app/MetronomeScreen";
import { FairwayFinderScreen } from "./pages/app/FairwayFinderScreen";
import { GreenReaderScreen } from "./pages/app/GreenReaderScreen";
import { SwingTempoScreen } from "./pages/app/SwingTempoScreen";
import { AlignmentCheckerScreen } from "./pages/app/AlignmentCheckerScreen";
import { GappingScreen } from "./pages/app/GappingScreen";
import { ChooseGolfableScreen } from "./pages/app/ChooseGolfableScreen";
import { ChallengesScreen } from "./pages/app/ChallengesScreen";
import { NewChallengeScreen } from "./pages/app/NewChallengeScreen";
import { ChallengeDetailScreen } from "./pages/app/ChallengeDetailScreen";
import { AdminScreen } from "./pages/app/AdminScreen";
import { StudioAdminScreen } from "./pages/app/StudioAdminScreen";
import { SignupScreen } from "./pages/auth/SignupScreen";
import { LoginScreen } from "./pages/auth/LoginScreen";
import { ForgotPasswordScreen } from "./pages/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "./pages/auth/ResetPasswordScreen";
import { NotFoundScreen } from "./pages/NotFoundScreen";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketingHome />} />
      <Route path="/join/:code" element={<JoinChallengeScreen />} />
      <Route path="/my-studio/:slug" element={<StudioInviteScreen />} />
      <Route path="/terms" element={<TermsScreen />} />
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
        <Route path="golfable-score" element={<GolfableScoreDetailScreen />} />
        <Route path="golfable-score/:category" element={<GolfableScoreDetailScreen />} />
        <Route path="library" element={<LibraryScreen />} />
        <Route path="library/:date" element={<TodayScreen />} />
        <Route path="choose" element={<ChooseGolfableScreen />} />
        <Route path="play/:drillId" element={<TodayScreen />} />
        <Route path="leaderboard/:drillId/:date" element={<LeaderboardScreen />} />
        <Route path="tools" element={<ToolsScreen />} />
        <Route path="tools/metronome" element={<MetronomeScreen />} />
        <Route path="tools/fairway-finder" element={<FairwayFinderScreen />} />
        <Route path="tools/green-reader" element={<GreenReaderScreen />} />
        <Route path="tools/swing-tempo" element={<SwingTempoScreen />} />
        <Route path="tools/alignment-checker" element={<AlignmentCheckerScreen />} />
        <Route path="tools/gapping" element={<GappingScreen />} />
        <Route path="challenges" element={<ChallengesScreen />} />
        <Route path="challenges/new" element={<NewChallengeScreen />} />
        <Route path="challenges/:id" element={<ChallengeDetailScreen />} />
        <Route path="profile" element={<ProfileScreen />} />
        <Route path="bag" element={<MyBagScreen />} />
        <Route path="studio-admin" element={<StudioAdminScreen />} />
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
