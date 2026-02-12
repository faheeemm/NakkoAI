'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, MessageSquare } from 'lucide-react';
import { Toaster, toast } from 'sonner';

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

export default function Page() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load chats with caching
  useEffect(() => {
    const loadChats = async () => {
      try {
        // Check if we have cached chats in sessionStorage
        const cached = sessionStorage.getItem('chats_cache');
        const cacheTime = sessionStorage.getItem('chats_cache_time');
        const now = Date.now();

        // Use cache if it's less than 5 minutes old
        if (cached && cacheTime && now - parseInt(cacheTime) < 5 * 60 * 1000) {
          const chatsData = JSON.parse(cached);
          setChats(chatsData);
          if (chatsData.length > 0) {
            router.push(`/chat/${chatsData[0].id}`);
          }
          return;
        }

        const response = await fetch('/api/chats', {
          headers: {
            'Cache-Control': 'max-age=300', // 5 minutes
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to load chats');
        }
        
        const data = await response.json();
        setChats(data);
        
        // Cache the response
        sessionStorage.setItem('chats_cache', JSON.stringify(data));
        sessionStorage.setItem('chats_cache_time', now.toString());
        
        if (data.length > 0) {
          router.push(`/chat/${data[0].id}`);
        }
      } catch (error) {
        console.error('Failed to load chats:', error);
        toast.error('Failed to load chat history');
      }
    };
    loadChats();
  }, []);

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

  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete chat' })) as any;
        throw new Error(error.error || 'Failed to delete chat');
      }
      
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      
      // Invalidate cache
      sessionStorage.removeItem('chats_cache');
      sessionStorage.removeItem('chats_cache_time');
      sessionStorage.removeItem(`messages_${chatId}`);
      sessionStorage.removeItem(`messages_${chatId}_time`);
      
      toast.success('Chat deleted 🗑️');
    } catch (error) {
      console.error('Failed to delete chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete chat';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <Button
            onClick={createNewChat}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm py-2 flex items-center justify-center gap-2 rounded-lg shadow-lg transition-all hover:shadow-blue-500/50"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="group p-3 rounded-lg cursor-pointer transition-all text-slate-400 hover:bg-slate-800/50"
                onClick={() => router.push(`/chat/${chat.id}`)}
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
                      deleteChat(chat.id);
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

      {/* Main Welcome Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-sm px-6 py-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-all hover:shadow-lg"
          >
            <MessageSquare className="w-5 h-5 text-blue-400" />
          </button>
        </div>

        {/* Welcome Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-slate-100 mb-4 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Start a conversation</h2>
            <p className="text-slate-400 mb-8 max-w-md text-lg">
              {chats.length === 0 
                ? "Click 'New Chat' to start talking with Faheem's Hyderabadi chatbot"
                : 'Select a chat from the sidebar or create a new one'}
            </p>
            {chats.length === 0 && (
              <Button
                onClick={createNewChat}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition-all hover:shadow-blue-500/30"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Chat
              </Button>
            )}
          </div>
        </div>
      </div>

      <Toaster position="top-right" theme="dark" />
    </div>
  );

}