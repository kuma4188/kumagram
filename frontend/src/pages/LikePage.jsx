import { useState, useEffect } from "react";
import api from "../api/client";
import PostCard from "../components/feed/PostCard";
import CommentSheet from "../components/modals/CommentSheet";

export default function LikePage() {
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);

  const fetchLikedPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/posts/liked");
      setLikedPosts(res.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedPosts();
  }, []);

  // Like 페이지에서 하트를 눌러 좋아요가 해제(is_liked === false)되면 즉시 목록에서 제거!
  const handleLikeToggled = (updatedPost) => {
    if (!updatedPost.is_liked) {
      setLikedPosts((prev) => prev.filter((p) => p.id !== updatedPost.id));
    }
  };

  return (
    <div className="pb-16">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-base font-extrabold tracking-tight text-gray-900">LIKE</h2>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-gray-400">Loading liked posts...</div>
      ) : likedPosts.length === 0 ? (
        <div className="py-20 text-center text-xs text-gray-400">
          You haven't liked any posts yet.
        </div>
      ) : (
        likedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onOpenComment={(id) => setActiveCommentPostId(id)}
            onLikeToggled={handleLikeToggled}
            onPostDeleted={(id) =>
              setLikedPosts((prev) => prev.filter((p) => p.id !== id))
            }
          />
        ))
      )}

      <CommentSheet
        postId={activeCommentPostId}
        isOpen={!!activeCommentPostId}
        onClose={() => setActiveCommentPostId(null)}
      />
    </div>
  );
}