import { Heart, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  // 2024년 8월 17일 기준 사귄 일수 및 기념일(100일 단위 / N주년) 계산 로직
  const getAnniversaryInfo = () => {
    const startDate = new Date("2024-08-17T00:00:00+09:00");
    const today = new Date();

    // 시간 오차를 없애기 위해 한국 시간(KST) 기준 연/월/일만 추출하여 일수 계산
    const startUTC = Date.UTC(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );
    const todayUTC = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const days = Math.floor((todayUTC - startUTC) / (1000 * 60 * 60 * 24)) + 1;

    // 1. N주년 체크 (매년 8월 17일)
    const isYearlyAnniversary =
      today.getMonth() === 7 && // JS에서 8월은 인덱스 7 (0부터 시작)
      today.getDate() === 17 &&
      today.getFullYear() > 2024;
    const years = today.getFullYear() - 2024;

    // 2. 100일 배수 체크 (100일, 200일, ..., 800일 등)
    const isHundredMilestone = days > 0 && days % 100 === 0;

    // 영어 서수 접미사(1st, 2nd, 3rd, 4th...) 생성 헬퍼
    const getOrdinal = (n) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    let message = null;
    if (isYearlyAnniversary) {
      message = `Happy ${getOrdinal(years)} Anniversary! 🎉`;
    } else if (isHundredMilestone) {
      message = `Happy ${days} Days! 🎉`;
    }

    return { days, message };
  };

  const { days, message } = getAnniversaryInfo();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
      {/* 좌측: kumagram 로고 + 기념일 축하 문구 */}
      <div className="flex items-center gap-2 min-w-0">
        <h1
          onClick={() => navigate("/feed")}
          className="text-xl font-bold tracking-tight cursor-pointer shrink-0"
        >
          kumagram
        </h1>

        {/* 100일 배수 또는 N주년 당일에만 나타나는 축하 배지 */}
        {message && (
          <div className="flex items-center gap-1 bg-pink-50 border border-pink-200 text-pink-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold truncate animate-pulse">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span className="truncate">{message}</span>
          </div>
        )}
      </div>

      {/* 우측 상단 커플 D-Day 배지 */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition ${
          message
            ? "bg-pink-600 text-white shadow-xs" // 기념일 당일에는 우측 배지도 핑크색으로 강조!
            : "bg-gray-100 text-gray-800"
        }`}
      >
        <Heart
          className={`w-3.5 h-3.5 ${
            message ? "fill-white text-white" : "fill-red-500 text-red-500"
          }`}
        />
        <span>{days}</span>
      </div>
    </header>
  );
}