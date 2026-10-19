import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import api from "../../api/client";

const BACKEND_URL = "";

export default function PostCard({ post: initialPost, onOpenComment, onPostDeleted, onLikeToggled }) {
  const navigate = useNavigate();
  const editFileInputRef = useRef(null);
  const [post, setPost] = useState(initialPost);

  // Photo 다중 이미지 슬라이더 인덱스
  const [currentSlide, setCurrentSlide] = useState(0);

  // 우측 상단 점 3개(...) 메뉴 및 수정 모드 여부
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- 수정 모드 전용 State (모든 항목 수정 지원) ---
  const [editIsPublic, setEditIsPublic] = useState(post.is_public);
  const [editContent, setEditContent] = useState(post.content || "");

  // 1. Text 수정용 키워드
  const [editKeyword, setEditKeyword] = useState("");
  // 2. Photo 수정용 (기존에 남겨둘 이미지 경로 배열 & 새로 추가할 파일 배열)
  const [keptImages, setKeptImages] = useState([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState([]);
  // 3. Music 수정용
  const [editMusicUrl, setEditMusicUrl] = useState("");
  const [editMusicMeta, setEditMusicMeta] = useState(null);
  const [isParsingMusic, setIsParsingMusic] = useState(false);
  // 4. Dictionary 수정용
  const [editWord, setEditWord] = useState("");
  const [editMeaning, setEditMeaning] = useState("");
  const [editExample, setEditExample] = useState("");
  // 5. Balance Game 수정용
  const [editSituation, setEditSituation] = useState("");
  const [editOption1, setEditOption1] = useState("");
  const [editOption2, setEditOption2] = useState("");

  // 밸런스 게임 체크박스 선택 상태
  const [selectedOption, setSelectedOption] = useState(
    post.balance_result?.my_vote || null
  );

  const extra = post.extra_data || {};
  const authorAvatar = post.author?.profile_image
    ? `${BACKEND_URL}${post.author.profile_image}`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.username}`;

  // Edit 버튼을 눌렀을 때 현재 게시물의 모든 데이터를 수정 폼에 채워 넣기
  const startEditing = () => {
    const currentExtra = post.extra_data || {};
    setEditIsPublic(post.is_public);
    setEditContent(post.content || "");

    if (post.post_type === "text") {
      setEditKeyword(currentExtra.keyword || "");
    } else if (post.post_type === "photo") {
      setKeptImages(currentExtra.images || []);
      setNewPhotoFiles([]);
      setNewPhotoPreviews([]);
    } else if (post.post_type === "music") {
      setEditMusicUrl(currentExtra.url || "");
      setEditMusicMeta(currentExtra);
    } else if (post.post_type === "dictionary") {
      setEditWord(currentExtra.word || "");
      setEditMeaning(currentExtra.meaning || "");
      setEditExample(currentExtra.example || "");
    } else if (post.post_type === "balance") {
      setEditSituation(currentExtra.situation || "");
      setEditOption1(currentExtra.option1 || "");
      setEditOption2(currentExtra.option2 || "");
    }

    setShowMenu(false);
    setIsEditing(true);
  };

  // Photo 수정 모드: 새 사진 추가 핸들러 (기존 사진 + 새 사진 합쳐서 최대 5장)
  const handleAddEditPhotos = (e) => {
    const selected = Array.from(e.target.files);
    if (keptImages.length + newPhotoFiles.length + selected.length > 5) {
      alert("You can upload up to 5 photos in total.");
      return;
    }
    const updatedFiles = [...newPhotoFiles, ...selected];
    setNewPhotoFiles(updatedFiles);
    setNewPhotoPreviews(updatedFiles.map((f) => URL.createObjectURL(f)));
  };

  // Music 수정 모드: 바뀐 URL로 메타데이터 다시 불러오기
  const handleReparseMusic = async () => {
    if (!editMusicUrl.trim()) return;
    setIsParsingMusic(true);
    try {
      const res = await api.post("/posts/parse-music", { url: editMusicUrl });
      setEditMusicMeta(res.data);
    } catch (err) {
      alert("Failed to extract music info from URL.");
    } finally {
      setIsParsingMusic(false);
    }
  };

  // 수정 완료(Save) 버튼 핸들러
  const handleSaveEdit = async () => {
    if (isSaving) return;
    let updatedExtra = {};

    if (post.post_type === "text") {
      if (!editKeyword.trim() || !editContent.trim()) {
        alert("Please enter both a keyword and text.");
        return;
      }
      updatedExtra = { keyword: editKeyword.trim() };
    } else if (post.post_type === "photo") {
      if (keptImages.length + newPhotoFiles.length === 0) {
        alert("Please keep or select at least 1 photo.");
        return;
      }
      updatedExtra = { images: keptImages };
    } else if (post.post_type === "music") {
      if (!editMusicUrl.trim()) {
        alert("Please enter a YouTube Music URL.");
        return;
      }
      let meta = editMusicMeta;
      // URL을 바꿨는데 Load를 안 눌렀다면 자동 파싱
      if (!meta || meta.url !== editMusicUrl.trim()) {
        const res = await api.post("/posts/parse-music", { url: editMusicUrl.trim() });
        meta = res.data;
      }
      updatedExtra = meta;
    } else if (post.post_type === "dictionary") {
      if (!editWord.trim() || !editMeaning.trim() || !editExample.trim()) {
        alert("Please fill in the word, meaning, and example.");
        return;
      }
      updatedExtra = {
        word: editWord.trim(),
        meaning: editMeaning.trim(),
        example: editExample.trim(),
      };
    } else if (post.post_type === "balance") {
      if (!editSituation.trim() || !editOption1.trim() || !editOption2.trim()) {
        alert("Please fill in the situation and both options.");
        return;
      }
      updatedExtra = {
        situation: editSituation.trim(),
        option1: editOption1.trim(),
        option2: editOption2.trim(),
      };
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("content", editContent);
      formData.append("is_public", editIsPublic);
      formData.append("extra_data", JSON.stringify(updatedExtra));

      if (post.post_type === "photo") {
        newPhotoFiles.forEach((file) => {
          formData.append("new_images", file);
        });
      }

      const res = await api.put(`/posts/${post.id}`, formData);
      setPost(res.data);
      setCurrentSlide(0);
      setIsEditing(false);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update post.");
    } finally {
      setIsSaving(false);
    }
  };

  // 작성 시간 상대 표기
  const formatTimeAgo = (dateStr) => {
    const created = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - created) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
  };

  const getBadgeLabel = (type) => {
    switch (type) {
      case "text": return "Text";
      case "photo": return "Photo";
      case "music": return "Music";
      case "dictionary": return "Dictionary";
      case "balance": return "Balance game";
      default: return type;
    }
  };

  const handleLike = async () => {
    try {
      const res = await api.post(`/posts/${post.id}/like`);
      setPost(res.data);
      if (onLikeToggled) onLikeToggled(res.data);
    } catch (err) {
      alert("Failed to update like.");
    }
  };

  const handleVote = async () => {
    if (!selectedOption) {
      alert("Please check an option before voting!");
      return;
    }
    try {
      const res = await api.post(`/posts/${post.id}/vote`, {
        selected_option: selectedOption,
      });
      setPost(res.data);
    } catch (err) {
      alert("Failed to submit vote.");
    }
  };

  const handleShareWhatsApp = () => {
    const shareUrl = `${window.location.origin}/feed/${post.id}`;
    const text = encodeURIComponent(`Check out this post on kumagram! ❤️\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/posts/${post.id}`);
      if (onPostDeleted) onPostDeleted(post.id);
    } catch (err) {
      alert("Failed to delete post.");
    }
  };

  const images = extra.images || [];

  return (
    <article className="bg-white border-b border-gray-100 py-4 px-4">
      {/* 1. 카드 상단 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div
          onClick={() => navigate(`/${post.author.username}`)}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <img
            src={authorAvatar}
            alt="author"
            className="w-9 h-9 rounded-full object-cover border border-gray-200"
          />
          <div>
            <div className="text-sm font-bold text-gray-900 leading-tight">
              {post.author.username}
            </div>
            <div className="text-[11px] text-gray-400">
              {formatTimeAgo(post.created_at)} · {post.is_public ? "Public" : "Private"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-[11px] font-bold">
            {getBadgeLabel(post.post_type)}
          </span>

          {post.is_mine && (
            <div>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-500 hover:text-gray-900"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20">
                  <button
                    onClick={startEditing}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. 본문 영역: 수정 모드(isEditing) vs 일반 보기 모드 */}
      {isEditing ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-3 space-y-3">
          {/* 수정 모드 상단: Public / Private 전환 토글 버튼 */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <span className="text-xs font-bold text-gray-700">Edit Post</span>
            <button
              type="button"
              onClick={() => setEditIsPublic(!editIsPublic)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition ${
                editIsPublic
                  ? "bg-white text-gray-700 border-gray-300"
                  : "bg-gray-900 text-white border-gray-900"
              }`}
            >
              {editIsPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{editIsPublic ? "Public" : "Private"}</span>
            </button>
          </div>

          {/* (1) TEXT 수정 폼 */}
          {post.post_type === "text" && (
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Thumbnail Keyword
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={editKeyword}
                  onChange={(e) => setEditKeyword(e.target.value)}
                  className="w-full text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Content
                </label>
                <textarea
                  rows={5}
                  maxLength={2000}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full text-sm p-2.5 bg-white border border-gray-300 rounded-xl resize-none"
                />
              </div>
            </div>
          )}

          {/* (2) PHOTO 수정 폼 (기존 사진 삭제 + 새 사진 추가 + 설명 수정) */}
          {post.post_type === "photo" && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1.5">
                  Photos ({keptImages.length + newPhotoFiles.length}/5)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* 기존 이미지 목록 */}
                  {keptImages.map((imgUrl, idx) => (
                    <div key={`kept-${idx}`} className="aspect-square rounded-xl overflow-hidden relative border border-gray-200">
                      <img src={`${BACKEND_URL}${imgUrl}`} alt="kept" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setKeptImages(keptImages.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {/* 새로 추가한 이미지 미리보기 */}
                  {newPhotoPreviews.map((src, idx) => (
                    <div key={`new-${idx}`} className="aspect-square rounded-xl overflow-hidden relative border border-blue-400">
                      <img src={src} alt="new" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = newPhotoFiles.filter((_, i) => i !== idx);
                          setNewPhotoFiles(updated);
                          setNewPhotoPreviews(updated.map((f) => URL.createObjectURL(f)));
                        }}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {/* 사진 추가 버튼 */}
                  {keptImages.length + newPhotoFiles.length < 5 && (
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-900 hover:text-gray-900 bg-white"
                    >
                      <Plus className="w-5 h-5 mb-0.5" />
                      <span className="text-[10px] font-semibold">Add</span>
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={handleAddEditPhotos}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Caption
                </label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full text-sm p-2.5 bg-white border border-gray-300 rounded-xl resize-none"
                />
              </div>
            </div>
          )}

          {/* (3) MUSIC 수정 폼 */}
          {post.post_type === "music" && (
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  YouTube Music URL
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    value={editMusicUrl}
                    onChange={(e) => setEditMusicUrl(e.target.value)}
                    className="flex-1 text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleReparseMusic}
                    disabled={isParsingMusic}
                    className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-xl"
                  >
                    {isParsingMusic ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load"}
                  </button>
                </div>
              </div>
              {editMusicMeta && (
                <div className="flex items-center gap-2.5 p-2.5 bg-gray-900 text-white rounded-xl">
                  {editMusicMeta.thumbnail && (
                    <img src={editMusicMeta.thumbnail} alt="cover" className="w-10 h-10 rounded object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate">{editMusicMeta.title}</div>
                    <div className="text-[11px] text-gray-400 truncate">{editMusicMeta.singer}</div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full text-sm p-2.5 bg-white border border-gray-300 rounded-xl resize-none"
                />
              </div>
            </div>
          )}

          {/* (4) DICTIONARY 수정 폼 */}
          {post.post_type === "dictionary" && (
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Word</label>
                <input
                  type="text"
                  value={editWord}
                  onChange={(e) => setEditWord(e.target.value)}
                  className="w-full text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Meaning</label>
                <textarea
                  rows={2}
                  value={editMeaning}
                  onChange={(e) => setEditMeaning(e.target.value)}
                  className="w-full text-sm p-2.5 bg-white border border-gray-300 rounded-xl resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Example</label>
                <textarea
                  rows={2}
                  value={editExample}
                  onChange={(e) => setEditExample(e.target.value)}
                  className="w-full text-sm p-2.5 bg-white border border-gray-300 rounded-xl resize-none"
                />
              </div>
            </div>
          )}

          {/* (5) BALANCE GAME 수정 폼 */}
          {post.post_type === "balance" && (
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Situation</label>
                <textarea
                  rows={2}
                  value={editSituation}
                  onChange={(e) => setEditSituation(e.target.value)}
                  className="w-full text-sm p-2.5 bg-white border border-gray-300 rounded-xl resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Option 1</label>
                <input
                  type="text"
                  value={editOption1}
                  onChange={(e) => setEditOption1(e.target.value)}
                  className="w-full text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Option 2</label>
                <input
                  type="text"
                  value={editOption2}
                  onChange={(e) => setEditOption2(e.target.value)}
                  className="w-full text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* 하단 Cancel / Save 버튼 */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3.5 py-1.5 text-xs font-bold bg-white border border-gray-300 text-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="px-3.5 py-1.5 text-xs font-bold bg-gray-900 text-white rounded-lg disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        /* --- 일반 보기 모드 (기존과 동일) --- */
        <div className="mb-3">
          {post.post_type === "text" && (
            <div className="py-2">
              <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                {post.content}
              </p>
            </div>
          )}

          {post.post_type === "photo" && (
            <div>
              {images.length > 0 && (
                <div className="relative rounded-2xl overflow-hidden bg-gray-100 mb-2.5 aspect-4/3">
                  <img
                    src={`${BACKEND_URL}${images[currentSlide]}`}
                    alt="post"
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      {currentSlide > 0 && (
                        <button
                          onClick={() => setCurrentSlide(currentSlide - 1)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      )}
                      {currentSlide < images.length - 1 && (
                        <button
                          onClick={() => setCurrentSlide(currentSlide + 1)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, idx) => (
                          <span
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition ${
                              idx === currentSlide ? "bg-white scale-125" : "bg-white/50"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              {post.content && (
                <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                  {post.content}
                </p>
              )}
            </div>
          )}

          {post.post_type === "music" && (
            <div>
              <div
                onClick={() => extra.url && window.open(extra.url, "_blank")}
                className="cursor-pointer rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 mb-2.5"
              >
                {extra.thumbnail && (
                  <div className="aspect-square w-full bg-black overflow-hidden relative">
                    <img
                      src={extra.thumbnail}
                      alt={extra.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white p-2 rounded-full">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                )}
                <div className="p-3">
                  <div className="font-bold text-sm text-gray-900">{extra.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{extra.singer}</div>
                </div>
              </div>
              {post.content && (
                <p className="text-sm text-gray-800 whitespace-pre-line mt-1">
                  {post.content}
                </p>
              )}
            </div>
          )}

          {post.post_type === "dictionary" && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
              <h3 className="text-base font-extrabold text-gray-900">{extra.word}</h3>
              <div>
                <div className="text-xs font-bold text-gray-500 mb-0.5">Meaning)</div>
                <p className="text-sm text-gray-800 whitespace-pre-line">{extra.meaning}</p>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 mb-0.5">Example)</div>
                <p className="text-sm text-gray-800 whitespace-pre-line">{extra.example}</p>
              </div>
            </div>
          )}

          {post.post_type === "balance" && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">{extra.situation}</h3>
              <div className="space-y-2.5 mb-3">
                <div
                  onClick={() => setSelectedOption(1)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    selectedOption === 1
                      ? "bg-white border-gray-900 shadow-xs"
                      : "bg-white/60 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{extra.option1}</span>
                    {selectedOption === 1 ? (
                      <CheckSquare className="w-4 h-4 text-gray-900 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </div>
                  {post.balance_result?.my_vote &&
                    post.balance_result.option1_voters.length > 0 && (
                      <div className="text-[11px] font-semibold text-blue-600 mt-1">
                        {post.balance_result.option1_voters.join(", ")}
                      </div>
                    )}
                </div>

                <div
                  onClick={() => setSelectedOption(2)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    selectedOption === 2
                      ? "bg-white border-gray-900 shadow-xs"
                      : "bg-white/60 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{extra.option2}</span>
                    {selectedOption === 2 ? (
                      <CheckSquare className="w-4 h-4 text-gray-900 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </div>
                  {post.balance_result?.my_vote &&
                    post.balance_result.option2_voters.length > 0 && (
                      <div className="text-[11px] font-semibold text-blue-600 mt-1">
                        {post.balance_result.option2_voters.join(", ")}
                      </div>
                    )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleVote}
                  className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition"
                >
                  Vote
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. 카드 하단 인터랙션 푸터 */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-black transition"
          >
            <Heart
              className={`w-5 h-5 transition ${
                post.is_liked ? "fill-red-500 text-red-500 scale-110" : "text-gray-700"
              }`}
            />
            <span>{post.likes_count}</span>
          </button>

          <button
            onClick={() => onOpenComment(post.id)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-black transition"
          >
            <MessageCircle className="w-5 h-5 text-gray-700" />
            <span>{post.comments_count}</span>
          </button>
        </div>

        <button
          onClick={handleShareWhatsApp}
          className="p-1 text-gray-700 hover:text-black transition"
          title="Share via WhatsApp"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </article>
  );
}