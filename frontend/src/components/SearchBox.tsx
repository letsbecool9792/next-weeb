import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Search, CornerDownLeft } from 'lucide-react';
import Poster from './Poster';
import { API_URL } from '../config';
import { authFetch } from '../utils/fetch';
import type { ListEntry } from '../types';
import { STATUS_LABELS } from '../types';

// The user's list, fetched once per page load, the first time the box is focused
let listRequest: Promise<ListEntry[]> | null = null;
const loadList = () => {
    listRequest ??= authFetch(`${API_URL}/api/cached-animelist/`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);
    return listRequest;
};

/**
 * Search in the header. "/" or Ctrl+K focuses it from anywhere. While typing
 * it suggests matches from the user's own list (instant, no network); Enter
 * searches all of MyAnimeList on the search page.
 */
const SearchBox = ({ autoFocus = false, onDone }: { autoFocus?: boolean; onDone?: () => void }) => {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [entries, setEntries] = useState<ListEntry[]>([]);
    const input = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
            if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
                e.preventDefault();
                input.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const matches = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return entries.filter((e) => e.title.toLowerCase().includes(q)).slice(0, 6);
    }, [query, entries]);

    const finish = () => {
        setOpen(false);
        setQuery('');
        input.current?.blur();
        onDone?.();
    };

    const searchMal = () => {
        const q = query.trim();
        if (!q) return;
        navigate(`/search?q=${encodeURIComponent(q)}`);
        finish();
    };

    return (
        <div className="relative w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-300/70" />
            <input
                ref={input}
                autoFocus={autoFocus}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => { setOpen(true); loadList().then(setEntries); }}
                onBlur={() => setOpen(false)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') searchMal();
                    if (e.key === 'Escape') finish();
                }}
                placeholder="Search anime..."
                aria-label="Search anime"
                className="input py-2 pl-10 pr-12 text-sm"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/15 px-1.5 text-[10px] text-purple-300/70 sm:block">
                /
            </kbd>

            <AnimatePresence>
                {open && query.trim() && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        // mousedown would blur the input (closing this) before the click lands
                        onMouseDown={(e) => e.preventDefault()}
                        className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-ink-soft/95 shadow-2xl shadow-black/60 backdrop-blur-xl"
                    >
                        {matches.length > 0 && (
                            <p className="px-4 pt-3 text-[10px] font-semibold uppercase tracking-widest text-purple-300/60">On your list</p>
                        )}
                        {matches.map((m) => (
                            <Link
                                key={m.mal_id}
                                to={`/anime/${m.mal_id}`}
                                onClick={finish}
                                className="flex items-center gap-3 px-4 py-2 transition hover:bg-white/10"
                            >
                                <Poster src={m.image_url} title="" className="h-12 w-8 shrink-0 rounded object-cover" />
                                <div className="min-w-0">
                                    <p className="truncate text-sm">{m.title}</p>
                                    <p className="text-xs text-purple-300/70">{STATUS_LABELS[m.status] ?? m.status}</p>
                                </div>
                            </Link>
                        ))}
                        <button
                            onClick={searchMal}
                            className="flex w-full items-center justify-between gap-3 border-t border-white/5 px-4 py-3 text-left text-sm text-pink-200 transition hover:bg-white/10"
                        >
                            <span className="truncate">Search MyAnimeList for "{query.trim()}"</span>
                            <CornerDownLeft className="h-4 w-4 shrink-0" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchBox;
