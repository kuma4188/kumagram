import { NavLink } from "react-router-dom";
import { Home, Heart, Plus } from "lucide-react";

const BACKEND_URL = "";

export default function BottomNav() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const avatarUrl = user.profile_image
    ? `${BACKEND_URL}${user.profile_image}`
    : "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (user.username || "default");

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 h-16 flex items-center justify-between z-30">
      {/* 1. HOME 버튼 */}
      <NavLink
        to="/feed"
        className={({ isActive }) =>
          `flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition ${
            isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
          }`
        }
      >
        <Home className="w-4 h-4" />
        <span>HOME</span>
      </NavLink>

      {/* 2. Like 버튼 */}
      <NavLink
        to="/like"
        className={({ isActive }) =>
          `flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition ${
            isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
          }`
        }
      >
        <Heart className="w-4 h-4" />
        <span>Like</span>
      </NavLink>

      {/* 3. + Post 버튼 */}
      <NavLink
        to="/post"
        className={({ isActive }) =>
          `flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold border border-gray-300 transition ${
            isActive ? "bg-gray-900 text-white border-gray-900" : "text-gray-800 hover:bg-gray-50"
          }`
        }
      >
        <Plus className="w-4 h-4" />
        <span>Post</span>
      </NavLink>

      {/* 4. 내 프로필 사진 버튼 */}
      <NavLink
        to={`/${user.username}`}
        className={({ isActive }) =>
          `w-9 h-9 rounded-full overflow-hidden border-2 transition ${
            isActive ? "border-black scale-105" : "border-transparent"
          }`
        }
      >
        <img src={avatarUrl} alt="profile" className="w-full h-full object-cover" />
      </NavLink>
    </nav>
  );
}