import { useEffect } from 'react';

/**
 * Cursor spotlight. One listener for the whole page: whichever card the
 * pointer is over gets --mx/--my set to the pointer's position inside it,
 * and the CSS in index.css (.card::before / ::after) draws a pink glow and a
 * lit border there. Cheaper than a listener per card, and new cards work
 * automatically.
 */
export const useSpotlight = () => {
    useEffect(() => {
        const onMove = (e: PointerEvent) => {
            const el = (e.target as Element | null)?.closest?.('.card, .spotlight') as HTMLElement | null;
            if (!el) return;
            const r = el.getBoundingClientRect();
            el.style.setProperty('--mx', `${e.clientX - r.left}px`);
            el.style.setProperty('--my', `${e.clientY - r.top}px`);
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        return () => window.removeEventListener('pointermove', onMove);
    }, []);
};
