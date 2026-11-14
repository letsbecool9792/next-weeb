import { motion, useScroll, useTransform } from 'motion/react';
import HoloCard from './HoloCard';
import Kanji from './Kanji';

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const rise = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

/**
 * Full-width banner at the top of a page: the show's art blurred behind,
 * drifting slower than the page as you scroll (parallax), fading into the
 * background, with the poster and text animating in.
 */
const HeroBanner = ({ image, poster, posterCode, posterBadge, kanji, eyebrow, title, meta, description, actions, compact = false }: {
    image?: string | null;      // background art (the large cover works well)
    poster?: string | null;     // shown as a holo card on the left, from md screens up
    posterCode?: string;        // small label on the holo card
    posterBadge?: React.ReactNode;
    kanji?: string;             // the page's word in Japanese, huge in outline on the right
    eyebrow?: React.ReactNode;  // small line above the title
    title: React.ReactNode;
    meta?: React.ReactNode;     // chips under the title
    description?: React.ReactNode;
    actions?: React.ReactNode;
    compact?: boolean;          // shorter variant
}) => {
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 600], [0, 180]);
    const fade = useTransform(scrollY, [0, 450], [1, 0.2]);

    return (
        <section className={`relative w-full overflow-hidden ${compact ? 'min-h-[420px] h-[55vh]' : 'min-h-[520px] h-[72vh]'}`}>
            <motion.div style={{ y }} className="absolute inset-0">
                {image ? (
                    <motion.img
                        src={image}
                        alt=""
                        initial={{ scale: 1.25, opacity: 0 }}
                        animate={{ scale: 1.12, opacity: 0.55 }}
                        transition={{ duration: 1.6, ease: 'easeOut' }}
                        className="h-full w-full object-cover object-[center_25%] blur-[3px]"
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-purple-900 via-fuchsia-950 to-ink" />
                )}
            </motion.div>

            {/* Fade the art into the page: from the bottom, the left, and under the header */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/50 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink/80 to-transparent" />
            <div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-pink-600/20 blur-3xl" />
            {kanji && <Kanji text={kanji} className="bottom-6 right-4 hidden text-[10rem] opacity-80 sm:block lg:right-10 lg:text-[15rem]" />}

            <motion.div style={{ opacity: fade }} className="relative flex h-full items-end px-4 pb-14 pt-24 sm:px-8">
                <motion.div variants={stagger} initial="hidden" animate="show" className="flex w-full items-end gap-8">
                    {poster !== undefined && (
                        <motion.div variants={rise} className="hidden shrink-0 md:block">
                            <HoloCard
                                image={poster}
                                title={typeof title === 'string' ? title : ''}
                                code={posterCode}
                                badge={posterBadge}
                                className="w-44 lg:w-52"
                            />
                        </motion.div>
                    )}
                    <div className="max-w-2xl">
                        {eyebrow && (
                            <motion.p variants={rise} className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-pink-300">
                                {eyebrow}
                            </motion.p>
                        )}
                        <motion.h1 variants={rise} className="text-4xl font-bold leading-[1.05] tracking-tight drop-shadow-lg sm:text-5xl lg:text-6xl">
                            {title}
                        </motion.h1>
                        {meta && <motion.div variants={rise} className="mt-4 flex flex-wrap gap-2">{meta}</motion.div>}
                        {description && (
                            <motion.div variants={rise} className="mt-4 max-w-xl text-base text-purple-100/85 sm:text-lg">
                                {description}
                            </motion.div>
                        )}
                        {actions && <motion.div variants={rise} className="mt-6 flex flex-wrap gap-3">{actions}</motion.div>}
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
};

export default HeroBanner;
