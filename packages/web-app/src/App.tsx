import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { MarketingHome } from "./pages/MarketingHome";
import { AppShell } from "./components/AppNav";
import { RequireAuth } from "./components/RequireAuth";
import { RequireAdmin } from "./components/RequireAdmin";
import { RequireFitAccess } from "./components/RequireFitAccess";
import { HomeScreen } from "./pages/app/HomeScreen";
import { LauncherScreen } from "./pages/app/LauncherScreen";
import { useAuth } from "./lib/AuthProvider";
import { loadPendingChallenge } from "./lib/golfableInsights";
import { LoginScreen } from "./pages/auth/LoginScreen";
import { NotFoundScreen } from "./pages/NotFoundScreen";

// Screens load on demand so the phone downloads only what it opens. The
// launcher, Golfable home, marketing page and login stay in the main bundle
// so the first screen never waits on a second download.
const StudiosScreen = lazy(() => import("./pages/StudiosScreen").then((m) => ({ default: m.StudiosScreen })));
const JoinChallengeScreen = lazy(() => import("./pages/JoinChallengeScreen").then((m) => ({ default: m.JoinChallengeScreen })));
const StudioInviteScreen = lazy(() => import("./pages/StudioInviteScreen").then((m) => ({ default: m.StudioInviteScreen })));
const ChallengeInviteScreen = lazy(() => import("./pages/ChallengeInviteScreen").then((m) => ({ default: m.ChallengeInviteScreen })));
const TermsScreen = lazy(() => import("./pages/TermsScreen").then((m) => ({ default: m.TermsScreen })));
const TodayScreen = lazy(() => import("./pages/app/TodayScreen").then((m) => ({ default: m.TodayScreen })));
const ProgressScreen = lazy(() => import("./pages/app/ProgressScreen").then((m) => ({ default: m.ProgressScreen })));
const GolfableScoreDetailScreen = lazy(() => import("./pages/app/GolfableScoreDetailScreen").then((m) => ({ default: m.GolfableScoreDetailScreen })));
const ProfileScreen = lazy(() => import("./pages/app/ProfileScreen").then((m) => ({ default: m.ProfileScreen })));
const MyBagScreen = lazy(() => import("./pages/app/MyBagScreen").then((m) => ({ default: m.MyBagScreen })));
const ToolsScreen = lazy(() => import("./pages/app/ToolsScreen").then((m) => ({ default: m.ToolsScreen })));
const MetronomeScreen = lazy(() => import("./pages/app/MetronomeScreen").then((m) => ({ default: m.MetronomeScreen })));
const FairwayFinderScreen = lazy(() => import("./pages/app/FairwayFinderScreen").then((m) => ({ default: m.FairwayFinderScreen })));
const GreenReaderScreen = lazy(() => import("./pages/app/GreenReaderScreen").then((m) => ({ default: m.GreenReaderScreen })));
const SwingTempoScreen = lazy(() => import("./pages/app/SwingTempoScreen").then((m) => ({ default: m.SwingTempoScreen })));
const AlignmentCheckerScreen = lazy(() => import("./pages/app/AlignmentCheckerScreen").then((m) => ({ default: m.AlignmentCheckerScreen })));
const GappingScreen = lazy(() => import("./pages/app/GappingScreen").then((m) => ({ default: m.GappingScreen })));
const AdminScreen = lazy(() => import("./pages/app/AdminScreen").then((m) => ({ default: m.AdminScreen })));
const FitScreen = lazy(() => import("./pages/app/FitScreen").then((m) => ({ default: m.FitScreen })));
const StudioAdminScreen = lazy(() => import("./pages/app/StudioAdminScreen").then((m) => ({ default: m.StudioAdminScreen })));
const SignupScreen = lazy(() => import("./pages/auth/SignupScreen").then((m) => ({ default: m.SignupScreen })));
const ForgotPasswordScreen = lazy(() => import("./pages/auth/ForgotPasswordScreen").then((m) => ({ default: m.ForgotPasswordScreen })));
const ResetPasswordScreen = lazy(() => import("./pages/auth/ResetPasswordScreen").then((m) => ({ default: m.ResetPasswordScreen })));

// Anyone with Golfable Fit opens to a two-door launcher; everyone else
// opens straight into Golfable as before.
function AppIndex() {
  const { profile } = useAuth();
  if (!profile) return <div className="p-6 text-center font-body text-neutral-500">Loading…</div>;
  // A friend's challenge waiting: go straight to Golfable practice.
  if (loadPendingChallenge()) return <Navigate to="/app/golf" replace />;
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
      <Route path="/challenge" element={<ChallengeInviteScreen />} />
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
        <Route path="progress" element={<ProgressScreen />} />
        <Route path="golfable-score" element={<GolfableScoreDetailScreen />} />
        <Route path="golfable-score/:category" element={<GolfableScoreDetailScreen />} />
        <Route path="play/:drillId" element={<TodayScreen />} />
        <Route path="tools" element={<ToolsScreen />} />
        <Route path="tools/metronome" element={<MetronomeScreen />} />
        <Route path="tools/fairway-finder" element={<FairwayFinderScreen />} />
        <Route path="tools/green-reader" element={<GreenReaderScreen />} />
        <Route path="tools/swing-tempo" element={<SwingTempoScreen />} />
        <Route path="tools/alignment-checker" element={<AlignmentCheckerScreen />} />
        <Route path="tools/gapping" element={<GappingScreen />} />
        {/* Simplified Golfable: the daily drill, library, rounds, leaderboard,
            forum and challenges are hidden (screens still in the repo, data
            untouched). Old links land on the practice generator. */}
        {["today", "library/*", "round/*", "leaderboard/*", "forum/*", "challenges/*"].map((path) => (
          <Route key={path} path={path} element={<Navigate to="/app" replace />} />
        ))}
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
        {/* The old program screens are gone; any bookmark or notification
            pointing at one lands on the routine generator. */}
        <Route path="fit/*" element={<Navigate to="/app/fit" replace />} />
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
