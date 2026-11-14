import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import PixelHeart from './PixelHeart';

/** Pixel heart plus the NEXTWEEB wordmark in the pixel font. The heart beats on hover. */
const Logo = ({ to = '/', size = 'md' }: { to?: string; size?: 'sm' | 'md' }) => (
    <Link to={to} className="group flex shrink-0 items-center gap-2.5" aria-label="NextWeeb home">
        <motion.span
            whileHover={{ scale: [1, 1.18, 1, 1.12, 1] }}
            transition={{ duration: 0.7 }}
            className="drop-shadow-[0_0_12px_rgba(236,72,153,0.45)]"
        >
            <PixelHeart className={size === 'sm' ? 'h-6 w-6' : 'h-7 w-7'} />
        </motion.span>
        <span className={`font-pixel font-bold tracking-wide text-gradient ${size === 'sm' ? 'text-base' : 'text-lg'}`}>
            NEXTWEEB
        </span>
    </Link>
);

export default Logo;
