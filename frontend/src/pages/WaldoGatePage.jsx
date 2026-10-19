import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function WaldoGatePage() {
  const navigate = useNavigate();

  const handleImageClick = async (e) => {
    // 클릭한 이미지의 전체 가로/세로 크기 대비 내가 누른 위치의 상대 퍼센트(%) 계산
    const rect = e.currentTarget.getBoundingClientRect();
    const x_percent = ((e.clientX - rect.left) / rect.width) * 100;
    const y_percent = ((e.clientY - rect.top) / rect.height) * 100;

    // (팁: 내가 원하는 캐릭터의 좌표를 알고 싶을 때 아래 주석을 풀고 F12 콘솔을 보면 정확한 %가 찍힙니다!)
    // console.log(`클릭 좌표 -> X: ${x_percent.toFixed(1)}%, Y: ${y_percent.toFixed(1)}%`);

    try {
      const res = await api.post("/auth/verify-waldo", { x_percent, y_percent });
      if (res.data.success) {
        // 정답! 통과 토큰을 세션에 저장하고 리눅스 로그인 창으로 이동
        sessionStorage.setItem("waldo_gate_token", res.data.gate_token);
        navigate("/login");
      } else {
        // 오답! 명세서대로 Alert 표시
        alert(res.data.message);
      }
    } catch (err) {
      alert("Unable to connect to server");
    }
  };

  return (
    <div className="min-h-screen bg-black flex justify-center items-center select-none">
      {/* 모바일 비율 컨테이너 */}
      <div className="w-full max-w-md h-screen overflow-hidden relative">
        <img
          src="/waldo.png"
          alt="Find the right person"
          onClick={handleImageClick}
          className="w-full h-full object-cover cursor-pointer"
        />
      </div>
    </div>
  );
}