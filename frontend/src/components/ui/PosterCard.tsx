import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import Poster from '../Poster';

type PosterCardProps = {
    to: string;
    title: string;
    image?: string | null;
    score?: number | null;      // shown as a star badge when above 0
    reason?: string;            // slides up over the poster on hover, and shows under the title
    subtitle?: string;          // a short line under the title
    badge?: React.ReactNode;    // top-left corner
};

/**
 * The poster tile used everywhere: lifts and glows on hover, the art zooms,
 * and the reason it was recommended slides up over the image.
 */
const PosterCard = ({ to, title, image, score, reason, subtitle, badge }: PosterCardProps) => (
    <motion.div
        whileHover={{ y: -8 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        className="group relative"
    >
        <Link to={to} className="block focus:outline-none">
            <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-ink-soft ring-1 ring-white/10 shadow-xl shadow-black/40 transition duration-300 group-hover:ring-2 group-hover:ring-pink-400/70 group-hover:shadow-pink-500/25 group-focus-visible:ring-2 group-focus-visible:ring-pink-400">
                <Poster
                    src={image}
                    title={title}
                    className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-transparent opacity-70 transition duration-300 group-hover:opacity-100" />

                {badge && <div className="absolute left-2 top-2">{badge}</div>}

                {score != null && score > 0 && (
                    <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-bold text-amber-300 backdrop-blur">
                        <Star size={11} className="fill-amber-300" />
                        {score.toFixed(score % 1 === 0 ? 0 : 1)}
                    </div>
                )}

                {reason && (
                    <p className="absolute inset-x-0 bottom-0 translate-y-full p-3 text-xs leading-snug text-purple-50 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        {reason}
                    </p>
                )}
            </div>
            <p className="mt-2.5 line-clamp-2 text-sm font-medium leading-snug text-white/90 transition group-hover:text-pink-300">
                {title}
            </p>
            {subtitle && <p className="mt-0.5 line-clamp-1 text-xs text-purple-300/70">{subtitle}</p>}
        </Link>
    </motion.div>
);

export default PosterCard;
