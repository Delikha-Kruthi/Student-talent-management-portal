import React, { useState, useEffect } from 'react';
import { Message, User } from '../../types/index.js';
import { api } from '../../services/api.js';
import { MessageSquare, Send, UserCheck, Clock, Loader2 } from 'lucide-react';

interface MessagesPageProps {
  user: User;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [user.id]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await api.getMessages(user.id);
      if (res.messages) setMessages(res.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setSending(true);
    try {
      const res = await api.sendMessage({
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        receiverId: 'user-client-demo', // Default active correspondent
        receiverName: 'Industrial Partner / Coordinator',
        content: newContent.trim()
      });

      if (res.success) {
        setNewContent('');
        loadMessages();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#00D4F5]" />
            Project Collaboration & Direct Communications
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Section 16: Project-related messaging between students, faculty mentors, and industrial clients.
          </p>
        </div>
      </div>

      {/* Message Thread */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="space-y-3 min-h-[300px] max-h-[500px] overflow-y-auto pr-2">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 text-[#00D4F5] animate-spin mb-2" />
              <p className="text-xs">Loading conversations...</p>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-12">No messages exchanged yet.</p>
          ) : (
            messages.map((m) => {
              const isMine = m.senderId === user.id;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1 px-1">
                    <span className="font-semibold text-slate-300">{m.senderName}</span>
                    <span>• {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed ${
                      isMine
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-xs'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {m.projectTitle && (
                      <span className="text-[10px] font-bold block mb-1 opacity-80 uppercase tracking-wider">
                        Re: {m.projectTitle}
                      </span>
                    )}
                    <p>{m.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Send Box */}
        <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            required
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Type your message regarding capstone milestones or deliverables..."
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4F5]"
          />
          <button
            type="submit"
            disabled={sending}
            className="px-5 py-2.5 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
