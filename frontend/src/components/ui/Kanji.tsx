import { motion } from 'motion/react';

/**
 * Kanji marker: the page's word in Japanese, set huge in outline behind its
 * title (発見 on Discover, 統計 on Stats...). Purely visual, so screen
 * readers skip it.
 */
const Kanji = ({ text, className = '' }: { text: string; className?: string }) => (
    <motion.span
        aria-hidden="true"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className={`kanji-outline pointer-events-none absolute select-none whitespace-nowrap font-kanji leading-none ${className}`}
    >
        {text}
    </motion.span>
);

export default Kanji;
