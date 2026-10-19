import { Navigate, Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import BottomNav from "./BottomNav";

export default function ProtectedRoute() {
  const token = localStorage.getItem("access_token");
  const location = useLocation();

  if (!token) {
    // 로그인 안 된 상태로 접근 시 현재 주소(location)를 기억한 채 /login으로 이동
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      {/* 모바일 앱 사이즈(max-w-md) 중앙 고정 */}
      <div className="w-full max-w-md bg-white min-h-screen pb-20 shadow-sm relative flex flex-col">
        <Header />
        <main className="flex-1">
          {/* 하위 페이지(/feed, /like, /:username 등)가 이 자리에 렌더링됩니다 */}
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}