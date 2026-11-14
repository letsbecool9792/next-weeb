/**
 * Ticker tape: a slightly tilted strip that scrolls its items forever, like
 * a broadcast ticker. Items are repeated so the strip is always full, then
 * doubled so the CSS marquee (0 -> -50%) loops without a seam.
 */
const Ticker = ({ items, tone = 'pink', reverse = false, tilt = -2, speed = 40, className = '' }: {
    items: string[];
    tone?: 'pink' | 'light' | 'dark';
    reverse?: boolean;
    tilt?: number;     // degrees
    speed?: number;    // seconds per loop; lower is faster
    className?: string;
}) => {
    if (items.length === 0) return null;
    const filled = Array.from({ length: Math.ceil(16 / items.length) }, () => items).flat();
    const tones = {
        pink: 'bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 text-white shadow-xl shadow-pink-500/20',
        light: 'bg-pink-50 text-ink',
        dark: 'bg-ink-soft text-pink-200 border-y border-white/10',
    };

    return (
        <div aria-hidden="true" className={`relative -mx-[5%] overflow-hidden py-2.5 ${tones[tone]} ${className}`} style={{ transform: `rotate(${tilt}deg)` }}>
            <div
                className={`flex w-max gap-6 font-pixel text-sm font-bold uppercase tracking-wider sm:text-base ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
                style={{ animationDuration: `${speed}s` }}
            >
                {[...filled, ...filled].map((item, i) => (
                    <span key={i} className="flex items-center gap-6 whitespace-nowrap">
                        {item}
                        <span className="opacity-60">✦</span>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default Ticker;
