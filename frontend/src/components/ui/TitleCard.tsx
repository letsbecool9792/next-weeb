import { motion } from 'motion/react';

/**
 * Section heading styled like an anime episode title card: a slanted
 * gradient band with the episode number in the pixel font, then the title.
 * The number is the section's position on the page.
 */
const TitleCard = ({ ep, label, title, subtitle, size = 'md' }: {
    ep: number;
    label?: string;            // small text in the band, e.g. the page name
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    size?: 'md' | 'lg';
}) => (
    <div>
        <motion.div
            initial={{ opacity: 0, x: -24, skewX: -12 }}
            whileInView={{ opacity: 1, x: 0, skewX: -12 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-2 inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 px-3 py-1 shadow-lg shadow-pink-500/20"
        >
            <span className="skew-x-12 font-pixel text-xs font-bold tracking-wider">EP.{String(ep).padStart(2, '0')}</span>
            {label && <span className="skew-x-12 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">{label}</span>}
        </motion.div>
        <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className={`font-bold tracking-tight ${size === 'lg' ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'}`}
        >
            {title}
        </motion.h2>
        {subtitle && <p className="mt-1.5 text-sm text-purple-300/70 sm:text-base">{subtitle}</p>}
    </div>
);

export default TitleCard;
