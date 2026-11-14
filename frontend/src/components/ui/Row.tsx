import { Children, useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TitleCard from './TitleCard';

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
};
const item = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

/**
 * A titled, horizontally scrolling row of posters, like a streaming app.
 * Cards stagger in when the row scrolls into view; arrow buttons appear on
 * hover (desktop), and the row can be swiped or shift-scrolled.
 */
const Row = ({ title, icon, subtitle, action, ep, label, children, itemClassName = 'w-36 sm:w-44' }: {
    title: React.ReactNode;
    ep?: number;        // when set, the title is an episode title card with this number
    label?: string;     // text in the episode band, usually the page name
    icon?: React.ReactNode;
    subtitle?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    itemClassName?: string;
}) => {
    const scroller = useRef<HTMLDivElement>(null);
    const items = Children.toArray(children);
    if (items.length === 0) return null;

    const scroll = (direction: 1 | -1) => {
        const el = scroller.current;
        if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
    };

    const arrow = 'absolute top-0 bottom-12 z-10 hidden w-12 items-center justify-center opacity-0 transition duration-300 group-hover/row:opacity-100 md:flex';

    return (
        <section className="group/row relative mb-10">
            <div className="mb-3 flex items-end justify-between gap-4 px-4 sm:px-8">
                {ep ? (
                    <TitleCard ep={ep} label={label} title={title} subtitle={subtitle} />
                ) : (
                    <div>
                        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
                            {icon}
                            {title}
                        </h2>
                        {subtitle && <p className="mt-1 text-sm text-purple-300/70">{subtitle}</p>}
                    </div>
                )}
                {action}
            </div>

            <div className="relative">
                <button
                    onClick={() => scroll(-1)}
                    aria-label="Scroll left"
                    className={`${arrow} left-0 bg-gradient-to-r from-ink to-transparent`}
                >
                    <ChevronLeft className="h-8 w-8 rounded-full bg-black/50 p-1 backdrop-blur hover:bg-pink-500" />
                </button>

                <motion.div
                    ref={scroller}
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.15 }}
                    className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 pt-2 sm:scroll-px-8 sm:px-8"
                >
                    {items.map((child, i) => (
                        <motion.div key={i} variants={item} className={`shrink-0 snap-start ${itemClassName}`}>
                            {child}
                        </motion.div>
                    ))}
                </motion.div>

                <button
                    onClick={() => scroll(1)}
                    aria-label="Scroll right"
                    className={`${arrow} right-0 bg-gradient-to-l from-ink to-transparent`}
                >
                    <ChevronRight className="h-8 w-8 rounded-full bg-black/50 p-1 backdrop-blur hover:bg-pink-500" />
                </button>
            </div>
        </section>
    );
};

export default Row;
