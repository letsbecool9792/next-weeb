import { motion } from 'motion/react';
import { useShowcase } from '../../utils/showcase';

const ROWS = 4;

/**
 * Tilted wall of real anime covers drifting sideways, rows alternating
 * direction. Each row's covers are repeated twice so the CSS marquee
 * (translateX 0 -> -50%) loops without a visible seam.
 * Shows gradient tiles while the (possibly sleeping) backend responds.
 */
const PosterWall = ({ className = '' }: { className?: string }) => {
    const covers = useShowcase();

    const perRow = Math.max(1, Math.ceil(covers.length / ROWS));
    const rows = Array.from({ length: ROWS }, (_, r) => covers.slice(r * perRow, (r + 1) * perRow));

    return (
        <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
            <div className="absolute -inset-[20%] flex -rotate-[8deg] flex-col justify-center gap-4">
                {rows.map((row, r) => (
                    <div key={r} className="flex w-max gap-4">
                        <div className={`flex w-max gap-4 ${r % 2 ? 'animate-marquee-reverse' : 'animate-marquee'}`} style={{ animationDuration: `${70 + r * 15}s` }}>
                            {(row.length ? [...row, ...row] : Array.from({ length: 24 }, () => null)).map((cover, i) =>
                                cover ? (
                                    <motion.img
                                        key={`${cover.id}-${i}`}
                                        src={cover.image}
                                        alt=""
                                        loading="lazy"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.8, delay: (i % 12) * 0.04 }}
                                        className="h-56 w-40 shrink-0 rounded-xl object-cover shadow-xl sm:h-64 sm:w-44"
                                    />
                                ) : (
                                    <div key={i} className="h-56 w-40 shrink-0 rounded-xl bg-gradient-to-br from-purple-900/60 to-fuchsia-950/60 sm:h-64 sm:w-44" />
                                )
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PosterWall;
