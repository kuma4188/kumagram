import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/client";

export default function LinuxLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorCode, setErrorCode] = useState(null);

  // WhatsApp 공유 링크(/feed/15 등)를 눌러서 들어온 경우, 로그인 후 돌아갈 원래 주소 기억
  const from = location.state?.from?.pathname || "/feed";

  useEffect(() => {
    // 윌리를 찾아라를 통과하지 않고 주소창에 /login을 직접 치고 들어오면 쫓아냄!
    const gateToken = sessionStorage.getItem("waldo_gate_token");
    if (!gateToken) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // 에러 창이 떴을 때 아무 키나 누르면(Press any key to abort) 에러 창 닫기
  useEffect(() => {
    if (!errorCode) return;
    const handleKeyDown = () => setErrorCode(null);
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [errorCode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const gate_token = sessionStorage.getItem("waldo_gate_token") || "";
      const res = await api.post("/auth/login", { username, password, gate_token });
      
      // 로그인 성공: 토큰과 내 정보(Lucas 또는 Cherish) 저장
      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      // 원래 가려던 페이지(기본값 /feed)로 이동!
      navigate(from, { replace: true });
    } catch (err) {
      // 틀렸을 때 Figma 시안의 블루박스 에러 표시
      setErrorCode(err.response?.data?.detail || "Error: OE: 016F : BFF9B3D4");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-mono flex justify-center">
      <div className="w-full max-w-md p-6 flex flex-col justify-between relative">
        
        {/* 상단 TTY1 터미널 영역 */}
        <div>
          <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-6 text-gray-400 text-sm">
            <span>Linux</span>
            <span>×</span>
          </div>

          <p className="mb-1">Welcome to Linux (TTY1)</p>
          <p className="mb-6 text-gray-400 text-sm">To continue, please log in:</p>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="flex items-center">
              <label className="mr-2 shrink-0">linux login:</label>
              <span className="text-gray-500">[</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                className="bg-black text-gray-100 focus:outline-none border-none px-1 w-40 font-mono"
              />
              <span className="text-gray-500">]</span>
            </div>

            <div className="flex items-center">
              <label className="mr-2 shrink-0">Password:</label>
              <span className="text-gray-500 ml-3">[</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black text-gray-100 focus:outline-none border-none px-1 w-40 font-mono"
              />
              <span className="text-gray-500">]</span>
            </div>

            {/* 엔터키로 제출되지만 모바일 키패드를 위해 숨김 submit 버튼 포함 */}
            <button type="submit" className="hidden">Login</button>
          </form>
        </div>

        {/* Figma 시안의 파란색 TUI 에러 박스 (로그인 실패 시 노출) */}
        {errorCode && (
          <div 
            onClick={() => setErrorCode(null)}
            className="bg-blue-700 text-white p-5 border-2 border-gray-300 shadow-lg my-auto cursor-pointer"
          >
            <p className="font-bold mb-2">{errorCode}</p>
            <p className="text-xs text-blue-200">Press any key or touch to abort</p>
          </div>
        )}

        <div className="text-gray-600 text-xs">_</div>
      </div>
    </div>
  );
}