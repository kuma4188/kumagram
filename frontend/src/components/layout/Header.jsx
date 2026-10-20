import { Heart, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  // 2024년 8월 17일 기준 사귄 일수 및 기념일(100일 단위 / N주년) 계산 로직
// 접속 지역 기준 사귄 일수 및 기념일(100일 단위 / N주년) 계산 로직
  const getAnniversaryInfo = () => {
    const today = new Date();

    // 1. 접속 기기의 현지 날짜(연/월/일) 추출
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed (8월은 7)
    const currentDate = today.getDate();

    // 2. 사귄 시작일(2024-08-17)과 오늘을 각각 순수 날짜(UTC 자정 기준)로 정규화
    //    시간/시차 오프셋 없이 날짜(Date) 차이만 계산하기 위함
    const startUTC = Date.UTC(2024, 7, 17); // 2024년 8월 17일
    const todayUTC = Date.UTC(currentYear, currentMonth, currentDate);

    // 사귄 당일을 1일로 계산 (+1)
    const days = Math.floor((todayUTC - startUTC) / (1000 * 60 * 60 * 24)) + 1;

    // 3. N주년 체크 (접속 지역의 현지 날짜가 8월 17일인 경우)
    const isYearlyAnniversary =
      currentMonth === 7 &&
      currentDate === 17 &&
      currentYear > 2024;
    const years = currentYear - 2024;

    // 4. 100일 배수 체크 (100일, 200일...)
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