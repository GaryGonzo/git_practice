import { Routes, Route } from "react-router-dom";
import { MarketingHome } from "./pages/MarketingHome";
import { AppShell } from "./components/AppNav";
import { TodayScreen } from "./pages/app/TodayScreen";
import { ProgressScreen } from "./pages/app/ProgressScreen";
import { LibraryScreen } from "./pages/app/LibraryScreen";
import { ProfileScreen } from "./pages/app/ProfileScreen";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketingHome />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<TodayScreen />} />
        <Route path="progress" element={<ProgressScreen />} />
        <Route path="library" element={<LibraryScreen />} />
        <Route path="profile" element={<ProfileScreen />} />
      </Route>
    </Routes>
  );
}

export default App;
