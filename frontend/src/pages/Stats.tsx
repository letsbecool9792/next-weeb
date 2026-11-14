import { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Award, BarChart2, Building2, Clock, Film, PieChart as PieIcon, Star, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import AppShell from '../components/AppShell';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/ui/PageHeader';
import Row from '../components/ui/Row';
import PosterCard from '../components/ui/PosterCard';
import CountUp from '../components/ui/CountUp';
import Reveal from '../components/ui/Reveal';
import { API_URL } from '../config';
import { authFetch } from '../utils/fetch';
import { averageScore, LOAD_ERROR } from '../utils/format';
import type { StatsEntry } from '../types';

const tooltipStyle = {
    contentStyle: { background: 'rgba(20, 11, 34, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' },
    labelStyle: { color: '#f9a8d4', fontWeight: 600 },
    cursor: { fill: 'rgba(255,255,255,0.04)' },
};
const axis = { stroke: 'rgba(233, 213, 255, 0.5)', fontSize: 12, tickLine: false, axisLine: false };
const PIE_COLORS = ['#ec4899', '#a855f7', '#38bdf8', '#f59e0b', '#34d399', '#f472b6'];

/** Counts per value, biggest first */
const countBy = (values: string[]) => {
    const map = new Map<string, number>();
    values.forEach((v) => v && map.set(v, (map.get(v) || 0) + 1));
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
};

const ChartCard = ({ icon, title, children, delay = 0 }: { icon: React.ReactNode; title: string; children: React.ReactNode; delay?: number }) => (
    <Reveal delay={delay}>
        <div className="card h-full">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold">{icon}{title}</h2>
            {children}
        </div>
    </Reveal>
);

const Stats = () => {
    const [animeList, setAnimeList] = useState<StatsEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await authFetch(`${API_URL}/api/stats-data/`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setAnimeList(await res.json());
        } catch {
            setError(LOAD_ERROR);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const header = (
        <PageHeader
            eyebrow="Stats"
            title={<>Your anime, <span className="text-gradient">by the numbers</span></>}
            subtitle={loading ? 'Crunching your stats...' : `Across the ${animeList.length} shows you've completed`}
        />
    );

    if (loading) {
        return (
            <AppShell>
                {header}
                <div className="grid grid-cols-2 gap-4 px-4 sm:px-8 lg:grid-cols-4">
                    {Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton h-28" />)}
                </div>
                <div className="mt-6 grid gap-6 px-4 sm:px-8 lg:grid-cols-2">
                    {Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton h-80" />)}
                </div>
            </AppShell>
        );
    }

    if (error || animeList.length === 0) {
        return (
            <AppShell>
                {header}
                {error ? (
                    <ErrorState message={error} onRetry={load} />
                ) : (
                    <div className="card mx-auto max-w-xl text-center text-purple-200">
                        Stats are built from the shows you've completed. Mark a few as completed on MyAnimeList, then sync.
                    </div>
                )}
            </AppShell>
        );
    }

    const genreData = countBy(animeList.flatMap((a) => a.genres)).slice(0, 10);
    const studioData = countBy(animeList.flatMap((a) => a.studios)).slice(0, 10);
    const mediaData = countBy(animeList.map((a) => (a.media_type || 'unknown').toUpperCase().replace('_', ' ')));

    // Every score from 1 to 10, so gaps show as empty bars instead of disappearing
    const scoreData = Array.from({ length: 10 }, (_, i) => ({
        name: String(i + 1),
        count: animeList.filter((a) => a.score === i + 1).length,
    }));

    const totalMinutes = animeList.reduce((t, a) => t + ((a.num_episodes || 0) * (a.average_episode_duration || 0)) / 60, 0);
    const average = averageScore(animeList.map((a) => a.score));
    const perfectTens = animeList.filter((a) => a.score === 10);

    const tiles = [
        { label: 'Completed', icon: Film, value: animeList.length, decimals: 0, note: 'shows' },
        { label: 'Watch time', icon: Clock, value: totalMinutes / 60, decimals: 0, note: `hours · ${(totalMinutes / 60 / 24).toFixed(1)} days` },
        { label: 'Average score', icon: Star, value: average ?? 0, decimals: 2, note: average === null ? 'nothing rated yet' : 'out of 10', empty: average === null },
        { label: 'Perfect 10s', icon: Award, value: perfectTens.length, decimals: 0, note: 'masterpieces' },
    ];

    return (
        <AppShell>
            {header}

            <div className="mb-8 grid grid-cols-2 gap-4 px-4 sm:px-8 lg:grid-cols-4">
                {tiles.map((t, i) => (
                    <motion.div
                        key={t.label}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        whileHover={{ y: -4 }}
                        className="card relative overflow-hidden p-5"
                    >
                        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-pink-500/15 blur-2xl" />
                        <div className="flex items-center justify-between">
                            <p className="text-xs uppercase tracking-widest text-purple-300/70">{t.label}</p>
                            <t.icon className="h-5 w-5 text-pink-300" />
                        </div>
                        <p className="mt-2 text-4xl font-bold">{t.empty ? '–' : <CountUp value={t.value} decimals={t.decimals} />}</p>
                        <p className="mt-1 text-xs text-purple-300/60">{t.note}</p>
                    </motion.div>
                ))}
            </div>

            <div className="mb-12 grid gap-6 px-4 sm:px-8 lg:grid-cols-2">
                <ChartCard icon={<TrendingUp className="h-5 w-5 text-pink-400" />} title="Top genres">
                    <ResponsiveContainer width="100%" height={340}>
                        <BarChart data={genreData} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <defs>
                                <linearGradient id="g-genre" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#a855f7" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                </linearGradient>
                            </defs>
                            <XAxis type="number" allowDecimals={false} {...axis} />
                            <YAxis type="category" dataKey="name" width={110} {...axis} />
                            <Tooltip {...tooltipStyle} />
                            <Bar dataKey="count" fill="url(#g-genre)" radius={[0, 8, 8, 0]} animationDuration={1200} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard icon={<Building2 className="h-5 w-5 text-sky-400" />} title="Top studios" delay={0.1}>
                    <ResponsiveContainer width="100%" height={340}>
                        <BarChart data={studioData} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <defs>
                                <linearGradient id="g-studio" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#38bdf8" />
                                </linearGradient>
                            </defs>
                            <XAxis type="number" allowDecimals={false} {...axis} />
                            <YAxis type="category" dataKey="name" width={130} {...axis} />
                            <Tooltip {...tooltipStyle} />
                            <Bar dataKey="count" fill="url(#g-studio)" radius={[0, 8, 8, 0]} animationDuration={1200} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard icon={<BarChart2 className="h-5 w-5 text-amber-300" />} title="How you rate">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={scoreData}>
                            <defs>
                                <linearGradient id="g-score" x1="0" y1="1" x2="0" y2="0">
                                    <stop offset="0%" stopColor="#be185d" />
                                    <stop offset="100%" stopColor="#f472b6" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="name" {...axis} />
                            <YAxis allowDecimals={false} {...axis} />
                            <Tooltip {...tooltipStyle} labelFormatter={(l) => `Score ${l}`} />
                            <Bar dataKey="count" fill="url(#g-score)" radius={[8, 8, 0, 0]} animationDuration={1200} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard icon={<PieIcon className="h-5 w-5 text-purple-400" />} title="Formats" delay={0.1}>
                    <div className="flex flex-col items-center gap-6 sm:flex-row">
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={mediaData} dataKey="count" nameKey="name" innerRadius="58%" outerRadius="88%" paddingAngle={3} stroke="none" animationDuration={1200}>
                                    {mediaData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip {...tooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                        <ul className="w-full space-y-2 sm:w-48">
                            {mediaData.map((m, i) => (
                                <li key={m.name} className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2">
                                        <span className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                        {m.name}
                                    </span>
                                    <span className="text-purple-300/70">{Math.round((m.count / animeList.length) * 100)}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </ChartCard>
            </div>

            <Row title="Your perfect 10s" icon={<Award className="h-5 w-5 text-amber-300" />} subtitle="Every show you gave a 10">
                {perfectTens.map((a) => (
                    <PosterCard key={a.mal_id} to={`/anime/${a.mal_id}`} title={a.title} image={a.image} score={10} />
                ))}
            </Row>
        </AppShell>
    );
};

export default Stats;
