import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { usePostHog } from 'posthog-js/react';
import { Bot, Loader2, Send, X } from 'lucide-react';
import PosterCard from './ui/PosterCard';
import { API_URL } from '../config';
import { authFetch } from '../utils/fetch';
import type { Pick } from '../types';

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    picks?: Pick[];  // shows the assistant suggested, as clickable cards
};

const SUGGESTIONS = [
    'Give me something short and wholesome',
    'Something dark and psychological',
    'A movie for tonight',
];

/**
 * The AI chat as a panel that slides in from the right. It stays mounted
 * while closed, so the conversation survives closing and reopening.
 */
const ChatPanel = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const posthog = usePostHog();

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => inputRef.current?.focus(), 300);
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
    }, [open, onClose]);

    const send = async (text: string) => {
        const userMessage = text.trim();
        if (!userMessage || loading) return;

        const history: ChatMessage[] = [...messages, { role: 'user', content: userMessage }];
        setInput('');
        setMessages(history);
        setLoading(true);

        const reply = (content: string, picks: Pick[] = []) =>
            setMessages((prev) => [...prev, { role: 'assistant', content, picks }]);

        try {
            // The server builds the user's taste and the candidate list itself.
            // We only send the conversation. Earlier suggestions are appended as
            // text so the AI knows what it already recommended.
            const payload = history.map((m) => ({
                role: m.role,
                content: m.picks?.length ? `${m.content}\n\n(Suggested: ${m.picks.map((p) => p.title).join(', ')})` : m.content,
            }));

            const res = await authFetch(`${API_URL}/api/ai-chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: payload }),
            });

            if (res.ok) {
                const data: { message: string; picks: Pick[] } = await res.json();
                reply(data.message, data.picks);
                posthog?.capture('ai_chat_message_sent', {
                    message_length: userMessage.length,
                    turn: history.length,
                    picks_count: data.picks.length,
                });
            } else if (res.status === 429) {
                reply("You've reached the chat limit for now (20 messages an hour). Try again later.");
            } else {
                reply('Sorry, I had trouble processing that. Please try again!');
            }
        } catch {
            reply('Oops! Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Dimmed backdrop; clicking it closes the panel */}
            <motion.div
                initial={false}
                animate={{ opacity: open ? 1 : 0 }}
                className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm ${open ? '' : 'pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <motion.aside
                initial={false}
                animate={{ x: open ? 0 : '105%' }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                aria-hidden={!open}
                aria-label="AI assistant"
                className={`fixed inset-y-0 right-0 z-[70] flex w-full max-w-lg flex-col border-l border-white/10 bg-ink-soft/95 shadow-2xl shadow-black backdrop-blur-xl ${open ? '' : 'invisible'}`}
            >
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="icon h-10 w-10"><Bot className="h-5 w-5" /></div>
                        <div>
                            <p className="font-semibold">AI assistant</p>
                            <p className="text-xs text-purple-300/70">Knows your list, only suggests shows you haven't seen</p>
                        </div>
                    </div>
                    <button onClick={onClose} aria-label="Close chat" className="rounded-full p-2 transition hover:bg-white/10">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
                    {messages.length === 0 && (
                        <div className="pt-8 text-center">
                            <p className="mb-5 text-purple-200/80">What are you in the mood for?</p>
                            <div className="flex flex-col gap-2">
                                {SUGGESTIONS.map((s, i) => (
                                    <motion.button
                                        key={s}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + i * 0.08 }}
                                        onClick={() => send(s)}
                                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm transition hover:border-pink-400/40 hover:bg-white/10"
                                    >
                                        "{s}"
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 12, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                                    msg.role === 'user'
                                        ? 'rounded-br-md bg-gradient-to-r from-pink-500 to-purple-500'
                                        : 'rounded-bl-md bg-white/[0.07]'
                                }`}>
                                    {msg.role === 'user' ? (
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    ) : (
                                        <div className="markdown-content"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                                    )}
                                </div>
                            </div>
                            {msg.picks && msg.picks.length > 0 && (
                                <div className="no-scrollbar -mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-2">
                                    {msg.picks.map((pick, j) => (
                                        <motion.div
                                            key={pick.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.15 + j * 0.06 }}
                                            className="w-28 shrink-0"
                                        >
                                            <PosterCard to={`/anime/${pick.id}`} title={pick.title} image={pick.image} score={pick.score} reason={pick.reason} />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-white/[0.07] px-4 py-3 text-sm text-purple-200/80">
                                <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={endRef} />
                </div>

                <form
                    onSubmit={(e) => { e.preventDefault(); send(input); }}
                    className="flex gap-2 border-t border-white/10 p-4"
                >
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask for anything..."
                        disabled={loading}
                        className="input"
                    />
                    <button type="submit" disabled={loading || !input.trim()} aria-label="Send" className="btn-primary px-4">
                        <Send className="h-4 w-4" />
                    </button>
                </form>
            </motion.aside>
        </>
    );
};

export default ChatPanel;
