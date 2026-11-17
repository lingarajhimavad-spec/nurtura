import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  MessageSquare,
  Plus,
  Search,
  Send,
  ThumbsUp,
  Users,
} from 'lucide-react';
import { useBabyMemory } from '../context/BabyMemoryContext';
import type { CommunityTopic } from '../types/babyMemory';

const QUICK_STARTERS = [
  'Ask about dosage / fever',
  'Share recent weight & feeding',
  'Follow up on lab result',
];

export const CareConnectView: React.FC = () => {
  const {
    t,
    firebaseUser,
    threads,
    messagesByThread,
    sendConsultationMessage,
    createConsultationThread,
    communityPosts,
    repliesByPost,
    likesByPost,
    createCommunityPost,
    addCommunityReply,
    toggleCommunityLike,
    subscribePostDetails,
  } = useBabyMemory();

  const [subTab, setSubTab] = useState<'doctors' | 'community'>('doctors');
  const [activeThreadId, setActiveThreadId] = useState<string>(threads[0]?.id || '');
  const [msgText, setMsgText] = useState('');
  const [urgentFlag, setUrgentFlag] = useState(false);

  const [newDocName, setNewDocName] = useState('');
  const [newDocSpec, setNewDocSpec] = useState('Pediatrics');
  const [showNewThread, setShowNewThread] = useState(false);
  const [docImgError, setDocImgError] = useState(false);

  // Community state
  const [topicFilter, setTopicFilter] = useState<'all' | CommunityTopic>('all');
  const [communitySearch, setCommunitySearch] = useState('');
  const [postTopic, setPostTopic] = useState<CommunityTopic>('milestones');
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (!activeThreadId && threads.length > 0) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId]);

  useEffect(() => {
    if (!expandedPostId) return;
    return subscribePostDetails(expandedPostId);
  }, [expandedPostId, subscribePostDetails]);

  const activeThread = threads.find((tr) => tr.id === activeThreadId) || threads[0] || null;
  const activeMessages = activeThread ? messagesByThread[activeThread.id] || [] : [];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !msgText.trim()) return;
    await sendConsultationMessage(activeThread.id, msgText, urgentFlag);
    setMsgText('');
    setUrgentFlag(false);
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    const id = await createConsultationThread(newDocName, newDocSpec, 'Care Partner Clinic');
    setActiveThreadId(id);
    setNewDocName('');
    setShowNewThread(false);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (postTitle.trim().length < 3 || postBody.trim().length < 3) return;
    await createCommunityPost(postTopic, postTitle, postBody);
    setPostTitle('');
    setPostBody('');
  };

  const handleReplySubmit = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await addCommunityReply(postId, replyText);
    setReplyText('');
  };

  const normalizedSearch = communitySearch.trim().toLowerCase();
  const visiblePosts = communityPosts.filter((p) => {
    if (topicFilter !== 'all' && p.topic !== topicFilter) return false;
    if (!normalizedSearch) return true;
    return (
      p.title.toLowerCase().includes(normalizedSearch) ||
      p.body.toLowerCase().includes(normalizedSearch) ||
      p.authorHandle.toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
            {subTab === 'doctors' ? t.doctorMessagesTitle : t.communityForumTitle}
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
            Consult directly with OB/GYNs and pediatricians or exchange practical tips in the parent community.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setSubTab('doctors')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              subTab === 'doctors'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Doctor Messaging ({threads.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('community')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              subTab === 'community'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Parent Community ({communityPosts.length})
          </button>
        </div>
      </div>

      {subTab === 'doctors' ? (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Clinician Thread List */}
          <div className="lg:col-span-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-stone-900 dark:text-stone-100">
                Care Team Inbox
              </h2>
              <button
                type="button"
                onClick={() => setShowNewThread((s) => !s)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Doctor</span>
              </button>
            </div>

            {showNewThread && (
              <form onSubmit={handleCreateThread} className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/60 space-y-2.5">
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="Doctor name (e.g., Dr. Patel)"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                />
                <input
                  type="text"
                  value={newDocSpec}
                  onChange={(e) => setNewDocSpec(e.target.value)}
                  placeholder="Specialty (OB/GYN, Pediatrics)"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 text-xs font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg"
                >
                  Open Secure Thread
                </button>
              </form>
            )}

            <div className="divide-y divide-stone-200 dark:divide-stone-800">
              {threads.map((thr) => {
                const selected = activeThread?.id === thr.id;
                return (
                  <button
                    key={thr.id}
                    type="button"
                    onClick={() => setActiveThreadId(thr.id)}
                    className={`w-full text-left py-3.5 px-3 rounded-lg transition-colors ${
                      selected
                        ? 'bg-sage-50 dark:bg-sage-950/40'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {thr.doctorName}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {thr.specialty} · {thr.clinicName}
                    </p>
                    <p className="mt-1 text-xs text-stone-600 dark:text-stone-300 truncate">
                      {thr.lastMessage}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Conversation Pane */}
          <div className="lg:col-span-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl flex flex-col min-h-[480px]">
            {activeThread ? (
              <>
                <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
                    {!docImgError ? (
                      <img
                        src="/src/assets/images/avatar_doctor_profile_1794935392933.jpg"
                        alt={activeThread.doctorName}
                        referrerPolicy="no-referrer"
                        onError={() => setDocImgError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-sage-700 dark:text-sage-400">
                        DR
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {activeThread.doctorName}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {activeThread.specialty} · {activeThread.clinicName}
                    </p>
                  </div>
                </div>

                <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[360px]">
                  {activeMessages.length === 0 ? (
                    <p className="text-xs text-center text-stone-500 dark:text-stone-400 py-10">
                      Send a question about symptoms, test results, dosage, or feeding schedules.
                    </p>
                  ) : (
                    activeMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          m.senderRole === 'parent' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <span className="text-[11px] text-stone-400 dark:text-stone-500 mb-1">
                          {m.senderName} {m.urgent ? '· Marked Urgent' : ''}
                        </span>
                        <div
                          className={`max-w-lg px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                            m.senderRole === 'parent'
                              ? 'bg-sage-700 text-white'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                          }`}
                        >
                          {m.body}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-stone-200 dark:border-stone-800 space-y-3"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    {QUICK_STARTERS.map((starter) => (
                      <button
                        key={starter}
                        type="button"
                        onClick={() => setMsgText(`${starter}: `)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 text-stone-600 dark:text-stone-300 hover:border-sage-400 dark:hover:border-sage-600 hover:text-sage-800 dark:hover:text-sage-200 transition-colors"
                      >
                        {starter}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={1500}
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      placeholder="Write a message to your doctor..."
                      className="flex-1 px-3.5 py-2.5 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg whitespace-nowrap shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </button>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={urgentFlag}
                      onChange={(e) => setUrgentFlag(e.target.checked)}
                      className="rounded border-stone-300 text-rose-600 focus:ring-rose-500"
                    />
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Flag for urgent clinical triage review</span>
                  </label>
                </form>
              </>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreatePost}
            className="lg:col-span-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-4 h-fit"
          >
            <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-blush-600 dark:text-blush-400" />
              <span>Share with Parents</span>
            </h2>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Topic
              </label>
              <select
                value={postTopic}
                onChange={(e) => setPostTopic(e.target.value as CommunityTopic)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              >
                <option value="milestones">Milestones (5w / 10w / 20w)</option>
                <option value="pregnancy">Pregnancy Journey</option>
                <option value="newborn">Newborn Care</option>
                <option value="nutrition">Nutrition &amp; Diet</option>
                <option value="sleep">Sleep Routines</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Headline
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={140}
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Question or experience to share"
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Details (no personal contact info)
              </label>
              <textarea
                rows={3}
                required
                minLength={3}
                maxLength={2000}
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg whitespace-nowrap"
            >
              Publish Discussion
            </button>
          </form>

          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg w-fit">
                {(['all', 'pregnancy', 'newborn', 'milestones', 'nutrition', 'sleep'] as const).map(
                  (tp) => (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => setTopicFilter(tp)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize whitespace-nowrap ${
                        topicFilter === tp
                          ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                          : 'text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {tp}
                    </button>
                  )
                )}
              </div>
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={communitySearch}
                  onChange={(e) => setCommunitySearch(e.target.value)}
                  placeholder="Search discussions..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            {visiblePosts.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-10 text-center text-sm text-stone-500 dark:text-stone-400">
                No discussions match your filter yet. Start a conversation on the left.
              </div>
            ) : (
              <div className="space-y-4">
                {visiblePosts.map((post) => {
                  const postLikes = likesByPost[post.id] || [];
                  const postReplies = repliesByPost[post.id] || [];
                  const likedByMe = postLikes.some(
                    (l) => l.userId === (firebaseUser?.uid || 'local_preview')
                  );
                  const isExpanded = expandedPostId === post.id;

                  return (
                    <article
                      key={post.id}
                      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                        <span>{post.authorHandle}</span>
                        <span className="capitalize">{post.topic}</span>
                      </div>
                      <h3 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
                        {post.title}
                      </h3>
                      <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                        {post.body}
                      </p>

                      <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => void toggleCommunityLike(post.id)}
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            likedByMe
                              ? 'text-blush-600 dark:text-blush-400'
                              : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span className="font-mono-tabular">{postLikes.length}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{isExpanded ? 'Hide Replies' : `Replies (${postReplies.length})`}</span>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-3">
                          {postReplies.map((r) => (
                            <div key={r.id} className="text-xs bg-stone-50 dark:bg-stone-800/60 p-3 rounded-lg">
                              <span className="font-semibold text-stone-800 dark:text-stone-200">
                                {r.authorHandle}:{' '}
                              </span>
                              <span className="text-stone-600 dark:text-stone-300">{r.body}</span>
                            </div>
                          ))}
                          <form
                            onSubmit={(e) => void handleReplySubmit(e, post.id)}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="text"
                              maxLength={1200}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write a helpful reply..."
                              className="flex-1 px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                            />
                            <button
                              type="submit"
                              className="px-3 py-2 text-xs font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg whitespace-nowrap"
                            >
                              Reply
                            </button>
                          </form>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
