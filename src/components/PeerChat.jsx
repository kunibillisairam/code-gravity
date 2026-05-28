import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hash, MessageSquare, Plus, Send, AlertCircle, Code, HelpCircle, 
  Users, ArrowLeft, Terminal, Info, ShieldAlert, Sparkles, Smile, Check, X
} from 'lucide-react';
import { chatService } from '../services/chatService';

const PeerChat = ({ onBack }) => {
  const myUsername = localStorage.getItem('codegravity_user') || 'anonymous';
  const token = localStorage.getItem('codegravity_token');

  // --- STATE ---
  const [rooms, setRooms] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState({ type: 'room', id: null, name: 'general-chat' }); // { type: 'room'|'dm', id: string, name: string }
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [users, setUsers] = useState([]);
  const [typingStatus, setTypingStatus] = useState({}); // { username: timestamp }
  const [toasts, setToasts] = useState([]); // List of live notifications
  
  // Modals
  const [showDMModal, setShowDMModal] = useState(false);
  const [showShareCodeModal, setShowShareCodeModal] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);

  // New Code Snippet states
  const [codeSnippet, setCodeSnippet] = useState({ code: '', language: 'python', explanation: '' });
  const [snippetError, setSnippetError] = useState('');

  // Hint request states
  const [hintRequest, setHintRequest] = useState({ problemTitle: 'Two Sum', approach: '', stuckOn: '' });
  const [hintError, setHintError] = useState('');

  // Refs for auto-scroll and typing timeout
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // --- FETCH INITIAL DATA ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const fetchedRooms = await chatService.getRooms();
        setRooms(fetchedRooms);
        
        // Default active tab to general-chat room if available
        const general = fetchedRooms.find(r => r.slug === 'general-chat');
        if (general) {
          setActiveTab({ type: 'room', id: general.id, name: general.name });
        } else if (fetchedRooms.length > 0) {
          setActiveTab({ type: 'room', id: fetchedRooms[0].id, name: fetchedRooms[0].name });
        }

        const fetchedConversations = await chatService.getConversations();
        setConversations(fetchedConversations);

        const fetchedUsers = await chatService.getUsers();
        setUsers(fetchedUsers);
      } catch (err) {
        console.error('Failed to load chat metadata:', err);
      }
    };

    fetchInitialData();
  }, []);

  // --- CONNECT WEBSOCKET ---
  useEffect(() => {
    if (!token) return;

    // Connect to WebSocket gateway
    chatService.connect(
      token,
      // Event Handler
      (event) => {
        if (event.type === 'message') {
          // Check if message belongs to active room or DM conversation
          const isCurrentRoom = activeTab.type === 'room' && event.room_id === activeTab.id;
          const isCurrentDM = activeTab.type === 'dm' && event.conversation_id === activeTab.id;

          if (isCurrentRoom || isCurrentDM) {
            setMessages((prev) => [...prev, event]);
            // If viewing a DM, mark it as read immediately
            if (isCurrentDM) {
              chatService.markAsRead(activeTab.id).catch(err => console.error(err));
            }
          } else {
            // Trigger floating toast notification if message is from a different conversation
            if (event.conversation_id && event.sender_username !== myUsername) {
              // Increment unread count locally
              setConversations((prev) => 
                prev.map((c) => {
                  if (c.id === event.conversation_id) {
                    const counts = { ...c.unread_counts };
                    counts[myUsername] = (counts[myUsername] || 0) + 1;
                    return { ...c, last_message_text: event.content, unread_counts: counts, last_message_at: new Date().toISOString() };
                  }
                  return c;
                }).sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
              );

              // Add toast popup
              const toastId = Date.now();
              setToasts((prev) => [...prev, {
                id: toastId,
                sender: event.sender_username,
                text: event.content || 'Shared a logic snippet.',
                convId: event.conversation_id
              }]);

              // Auto-remove toast in 4 seconds
              setTimeout(() => {
                setToasts((prev) => prev.filter(t => t.id !== toastId));
              }, 4000);
            }
          }
        } else if (event.type === 'typing') {
          // Handle typing indicator
          const isCurrentRoom = activeTab.type === 'room' && event.room_id === activeTab.id;
          const isCurrentDM = activeTab.type === 'dm' && event.conversation_id === activeTab.id;

          if ((isCurrentRoom || isCurrentDM) && event.sender !== myUsername) {
            setTypingStatus((prev) => {
              const updated = { ...prev };
              if (event.is_typing) {
                updated[event.sender] = Date.now();
              } else {
                delete updated[event.sender];
              }
              return updated;
            });
          }
        } else if (event.type === 'status') {
          // Handle online/offline statuses in real-time
          setConversations((prev) => 
            prev.map((c) => {
              const hasUser = c.participants.includes(event.username);
              if (hasUser) {
                return { ...c, other_participant_status: event.status };
              }
              return c;
            })
          );
          setUsers((prev) => 
            prev.map((u) => {
              if (u.username === event.username) {
                return { ...u, online_status: event.status };
              }
              return u;
            })
          );
        }
      },
      // Disconnect callback
      () => {
        console.warn('Socket closed. Connection manager is retrying...');
      }
    );

    return () => {
      chatService.disconnect();
    };
  }, [activeTab, token]);

  // --- FETCH MESSAGES ON TAB CHANGE ---
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeTab.id) return;
      setMessages([]);
      setTypingStatus({});
      try {
        if (activeTab.type === 'room') {
          const history = await chatService.getRoomMessages(activeTab.id);
          setMessages(history);
        } else {
          const history = await chatService.getConversationMessages(activeTab.id);
          setMessages(history);
          
          // Clear notification counts for this conversation locally
          setConversations((prev) => 
            prev.map((c) => {
              if (c.id === activeTab.id) {
                const counts = { ...c.unread_counts };
                counts[myUsername] = 0;
                return { ...c, unread_counts: counts };
              }
              return c;
            })
          );
        }
      } catch (err) {
        console.error('Failed to load message history:', err);
      }
    };

    fetchMessages();
  }, [activeTab]);

  // --- AUTO SCROLL TO BOTTOM ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingStatus]);

  // --- CLEAN UP STALE TYPING STATUSES ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingStatus((prev) => {
        const updated = { ...prev };
        let changed = false;
        for (const [user, timestamp] of Object.entries(updated)) {
          if (now - timestamp > 4000) {
            delete updated[user];
            changed = true;
          }
        }
        return changed ? updated : prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // --- HANDLE SEND TEXT MESSAGE ---
  const handleSendText = () => {
    if (!inputText.trim()) return;

    const payload = {
      content: inputText,
      msg_type: 'text'
    };

    if (activeTab.type === 'room') {
      payload.room_id = activeTab.id;
    } else {
      payload.conversation_id = activeTab.id;
    }

    const success = chatService.sendMessage(payload);
    if (success) {
      setInputText('');
      
      // Stop typing immediately
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      chatService.sendTyping({
        [activeTab.type === 'room' ? 'room_id' : 'conversation_id']: activeTab.id,
        is_typing: false
      });
    }
  };

  // --- HANDLE TYPING TRIGGERS ---
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    
    // Broadcast typing notification
    chatService.sendTyping({
      [activeTab.type === 'room' ? 'room_id' : 'conversation_id']: activeTab.id,
      is_typing: true
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to clear typing state after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      chatService.sendTyping({
        [activeTab.type === 'room' ? 'room_id' : 'conversation_id']: activeTab.id,
        is_typing: false
      });
    }, 2000);
  };

  // --- SHARE CODE SUBMIT ---
  const handleShareCode = () => {
    const { code, language, explanation } = codeSnippet;
    
    if (!code.trim()) {
      setSnippetError('Please write or paste your code snippet.');
      return;
    }
    if (explanation.trim().length < 30) {
      setSnippetError(`Please provide a detailed logic explanation of at least 30 characters (Current: ${explanation.trim().length}).`);
      return;
    }

    setSnippetError('');

    const payload = {
      content: '', // content not needed since snippet is included
      msg_type: 'algorithm_discuss',
      code_snippet: {
        code,
        language,
        explanation
      }
    };

    if (activeTab.type === 'room') {
      payload.room_id = activeTab.id;
    } else {
      payload.conversation_id = activeTab.id;
    }

    const success = chatService.sendMessage(payload);
    if (success) {
      setCodeSnippet({ code: '', language: 'python', explanation: '' });
      setShowShareCodeModal(false);
    }
  };

  // --- ASK FOR HINT SUBMIT ---
  const handleAskForHint = () => {
    const { problemTitle, approach, stuckOn } = hintRequest;

    if (!approach.trim() || !stuckOn.trim()) {
      setHintError('All description fields are mandatory to help peers understand your logic.');
      return;
    }
    if (approach.trim().length < 30) {
      setHintError(`Please explain your approach in greater depth (min 30 characters. Current: ${approach.trim().length}).`);
      return;
    }

    setHintError('');

    const formattedContent = `💡 **[Hint Request: ${problemTitle}]**\n\n**My Approach / Logic:**\n${approach}\n\n**Where I am Stuck / Confused:**\n${stuckOn}`;
    
    const payload = {
      content: formattedContent,
      msg_type: 'hint_request'
    };

    if (activeTab.type === 'room') {
      payload.room_id = activeTab.id;
    } else {
      payload.conversation_id = activeTab.id;
    }

    const success = chatService.sendMessage(payload);
    if (success) {
      setHintRequest({ problemTitle: 'Two Sum', approach: '', stuckOn: '' });
      setShowHintModal(false);
    }
  };

  // --- START NEW DM ---
  const handleStartDM = async (recipient) => {
    try {
      const conv = await chatService.createConversation(recipient);
      
      // Update conversations state if not already in list
      setConversations((prev) => {
        const exists = prev.find(c => c.id === conv.id);
        if (exists) return prev;
        return [conv, ...prev];
      });

      setActiveTab({ type: 'dm', id: conv.id, name: recipient });
      setShowDMModal(false);
    } catch (err) {
      console.error('Failed to create Direct Message session:', err);
    }
  };

  // --- HELPER: RENDER TYPING TEXT ---
  const getTypingText = () => {
    const typists = Object.keys(typingStatus);
    if (typists.length === 0) return '';
    if (typists.length === 1) return `${typists[0]} is typing...`;
    if (typists.length === 2) return `${typists[0]} and ${typists[1]} are typing...`;
    return 'Several people are typing...';
  };

  // --- HELPER: FORMAT TIMESTAMP ---
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex w-full h-[calc(100vh-80px)] mt-20 bg-slate-900 text-slate-100 overflow-hidden font-sans border-t border-slate-800">
      
      {/* --- FLOATING TOAST BAR --- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              onClick={() => {
                setActiveTab({ type: 'dm', id: toast.convId, name: toast.sender });
                setToasts(prev => prev.filter(t => t.id !== toast.id));
              }}
              className="bg-[#0f1224] border-l-4 border-cyber-magenta p-4 rounded-lg shadow-2xl cursor-pointer w-80 solid-card solid-card-hover text-left flex items-start gap-3"
            >
              <MessageSquare className="w-5 h-5 text-cyber-magenta shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-cyber-magenta tracking-wider">New Message</span>
                <p className="text-xs font-bold text-slate-200">@{toast.sender}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{toast.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- COLUMN 1: LEFT SIDEBAR --- */}
      <div className="w-64 bg-[#0a0d17] border-r border-slate-800 flex flex-col justify-between shrink-0">
        
        {/* Banner */}
        <div className="p-4 border-b border-slate-800/80 bg-[#070912] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyber-cyan animate-pulse" />
            <span className="font-extrabold text-sm tracking-wider uppercase text-slate-200">PEER HUB</span>
          </div>
          <button 
            onClick={onBack}
            className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white"
            title="Back to CodeGravity"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-6">
          
          {/* Chat Rooms */}
          <div>
            <div className="px-2 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Learning Rooms</span>
            </div>
            
            <div className="space-y-0.5">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setActiveTab({ type: 'room', id: room.id, name: room.name })}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                    activeTab.type === 'room' && activeTab.id === room.id
                      ? 'bg-slate-800 text-cyber-cyan border border-cyber-cyan/30'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <Hash className={`w-3.5 h-3.5 shrink-0 ${activeTab.type === 'room' && activeTab.id === room.id ? 'text-cyber-cyan' : 'text-slate-500'}`} />
                  <span className="truncate">{room.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Direct Messages */}
          <div>
            <div className="px-2 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Direct Messages</span>
              <button 
                onClick={() => setShowDMModal(true)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyber-cyan transition-colors"
                title="Start Direct Message"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {conversations.map((conv) => {
                const other = conv.participants.find(p => p !== myUsername);
                const isSelected = activeTab.type === 'dm' && activeTab.id === conv.id;
                const unread = conv.unread_counts[myUsername] || 0;
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveTab({ type: 'dm', id: conv.id, name: other })}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                      isSelected
                        ? 'bg-slate-800 text-cyber-purple border border-cyber-purple/30'
                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="relative shrink-0">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyber-cyan to-cyber-purple flex items-center justify-center text-[10px] text-space-900 font-black">
                          {other?.charAt(0).toUpperCase()}
                        </div>
                        {/* Presence Dot */}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0a0d17] ${
                          conv.other_participant_status === 'online' ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-slate-650'
                        }`} />
                      </div>
                      <span className="truncate">@{other}</span>
                    </div>

                    {/* Unread badge */}
                    {unread > 0 && (
                      <span className="bg-cyber-magenta text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full animate-bounce">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
              {conversations.length === 0 && (
                <div className="text-[10px] text-slate-600 font-bold px-2 py-4 italic">No active conversations. Click + to start!</div>
              )}
            </div>
          </div>

        </div>

        {/* User Card */}
        <div className="p-3 bg-[#070911] border-t border-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyber-cyan to-cyber-purple flex items-center justify-center text-xs font-extrabold text-slate-900">
            {myUsername.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-black text-slate-200 truncate">@{myUsername}</p>
            <span className="text-[9px] font-mono font-bold text-cyber-cyan uppercase tracking-wider">Level 1 Alchemist</span>
          </div>
        </div>

      </div>

      {/* --- COLUMN 2: CENTRAL CHAT WINDOW --- */}
      <div className="flex-1 flex flex-col bg-[#0e1220] justify-between">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#090b14]/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {activeTab.type === 'room' ? (
              <Hash className="w-5 h-5 text-cyber-cyan" />
            ) : (
              <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-br from-cyber-cyan to-cyber-purple flex items-center justify-center text-[10px] text-space-900 font-extrabold">
                {activeTab.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-left">
              <h1 className="text-sm font-extrabold text-slate-200 uppercase tracking-wide">
                {activeTab.type === 'room' ? activeTab.name : `@${activeTab.name}`}
              </h1>
              <p className="text-[10px] text-slate-500 font-bold">
                {activeTab.type === 'room' 
                  ? (rooms.find(r => r.id === activeTab.id)?.description || 'Topic room discussion.') 
                  : 'Direct encrypted collaborative session.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowHintModal(true)}
              className="px-3 py-1 bg-cyber-cyan/10 hover:bg-cyber-cyan hover:text-slate-900 border border-cyber-cyan/30 text-cyber-cyan transition-all rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Ask for Hint
            </button>
            <button 
              onClick={() => setShowShareCodeModal(true)}
              className="px-3 py-1 bg-cyber-purple/10 hover:bg-cyber-purple hover:text-white border border-cyber-purple/30 text-cyber-purple transition-all rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              Discuss Logic
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-[#0a0c16]/30">
          
          {/* Welcome Message */}
          <div className="p-5 border border-slate-800/80 rounded-xl bg-[#0f1324]/50 max-w-2xl mx-auto text-center my-6 space-y-3">
            <Sparkles className="w-7 h-7 text-cyber-purple mx-auto animate-pulse" />
            <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider">
              {activeTab.type === 'room' ? `Welcome to #${activeTab.name}!` : `Direct Session with @${activeTab.name}`}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {activeTab.type === 'room'
                ? "This is the start of an educational discussion. Ask queries, clarify algorithms, and prompt logic guidelines with peers. Let's grow together!"
                : `Collaborate directly on solving problems with @${activeTab.name}. Remember, to paste code, you must explain the underlying reasoning to support growth!`}
            </p>
          </div>

          {/* Messages Map */}
          {messages.map((msg, index) => {
            const isMe = msg.sender_username === myUsername;
            const isSystem = msg.sender_username === 'System AutoMod';
            const isBlocked = msg.moderation_status === 'blocked';
            const isHint = msg.type === 'hint_request';
            const isCodeDiscuss = msg.type === 'algorithm_discuss';

            // System warning card
            if (isSystem || isBlocked) {
              return (
                <div key={msg.id || index} className="flex justify-start my-2">
                  <div className="bg-[#1c0f1d] border-l-4 border-rose-500 p-4 rounded-r-xl max-w-3xl text-left shadow-lg flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] uppercase font-mono font-bold text-rose-400 tracking-wider">Security AutoMod Filter</span>
                      <p className="text-xs text-rose-200 mt-1 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            }

            // Normal and styled message cards
            return (
              <div key={msg.id || index} className={`flex gap-3 justify-start items-start`}>
                
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyber-cyan to-cyber-purple flex items-center justify-center text-xs font-black text-space-900 shrink-0 select-none">
                  {msg.sender_username.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0 text-left space-y-1">
                  
                  {/* Name and time */}
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xs font-black tracking-wide ${isMe ? 'text-cyber-cyan' : 'text-slate-200'}`}>
                      @{msg.sender_username}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>

                  {/* Message body */}
                  <div className="max-w-4xl text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                    
                    {/* Render Hint Card */}
                    {isHint ? (
                      <div className="p-4 border border-cyber-cyan/40 bg-[#0a1622] rounded-xl my-1 relative shadow-lg overflow-hidden space-y-2">
                        <div className="absolute top-0 right-0 px-2 py-0.5 bg-cyber-cyan text-slate-900 font-extrabold text-[8px] uppercase tracking-widest rounded-bl">
                          HINT REQUEST
                        </div>
                        <p className="text-xs font-black text-cyber-cyan tracking-wide flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4" />
                          Topic: {msg.content.split('\n\n')[0].replace('💡 **[Hint Request: ', '').replace(']**', '')}
                        </p>
                        <div className="text-[11px] space-y-2.5 mt-2 border-t border-slate-800/80 pt-2.5">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">My Thought Logic:</span>
                            <p className="text-slate-300 italic">{msg.content.includes('**My Approach / Logic:**') ? msg.content.split('**My Approach / Logic:**')[1].split('**Where I am Stuck / Confused:**')[0].trim() : ''}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Stuck Point:</span>
                            <p className="text-slate-200 font-bold">{msg.content.includes('**Where I am Stuck / Confused:**') ? msg.content.split('**Where I am Stuck / Confused:**')[1].trim() : ''}</p>
                          </div>
                        </div>
                      </div>
                    ) : isCodeDiscuss && msg.code_snippet ? (
                      /* Render Code Discussion Card with Mandatory Explanation Sidecard */
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 my-1.5">
                        
                        {/* Explanation Card */}
                        <div className="md:col-span-5 p-4 border border-cyber-purple/45 bg-[#140c1d] rounded-xl flex flex-col justify-between shadow-lg">
                          <div>
                            <div className="flex items-center gap-1.5 text-cyber-purple font-extrabold text-[10px] uppercase tracking-widest mb-2">
                              <Sparkles className="w-3.5 h-3.5" />
                              Algorithm & Logic
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed italic whitespace-pre-wrap">
                              "{msg.code_snippet.explanation}"
                            </p>
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between">
                            <span className="text-[9px] text-slate-500 font-mono font-bold">EXPLANATION CARD</span>
                            <Check className="w-3.5 h-3.5 text-cyber-cyan" />
                          </div>
                        </div>

                        {/* Code Block Card */}
                        <div className="md:col-span-7 border border-slate-800 rounded-xl overflow-hidden bg-[#070911]/90 shadow-2xl flex flex-col justify-between">
                          <div className="px-3.5 py-1.5 bg-[#05060b] border-b border-slate-850 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Terminal className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">{msg.code_snippet.language}</span>
                            </div>
                            <span className="text-[9px] font-mono font-bold text-cyber-purple">SECURE SNIPPET</span>
                          </div>
                          <pre className="p-3.5 overflow-x-auto text-[10px] font-mono text-emerald-400 text-left bg-[#05060b]/40">
                            <code>{msg.code_snippet.code}</code>
                          </pre>
                        </div>

                      </div>
                    ) : (
                      /* Standard Text */
                      <p>{msg.content}</p>
                    )}

                  </div>

                </div>

              </div>
            );
          })}
          
          <div ref={chatEndRef} />
        </div>

        {/* Typing indicator bubble */}
        <div className="px-6 h-5 text-left select-none bg-[#0e1220]">
          {getTypingText() && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-cyber-cyan animate-pulse">
              <span className="typing-cursor mr-1"></span>
              {getTypingText()}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#0a0c16] border-t border-slate-800">
          <div className="flex items-center gap-3 bg-[#0e1224] border border-slate-800 rounded-lg p-2.5 focus-within:border-cyber-cyan/50 focus-within:shadow-neon-cyan transition-all">
            <textarea
              rows={1}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendText();
                }
              }}
              placeholder={activeTab.type === 'room' ? `Message #${activeTab.name}...` : `Direct message @${activeTab.name}...`}
              className="flex-1 bg-transparent text-xs text-slate-200 outline-none border-none resize-none font-sans max-h-24 py-1 pr-2 leading-relaxed"
            />
            <button
              onClick={handleSendText}
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-md transition-all ${
                inputText.trim() 
                  ? 'bg-cyber-cyan text-slate-900 shadow-neon-cyan cursor-pointer' 
                  : 'bg-slate-800 text-slate-650 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* --- COLUMN 3: RIGHT PANEL (COMMUNITY DASHBOARD) --- */}
      <div className="w-64 bg-[#0a0d17] border-l border-slate-800 p-4 shrink-0 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyber-cyan" />
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Community Rules</span>
          </div>

          <div className="space-y-4 text-left">
            <div className="p-3 border border-slate-850 bg-[#0e1222]/50 rounded-lg space-y-1.5">
              <span className="text-[10px] font-black text-cyber-cyan uppercase tracking-wider block">1. Focus on Reasoning</span>
              <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">
                Avoid copying raw answers. Explain structural approaches, space complexities, and memory usage.
              </p>
            </div>

            <div className="p-3 border border-slate-850 bg-[#0e1222]/50 rounded-lg space-y-1.5">
              <span className="text-[10px] font-black text-cyber-purple uppercase tracking-wider block">2. Collaborative Hints</span>
              <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">
                Provide visual hints, dry run paths, or corner cases. Do not give complete answers directly.
              </p>
            </div>

            <div className="p-3 border border-slate-850 bg-[#0e1222]/50 rounded-lg space-y-1.5">
              <span className="text-[10px] font-black text-cyber-magenta uppercase tracking-wider block">3. Code Reasoning Checks</span>
              <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">
                CodeGravity enforces mandatory explanations for sharing snippets (min 30 characters). AI-only pastes are blocked.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-850 text-center">
          <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider">CodeGravity Lounge v2.6</span>
        </div>

      </div>

      {/* --- MODAL 1: ADD DIRECT MESSAGE --- */}
      {showDMModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0e1224] border border-slate-800 rounded-xl w-[400px] p-6 text-left shadow-2xl relative">
            <button 
              onClick={() => setShowDMModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider mb-4">Start a Peer Session</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user.username}
                  onClick={() => handleStartDM(user.username)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyber-cyan to-cyber-purple flex items-center justify-center text-xs font-black text-space-900">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0e1224] ${
                        user.online_status === 'online' ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-slate-650'
                      }`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">@{user.username}</p>
                      <p className="text-[10px] text-slate-500 font-bold">{user.display_name}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    user.online_status === 'online' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {user.online_status === 'online' ? 'Online' : 'Offline'}
                  </span>
                </button>
              ))}
              {users.length === 0 && (
                <p className="text-xs text-slate-500 font-bold italic py-4 text-center">No registered peers available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: DISCUSS LOGIC & SHARE CODE --- */}
      {showShareCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0e1224] border border-slate-800 rounded-xl w-[550px] p-6 text-left shadow-2xl relative">
            <button 
              onClick={() => setShowShareCodeModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Code className="w-5 h-5 text-cyber-purple" />
              Discuss Code Logic
            </h3>
            <p className="text-[10px] text-slate-500 font-bold mb-4">
              To keep CodeGravity an active learning environment, you must explain your logic alongside any code snippet.
            </p>

            <div className="space-y-4">
              {/* Language Selection */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Snippet Language</label>
                <select
                  value={codeSnippet.language}
                  onChange={(e) => setCodeSnippet(prev => ({ ...prev, language: e.target.value }))}
                  className="bg-[#070912] text-xs text-slate-200 outline-none border border-slate-800 rounded px-3 py-1.5 w-full focus:border-cyber-purple/50"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>
              </div>

              {/* Code input */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Code Snippet</label>
                <textarea
                  rows={5}
                  value={codeSnippet.code}
                  onChange={(e) => setCodeSnippet(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Paste your source code here..."
                  className="bg-[#070912] font-mono text-[11px] text-emerald-400 outline-none border border-slate-800 rounded p-3 w-full focus:border-cyber-purple/50 resize-none"
                />
              </div>

              {/* Explanation input */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Logic & Approach Explanation (Min 30 chars)</label>
                  <span className={`text-[9px] font-mono font-bold ${codeSnippet.explanation.length >= 30 ? 'text-cyber-cyan' : 'text-rose-400'}`}>
                    {codeSnippet.explanation.length}/30
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={codeSnippet.explanation}
                  onChange={(e) => setCodeSnippet(prev => ({ ...prev, explanation: e.target.value }))}
                  placeholder="Describe your algorithm logic, spatial parameters, and why you used this strategy..."
                  className="bg-[#070912] text-xs text-slate-200 outline-none border border-slate-800 rounded p-3 w-full focus:border-cyber-purple/50 resize-none"
                />
              </div>

              {/* Error messages */}
              {snippetError && (
                <div className="p-3 border border-rose-950/20 bg-rose-950/10 text-rose-400 text-[11px] font-bold rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{snippetError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowShareCodeModal(false)}
                  className="px-4 py-1.5 rounded hover:bg-slate-800 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShareCode}
                  className="px-4 py-1.5 bg-cyber-purple hover:bg-cyber-purple/80 hover:shadow-neon-purple text-white rounded text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  Submit Logic
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: ASK FOR HINT --- */}
      {showHintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0e1224] border border-slate-800 rounded-xl w-[550px] p-6 text-left shadow-2xl relative">
            <button 
              onClick={() => setShowHintModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-5 h-5 text-cyber-cyan" />
              Ask for Hints
            </h3>
            <p className="text-[10px] text-slate-500 font-bold mb-4">
              Ask peers for conceptual clues, corner cases, or complexity debugging rather than copy-pasting code!
            </p>

            <div className="space-y-4">
              {/* Problem Title */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Target Problem</label>
                <input
                  type="text"
                  value={hintRequest.problemTitle}
                  onChange={(e) => setHintRequest(prev => ({ ...prev, problemTitle: e.target.value }))}
                  placeholder="e.g. Two Sum, Valid Parentheses, etc."
                  className="bg-[#070912] text-xs text-slate-200 outline-none border border-slate-800 rounded px-3 py-1.5 w-full focus:border-cyber-cyan/50"
                />
              </div>

              {/* Approach description */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">My Thought Approach (Min 30 chars)</label>
                  <span className={`text-[9px] font-mono font-bold ${hintRequest.approach.length >= 30 ? 'text-cyber-cyan' : 'text-rose-400'}`}>
                    {hintRequest.approach.length}/30
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={hintRequest.approach}
                  onChange={(e) => setHintRequest(prev => ({ ...prev, approach: e.target.value }))}
                  placeholder="Describe your reasoning logic. E.g. I am using a hash map to keep track of indices, but..."
                  className="bg-[#070912] text-xs text-slate-200 outline-none border border-slate-800 rounded p-3 w-full focus:border-cyber-cyan/50 resize-none"
                />
              </div>

              {/* Where stuck */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Where I am Stuck / Confused</label>
                <textarea
                  rows={2}
                  value={hintRequest.stuckOn}
                  onChange={(e) => setHintRequest(prev => ({ ...prev, stuckOn: e.target.value }))}
                  placeholder="What is failing? Test cases? TLE? Space constraint?"
                  className="bg-[#070912] text-xs text-slate-200 outline-none border border-slate-800 rounded p-3 w-full focus:border-cyber-cyan/50 resize-none"
                />
              </div>

              {/* Error messages */}
              {hintError && (
                <div className="p-3 border border-rose-950/20 bg-rose-950/10 text-rose-400 text-[11px] font-bold rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{hintError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowHintModal(false)}
                  className="px-4 py-1.5 rounded hover:bg-slate-800 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAskForHint}
                  className="px-4 py-1.5 bg-cyber-cyan hover:bg-cyber-cyan/80 hover:shadow-neon-cyan text-slate-900 rounded text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  Broadcast Hint Request
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PeerChat;
