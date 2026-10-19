import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Plus, X, Music, Loader2 } from "lucide-react";
import api from "../api/client";

const BACKEND_URL = "";

const POST_TYPES = [
  { id: "text", label: "Text" },
  { id: "photo", label: "Photo" },
  { id: "music", label: "Music" },
  { id: "dictionary", label: "Dictionary" },
  { id: "balance", label: "Balance game" },
];

export default function CreatePostPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // 공통 상태: 현재 선택된 탭, 공개 여부(눈 아이콘), 본문 텍스트(최대 2000자), 로딩 상태
  const [activeType, setActiveType] = useState("text");
  const [isPublic, setIsPublic] = useState(true);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Text 전용 상태 (프로필 썸네일에 표시할 키워드)
  const [textKeyword, setTextKeyword] = useState("");

  // 2. Photo 전용 상태 (최대 5장 파일 배열 & 미리보기 URL 배열)
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  // 3. Music 전용 상태 (유튜브 뮤직 URL 및 파싱된 결과)
  const [musicUrl, setMusicUrl] = useState("");
  const [musicMeta, setMusicMeta] = useState(null);
  const [isParsingMusic, setIsParsingMusic] = useState(false);

  // 4. Dictionary 전용 상태 (단어, 의미, 예시)
  const [dictWord, setDictWord] = useState("");
  const [dictMeaning, setDictMeaning] = useState("");
  const [dictExample, setDictExample] = useState("");

  // 5. Balance Game 전용 상태 (상황, 선택지 1, 선택지 2)
  const [balanceSituation, setBalanceSituation] = useState("");
  const [balanceOption1, setBalanceOption1] = useState("");
  const [balanceOption2, setBalanceOption2] = useState("");

  const avatarUrl = user.profile_image
    ? `${BACKEND_URL}${user.profile_image}`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || "default"}`;

  // 사진 선택 핸들러 (최대 5장 제한)
  const handlePhotoSelect = (e) => {
    const selected = Array.from(e.target.files);
    if (photoFiles.length + selected.length > 5) {
      alert("You can upload up to 5 photos.");
      return;
    }
    const newFiles = [...photoFiles, ...selected];
    setPhotoFiles(newFiles);
    setPhotoPreviews(newFiles.map((file) => URL.createObjectURL(file)));
  };

  // 선택한 사진 개별 취소 핸들러
  const handleRemovePhoto = (index) => {
    const newFiles = photoFiles.filter((_, i) => i !== index);
    setPhotoFiles(newFiles);
    setPhotoPreviews(newFiles.map((file) => URL.createObjectURL(file)));
  };

  // Music URL 입력 후 포커스가 벗어나거나 버튼을 누르면 메타데이터 자동 추출
  const handleFetchMusicMeta = async () => {
    if (!musicUrl.trim()) return;
    setIsParsingMusic(true);
    try {
      const res = await api.post("/posts/parse-music", { url: musicUrl });
      setMusicMeta(res.data);
    } catch (err) {
      alert("Failed to extract music info from URL.");
    } finally {
      setIsParsingMusic(false);
    }
  };

  // 게시물 최종 업로드(Post) 버튼 핸들러
  const handleSubmit = async () => {
    if (isSubmitting) return;

    let extraData = {};

    // 각 탭별 필수 입력값 검증 및 extra_data 구성
    if (activeType === "text") {
      if (!textKeyword.trim() || !content.trim()) {
        alert("Please enter both a thumbnail keyword and your thoughts.");
        return;
      }
      extraData = { keyword: textKeyword.trim() };
    } else if (activeType === "photo") {
      if (photoFiles.length === 0) {
        alert("Please select at least 1 photo.");
        return;
      }
    } else if (activeType === "music") {
      if (!musicUrl.trim()) {
        alert("Please enter a YouTube Music URL.");
        return;
      }
      // 만약 파싱 전 바로 Post를 눌렀다면 자동으로 파싱 먼저 수행
      let meta = musicMeta;
      if (!meta) {
        const res = await api.post("/posts/parse-music", { url: musicUrl });
        meta = res.data;
      }
      extraData = meta;
    } else if (activeType === "dictionary") {
      if (!dictWord.trim() || !dictMeaning.trim() || !dictExample.trim()) {
        alert("Please fill in the word, meaning, and example.");
        return;
      }
      extraData = {
        word: dictWord.trim(),
        meaning: dictMeaning.trim(),
        example: dictExample.trim(),
      };
    } else if (activeType === "balance") {
      if (!balanceSituation.trim() || !balanceOption1.trim() || !balanceOption2.trim()) {
        alert("Please fill in the situation and both options.");
        return;
      }
      extraData = {
        situation: balanceSituation.trim(),
        option1: balanceOption1.trim(),
        option2: balanceOption2.trim(),
      };
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("post_type", activeType);
      formData.append("is_public", isPublic);
      formData.append("content", content);
      formData.append("extra_data", JSON.stringify(extraData));

      if (activeType === "photo") {
        photoFiles.forEach((file) => {
          formData.append("images", file);
        });
      }

      await api.post("/posts", formData);
      // 업로드 완료 후 내 프로필 또는 메인 피드로 이동 (비공개면 내 프로필로 이동해 바로 확인!)
      if (!isPublic) {
        navigate(`/${user.username}`);
      } else {
        navigate("/feed");
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to upload post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 pb-24">
      {/* 1. 상단 Posting 타이틀 및 Post(게시) 제출 버튼 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Posting</h2>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-full transition disabled:opacity-50"
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>

      {/* 2. 5가지 게시물 유형 선택 가로 스크롤 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {POST_TYPES.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveType(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 border transition ${
              activeType === tab.id
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. 메인 작성 카드 영역 */}
      <div className="border border-gray-200 rounded-2xl p-4 shadow-xs bg-white">
        {/* 작성자 프로필 및 눈 모양(Public / Private) 공개 설정 버튼 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <img
              src={avatarUrl}
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover border border-gray-200"
            />
            <div>
              <div className="text-sm font-bold text-gray-900">{user.username}</div>
              <div className="text-[11px] text-gray-400">
                {isPublic ? "Public" : "Private (Only me)"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              isPublic
                ? "bg-gray-50 text-gray-700 border-gray-200"
                : "bg-gray-900 text-white border-gray-900"
            }`}
          >
            {isPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{isPublic ? "Public" : "Private"}</span>
          </button>
        </div>

        {/* --- 유형 1: TEXT 폼 --- */}
        {activeType === "text" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Thumbnail Keyword
              </label>
              <input
                type="text"
                maxLength={20}
                value={textKeyword}
                onChange={(e) => setTextKeyword(e.target.value)}
                placeholder="e.g., Movie, Daily, Coffee (Shown on profile grid)"
                className="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <textarea
                rows={7}
                maxLength={2000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write down your thoughts today..."
                className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 resize-none"
              />
              <div className="text-right text-[11px] text-gray-400 mt-1">
                {content.length.toLocaleString()}/2,000
              </div>
            </div>
          </div>
        )}

        {/* --- 유형 2: PHOTO 폼 (최대 5장) --- */}
        {activeType === "photo" && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Photos ({photoFiles.length}/5)
                </label>
                <span className="text-[11px] text-gray-400">JPG, PNG · Max 20MB</span>
              </div>

              {/* 사진 미리보기 및 추가 버튼 영역 */}
              <div className="grid grid-cols-3 gap-2">
                {photoPreviews.map((src, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden relative border border-gray-200">
                    <img src={src} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {photoFiles.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-900 hover:text-gray-900 transition"
                  >
                    <Plus className="w-6 h-6 mb-1" />
                    <span className="text-[11px] font-semibold">Select Photo</span>
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/*"
                multiple
                className="hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Caption
              </label>
              <textarea
                rows={4}
                maxLength={2000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tell the story behind these photos..."
                className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 resize-none"
              />
              <div className="text-right text-[11px] text-gray-400 mt-1">
                {content.length.toLocaleString()}/2,000
              </div>
            </div>
          </div>
        )}

        {/* --- 유형 3: MUSIC 폼 --- */}
        {activeType === "music" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={musicUrl}
                  onChange={(e) => setMusicUrl(e.target.value)}
                  onBlur={handleFetchMusicMeta}
                  placeholder="Paste YouTube Music URL link here"
                  className="flex-1 text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900"
                />
                <button
                  type="button"
                  onClick={handleFetchMusicMeta}
                  disabled={isParsingMusic}
                  className="px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl shrink-0"
                >
                  {isParsingMusic ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load"}
                </button>
              </div>
            </div>

            {/* 추출된 음악 정보(썸네일, 제목, 가수) 미리보기 카드 */}
            {musicMeta && (
              <div className="flex items-center gap-3 p-3 bg-gray-900 text-white rounded-xl">
                {musicMeta.thumbnail ? (
                  <img
                    src={musicMeta.thumbnail}
                    alt="cover"
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                    <Music className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate">{musicMeta.title}</div>
                  <div className="text-xs text-gray-400 truncate">{musicMeta.singer}</div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={4}
                maxLength={2000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add a description about this song if you'd like..."
                className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 resize-none"
              />
              <div className="text-right text-[11px] text-gray-400 mt-1">
                {content.length.toLocaleString()}/2,000
              </div>
            </div>
          </div>
        )}

        {/* --- 유형 4: DICTIONARY 폼 --- */}
        {activeType === "dictionary" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Word
              </label>
              <input
                type="text"
                value={dictWord}
                onChange={(e) => setDictWord(e.target.value)}
                placeholder="What word do you want to explain? (e.g., 서운하다)"
                className="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Meaning
              </label>
              <textarea
                rows={3}
                value={dictMeaning}
                onChange={(e) => setDictMeaning(e.target.value)}
                placeholder="What does this word mean?"
                className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Example
              </label>
              <textarea
                rows={3}
                value={dictExample}
                onChange={(e) => setDictExample(e.target.value)}
                placeholder="Show an example of how to use it and what it means!"
                className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 resize-none"
              />
            </div>
          </div>
        )}

        {/* --- 유형 5: BALANCE GAME 폼 --- */}
        {activeType === "balance" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Situation
              </label>
              <textarea
                rows={2}
                value={balanceSituation}
                onChange={(e) => setBalanceSituation(e.target.value)}
                placeholder="Tell me the situation (e.g., If you had to eat one of these?)"
                className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Number 1
              </label>
              <input
                type="text"
                value={balanceOption1}
                onChange={(e) => setBalanceOption1(e.target.value)}
                placeholder="Opinion 1"
                className="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Number 2
              </label>
              <input
                type="text"
                value={balanceOption2}
                onChange={(e) => setBalanceOption2(e.target.value)}
                placeholder="Opinion 2"
                className="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}