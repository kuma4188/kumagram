import { BrowserRouter, Routes, Route } from "react-router-dom";
import WaldoGatePage from "./pages/WaldoGatePage";
import LinuxLoginPage from "./pages/LinuxLoginPage";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import HomeFeedPage from "./pages/HomeFeedPage";
import LikePage from "./pages/LikePage";
import CreatePostPage from "./pages/CreatePostPage";
import ProfilePage from "./pages/ProfilePage";
import PostDetailPage from "./pages/PostDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1 & 2. 전체 공개 관문 (윌리를 찾아라 & 리눅스 TUI 로그인) */}
        <Route path="/" element={<WaldoGatePage />} />
        <Route path="/login" element={<LinuxLoginPage />} />

        {/* 3~9. 인증된 커플(Lucas & Cherish) 전용 영역 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/feed" element={<HomeFeedPage />} />
          <Route path="/feed/:id" element={<PostDetailPage />} />
          <Route path="/like" element={<LikePage />} />
          <Route path="/post" element={<CreatePostPage />} />
          <Route path="/:username" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}