import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { MarketingHome } from "./pages/MarketingHome";
import { AppShell } from "./components/AppNav";
import { RequireAuth } from "./components/RequireAuth";
import { RequireAdmin } from "./components/RequireAdmin";
import { RequireFitAccess } from "./components/RequireFitAccess";
import { HomeScreen } from "./pages/app/HomeScreen";
import { LauncherScreen } from "./pages/app/LauncherScreen";
import { useAuth } from "./lib/AuthProvider";
import { LoginScreen } from "./pages/auth/LoginScreen";
import { NotFoundScreen } from "./pages/NotFoundScreen";

// Screens load on demand so the phone downloads only what it opens. The
// launcher, Golfable home, marketing page and login stay in the main bundle
// so the first screen never waits on a second download.
const StudiosScreen = lazy(() => import("./pages/StudiosScreen").then((m) => ({ default: m.StudiosScreen })));
const JoinChallengeScreen = lazy(() => import("./pages/JoinChallengeScreen").then((m) => ({ default: m.JoinChallengeScreen })));
const StudioInviteScreen = lazy(() => import("./pages/StudioInviteScreen").then((m) => ({ default: m.StudioInviteScreen })));
const TermsScreen = lazy(() => import("./pages/TermsScreen").then((m) => ({ default: m.TermsScreen })));
const TodayScreen = lazy(() => import("./pages/app/TodayScreen").then((m) => ({ default: m.TodayScreen })));
const ProgressScreen = lazy(() => import("./pages/app/ProgressScreen").then((m) => ({ default: m.ProgressScreen })));
const GolfableScoreDetailScreen = lazy(() => import("./pages/app/GolfableScoreDetailScreen").then((m) => ({ default: m.GolfableScoreDetailScreen })));
const LibraryScreen = lazy(() => import("./pages/app/LibraryScreen").then((m) => ({ default: m.LibraryScreen })));
const RoundScreen = lazy(() => import("./pages/app/RoundScreen").then((m) => ({ default: m.RoundScreen })));
const RoundPlayScreen = lazy(() => import("./pages/app/RoundPlayScreen").then((m) => ({ default: m.RoundPlayScreen })));
const ProfileScreen = lazy(() => import("./pages/app/ProfileScreen").then((m) => ({ default: m.ProfileScreen })));
const MyBagScreen = lazy(() => import("./pages/app/MyBagScreen").then((m) => ({ default: m.MyBagScreen })));
const LeaderboardScreen = lazy(() => import("./pages/app/LeaderboardScreen").then((m) => ({ default: m.LeaderboardScreen })));
const LeaderboardHubScreen = lazy(() => import("./pages/app/LeaderboardHubScreen").then((m) => ({ default: m.LeaderboardHubScreen })));
const ToolsScreen = lazy(() => import("./pages/app/ToolsScreen").then((m) => ({ default: m.ToolsScreen })));
const MetronomeScreen = lazy(() => import("./pages/app/MetronomeScreen").then((m) => ({ default: m.MetronomeScreen })));
const FairwayFinderScreen = lazy(() => import("./pages/app/FairwayFinderScreen").then((m) => ({ default: m.FairwayFinderScreen })));
const GreenReaderScreen = lazy(() => import("./pages/app/GreenReaderScreen").then((m) => ({ default: m.GreenReaderScreen })));
const SwingTempoScreen = lazy(() => import("./pages/app/SwingTempoScreen").then((m) => ({ default: m.SwingTempoScreen })));
const AlignmentCheckerScreen = lazy(() => import("./pages/app/AlignmentCheckerScreen").then((m) => ({ default: m.AlignmentCheckerScreen })));
const GappingScreen = lazy(() => import("./pages/app/GappingScreen").then((m) => ({ default: m.GappingScreen })));
const ForumScreen = lazy(() => import("./pages/app/ForumScreen").then((m) => ({ default: m.ForumScreen })));
const ForumCategoryScreen = lazy(() => import("./pages/app/ForumCategoryScreen").then((m) => ({ default: m.ForumCategoryScreen })));
const ForumNewThreadScreen = lazy(() => import("./pages/app/ForumNewThreadScreen").then((m) => ({ default: m.ForumNewThreadScreen })));
const ForumThreadScreen = lazy(() => import("./pages/app/ForumThreadScreen").then((m) => ({ default: m.ForumThreadScreen })));
const ChallengesScreen = lazy(() => import("./pages/app/ChallengesScreen").then((m) => ({ default: m.ChallengesScreen })));
const NewChallengeScreen = lazy(() => import("./pages/app/NewChallengeScreen").then((m) => ({ default: m.NewChallengeScreen })));
const ChallengeDetailScreen = lazy(() => import("./pages/app/ChallengeDetailScreen").then((m) => ({ default: m.ChallengeDetailScreen })));
const AdminScreen = lazy(() => import("./pages/app/AdminScreen").then((m) => ({ default: m.AdminScreen })));
const FitScreen = lazy(() => import("./pages/app/FitScreen").then((m) => ({ default: m.FitScreen })));
const FitWorkoutScreen = lazy(() => import("./pages/app/FitWorkoutScreen").then((m) => ({ default: m.FitWorkoutScreen })));
const FitHistoryScreen = lazy(() => import("./pages/app/FitHistoryScreen").then((m) => ({ default: m.FitHistoryScreen })));
const FitPlanScreen = lazy(() => import("./pages/app/FitPlanScreen").then((m) => ({ default: m.FitPlanScreen })));
const FitTodayScreen = lazy(() => import("./pages/app/FitTodayScreen").then((m) => ({ default: m.FitTodayScreen })));
const FitNutritionScreen = lazy(() => import("./pages/app/FitNutritionScreen").then((m) => ({ default: m.FitNutritionScreen })));
const FitCheckinScreen = lazy(() => import("./pages/app/FitCheckinScreen").then((m) => ({ default: m.FitCheckinScreen })));
const FitScheduleScreen = lazy(() => import("./pages/app/FitScheduleScreen").then((m) => ({ default: m.FitScheduleScreen })));
const StudioAdminScreen = lazy(() => import("./pages/app/StudioAdminScreen").then((m) => ({ default: m.StudioAdminScreen })));
const SignupScreen = lazy(() => import("./pages/auth/SignupScreen").then((m) => ({ default: m.SignupScreen })));
const ForgotPasswordScreen = lazy(() => import("./pages/auth/ForgotPasswordScreen").then((m) => ({ default: m.ForgotPasswordScreen })));
const ResetPasswordScreen = lazy(() => import("./pages/auth/ResetPasswordScreen").then((m) => ({ default: m.ResetPasswordScreen })));

// Anyone with Golfable Fit opens to a two-door launcher; everyone else
// opens straight into Golfable as before.
function AppIndex() {
  const { profile } = useAuth();
  if (!profile) return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  return profile.fit_access ? <LauncherScreen /> : <HomeScreen />;
}

function App() {
  return (
    <Suspense fallback={<div className="font-body p-6 text-center text-neutral-400">Loading…</div>}>
    <Routes>
      <Route path="/" element={<MarketingHome />} />
      <Route path="/studios" element={<StudiosScreen />} />
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
        <Route index element={<AppIndex />} />
        <Route path="golf" element={<HomeScreen />} />
        <Route path="today" element={<TodayScreen />} />
        <Route path="progress" element={<ProgressScreen />} />
        <Route path="golfable-score" element={<GolfableScoreDetailScreen />} />
        <Route path="golfable-score/:category" element={<GolfableScoreDetailScreen />} />
        <Route path="library" element={<LibraryScreen />} />
        <Route path="library/:date" element={<TodayScreen />} />
        <Route path="round" element={<RoundScreen />} />
        <Route path="round/:roundId" element={<RoundPlayScreen />} />
        <Route path="play/:drillId" element={<TodayScreen />} />
        <Route path="leaderboard" element={<LeaderboardHubScreen />} />
        <Route path="leaderboard/:drillId/:date" element={<LeaderboardScreen />} />
        <Route path="tools" element={<ToolsScreen />} />
        <Route path="tools/metronome" element={<MetronomeScreen />} />
        <Route path="tools/fairway-finder" element={<FairwayFinderScreen />} />
        <Route path="tools/green-reader" element={<GreenReaderScreen />} />
        <Route path="tools/swing-tempo" element={<SwingTempoScreen />} />
        <Route path="tools/alignment-checker" element={<AlignmentCheckerScreen />} />
        <Route path="tools/gapping" element={<GappingScreen />} />
        <Route path="forum" element={<ForumScreen />} />
        <Route path="forum/:categorySlug" element={<ForumCategoryScreen />} />
        <Route path="forum/:categorySlug/new" element={<ForumNewThreadScreen />} />
        <Route path="forum/:categorySlug/:threadId" element={<ForumThreadScreen />} />
        <Route path="challenges" element={<ChallengesScreen />} />
        <Route path="challenges/new" element={<NewChallengeScreen />} />
        <Route path="challenges/:id" element={<ChallengeDetailScreen />} />
        <Route path="profile" element={<ProfileScreen />} />
        <Route path="bag" element={<MyBagScreen />} />
        <Route path="studio-admin" element={<StudioAdminScreen />} />
        <Route
          path="fit"
          element={
            <RequireFitAccess>
              <FitScreen />
            </RequireFitAccess>
          }
        />
        <Route
          path="fit/workout/:workoutLogId"
          element={
            <RequireFitAccess>
              <FitWorkoutScreen />
            </RequireFitAccess>
          }
        />
        <Route
          path="fit/history"
          element={
            <RequireFitAccess>
              <FitHistoryScreen />
            </RequireFitAccess>
          }
        />
        <Route
          path="fit/plan"
          element={
            <RequireFitAccess>
              <FitPlanScreen />
            </RequireFitAccess>
          }
        />
        <Route
          path="fit/today"
          element={
            <RequireFitAccess>
              <FitTodayScreen />
            </RequireFitAccess>
          }
        />
        <Route
          path="fit/schedule"
          element={
            <RequireFitAccess>
              <FitScheduleScreen />
            </RequireFitAccess>
          }
        />
        <Route
          path="fit/fuel"
          element={
            <RequireFitAccess>
              <FitNutritionScreen />
            </RequireFitAccess>
          }
        />
        <Route
          path="fit/checkin"
          element={
            <RequireFitAccess>
              <FitCheckinScreen />
            </RequireFitAccess>
          }
        />
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
    </Suspense>
  );
}

export default App;
