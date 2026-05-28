import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Search, Award, Zap, ShieldAlert, Loader2, ArrowLeft,
  ChevronRight, MessageCircle, Heart, Star, Pin, CheckCircle2, Send,
  AlertCircle, Trash2, HelpCircle, Lightbulb, BookOpen, Compass
} from 'lucide-react';
import { apiService } from '../services/api';

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const CATEGORIES = [
  { id: 'doubt', label: 'Doubt', icon: <HelpCircle className="w-3.5 h-3.5" />, color: 'rose' },
  { id: 'logic', label: 'Core Logic', icon: <Compass className="w-3.5 h-3.5" />, color: 'cyan' },
  { id: 'approach', label: 'Approach', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'purple' },
  { id: 'hint', label: 'Hint', icon: <Lightbulb className="w-3.5 h-3.5" />, color: 'amber' }
];

const DiscussionPanel = ({ problem }) => {
  const [discussions, setDiscussions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Navigation states
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [threadData, setThreadData] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  
  // Filter/Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'doubt' });
  const [newComment, setNewComment] = useState('');
  const [newReply, setNewReply] = useState({}); // commentId -> replyText
  const [showReplyForm, setShowReplyForm] = useState({}); // commentId -> boolean
  
  // Form warning/spam checks
  const [formWarning, setFormWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Current user cache
  const currentUser = localStorage.getItem('codegravity_user') || 'Anonymous';
  const currentUserEmail = localStorage.getItem('codegravity_token') ? 'authenticated' : '';

  const fetchDiscussions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiService.getDiscussions(problem.id);
      setDiscussions(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to sync discussion board.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchThreadDetails = async (threadId) => {
    setThreadLoading(true);
    setError('');
    try {
      const data = await apiService.getDiscussionThread(threadId);
      setThreadData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch thread detail.');
    } finally {
      setThreadLoading(false);
    }
  };

  useEffect(() => {
    if (problem) {
      fetchDiscussions();
      setActiveThreadId(null);
      setThreadData(null);
    }
  }, [problem]);

  useEffect(() => {
    if (activeThreadId) {
      fetchThreadDetails(activeThreadId);
    } else {
      setThreadData(null);
    }
  }, [activeThreadId]);

  // Client-Side Heuristics Code-Dumping & Spam Guard
  const validateContentPolicy = (content) => {
    const cleanText = content.trim();
    if (!cleanText) return '';

    // 1. Detect code blocks and calculate ratio
    const codeBlocks = cleanText.match(/```[\s\S]*?```|`[\s\S]*?`/g) || [];
    const totalCodeLen = codeBlocks.reduce((acc, block) => acc + block.length, 0);
    
    if (cleanText.length > 0 && (totalCodeLen / cleanText.length) > 0.40) {
      return 'Code-Dumping Blocked: Raw code makes up more than 40% of your post. Please explain your logic conceptually using words instead of copying full solutions.';
    }

    // 2. Continuous keywords checking
    const keywords = [
      /\bdef\b.*\(.*\):/, 
      /\bpublic\s+static\s+void\b/, 
      /\bclass\b.*\bextends\b/, 
      /#include\s+<.*>/, 
      /\bint\s+main\s*\(.*\)/, 
      /const\s+\w+\s*=\s*\(.*\)\s*=>/
    ];
    for (const pattern of keywords) {
      if (pattern.test(cleanText)) {
        const textWithoutCode = cleanText.replace(/```[\s\S]*?```|`[\s\S]*?`/g, '');
        if (textWithoutCode.trim().length < 120) {
          return 'Heuristics Warning: Coding snippet detected! Please expand your theoretical logic explanation (at least 120 characters) to encourage peer learning.';
        }
      }
    }
    return '';
  };

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    setFormWarning('');
    
    if (!currentUserEmail) {
      setFormWarning('Sign In Required: Please log in to publish a community thread.');
      return;
    }

    const warning = validateContentPolicy(newPost.content);
    if (warning) {
      setFormWarning(warning);
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createDiscussion(problem.id, newPost);
      setNewPost({ title: '', content: '', category: 'doubt' });
      setShowCreateModal(false);
      await fetchDiscussions();
    } catch (err) {
      setFormWarning(err.message || 'Error occurred while publishing.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    setFormWarning('');

    if (!currentUserEmail) {
      alert('Please sign in to reply to this thread.');
      return;
    }

    const warning = validateContentPolicy(newComment);
    if (warning) {
      alert(warning);
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createComment(activeThreadId, { content: newComment });
      setNewComment('');
      await fetchThreadDetails(activeThreadId);
      // silently refresh main list too
      apiService.getDiscussions(problem.id).then(setDiscussions).catch(console.error);
    } catch (err) {
      alert(err.message || 'Failed to submit comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateReply = async (commentId) => {
    const text = newReply[commentId] || '';
    if (!text.trim()) return;

    if (!currentUserEmail) {
      alert('Please sign in to reply.');
      return;
    }

    const warning = validateContentPolicy(text);
    if (warning) {
      alert(warning);
      return;
    }

    try {
      await apiService.createReply(commentId, { content: text });
      setNewReply(prev => ({ ...prev, [commentId]: '' }));
      setShowReplyForm(prev => ({ ...prev, [commentId]: false }));
      await fetchThreadDetails(activeThreadId);
    } catch (err) {
      alert(err.message || 'Failed to post reply.');
    }
  };

  const handleUpvoteDiscussion = async (threadId, e) => {
    e.stopPropagation();
    if (!currentUserEmail) {
      alert('Please sign in to upvote.');
      return;
    }

    try {
      const res = await apiService.upvoteDiscussion(threadId);
      
      // Update local state smoothly
      setDiscussions(prev => prev.map(d => d.id === threadId ? { ...d, upvote_count: res.upvote_count, has_upvoted: res.has_upvoted } : d));
      if (threadData && threadData.discussion.id === threadId) {
        setThreadData(prev => ({
          ...prev,
          discussion: { ...prev.discussion, upvote_count: res.upvote_count, has_upvoted: res.has_upvoted }
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpvoteComment = async (commentId) => {
    if (!currentUserEmail) {
      alert('Please sign in to upvote.');
      return;
    }

    try {
      const res = await apiService.upvoteComment(commentId);
      setThreadData(prev => ({
        ...prev,
        comments: prev.comments.map(c => c.id === commentId ? { ...c, upvote_count: res.upvote_count, has_upvoted: res.has_upvoted } : c)
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkHelpful = async (commentId) => {
    try {
      await apiService.markCommentHelpful(commentId);
      await fetchThreadDetails(activeThreadId);
    } catch (err) {
      alert(err.message || 'Failed to toggle helpful status.');
    }
  };

  const handleToggleResolve = async (threadId) => {
    try {
      const res = await apiService.resolveDiscussion(threadId);
      setThreadData(prev => ({
        ...prev,
        discussion: { ...prev.discussion, is_resolved: res.is_resolved }
      }));
      setDiscussions(prev => prev.map(d => d.id === threadId ? { ...d, is_resolved: res.is_resolved } : d));
    } catch (err) {
      alert(err.message || 'Failed to update thread status.');
    }
  };

  const handleDeleteDiscussion = async (threadId) => {
    if (!window.confirm('Delete Thread: Are you sure you want to permanently delete this thread and all comments?')) return;
    try {
      await apiService.deleteDiscussion(threadId);
      setActiveThreadId(null);
      await fetchDiscussions();
    } catch (err) {
      alert(err.message || 'Deletion failed.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete Comment: Are you sure?')) return;
    try {
      await apiService.deleteComment(commentId);
      await fetchThreadDetails(activeThreadId);
    } catch (err) {
      alert(err.message || 'Deletion failed.');
    }
  };

  // Filter discussions
  const filteredDiscussions = useMemo(() => {
    return discussions.filter(d => {
      const matchSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = activeCategory === 'all' || d.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [discussions, searchTerm, activeCategory]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0e121e] text-left">
      
      {/* HEADER CONTROLS (Back arrow in Thread view, or Search/Filters in standard view) */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-[#0b0e17] shrink-0 space-y-4">
        
        {activeThreadId ? (
          /* THREAD TOP NAVIGATION BAR */
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveThreadId(null)}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#121626] text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all text-xs font-bold uppercase cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Threads</span>
            </button>
            <span className="text-[10px] font-mono text-slate-450 uppercase tracking-widest">
              Legend Discussion Thread
            </span>
          </div>
        ) : (
          /* LIST DASHBOARD SEARCH & CREATE TICKET TOOLBAR */
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-850 dark:text-white">
                  Developer Circle
                </h3>
                <span className="text-[9px] font-light text-slate-400 dark:text-slate-500 block">
                  Peer-learning environment. Full code-dumps are auto-blocked.
                </span>
              </div>
              <button
                onClick={() => {
                  setFormWarning('');
                  setShowCreateModal(true);
                }}
                className="py-2 px-4 bg-gradient-to-r from-cyber-purple to-cyber-blue hover:from-[#aa55ff] hover:to-[#0055ff] text-white font-sans font-black text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-[0_0_12px_rgba(180,90,255,0.2)]"
              >
                Ask Doubt / Expl. Logic
              </button>
            </div>

            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {/* Categories */}
              <div className="flex items-center gap-1.5 flex-wrap flex-1 w-full overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer border transition-colors ${
                    activeCategory === 'all'
                      ? 'bg-slate-150 border-slate-300 dark:bg-slate-900 dark:border-slate-800 text-cyber-cyan font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Global
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer border transition-colors flex items-center gap-1 ${
                      activeCategory === cat.id
                        ? 'bg-slate-150 border-slate-300 dark:bg-slate-900 dark:border-slate-800 text-cyber-cyan font-black'
                        : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-56 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by keywords..."
                  className="w-full bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none text-slate-800 dark:text-white focus:border-cyber-cyan/35 transition-colors"
                />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* VIEW PANEL MAIN CONTAINER */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
        <AnimatePresence mode="wait">
          
          {isLoading ? (
            /* DYNAMIC LOADING STANDBY */
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center gap-3 text-slate-400"
            >
              <Loader2 className="w-7 h-7 text-cyber-purple animate-spin" />
              <span className="text-xs font-light">Retrieving topic discussion entries...</span>
            </motion.div>
          ) : error && !activeThreadId ? (
            /* ERROR MESSAGE VIEW */
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <div className="inline-flex p-3.5 bg-rose-500/10 text-rose-500 rounded-full mb-3">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h4 className="font-sans font-bold text-xs text-slate-850 dark:text-white">Standings sync interrupted</h4>
              <p className="text-slate-455 dark:text-slate-500 text-xs font-light max-w-xs mx-auto mt-1">{error}</p>
              <button 
                onClick={fetchDiscussions}
                className="mt-4 px-5 py-2 bg-cyber-cyan hover:bg-cyan-400 text-space-900 text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
              >
                Retry Syncer
              </button>
            </motion.div>
          ) : activeThreadId ? (
            /* THREAD DETAILS THREAD SYSTEM VIEW */
            <motion.div
              key="thread-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {threadLoading || !threadData ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-450">
                  <Loader2 className="w-6 h-6 text-cyber-purple animate-spin" />
                  <span className="text-xs font-light">Extracting comments and response nodes...</span>
                </div>
              ) : (
                <div className="space-y-6 text-left">
                  
                  {/* DISCUSSION ROOT QUESTION CARD */}
                  <div className="p-5 rounded-xl bg-slate-50/50 dark:bg-slate-950/10 border border-slate-200 dark:border-slate-850 relative overflow-hidden space-y-4">
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyber-purple to-cyber-cyan" />
                    
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Vote action */}
                      <button
                        onClick={(e) => handleUpvoteDiscussion(threadData.discussion.id, e)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                          threadData.discussion.has_upvoted
                            ? 'bg-cyber-purple/10 border-cyber-purple/35 text-cyber-purple'
                            : 'bg-white dark:bg-[#0e121e] border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white'
                        }`}
                        title="Upvote logic value"
                      >
                        <Heart className={`w-4 h-4 ${threadData.discussion.has_upvoted ? 'fill-current' : ''}`} />
                        <span className="text-xs font-bold mt-1">{threadData.discussion.upvote_count}</span>
                      </button>

                      {/* Right: Content body */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[8px] font-sans font-black uppercase px-2 py-0.5 rounded ${
                            threadData.discussion.category === 'doubt'
                              ? 'text-rose-500 bg-rose-500/10 border border-rose-500/20'
                              : threadData.discussion.category === 'logic'
                              ? 'text-cyan-500 bg-cyan-500/10 border border-cyan-500/20'
                              : threadData.discussion.category === 'approach'
                              ? 'text-purple-500 bg-purple-500/10 border border-purple-500/20'
                              : 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                          }`}>
                            {threadData.discussion.category}
                          </span>
                          {threadData.discussion.is_pinned && (
                            <span className="flex items-center gap-0.5 text-[8px] font-sans font-black uppercase px-2 py-0.5 rounded text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
                              <Pin className="w-2.5 h-2.5" /> Pinned
                            </span>
                          )}
                          {threadData.discussion.is_resolved && (
                            <span className="flex items-center gap-0.5 text-[8px] font-sans font-black uppercase px-2 py-0.5 rounded text-sky-500 bg-sky-500/10 border border-sky-500/20">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Resolved
                            </span>
                          )}
                        </div>

                        <h3 className="font-sans font-extrabold text-base text-slate-850 dark:text-white leading-tight">
                          {threadData.discussion.title}
                        </h3>

                        <div className="text-slate-655 dark:text-slate-300 text-xs font-light leading-relaxed whitespace-pre-wrap font-sans pt-1">
                          {threadData.discussion.content}
                        </div>

                        {/* Author metadata footer */}
                        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-850/60 flex-wrap">
                          <div className="flex items-center gap-2 group relative">
                            {threadData.discussion.author_pic ? (
                              <img 
                                src={threadData.discussion.author_pic} 
                                alt={threadData.discussion.author} 
                                className="w-7 h-7 rounded border border-slate-200 dark:border-slate-800 object-cover"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs font-bold text-cyber-cyan">
                                {getInitials(threadData.discussion.author)}
                              </div>
                            )}
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-sans font-bold text-slate-700 dark:text-slate-200 block">
                                {threadData.discussion.author}
                              </span>
                              <span className="text-[8px] font-mono text-slate-400 block">
                                Lvl {threadData.discussion.author_level} Scholar
                              </span>
                            </div>

                            {/* User details hover card popup */}
                            <div className="absolute bottom-full mb-2 left-0 w-44 p-3 bg-slate-900 border border-slate-800 rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 text-left font-sans shadow-2xl">
                              <div className="text-xs font-extrabold text-white">@{threadData.discussion.author}</div>
                              <div className="text-[9px] text-cyber-cyan font-bold mt-1 font-mono uppercase">Level {threadData.discussion.author_level} Scholar</div>
                              <div className="text-[9px] text-slate-400 font-mono mt-0.5">{threadData.discussion.author_xp} Quantum XP Accum.</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-slate-400">
                              {new Date(threadData.discussion.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            
                            {/* Author/Admin moderation resolution toggle */}
                            {(threadData.discussion.author_email === currentUserEmail || currentUser === 'sairam') && (
                              <button
                                onClick={() => handleToggleResolve(threadData.discussion.id)}
                                className={`text-[9px] px-2.5 py-1 font-bold uppercase rounded border cursor-pointer transition-colors ${
                                  threadData.discussion.is_resolved
                                    ? 'bg-sky-500/10 border-sky-500/35 text-sky-500'
                                    : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                }`}
                              >
                                {threadData.discussion.is_resolved ? 'Unmark Resolved' : 'Mark Resolved'}
                              </button>
                            )}

                            {/* Admin override moderation delete */}
                            {(threadData.discussion.author_email === currentUserEmail || currentUser === 'sairam') && (
                              <button
                                onClick={() => handleDeleteDiscussion(threadData.discussion.id)}
                                className="p-1 rounded text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Delete Discussion Thread"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* THREAD COMMENTS TIMELINE */}
                  <div className="space-y-4">
                    <h4 className="font-sans font-black text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" />
                      Contributions ({threadData.comments.length})
                    </h4>

                    {threadData.comments.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs font-light">
                        No explanations or doubts added yet. Be the first to share your logic!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {threadData.comments.map(comment => (
                          <div 
                            key={comment.id}
                            className={`p-4 rounded-xl border flex flex-col md:flex-row gap-4 relative overflow-hidden transition-all text-left ${
                              comment.is_helpful 
                                ? 'bg-orange-500/5 border-orange-500/35 shadow-sm' 
                                : 'bg-white dark:bg-[#0e121e]/40 border-slate-200 dark:border-slate-850'
                            }`}
                          >
                            {/* Pinned Helpful/Accepted Badge */}
                            {comment.is_helpful && (
                              <div className="absolute top-0 right-0 px-3 py-0.5 bg-orange-550 text-white font-sans font-black text-[7px] uppercase tracking-wider rounded-bl">
                                Helpful Answer (+50 XP Awardeded)
                              </div>
                            )}

                            {/* Upvote Comment Trigger */}
                            <div className="flex md:flex-col items-center justify-start shrink-0 gap-1.5">
                              <button
                                onClick={() => handleUpvoteComment(comment.id)}
                                className={`p-1.5 rounded border flex items-center gap-1 cursor-pointer transition-colors ${
                                  comment.has_upvoted
                                    ? 'bg-cyber-purple/10 border-cyber-purple/35 text-cyber-purple'
                                    : 'bg-slate-50 dark:bg-[#121626] border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                }`}
                                title="Upvote Explanation"
                              >
                                <Heart className={`w-3.5 h-3.5 ${comment.has_upvoted ? 'fill-current' : ''}`} />
                                <span className="text-[10px] font-bold">{comment.upvote_count}</span>
                              </button>
                            </div>

                            {/* Comment Core Content */}
                            <div className="flex-1 space-y-2">
                              <div className="text-slate-655 dark:text-slate-300 text-xs font-light leading-relaxed whitespace-pre-wrap font-sans">
                                {comment.content}
                              </div>

                              {/* Comment Header Meta */}
                              <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-850/40 flex-wrap">
                                <div className="flex items-center gap-2 group relative">
                                  {comment.author_pic ? (
                                    <img src={comment.author_pic} alt={comment.author} className="w-6 h-6 rounded border border-slate-200 dark:border-slate-800 object-cover" />
                                  ) : (
                                    <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-cyber-cyan">
                                      {getInitials(comment.author)}
                                    </div>
                                  )}
                                  <div className="space-y-0.5">
                                    <span className="text-[9px] font-sans font-bold text-slate-750 dark:text-slate-200 block">{comment.author}</span>
                                    <span className="text-[7px] font-mono text-slate-405 block">Lvl {comment.author_level}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-mono text-slate-400">
                                    {new Date(comment.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>

                                  {/* Author/Admin mark helpful toggler */}
                                  {(threadData.discussion.author_email === currentUserEmail || currentUser === 'sairam') && (
                                    <button
                                      onClick={() => handleMarkHelpful(comment.id)}
                                      className={`text-[8px] px-2 py-0.5 font-bold uppercase rounded border cursor-pointer transition-colors ${
                                        comment.is_helpful
                                          ? 'bg-orange-500/10 border-orange-500/35 text-orange-550'
                                          : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                      }`}
                                    >
                                      {comment.is_helpful ? 'Unmark Helpful' : 'Mark Helpful'}
                                    </button>
                                  )}

                                  {/* Delete Comment */}
                                  {(comment.author_email === currentUserEmail || currentUser === 'sairam') && (
                                    <button
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="p-0.5 rounded text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                      title="Delete Comment"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => setShowReplyForm(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                                    className="text-[9px] px-2 py-0.5 border border-slate-200 dark:border-slate-800 hover:border-cyber-cyan/35 text-slate-500 hover:text-cyber-cyan font-bold uppercase rounded cursor-pointer transition-all"
                                  >
                                    Reply
                                  </button>
                                </div>
                              </div>

                              {/* NESTED TIMELINE REPLIES BLOCK */}
                              <div className="space-y-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-850/30 pl-4 md:pl-6 relative">
                                {/* Visual left connection line */}
                                <div className="absolute top-0 bottom-6 left-0 w-[1px] bg-slate-200 dark:bg-slate-850" />

                                {comment.replies && comment.replies.map(reply => (
                                  <div key={reply.id} className="relative pl-4 space-y-1.5">
                                    {/* Bullet connection node */}
                                    <div className="absolute top-2.5 left-[-3.5px] w-1.5 h-1.5 rounded-full bg-slate-250 dark:bg-slate-800" />
                                    
                                    <div className="text-[11px] text-slate-655 dark:text-slate-350 font-sans font-light leading-relaxed whitespace-pre-wrap text-left">
                                      {reply.content}
                                    </div>
                                    
                                    <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[8px] font-sans font-black text-slate-500 dark:text-slate-400">
                                          @{reply.author}
                                        </span>
                                        <span className="text-[8px] font-mono text-slate-400">
                                          Lvl {reply.author_level} Scholar
                                        </span>
                                      </div>
                                      <span className="text-[8px] font-mono text-slate-400 shrink-0">
                                        {new Date(reply.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </div>
                                ))}

                                {/* Inline reply editor field */}
                                {showReplyForm[comment.id] && (
                                  <div className="relative pl-4 flex gap-2 items-end pt-2">
                                    <input 
                                      type="text"
                                      value={newReply[comment.id] || ''}
                                      onChange={(e) => setNewReply(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                      placeholder="Add an inline reply..."
                                      className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none focus:border-cyber-cyan/35"
                                    />
                                    <button
                                      onClick={() => handleCreateReply(comment.id)}
                                      className="p-2 bg-cyber-cyan hover:bg-cyan-400 text-space-900 rounded-lg cursor-pointer transition-colors"
                                      title="Publish Reply"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ROOT THREAD INPUT SUBMIT FORM */}
                  <form onSubmit={handleCreateComment} className="pt-4 border-t border-slate-200 dark:border-slate-850 space-y-3.5">
                    <h4 className="font-sans font-black text-xs uppercase tracking-wider text-slate-850 dark:text-white">
                      Contribute Explanation or Ask Detail
                    </h4>
                    
                    <div className="space-y-1">
                      <textarea
                        required
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write your logic analysis here... Full code dumps are automatically blocked."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-850 dark:text-white outline-none focus:border-cyber-purple/35 h-24 resize-none leading-relaxed font-sans"
                      />
                      <span className="text-[9px] text-slate-405 font-light italic block text-right">
                        Policy reminder: Avoid copy-pasting solutions. Logic-focused replies climb fastest.
                      </span>
                    </div>

                    <div className="flex justify-end shrink-0">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="py-2.5 px-5 bg-gradient-to-r from-cyber-cyan to-cyber-blue hover:from-[#00d6e6] hover:to-[#0055ff] text-space-900 font-sans font-black text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-75"
                      >
                        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Post Comment</>}
                      </button>
                    </div>
                  </form>

                </div>
              )}
            </motion.div>
          ) : (
            /* THREADS LISTING SYSTEM CARDS VIEW */
            <motion.div 
              key="list-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {filteredDiscussions.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center space-y-3 text-slate-400">
                  <MessageSquare className="w-9 h-9 text-slate-300 dark:text-slate-700" />
                  <h4 className="font-sans font-bold text-xs text-slate-800 dark:text-white">No discussions found</h4>
                  <span className="text-slate-400 dark:text-slate-500 text-xs font-light">Be the first to create a conceptual thread!</span>
                </div>
              ) : (
                filteredDiscussions.map(disc => (
                  <div
                    key={disc.id}
                    onClick={() => setActiveThreadId(disc.id)}
                    className="p-4 rounded-xl bg-white dark:bg-[#0e121e]/40 border border-slate-200 dark:border-slate-850 hover:border-cyber-purple/35 dark:hover:border-cyber-cyan/25 transition-all duration-300 cursor-pointer flex gap-4 select-none relative group text-left"
                  >
                    {/* Left glow top stripe for pinned logic */}
                    {disc.is_pinned && (
                      <div className="absolute top-0 left-0 w-full h-[2.5px] bg-emerald-500" />
                    )}

                    {/* Votes Count bubble column */}
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850/80 w-12 shrink-0 self-center">
                      <Heart className={`w-3.5 h-3.5 text-cyber-cyan ${disc.has_upvoted ? 'fill-cyber-cyan' : ''}`} />
                      <span className="text-[10px] font-sans font-extrabold text-slate-700 dark:text-slate-300 mt-1">
                        {disc.upvote_count}
                      </span>
                    </div>

                    {/* Description elements */}
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[7px] font-sans font-black uppercase px-2 py-0.5 rounded ${
                          disc.category === 'doubt'
                            ? 'text-rose-500 bg-rose-500/10 border border-rose-500/20'
                            : disc.category === 'logic'
                            ? 'text-cyan-500 bg-cyan-500/10 border border-cyan-500/20'
                            : disc.category === 'approach'
                            ? 'text-purple-500 bg-purple-500/10 border border-purple-500/20'
                            : 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                        }`}>
                          {disc.category}
                        </span>
                        {disc.is_pinned && (
                          <span className="flex items-center gap-0.5 text-[7px] font-sans font-black uppercase px-2 py-0.5 rounded text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
                            <Pin className="w-2.5 h-2.5" /> Pinned
                          </span>
                        )}
                        {disc.is_resolved && (
                          <span className="flex items-center gap-0.5 text-[7px] font-sans font-black uppercase px-2 py-0.5 rounded text-sky-500 bg-sky-500/10 border border-sky-500/20">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Resolved
                          </span>
                        )}
                        {disc.helpful_comment_id && (
                          <span className="flex items-center gap-0.5 text-[7px] font-sans font-black uppercase px-2 py-0.5 rounded text-orange-550 bg-orange-500/10 border border-orange-500/20">
                            <Award className="w-2.5 h-2.5 text-orange-500" /> Helpful Answer
                          </span>
                        )}
                      </div>

                      <h4 className="font-sans font-extrabold text-sm text-slate-850 dark:text-white truncate group-hover:text-cyber-cyan dark:group-hover:text-cyber-cyan transition-colors leading-snug">
                        {disc.title}
                      </h4>

                      <p className="text-slate-455 dark:text-slate-400 text-xs font-light line-clamp-2 leading-relaxed">
                        {disc.content}
                      </p>

                      {/* Card meta */}
                      <div className="flex items-center justify-between gap-4 pt-2 flex-wrap">
                        <span className="text-[9px] font-light text-slate-400">
                          by <strong className="font-bold text-slate-600 dark:text-slate-300">@{disc.author}</strong> (Lvl {disc.author_level})
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          {new Date(disc.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-350 dark:text-slate-700 group-hover:text-cyber-cyan transition-colors shrink-0 self-center" />
                  </div>
                ))
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* CREATE NEW DISCUSSION MODAL DIALOG */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 rounded-xl p-6 relative overflow-hidden shadow-2xl space-y-4 text-left"
            >
              <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-cyber-purple to-cyber-cyan" />
              
              <div className="flex items-center justify-between">
                <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-850 dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4.5 h-4.5 text-cyber-purple" />
                  Ask Doubt or Share Logic
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-2 py-1 text-slate-400 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded text-[10px] font-sans font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateDiscussion} className="space-y-4">
                {/* Category select */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Thread Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewPost(prev => ({ ...prev, category: cat.id }))}
                        className={`py-2 border text-[10px] font-sans font-bold uppercase rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          newPost.category === cat.id
                            ? 'bg-slate-100 border-slate-350 dark:bg-slate-900 dark:border-slate-750 text-cyber-cyan font-black'
                            : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white'
                        }`}
                      >
                        {cat.icon}
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Brief Summary Title</label>
                  <input
                    type="text"
                    required
                    value={newPost.title}
                    onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-cyber-cyan/35"
                    placeholder="e.g. Approach for optimized binary search logic"
                  />
                </div>

                {/* Content description */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Theoretical logic explanation / doubt</label>
                  <textarea
                    required
                    value={newPost.content}
                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-3 text-xs text-slate-800 dark:text-white h-32 outline-none focus:border-cyber-cyan/35 resize-none leading-relaxed"
                    placeholder="Explain your approach conceptually. Direct full code solutions are automatically blocked to encourage conceptual learning."
                  />
                </div>

                {/* Policy Alerts */}
                {formWarning && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] text-rose-500 leading-normal flex items-start gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formWarning}</span>
                  </div>
                )}

                {/* Policy Prompts when empty */}
                {!formWarning && (
                  <div className="p-3.5 bg-cyber-purple/5 border border-cyber-purple/20 rounded-xl text-[10px] text-slate-550 dark:text-slate-400 leading-relaxed flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-cyber-purple shrink-0" />
                    <div>
                      <strong>Peer-Learning Policy:</strong> Focus on explaining logic flow and pseudocode instead of dumping complete files. If code blocks are pasted, they must occupy less than 40% of the character count.
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-850/80 flex justify-end shrink-0">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-2.5 px-5 bg-gradient-to-r from-cyber-cyan to-cyber-blue hover:from-[#00d6e6] hover:to-[#0055ff] text-space-900 font-sans font-black text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-75"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Publish Thread</>}
                  </button>
                </div>

              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DiscussionPanel;
