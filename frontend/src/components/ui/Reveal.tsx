import { motion } from 'motion/react';

/**
 * Fades and slides its content up the first time it scrolls into view.
 * `delay` (seconds) staggers neighbouring blocks.
 */
const Reveal = ({ children, delay = 0, y = 24, className = '' }: {
    children: React.ReactNode;
    delay?: number;
    y?: number;
    className?: string;
}) => (
    <motion.div
        className={className}
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
        {children}
    </motion.div>
);

export default Reveal;
