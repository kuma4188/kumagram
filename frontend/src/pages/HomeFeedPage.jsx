import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/client";
import PostCard from "../components/feed/PostCard";
import CommentSheet from "../components/modals/CommentSheet";

export default function HomeFeedPage() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // 현재 열려있는 댓글 바텀시트의 게시물 ID
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const observerRef = useRef(null);

  const fetchPosts = useCallback(async (pageNum) => {
    setLoading(true);
    try {
      const res = await api.get(`/posts?page=${pageNum}&size=10`);
      setPosts((prev) => (pageNum === 1 ? res.data.items : [...prev, ...res.data.items]));
      setHasMore(res.data.has_more);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(page);
  }, [page, fetchPosts]);

  // 스크롤이 마지막 요소에 닿았는지 감지하는 IntersectionObserver
  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore]
  );

  // 삭제된 게시물 즉시 화면에서 제거
  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  return (
    <div className="pb-16">
      {posts.length === 0 && !loading ? (
        <div className="py-20 text-center text-xs text-gray-400">
          No posts yet. Tap <b>+ Post</b> below to share your first moment!
        </div>
      ) : (
        posts.map((post, idx) => {
          const isLast = idx === posts.length - 1;
          return (
            <div key={post.id} ref={isLast ? lastPostRef : null}>
              <PostCard
                post={post}
                onOpenComment={(id) => setActiveCommentPostId(id)}
                onPostDeleted={handlePostDeleted}
              />
            </div>
          );
        })
      )}

      {loading && (
        <div className="py-6 text-center text-xs text-gray-400">Loading posts...</div>
      )}

      {/* 댓글 바텀 시트 모달 */}
      <CommentSheet
        postId={activeCommentPostId}
        isOpen={!!activeCommentPostId}
        onClose={() => setActiveCommentPostId(null)}
        onCommentCountChange={(newCount) => {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === activeCommentPostId ? { ...p, comments_count: newCount } : p
            )
          );
        }}
      />
    </div>
  );
}