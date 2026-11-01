import { useState, useEffect } from "react";
import { X, Send, Trash2, Edit2, Check } from "lucide-react";
import api from "../../api/client";

const BACKEND_URL = "";

// 작성 시간 상대 표기 함수 추가
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";

  const safeDateStr = (dateStr.endsWith("Z") || dateStr.includes("+"))
    ? dateStr
    : `${dateStr}Z`;

  const created = new Date(safeDateStr);
  const now = new Date();
  const diffSec = Math.floor((now - created) / 1000);

  if (diffSec < 60) return "Just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  // 24시간이 지난 경우 날짜 형식(YYYY.MM.DD)으로 출력
  const year = created.getFullYear();
  const month = String(created.getMonth() + 1).padStart(2, '0');
  const day = String(created.getDate()).padStart(2, '0');
  
  return `${year}.${month}.${day}`;
};

export default function CommentSheet({ postId, isOpen, onClose, onCommentCountChange }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const fetchComments = async () => {
    if (!postId) return;
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments(res.data);
      if (onCommentCountChange) onCommentCountChange(res.data.length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId]);

  if (!isOpen) return null;

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/posts/${postId}/comments`, { content: newComment });
      setNewComment("");
      fetchComments();
    } catch (err) {
      alert("Failed to post comment.");
    }
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      await api.put(`/posts/comments/${commentId}`, { content: editContent });
      setEditingId(null);
      fetchComments();
    } catch (err) {
      alert("Failed to update comment.");
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await api.delete(`/posts/comments/${commentId}`);
      fetchComments();
    } catch (err) {
      alert("Failed to delete comment.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-end bg-black/50 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl h-[65vh] flex flex-col shadow-2xl z-10 animate-slide-up">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="w-6" />
          <div className="flex flex-col items-center">
            <div className="w-10 h-1 bg-gray-300 rounded-full mb-2" />
            <h3 className="text-sm font-bold text-gray-900">Comment</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center text-xs text-gray-400 py-12">
              No comments yet. Leave the first comment!
            </div>
          ) : (
            comments.map((c) => {
              const avatar = c.author.profile_image
                ? `${BACKEND_URL}${c.author.profile_image}`
                : `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author.username}`;

              return (
                <div key={c.id} className="flex items-start gap-3">
                  <img
                    src={avatar}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      {/* 유저 이름과 시간 표시 영역 */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">
                          {c.author.username}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatTimeAgo(c.created_at)}
                        </span>
                      </div>
                      
                      {c.is_mine && editingId !== c.id && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <button
                            onClick={() => {
                              setEditingId(c.id);
                              setEditContent(c.content);
                            }}
                            className="hover:text-gray-700"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {editingId === c.id ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="flex-1 text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                        />
                        <button
                          onClick={() => handleSaveEdit(c.id)}
                          className="p-1.5 bg-gray-900 text-white rounded-lg"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-gray-100 text-gray-600 rounded-lg"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-700 mt-0.5 whitespace-pre-line break-words">
                        {c.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={handleAddComment}
          className="p-3 border-t border-gray-100 flex items-center gap-2 bg-white"
        >
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 text-xs px-4 py-2.5 bg-gray-100 rounded-full focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-900"
          />
          <button
            type="submit"
            className="p-2.5 bg-gray-900 text-white rounded-full hover:bg-black transition shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}