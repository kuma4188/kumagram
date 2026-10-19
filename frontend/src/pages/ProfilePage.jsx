import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Grid, UserPlus, Layers, Lock, Camera } from "lucide-react";
import api from "../api/client";

const BACKEND_URL = "";

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // 수정용 입력 상태
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editImageFile, setEditImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // 프로필 정보 불러오기
  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${username}`);
      setProfile(res.data);
      setEditName(res.data.name);
      setEditUsername(res.data.username);
      setEditBio(res.data.bio || "");
      setPreviewImage(
        res.data.profile_image ? `${BACKEND_URL}${res.data.profile_image}` : null
      );
    } catch (err) {
      alert("User not found");
      navigate("/feed");
    }
  };

  useEffect(() => {
    setIsEditing(false);
    fetchProfile();
  }, [username]);

  // 사진 선택 시 미리보기 업데이트
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Edit Profile 버튼 클릭 핸들러 (회색 ➔ 파란색 수정모드 ➔ 파란색 재클릭 시 저장!)
  const handleEditToggleOrSave = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    // 이미 수정 중(파란색 버튼 상태)일 때 누르면 저장 실행
    try {
      const formData = new FormData();
      formData.append("name", editName);
      formData.append("username", editUsername);
      formData.append("bio", editBio);
      if (editImageFile) {
        formData.append("profile_image", editImageFile);
      }

      const res = await api.put("/users/me/profile", formData);
      
      // 로컬스토리지 내 정보 갱신
      localStorage.setItem("user", JSON.stringify(res.data));
      setIsEditing(false);

      // 계정명(username)이 바뀌었다면 새 주소로 이동, 아니면 새로고침
      if (res.data.username !== username) {
        navigate(`/${res.data.username}`, { replace: true });
      } else {
        fetchProfile();
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save profile");
    }
  };

  // 5가지 게시물 유형별 정사각형 썸네일 렌더러
  const renderThumbnail = (post) => {
    const extra = post.extra_data || {};

    switch (post.post_type) {
      case "photo": {
        const images = extra.images || [];
        const firstImg = images[0] ? `${BACKEND_URL}${images[0]}` : "";
        return (
          <div className="w-full h-full relative bg-gray-100">
            <img src={firstImg} alt="post" className="w-full h-full object-cover" />
            {images.length > 1 && (
              <Layers className="w-4 h-4 text-white absolute top-2 right-2 drop-shadow" />
            )}
          </div>
        );
      }
      case "music":
        return (
          <div className="w-full h-full bg-gray-900 relative">
            {extra.thumbnail && (
              <img src={extra.thumbnail} alt="music" className="w-full h-full object-cover opacity-90" />
            )}
          </div>
        );
      case "text":
        return (
          <div className="w-full h-full bg-neutral-100 flex items-center justify-center p-2 text-center">
            <span className="font-bold text-gray-800 text-sm break-words">
              {extra.keyword || "Text"}
            </span>
          </div>
        );
      case "dictionary":
        return (
          <div className="w-full h-full bg-amber-50 flex items-center justify-center p-2 text-center">
            <span className="font-bold text-gray-900 text-sm break-words">
              {extra.word || "Word"}
            </span>
          </div>
        );
      case "balance":
        return (
          <div className="w-full h-full bg-indigo-50 flex items-center justify-center p-2 text-center">
            <span className="font-extrabold text-indigo-900 text-xs tracking-tight">
              Balance Game
            </span>
          </div>
        );
      default:
        return <div className="w-full h-full bg-gray-200" />;
    }
  };

  if (!profile) return <div className="p-8 text-center text-sm text-gray-400">Loading...</div>;

  const avatarSrc =
    previewImage ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;

  return (
    <div className="pb-10">
      {/* 상단 프로필 정보 영역 */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          {/* 프로필 이미지 (수정 모드일 때 클릭하면 사진 변경 가능) */}
          <div 
            onClick={() => isEditing && fileInputRef.current?.click()}
            className={`w-20 h-20 rounded-full overflow-hidden border border-gray-200 relative shrink-0 ${
              isEditing ? "cursor-pointer ring-2 ring-blue-500" : ""
            }`}
          >
            <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* 우측 Posts / Followers / Following 카운트 */}
          <div className="flex flex-1 justify-around text-center ml-4">
            <div>
              <div className="font-bold text-base">{profile.posts_count}</div>
              <div className="text-xs text-gray-500">Posts</div>
            </div>
            <div>
              <div className="font-bold text-base">{profile.followers_count}</div>
              <div className="text-xs text-gray-500">Followers</div>
            </div>
            <div>
              <div className="font-bold text-base">{profile.following_count}</div>
              <div className="text-xs text-gray-500">Following</div>
            </div>
          </div>
        </div>

        {/* 이름 / 계정명 / 소개글 (일반 모드 vs 수정 모드) */}
        {!isEditing ? (
          <div className="mb-4">
            <div className="font-bold text-sm">{profile.username}</div>
            <div className="text-xs text-gray-500 mb-1">{profile.name}</div>
            <div className="text-sm text-gray-800 whitespace-pre-line">{profile.bio}</div>
          </div>
        ) : (
          /* Figma 시안(Untitled 1.pdf 5페이지)의 인라인 수정 폼 */
          <div className="space-y-3 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="-- 이름 입력창 --"
                className="w-full text-sm px-2.5 py-1.5 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="-- 계정명 입력창 --"
                className="w-full text-sm px-2.5 py-1.5 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Introduction</label>
              <textarea
                rows={2}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="-- 소개글 입력창 --"
                className="w-full text-sm px-2.5 py-1.5 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* 버튼 영역: 내 프로필(Edit Profile) vs 상대방 프로필(Following / Message / +👤) */}
        {profile.is_me ? (
          <button
            onClick={handleEditToggleOrSave}
            className={`w-full py-2 rounded-lg text-xs font-bold transition ${
              isEditing
                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700" // 수정 중일 때 파란색!
                : "bg-gray-100 text-gray-900 hover:bg-gray-200"
            }`}
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => alert("You can't unfollow! ❤️")}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-900"
            >
              Following
            </button>
            <button
              onClick={() => window.open("https://wa.me/62895332445650", "_blank")}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-900"
            >
              Message
            </button>
            <button
              onClick={() => alert("Excuse me, miss! Who else are you looking for? 👀")}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-900 flex items-center justify-center"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 중간 그리드 아이콘 바 */}
      <div className="border-t border-b border-gray-200 py-2.5 flex justify-center">
        <Grid className="w-5 h-5 text-gray-800" />
      </div>

      {/* 하단 3열 정사각형 게시물 그리드 */}
      {profile.posts.length === 0 ? (
        <div className="py-16 text-center text-xs text-gray-400">
          아직 업로드한 게시물이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {profile.posts.map((post) => (
            <div
              key={post.id}
              onClick={() => navigate(`/feed/${post.id}`)}
              className="aspect-square cursor-pointer relative overflow-hidden group border border-white"
            >
              {renderThumbnail(post)}
              {/* 비공개 게시물일 경우 좌측 상단에 작은 자물쇠 표시 */}
              {!post.is_public && (
                <div className="absolute top-1.5 left-1.5 bg-black/50 p-1 rounded-full">
                  <Lock className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}