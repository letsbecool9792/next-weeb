import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, BarChart2, ChevronDown, CircleCheck, Filter, List, MessageCircle, Sparkles, X, Check, Zap } from 'lucide-react';

import Footer from '../components/Footer';
import PosterWall from '../components/ui/PosterWall';
import Reveal from '../components/ui/Reveal';
import { useAuth } from '../auth/useAuth';

// Only features that exist.
const FEATURES = [
    {
        icon: Zap,
        title: 'Recommendations That Explain Themselves',
        description: 'Picks built from your ratings and from what fans of your favourite shows recommend. Every pick says why it was chosen.',
    },
    {
        icon: MessageCircle,
        title: 'An AI That Knows Your List',
        description: 'Ask for "something short and wholesome". It only suggests shows you haven\'t seen, as cards you can click.',
    },
    {
        icon: BarChart2,
        title: 'Taste Analyzer',
        description: "Your top genres and studios, rating spread, media types and total watch time across everything you've finished.",
    },
    {
        icon: List,
        title: 'Your Whole List, Fast',
        description: 'Your full MAL list synced and cached. Filter by status and sort by score, episodes or last update.',
    },
    {
        icon: Filter,
        title: 'Plan to Watch, Ranked',
        description: 'Find out which show already on your Plan to Watch fits your taste best, so you know what to start next.',
    },
    {
        icon: CircleCheck,
        title: 'Clean UI, No Ads',
        description: 'No bullshit. Just you, your weeb data, and the shows you love.',
    },
];

const STEPS = [
    { title: 'Sign in', description: 'Log in with your MyAnimeList account. We copy your list.' },
    { title: 'Analyze', description: 'We work out your taste from your scores, genres and studios.' },
    { title: 'Recommend', description: 'Boom. You get bangers tailored to your style, each with a reason.' },
    { title: 'Discover more', description: 'No data selling. No spam. Just better anime suggestions.' },
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

const Landing = () => {
    // Logged-in visitors skip the login page
    const { isLoggedIn } = useAuth();
    const startPath = isLoggedIn ? '/dashboard' : '/get-started';

    // The hero text drifts up and fades as you scroll past it
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 500], [0, -120]);
    const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

    return (
        <div className="page-bg overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-4 backdrop-blur-md sm:px-8">
                <Link to="/" className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/30">
                        <Sparkles className="h-4 w-4" />
                    </span>
                    <span className="text-lg font-bold text-gradient">NextWeeb</span>
                </Link>
                <div className="hidden items-center gap-8 text-sm text-purple-200/80 md:flex">
                    <a href="#features" className="transition hover:text-white">Features</a>
                    <a href="#how-it-works" className="transition hover:text-white">How it works</a>
                </div>
                <Link to={startPath} className="btn-secondary px-5 py-2 text-sm">
                    {isLoggedIn ? 'Open app' : 'Log in'}
                </Link>
            </nav>

            {/* Hero: poster wall behind a big headline */}
            <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
                <PosterWall className="opacity-40" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(11_6_20/0.55)_0%,rgb(11_6_20/0.92)_60%,rgb(11_6_20)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />

                <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-4xl text-center">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="chip mx-auto mb-6 px-4 py-1.5 text-sm"
                    >
                        <Sparkles className="h-3.5 w-3.5 text-pink-300" /> Built on your MyAnimeList
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl"
                    >
                        Find your next
                        <br />
                        <span className="text-gradient-animated">favourite anime.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="mx-auto mt-6 max-w-xl text-lg text-purple-100/80 sm:text-xl"
                    >
                        NextWeeb reads your MyAnimeList history and tells you what to watch next, and why.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
                    >
                        <Link to={startPath} className="btn-primary px-8 py-4 text-lg">
                            {isLoggedIn ? 'Open NextWeeb' : 'Log in with MyAnimeList'}
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                        <a href="#how-it-works" className="btn-secondary px-8 py-4 text-lg">See how it works</a>
                    </motion.div>
                </motion.div>

                <motion.a
                    href="#problem"
                    aria-label="Scroll down"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-purple-300/70"
                >
                    <ChevronDown className="h-8 w-8" />
                </motion.a>
            </section>

            {/* Problem and solution */}
            <section id="problem" className="mx-auto max-w-6xl px-4 py-24 sm:px-8">
                <Reveal className="mb-14 text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                        Anime recs are <span className="text-gradient">broken</span>.
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-purple-200/80">
                        Tired of basic anime recs that don't get your vibe?
                    </p>
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

            {/* Features */}
            <section id="features" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-24 sm:px-8">
                <Reveal className="mb-14 text-center">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-pink-300">Features</p>
                    <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Everything your MAL list can tell you</h2>
                </Reveal>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map((f, i) => (
                        <Reveal key={f.title} delay={(i % 3) * 0.1}>
                            <motion.div
                                whileHover={{ y: -6 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="card group relative h-full overflow-hidden"
                            >
                                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-pink-500/0 blur-3xl transition duration-500 group-hover:bg-pink-500/20" />
                                <div className="icon mb-5 transition duration-300 group-hover:rotate-6 group-hover:scale-110">
                                    <f.icon className="h-5 w-5" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold">{f.title}</h3>
                                <p className="text-purple-200/75">{f.description}</p>
                            </motion.div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-24 sm:px-8">
                <Reveal className="mb-16 text-center">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-pink-300">How it works</p>
                    <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Get started in minutes, not hours</h2>
                </Reveal>
                <div className="relative grid gap-10 md:grid-cols-4">
                    {/* The line drawing itself across the steps */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute left-[12%] right-[12%] top-7 hidden h-px origin-left bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 md:block"
                    />
                    {STEPS.map((step, i) => (
                        <Reveal key={step.title} delay={i * 0.15} className="relative text-center">
                            <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-xl font-bold shadow-lg shadow-pink-500/30 ring-8 ring-ink">
                                {i + 1}
                            </div>
                            <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
                            <p className="text-sm text-purple-200/75">{step.description}</p>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* Closing call to action */}
            <section className="px-4 py-24 sm:px-8">
                <Reveal>
                    <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 p-10 text-center sm:p-16">
                        <PosterWall className="opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/40 via-purple-800/70 to-ink/95" />
                        <div className="relative">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Built by a weeb, for weebs.</h2>
                            <p className="mx-auto mt-4 max-w-xl text-lg text-purple-100/80">
                                I made NextWeeb to find anime that actually matches my taste. Plug in your list and see what it finds for yours.
                            </p>
                            <Link to={startPath} className="btn-primary mt-8 px-8 py-4 text-lg">
                                Get started <ArrowRight className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </Reveal>
            </section>

            <Footer />
        </div>
    );
};

export default Landing;
