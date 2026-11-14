import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowRight, Check, Sparkles, X } from 'lucide-react';

import Footer from '../components/Footer';
import Logo from '../components/brand/Logo';
import PixelHeart from '../components/brand/PixelHeart';
import Poster from '../components/Poster';
import PosterWall from '../components/ui/PosterWall';
import HoloCard from '../components/ui/HoloCard';
import Ticker from '../components/ui/Ticker';
import TitleCard from '../components/ui/TitleCard';
import CountUp from '../components/ui/CountUp';
import Reveal from '../components/ui/Reveal';
import { useAuth } from '../auth/useAuth';
import { useShowcase } from '../utils/showcase';

const HEADLINE = ['Your', 'next', 'favourite', 'anime'];
const HEADLINE_ACCENT = ['is', 'already', 'waiting.'];

// The kinds of reason the app really gives, cycling under the hero buttons
const EXAMPLE_REASONS = [
    'Recommended by 31 fans of a show you rated 10',
    'From the studio behind your favourite',
    'Matches your taste for Drama and Music',
    'Continues a show already on your list',
];

const PROBLEMS = [
    <>Tired of cookie-cutter recs that act like everyone's got <b className="text-pink-300">the same taste</b>?</>,
    <>Sick of scrolling through <b className="text-pink-300">anime hell</b> just to find one show that doesn't suck?</>,
    <>Wasting hours watching <b className="text-pink-300">mid</b>? Nah, that ain't it.</>,
];
const SOLUTIONS = [
    <>NextWeeb uses your MAL history to recommend shows you'll <b className="text-pink-300">actually</b> want to watch.</>,
    <>See the genres and studios that define your taste, tailored to <b className="text-pink-300">you</b>.</>,
    <>Be an <b className="text-pink-300">anime stat god</b>. Sort, filter, dominate.</>,
];

const STEPS = [
    { numeral: '一', title: 'Log in', text: 'With your MyAnimeList account. We copy your list; we never change it.' },
    { numeral: '二', title: 'Read', text: 'Your scores, genres, studios and favourites become a taste profile.' },
    { numeral: '三', title: 'Pick', text: 'Thousands of shows are scored against it. You get the best, each with a reason.' },
    { numeral: '四', title: 'Watch', text: 'Ask the AI for something specific, or start at the top of your Plan to Watch.' },
];

const ExampleTag = () => (
    <span className="rounded-full border border-white/15 px-2 py-0.5 font-pixel text-[10px] uppercase tracking-wider text-purple-300/70">Example</span>
);

/** Words rise in one after another */
const word = {
    hidden: { opacity: 0, y: '0.5em', filter: 'blur(8px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

const Landing = () => {
    // Logged-in visitors skip the login page
    const { isLoggedIn } = useAuth();
    const startPath = isLoggedIn ? '/dashboard' : '/get-started';
    const covers = useShowcase();
    const cover = (i: number) => covers[i % Math.max(covers.length, 1)];

    // The kanji window drifts a little towards the pointer, and grows as you scroll away
    const px = useMotionValue(0);
    const py = useMotionValue(0);
    const kanjiX = useSpring(useTransform(px, [-0.5, 0.5], [30, -30]), { stiffness: 60, damping: 20 });
    const kanjiY = useSpring(useTransform(py, [-0.5, 0.5], [20, -20]), { stiffness: 60, damping: 20 });
    const { scrollY } = useScroll();
    const kanjiScale = useTransform(scrollY, [0, 700], [1, 1.18]);
    const heroFade = useTransform(scrollY, [0, 500], [1, 0]);

    const [reason, setReason] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setReason((r) => (r + 1) % EXAMPLE_REASONS.length), 2800);
        return () => clearInterval(t);
    }, []);

    const kanjiSize = { fontSize: 'min(92vh, 74vw)' };

    return (
        <div className="page-bg overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between bg-ink/40 px-4 backdrop-blur-md sm:px-8">
                <Logo />
                <div className="hidden items-center gap-8 text-sm text-purple-200/80 md:flex">
                    <a href="#episodes" className="transition hover:text-white">Features</a>
                    <a href="#how-it-works" className="transition hover:text-white">How it works</a>
                </div>
                <Link to={startPath} className="btn-secondary px-5 py-2 text-sm">
                    {isLoggedIn ? 'Open app' : 'Log in'}
                </Link>
            </nav>

            {/* ---------- Hero: anime covers seen through a giant 次 ("next") ---------- */}
            <section
                onPointerMove={(e) => {
                    px.set(e.clientX / window.innerWidth - 0.5);
                    py.set(e.clientY / window.innerHeight - 0.5);
                }}
                className="relative isolate flex min-h-[100svh] items-center overflow-hidden"
            >
                <motion.div
                    style={{ x: kanjiX, y: kanjiY, scale: kanjiScale }}
                    className="absolute inset-y-0 -right-[10%] w-[120%] opacity-45 lg:right-[-6%] lg:w-[68%] lg:opacity-100"
                >
                    {/* The covers show only inside the kanji: a dark layer multiplied over
                        them hides everything except where the white glyph is */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0 isolate"
                    >
                        <PosterWall />
                        <div className="absolute inset-0 flex items-center justify-center bg-ink mix-blend-multiply">
                            <span className="select-none font-kanji leading-none text-white" style={kanjiSize}>次</span>
                        </div>
                    </motion.div>
                    {/* A crisp pink edge drawn on top */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.2, delay: 0.6 }}
                        className="pointer-events-none absolute inset-0 flex items-center justify-center"
                        aria-hidden="true"
                    >
                        <span
                            className="select-none font-kanji leading-none text-transparent drop-shadow-[0_0_40px_rgba(236,72,153,0.45)]"
                            style={{ ...kanjiSize, WebkitTextStroke: '2px rgba(244,114,182,0.75)' }}
                        >
                            次
                        </span>
                    </motion.div>
                </motion.div>

                {/* Keep the copy readable over the art */}
                <div className="absolute inset-0 -z-0 bg-gradient-to-r from-ink via-ink/75 to-transparent lg:via-ink/40" />

                {/* Manga-panel frame and the katakana name down the edge */}
                <div className="pointer-events-none absolute inset-3 rounded-[28px] border border-white/10 sm:inset-5" />
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="absolute left-7 top-1/2 hidden -translate-y-1/2 font-kanji text-sm tracking-[0.5em] text-pink-300/60 [writing-mode:vertical-rl] lg:block"
                    aria-hidden="true"
                >
                    ネクストウィーブ
                </motion.p>

                <motion.div style={{ opacity: heroFade }} className="relative z-10 w-full px-6 pb-28 pt-28 sm:px-12 lg:pl-24">
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="chip mb-7 px-3.5 py-1.5 text-sm"
                    >
                        <PixelHeart className="h-3.5 w-3.5" /> Built on your MyAnimeList
                    </motion.p>

                    <motion.h1
                        initial="hidden"
                        animate="show"
                        transition={{ staggerChildren: 0.08, delayChildren: 0.15 }}
                        className="max-w-3xl text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl lg:text-[5.5rem]"
                    >
                        {HEADLINE.map((w) => (
                            <motion.span key={w} variants={word} className="mr-[0.22em] inline-block">{w}</motion.span>
                        ))}
                        <br />
                        {HEADLINE_ACCENT.map((w) => (
                            <motion.span key={w} variants={word} className="mr-[0.22em] inline-block text-gradient-animated">{w}</motion.span>
                        ))}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.75, duration: 0.7 }}
                        className="mt-7 max-w-lg text-lg text-purple-100/80 sm:text-xl"
                    >
                        Picks from your MyAnimeList, each one with the reason it was chosen.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.7 }}
                        className="mt-9 flex flex-wrap gap-3"
                    >
                        <Link to={startPath} className="btn-primary px-7 py-3.5 text-base">
                            {isLoggedIn ? 'Open NextWeeb' : 'Log in with MyAnimeList'} <ArrowRight className="h-5 w-5" />
                        </Link>
                        <a href="#episodes" className="btn-secondary px-7 py-3.5 text-base">See what you get</a>
                    </motion.div>

                    {/* What a reason looks like, cycling */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="mt-10 flex items-center gap-3 text-sm"
                    >
                        <span className="font-pixel text-[10px] uppercase tracking-wider text-purple-300/60">Every pick says why</span>
                        <div className="relative h-8 min-w-0 flex-1 overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={reason}
                                    initial={{ y: 24, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -24, opacity: 0 }}
                                    transition={{ duration: 0.35 }}
                                    className="chip absolute left-0 top-0 max-w-full truncate border-pink-400/30 bg-pink-500/15 py-1.5 text-pink-100"
                                >
                                    <Sparkles className="h-3 w-3 shrink-0 text-pink-300" /> {EXAMPLE_REASONS[reason]}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Two tapes crossing at the bottom */}
                <div className="absolute inset-x-0 bottom-6 z-10">
                    <Ticker items={['Picks with reasons', 'An AI that knows your list', 'Your taste in numbers', 'Plan to Watch, ranked', 'No ads']} tilt={-2} speed={45} />
                    <Ticker items={['Built on MyAnimeList', 'Free', 'Made by a weeb', 'For weebs']} tone="light" tilt={1.5} reverse speed={50} className="-mt-3 opacity-90" />
                </div>
            </section>

            {/* ---------- The features, as episodes ---------- */}
            <div id="episodes" className="scroll-mt-16">
                {/* EP.01 Reasons */}
                <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-28 sm:px-10 lg:grid-cols-2">
                    <div>
                        <TitleCard ep={1} label="Recommendations" size="lg" title={<>Every pick comes with <span className="text-gradient">receipts.</span></>} />
                        <Reveal delay={0.1}>
                            <p className="mt-5 max-w-md text-lg text-purple-200/80">
                                Most recommenders hand you a list. NextWeeb tells you why each show is on it: the favourite of yours it connects to,
                                how many fans backed it, the studio behind it.
                            </p>
                            <ul className="mt-6 space-y-2 text-purple-100/90">
                                {['Nothing you have already seen', 'No sequels to shows you never started', 'Rare genres you love count for more'].map((t) => (
                                    <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300" /> {t}</li>
                                ))}
                            </ul>
                        </Reveal>
                    </div>
                    <Reveal delay={0.15} className="relative flex h-[26rem] items-center justify-center">
                        <div className="absolute right-0 top-0"><ExampleTag /></div>
                        {[
                            { i: 0, rotate: -10, x: -110, y: 18, footer: EXAMPLE_REASONS[0] },
                            { i: 1, rotate: 0, x: 0, y: -10, footer: EXAMPLE_REASONS[1] },
                            { i: 2, rotate: 10, x: 110, y: 18, footer: EXAMPLE_REASONS[2] },
                        ].map((c) => (
                            <motion.div
                                key={c.i}
                                initial={{ opacity: 0, y: 60, rotate: 0, x: 0 }}
                                whileInView={{ opacity: 1, y: c.y, rotate: c.rotate, x: c.x }}
                                viewport={{ once: true, amount: 0.4 }}
                                transition={{ duration: 0.9, delay: 0.1 * c.i, ease: [0.22, 1, 0.36, 1] }}
                                whileHover={{ zIndex: 10 }}
                                className="absolute"
                                style={{ zIndex: c.i === 1 ? 2 : 1 }}
                            >
                                <HoloCard
                                    image={cover(c.i)?.image}
                                    title={cover(c.i)?.title ?? ''}
                                    code={`NW·00${c.i + 1}`}
                                    footer={c.footer}
                                    className="w-44 sm:w-52"
                                />
                            </motion.div>
                        ))}
                    </Reveal>
                </section>

                <Ticker items={['Because you liked', 'Top picks', 'Hidden gems', 'Your kind of drama', 'More from Madhouse']} tone="dark" tilt={0} speed={60} />

                {/* EP.02 AI chat */}
                <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-28 sm:px-10 lg:grid-cols-2">
                    <Reveal className="order-2 lg:order-1">
                        <div className="card space-y-4 p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold">AI assistant</p>
                                <ExampleTag />
                            </div>
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="ml-auto w-fit rounded-2xl rounded-br-md bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-2.5 text-sm"
                            >
                                something short and wholesome?
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.5 }}
                                className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-white/[0.07] px-4 py-2.5 text-sm"
                            >
                                Here are three cosy ones you haven't seen. All under 13 episodes.
                            </motion.div>
                            <div className="grid grid-cols-3 gap-3">
                                {[3, 4, 5].map((i, n) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.8 + n * 0.12 }}
                                    >
                                        <Poster src={cover(i)?.image} title={cover(i)?.title ?? ''} className="aspect-[2/3] w-full rounded-lg object-cover" />
                                        <p className="mt-1.5 line-clamp-1 text-xs text-purple-200/80">{cover(i)?.title}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </Reveal>
                    <div className="order-1 lg:order-2">
                        <TitleCard ep={2} label="AI chat" size="lg" title={<>An AI that has actually <span className="text-gradient">seen your list.</span></>} />
                        <Reveal delay={0.1}>
                            <p className="mt-5 max-w-md text-lg text-purple-200/80">
                                Ask for a vibe, a length, a mood. It knows what you loved and what you dropped, keeps the conversation going,
                                and only suggests real shows you haven't watched yet, as cards you can open.
                            </p>
                        </Reveal>
                    </div>
                </section>

                {/* EP.03 Stats */}
                <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-28 sm:px-10 lg:grid-cols-2">
                    <div>
                        <TitleCard ep={3} label="Stats" size="lg" title={<>Your taste, <span className="text-gradient">in numbers.</span></>} />
                        <Reveal delay={0.1}>
                            <p className="mt-5 max-w-md text-lg text-purple-200/80">
                                Top genres and studios, how you rate, what formats you watch, and how many days of your life went into it.
                                Be an anime stat god.
                            </p>
                        </Reveal>
                    </div>
                    <Reveal delay={0.15}>
                        <div className="card p-6">
                            <div className="mb-5 flex items-center justify-between">
                                <div className="flex gap-8">
                                    <div>
                                        <p className="text-4xl font-bold"><CountUp value={142} /></p>
                                        <p className="text-xs uppercase tracking-widest text-purple-300/70">Completed</p>
                                    </div>
                                    <div>
                                        <p className="text-4xl font-bold"><CountUp value={38.4} decimals={1} /></p>
                                        <p className="text-xs uppercase tracking-widest text-purple-300/70">Days watched</p>
                                    </div>
                                </div>
                                <ExampleTag />
                            </div>
                            <div className="space-y-3">
                                {[['Drama', 48], ['Comedy', 41], ['Romance', 30], ['Slice of Life', 26], ['Fantasy', 19]].map(([g, n], i) => (
                                    <div key={g}>
                                        <div className="mb-1 flex justify-between text-sm"><span>{g}</span><span className="text-purple-300/70">{n}</span></div>
                                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${(Number(n) / 48) * 100}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1.1, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                                                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Reveal>
                </section>

                {/* EP.04 Plan to Watch */}
                <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-28 sm:px-10 lg:grid-cols-2">
                    <Reveal className="order-2 lg:order-1">
                        <div className="card space-y-3 p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold">Your Plan to Watch</p>
                                <ExampleTag />
                            </div>
                            {[
                                { i: 6, why: 'Fits your taste for Drama' },
                                { i: 7, why: 'From a studio you love' },
                                { i: 8, why: 'Continues a show you started' },
                            ].map((row, n) => (
                                <motion.div
                                    key={row.i}
                                    initial={{ opacity: 0, x: -30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: n * 0.15 }}
                                    className="flex items-center gap-4 rounded-xl bg-white/[0.04] p-2.5"
                                >
                                    <span className={`w-8 text-center font-pixel text-2xl font-bold ${n === 0 ? 'text-gradient' : 'text-purple-300/50'}`}>{n + 1}</span>
                                    <Poster src={cover(row.i)?.image} title="" className="h-16 w-11 shrink-0 rounded-md object-cover" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{cover(row.i)?.title}</p>
                                        <p className="text-xs text-pink-200/80">{row.why}</p>
                                    </div>
                                    {n === 0 && <span className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-2.5 py-1 text-[10px] font-bold uppercase">Start here</span>}
                                </motion.div>
                            ))}
                        </div>
                    </Reveal>
                    <div className="order-1 lg:order-2">
                        <TitleCard ep={4} label="Plan to Watch" size="lg" title={<>A list you'll <span className="text-gradient">actually finish.</span></>} />
                        <Reveal delay={0.1}>
                            <p className="mt-5 max-w-md text-lg text-purple-200/80">
                                Your Plan to Watch, ranked by how well each show fits your taste, so the next one you start is the right one.
                            </p>
                        </Reveal>
                    </div>
                </section>
            </div>

            {/* ---------- Problem and solution ---------- */}
            <section className="relative mx-auto max-w-6xl px-6 py-24 sm:px-10">
                <Reveal className="mb-12">
                    <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                        Anime recs are <span className="text-gradient">broken.</span>
                    </h2>
                    <p className="mt-3 text-lg text-purple-200/80">Tired of basic anime recs that don't get your vibe?</p>
                </Reveal>
                <div className="grid gap-6 md:grid-cols-2">
                    {[{ title: 'The problem', items: PROBLEMS, Icon: X, tone: 'text-rose-300 bg-rose-500/15' },
                      { title: 'NextWeeb', items: SOLUTIONS, Icon: Check, tone: 'text-emerald-300 bg-emerald-500/15' }].map((col, c) => (
                        <Reveal key={col.title} delay={c * 0.15}>
                            <div className="card h-full p-8">
                                <h3 className="mb-6 text-2xl font-bold">{col.title}</h3>
                                <ul className="space-y-5">
                                    {col.items.map((text, i) => (
                                        <li key={i} className="flex items-start gap-3 text-purple-100/90">
                                            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${col.tone}`}>
                                                <col.Icon className="h-3.5 w-3.5" />
                                            </span>
                                            <p>{text}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ---------- How it works: four steps, numbered in kanji ---------- */}
            <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-16 px-6 py-24 sm:px-10">
                <Reveal className="mb-14">
                    <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">From your list to your next show</h2>
                </Reveal>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {STEPS.map((s, i) => (
                        <Reveal key={s.title} delay={i * 0.12}>
                            <div className="card relative h-full overflow-hidden pt-24">
                                <span className="kanji-outline absolute -top-2 right-3 font-kanji text-[7rem] leading-none" aria-hidden="true">{s.numeral}</span>
                                <p className="font-pixel text-xs text-pink-300">STEP {i + 1}</p>
                                <h3 className="mt-1 text-2xl font-bold">{s.title}</h3>
                                <p className="mt-2 text-sm text-purple-200/75">{s.text}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ---------- Closing call to action ---------- */}
            <section className="px-4 py-24 sm:px-8">
                <Reveal>
                    <div className="relative mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-[2rem] border border-white/10 p-8 sm:p-14 lg:grid-cols-[1fr_auto]">
                        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-pink-600/35 via-purple-900/70 to-ink" />
                        <span className="kanji-outline pointer-events-none absolute -bottom-16 -left-6 -z-10 font-kanji text-[18rem] leading-none" aria-hidden="true">次</span>
                        <div>
                            <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">Built by a weeb,<br />for weebs.</h2>
                            <p className="mt-5 max-w-lg text-lg text-purple-100/80">
                                I made NextWeeb to find anime that actually matches my taste. Plug in your list and see what it finds for yours.
                            </p>
                            <Link to={startPath} className="btn-primary mt-8 px-8 py-4 text-lg">
                                {isLoggedIn ? 'Open NextWeeb' : 'Log in with MyAnimeList'} <ArrowRight className="h-5 w-5" />
                            </Link>
                        </div>
                        <div className="hidden justify-center lg:flex">
                            <HoloCard
                                image={cover(9)?.image}
                                title={cover(9)?.title ?? ''}
                                code="NW·NEXT"
                                badge={<span className="rounded-full bg-black/55 px-2 py-0.5 font-pixel text-[10px] text-amber-200">★ YOURS?</span>}
                                className="w-60 rotate-3"
                            />
                        </div>
                    </div>
                </Reveal>
            </section>

            <Footer />
        </div>
    );
};

export default Landing;
