import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'motion/react';
import Poster from '../Poster';

type HoloCardProps = {
    image?: string | null;
    title: string;
    to?: string;
    badge?: React.ReactNode;   // top-right, e.g. a score
    code?: string;             // top-left in the pixel font, like a trading card's set number
    footer?: React.ReactNode;  // under the title on the card
    className?: string;
};

/**
 * Foil trading card. Follows the pointer: the card tilts towards it, a
 * rainbow foil layer slides across, and a glare spot sits under the cursor.
 * Springs smooth the motion and it settles flat when the pointer leaves.
 */
const HoloCard = ({ image, title, to, badge, code, footer, className = 'w-56' }: HoloCardProps) => {
    const ref = useRef<HTMLDivElement>(null);
    // Pointer position inside the card, 0..1 on each axis (0.5 = centre)
    const px = useMotionValue(0.5);
    const py = useMotionValue(0.5);
    const spring = { stiffness: 180, damping: 18 };
    const rotateX = useSpring(useTransform(py, [0, 1], [12, -12]), spring);
    const rotateY = useSpring(useTransform(px, [0, 1], [-14, 14]), spring);
    const glareX = useTransform(px, (v) => `${v * 100}%`);
    const glareY = useTransform(py, (v) => `${v * 100}%`);
    const foilPos = useTransform(px, (v) => `${v * 100}% 50%`);
    const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.55), transparent 45%)`;

    const onMove = (e: React.PointerEvent) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
    };
    const reset = () => { px.set(0.5); py.set(0.5); };

    const card = (
        <motion.div
            ref={ref}
            onPointerMove={onMove}
            onPointerLeave={reset}
            style={{ rotateX, rotateY, transformPerspective: 900 }}
            whileHover={{ scale: 1.04 }}
            className={`group relative aspect-[2/3] overflow-hidden rounded-2xl bg-ink-soft shadow-2xl shadow-pink-500/20 ring-1 ring-white/20 ${className}`}
        >
            <Poster src={image} title={title} className="h-full w-full object-cover" />

            {/* Rainbow foil, strongest where the light catches it */}
            <motion.div className="holo-foil absolute inset-0" style={{ backgroundPosition: foilPos }} />
            <motion.div className="absolute inset-0 mix-blend-overlay" style={{ background: glare }} />

            {/* Card furniture: inner frame, set code, badge, title strip */}
            <div className="pointer-events-none absolute inset-2 rounded-xl border border-white/30" />
            {code && (
                <span className="absolute left-3.5 top-3.5 rounded bg-black/55 px-1.5 py-0.5 font-pixel text-[10px] tracking-wider text-pink-100 backdrop-blur">
                    {code}
                </span>
            )}
            {badge && <span className="absolute right-3.5 top-3.5">{badge}</span>}
            <div className="absolute inset-x-2 bottom-2 rounded-b-xl bg-gradient-to-t from-black/95 via-black/70 to-transparent px-3 pb-3 pt-10">
                <p className="line-clamp-2 font-bold leading-tight text-white">{title}</p>
                {footer && <div className="mt-1 text-xs text-pink-200/90">{footer}</div>}
            </div>
        </motion.div>
    );

    return to ? <Link to={to} className="block focus:outline-none" aria-label={title}>{card}</Link> : card;
};

export default HoloCard;
