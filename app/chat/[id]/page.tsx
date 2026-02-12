'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Toaster, toast } from 'sonner';

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

interface Message {
  id: string;
  chat_id: string;
  type: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Sidebar component to prevent re-renders
function Sidebar({ onCreateChat, onDeleteChat, chats, currentChatId, onSelectChat, sidebarOpen, setSidebarOpen, onToggleSidebar }: {
  onCreateChat: () => void;
  onDeleteChat: (id: string) => void;
  chats: Chat[];
  currentChatId: string;
  onSelectChat: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onToggleSidebar: () => void;
}) {
  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col overflow-hidden flex-shrink-0`}>
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <Button
          onClick={onCreateChat}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm py-2 flex items-center justify-center gap-2 rounded-lg shadow-lg transition-all hover:shadow-blue-500/50"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group p-3 rounded-lg cursor-pointer transition-all ${
                currentChatId === chat.id
                  ? 'bg-blue-600/20 text-white border-l-2 border-blue-600 pl-2'
                  : 'text-slate-400 hover:bg-slate-800/50'
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{chat.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(chat.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id as string;

  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chats only once with caching
  useEffect(() => {
    const loadChats = async () => {
      try {
        // Check if we have cached chats in sessionStorage
        const cached = sessionStorage.getItem('chats_cache');
        const cacheTime = sessionStorage.getItem('chats_cache_time');
        const now = Date.now();

        // Use cache if it's less than 5 minutes old
        if (cached && cacheTime && now - parseInt(cacheTime) < 5 * 60 * 1000) {
          setChats(JSON.parse(cached));
          return;
        }

        const response = await fetch('/api/chats', {
          headers: {
            'Cache-Control': 'max-age=300', // 5 minutes
          },
        });
        if (!response.ok) throw new Error('Failed to load chats');
        const data = await response.json();
        setChats(data);
        
        // Cache the response
        sessionStorage.setItem('chats_cache', JSON.stringify(data));
        sessionStorage.setItem('chats_cache_time', now.toString());
      } catch (error) {
        console.error('Failed to load chats:', error);
        toast.error('Failed to load chat history');
      }
    };
    loadChats();
  }, []);

  // Load current chat and messages with caching
  useEffect(() => {
    if (!chatId) return;

    const loadChat = async () => {
      setInitialLoading(true);
      try {
        // Check cache first
        const cached = sessionStorage.getItem(`messages_${chatId}`);
        const cacheTime = sessionStorage.getItem(`messages_${chatId}_time`);
        const now = Date.now();

        if (cached && cacheTime && now - parseInt(cacheTime) < 2 * 60 * 1000) {
          const cachedMessages = JSON.parse(cached);
          setMessages(cachedMessages);
          setInitialLoading(false);
          return;
        }

        const response = await fetch(`/api/chats/${chatId}`, {
          headers: {
            'Cache-Control': 'max-age=120', // 2 minutes
          },
        });
        if (!response.ok) throw new Error('Failed to load messages');
        const data = await response.json();
        setMessages(data);
        
        // Cache the messages
        sessionStorage.setItem(`messages_${chatId}`, JSON.stringify(data));
        sessionStorage.setItem(`messages_${chatId}_time`, now.toString());
        
        // Find current chat from chats list
        const chat = chats.find((c) => c.id === chatId);
        if (chat) {
          setCurrentChat(chat);
        }
      } catch (error) {
        console.error('Failed to load chat:', error);
        toast.error('Failed to load messages');
      } finally {
        setInitialLoading(false);
      }
    };

    loadChat();
  }, [chatId, chats]);

  const createNewChat = async () => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create chat' })) as any;
        throw new Error(error.error || 'Failed to create chat');
      }
      
      const newChat = await response.json();
      setChats((prev) => [newChat, ...prev]);
      
      // Invalidate cache
      sessionStorage.removeItem('chats_cache');
      sessionStorage.removeItem('chats_cache_time');
      
      router.push(`/chat/${newChat.id}`);
      toast.success('New chat created! ✨');
    } catch (error) {
      console.error('Failed to create chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create chat';
      toast.error(errorMessage);
    }
  };

  const deleteChat = async (chatIdToDelete: string) => {
    try {
      const response = await fetch(`/api/chats/${chatIdToDelete}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete chat' })) as any;
        throw new Error(error.error || 'Failed to delete chat');
      }
      
      setChats((prev) => prev.filter((c) => c.id !== chatIdToDelete));
      
      // Invalidate cache
      sessionStorage.removeItem('chats_cache');
      sessionStorage.removeItem('chats_cache_time');
      sessionStorage.removeItem(`messages_${chatIdToDelete}`);
      sessionStorage.removeItem(`messages_${chatIdToDelete}_time`);
      
      if (chatId === chatIdToDelete) {
        const remainingChats = chats.filter((c) => c.id !== chatIdToDelete);
        if (remainingChats.length > 0) {
          router.push(`/chat/${remainingChats[0].id}`);
        } else {
          router.push('/');
        }
      }
      
      toast.success('Chat deleted 🗑️');
    } catch (error) {
      console.error('Failed to delete chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete chat';
      toast.error(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatId) return;

    const userMessage = input;
    setInput('');
    setLoading(true);
    const tempMessageId = `temp-${Date.now()}`;

    try {
      // Create temporary user message to show immediately
      const tempUserMessage: Message = {
        id: tempMessageId,
        chat_id: chatId,
        type: 'user',
        content: userMessage,
        created_at: new Date().toISOString(),
      };
      
      // Show user message immediately
      setMessages((prev) => [...prev, tempUserMessage]);

      // Get AI response
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage, chatId }),
      });

      // Parse error response for better error messages
      if (!analyzeResponse.ok) {
        let errorMessage = 'An error occurred. Please try again.';
        let errorType = 'error';

        try {
          const errorData = await analyzeResponse.json() as any;
          const error = errorData.error || errorData.message;

          // Determine error type and message
          if (analyzeResponse.status === 429) {
            errorMessage = '⏳ ' + (error || 'Too many requests. Please wait a moment and try again.');
            errorType = 'info';
          } else if (analyzeResponse.status === 401 || analyzeResponse.status === 403) {
            errorMessage = '🔐 ' + (error || 'Authentication failed. Please contact support.');
            errorType = 'error';
          } else if (analyzeResponse.status === 504) {
            errorMessage = '⏱️ ' + (error || 'AI service is taking too long. Please try again.');
            errorType = 'warning';
          } else if (analyzeResponse.status === 502 || analyzeResponse.status === 503) {
            errorMessage = '🔧 ' + (error || 'AI service is temporarily unavailable. Please try again in a moment.');
            errorType = 'warning';
          } else if (analyzeResponse.status === 500) {
            errorMessage = '❌ ' + (error || 'Server error. Please try again later.');
            errorType = 'error';
          } else if (analyzeResponse.status === 400) {
            errorMessage = '⚠️ ' + (error || 'Invalid request. Please check your input.');
            errorType = 'warning';
          } else {
            errorMessage = '❌ ' + (error || 'Failed to get response from AI');
          }
        } catch {
          // If response is not JSON, use default error message
          if (analyzeResponse.status === 429) {
            errorMessage = '⏳ Too many requests. Please wait and try again.';
            errorType = 'info';
          } else if (analyzeResponse.status === 503) {
            errorMessage = '🔧 AI service is temporarily down. Trying again soon...';
            errorType = 'warning';
          }
        }

        // Show error toast
        if (errorType === 'info') {
          toast.info(errorMessage);
        } else if (errorType === 'warning') {
          toast.warning(errorMessage);
        } else {
          toast.error(errorMessage);
        }

        throw new Error(errorMessage);
      }

      // Clear cache before refreshing to ensure fresh data
      sessionStorage.removeItem(`messages_${chatId}`);
      sessionStorage.removeItem(`messages_${chatId}_time`);

      // Refresh messages to show both user and assistant messages
      const messagesResponse = await fetch(`/api/chats/${chatId}`);
      if (!messagesResponse.ok) {
        toast.error('Failed to load updated messages');
        throw new Error('Failed to load messages');
      }
      
      const updatedMessages = await messagesResponse.json();
      setMessages(updatedMessages);

      // Cache the new messages
      const now = Date.now();
      sessionStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));
      sessionStorage.setItem(`messages_${chatId}_time`, now.toString());

      // Update chat title if it's still "New Chat"
      if (currentChat?.title === 'New Chat') {
        const newTitle = userMessage.substring(0, 50);
        setChats((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c))
        );
        setCurrentChat((prev) => prev ? { ...prev, title: newTitle } : null);
        
        // Clear chats cache
        sessionStorage.removeItem('chats_cache');
        sessionStorage.removeItem('chats_cache_time');
      }

      toast.success('Response received! 🎉');
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      
      // Only show toast if not already shown
      if (!errorMessage.includes('⏳') && !errorMessage.includes('🔧') && !errorMessage.includes('⏱️') && !errorMessage.includes('❌') && !errorMessage.includes('⚠️')) {
        toast.error(errorMessage);
      }
      
      // Remove temporary message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMessageId));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex">
      <Sidebar 
        onCreateChat={createNewChat}
        onDeleteChat={deleteChat}
        chats={chats}
        currentChatId={chatId}
        onSelectChat={(id) => router.push(`/chat/${id}`)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-all hover:shadow-lg"
            >
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </button>
            <h1 className="text-xl font-semibold text-slate-100">{currentChat?.title || 'ChatBot'}</h1>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full px-6 py-8">
            {initialLoading ? (
              <div className="space-y-6 mt-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-4">
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-blue-600/20 to-blue-400/10 rounded-xl p-4 w-48 h-16 animate-pulse" />
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-gradient-to-r from-slate-700/30 to-slate-600/20 rounded-xl p-4 w-64 h-20 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-slate-300 text-lg font-medium">No messages yet</p>
                  <p className="text-slate-500 text-sm mt-2">Start a conversation with Faheem's chatbot</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {message.type === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-2xl bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 shadow-lg hover:shadow-blue-500/20 transition-shadow">
                        <p className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="max-w-2xl bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-4 border border-slate-600/50 shadow-lg">
                        <div className="text-slate-200 text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({node, ...props}) => <p {...props} className="mb-3 last:mb-0" />,
                              ul: ({node, ...props}) => <ul {...props} className="list-disc pl-6 mb-3 last:mb-0" />,
                              ol: ({node, ...props}) => <ol {...props} className="list-decimal pl-6 mb-3 last:mb-0" />,
                              li: ({node, ...props}) => <li {...props} className="mb-1" />,
                              strong: ({node, ...props}) => <strong {...props} className="font-semibold text-slate-100" />,
                              em: ({node, ...props}) => <em {...props} className="italic text-slate-300" />,
                              code: ({node, inline, ...props}: any) => 
                                inline ? <code {...props} className="bg-slate-900/50 px-2 py-1 rounded text-xs font-mono text-blue-300" /> : <code {...props} />,
                              pre: ({node, ...props}) => <pre {...props} className="bg-slate-900/50 p-3 rounded mb-3 overflow-x-auto border border-slate-600/50" />,
                              blockquote: ({node, ...props}) => <blockquote {...props} className="border-l-4 border-blue-500 pl-4 italic text-slate-400 mb-3" />,
                              a: ({node, ...props}) => <a {...props} className="text-blue-400 hover:text-blue-300 underline transition-colors" />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-4 border border-slate-600/50 shadow-lg">
                  <div className="flex gap-3 items-center">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Faheem's chatbot is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        {chatId && (
          <div className="border-t border-slate-800 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-sm px-6 py-4">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                  placeholder="Ask Faheem's chatbot anything..."
                  className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none max-h-32 font-medium transition-all hover:border-slate-600/50"
                  disabled={loading}
                  rows={1}
                />
                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/30 h-fit"
                >
                  {loading ? 'Thinking...' : 'Send'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      <Toaster position="top-right" theme="dark" />
    </div>
  );
}
