import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../api/client";
import PostCard from "../components/feed/PostCard";
import CommentSheet from "../components/modals/CommentSheet";

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [isCommentOpen, setIsCommentOpen] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/posts/${id}`);
        setPost(res.data);
      } catch (err) {
        alert("Post not found or private.");
        navigate("/feed");
      }
    };
    fetchDetail();
  }, [id, navigate]);

  if (!post) {
    return <div className="py-16 text-center text-xs text-gray-400">Loading post...</div>;
  }

  return (
    <div className="pb-16">
      {/* 뒤로가기 상단 서브 바 */}
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="p-1 text-gray-700 hover:text-black"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold text-gray-900">Post</span>
      </div>

      {/* 오직 선택한 그 게시물 1개만 표시 (스크롤해도 다른 게시물 안 나옴!) */}
      <PostCard
        post={post}
        onOpenComment={() => setIsCommentOpen(true)}
        onPostDeleted={() => navigate(`/${post.author.username}`, { replace: true })}
      />

      <CommentSheet
        postId={post.id}
        isOpen={isCommentOpen}
        onClose={() => setIsCommentOpen(false)}
        onCommentCountChange={(newCount) =>
          setPost((prev) => ({ ...prev, comments_count: newCount }))
        }
      />
    </div>
  );
}