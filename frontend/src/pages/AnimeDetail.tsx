import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ExternalLink, Users, Trophy, TrendingUp, Heart, Link2 } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import AppShell from '../components/AppShell';
import ErrorState from '../components/ErrorState';
import HeroBanner from '../components/ui/HeroBanner';
import Row from '../components/ui/Row';
import PosterCard from '../components/ui/PosterCard';
import ScoreRing from '../components/ui/ScoreRing';
import Reveal from '../components/ui/Reveal';
import { HeroSkeleton } from '../components/ui/Skeleton';
import { API_URL } from '../config';
import { authFetch } from '../utils/fetch';
import { formatDate, humanize, LOAD_ERROR } from '../utils/format';
import { STATUS_LABELS } from '../types';

type ShowRef = { id: number; title: string; main_picture?: { medium: string; large?: string } };

// MAL leaves fields out for some shows (no picture, no statistics yet, an
// unaired show with no score...). Everything optional is marked with ?.
type Detail = {
    id: number;
    title: string;
    main_picture?: { medium: string; large?: string };
    alternative_titles?: { synonyms?: string[]; en?: string; ja?: string };
    start_date?: string;
    end_date?: string;
    synopsis?: string;
    background?: string;
    mean?: number;
    rank?: number;
    popularity?: number;
    num_list_users?: number;
    num_scoring_users?: number;
    media_type?: string;
    status?: string;
    genres?: { id: number; name: string }[];
    my_list_status?: {
        status?: string;
        score?: number;
        num_episodes_watched?: number;
        start_date?: string;
        finish_date?: string;
    };
    num_episodes?: number;
    start_season?: { year: number; season: string };
    source?: string;
    average_episode_duration?: number;
    rating?: string;
    studios?: { id: number; name: string }[];
    statistics?: { status?: Record<string, string> };
    related_anime?: { node: ShowRef; relation_type_formatted?: string }[];
    recommendations?: { node: ShowRef; num_recommendations?: number }[];
};

const STAT_COLORS: Record<string, string> = {
    watching: 'from-emerald-400 to-emerald-600',
    completed: 'from-sky-400 to-sky-600',
    on_hold: 'from-amber-400 to-amber-600',
    dropped: 'from-rose-400 to-rose-600',
    plan_to_watch: 'from-purple-400 to-purple-600',
};

const AnimeDetail = () => {
    const { anime_id } = useParams<{ anime_id: string }>();
    const [detail, setDetail] = useState<Detail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<'not_found' | 'failed' | null>(null);
    const [expanded, setExpanded] = useState(false);
    const posthog = usePostHog();

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        setExpanded(false);
        try {
            const res = await authFetch(`${API_URL}/api/anime/${anime_id}/`);
            if (res.status === 404) {
                setError('not_found');
                return;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: Detail = await res.json();
            setDetail(data);
            window.scrollTo({ top: 0 });

            posthog?.capture('anime_detail_viewed', { anime_id: data.id, anime_title: data.title, anime_score: data.mean });
        } catch {
            setError('failed');
        } finally {
            setLoading(false);
        }
    }, [anime_id, posthog]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) return <AppShell><HeroSkeleton /></AppShell>;

    if (error === 'failed') return (
        <AppShell>
            <div className="pt-24" />
            <ErrorState message={LOAD_ERROR} onRetry={load} />
        </AppShell>
    );

    if (!detail) return (
        <AppShell>
            <div className="overlay-center">
                <div className="overlay-box max-w-md">
                    <p className="text-xl font-semibold">Anime not found.</p>
                    <p className="mt-2 text-purple-300/80">MyAnimeList has no show with this id.</p>
                    <Link to="/animelist" className="btn-primary mt-6">Back to my list</Link>
                </div>
            </div>
        </AppShell>
    );

    const minutesPerEpisode = detail.average_episode_duration ? Math.round(detail.average_episode_duration / 60) : null;
    const mine = detail.my_list_status;
    const watched = mine?.num_episodes_watched ?? 0;
    const progress = detail.num_episodes ? Math.min(watched / detail.num_episodes, 1) : 0;

    const stats = Object.entries(detail.statistics?.status ?? {}).map(([k, v]) => [k, parseInt(v, 10) || 0] as const);
    const statTotal = stats.reduce((s, [, v]) => s + v, 0) || 1;

    const synopsis = detail.synopsis || 'No synopsis yet.';
    const longSynopsis = synopsis.length > 600;

    const info: [string, React.ReactNode][] = [
        ['Aired', `${formatDate(detail.start_date)} to ${formatDate(detail.end_date, '?')}`],
        ['Episodes', `${detail.num_episodes || '?'}${minutesPerEpisode ? ` × ${minutesPerEpisode} min` : ''}`],
        ['Studios', (detail.studios ?? []).map((s) => s.name).join(', ') || 'Unknown'],
        ['Season', detail.start_season ? `${detail.start_season.season} ${detail.start_season.year}` : 'Unknown'],
        ['Source', humanize(detail.source) || 'Unknown'],
        ['Rating', detail.rating?.toUpperCase().replace('_', '-') || 'Unknown'],
    ];

    return (
        <AppShell>
            <HeroBanner
                key={detail.id}
                image={detail.main_picture?.large ?? detail.main_picture?.medium}
                poster={detail.main_picture?.large ?? detail.main_picture?.medium ?? null}
                eyebrow={detail.alternative_titles?.en && detail.alternative_titles.en !== detail.title ? detail.alternative_titles.en : detail.alternative_titles?.ja}
                title={detail.title}
                meta={
                    <>
                        {detail.media_type && <span className="chip">{detail.media_type.toUpperCase().replace('_', ' ')}</span>}
                        {detail.status && <span className="chip capitalize">{humanize(detail.status)}</span>}
                        {(detail.genres ?? []).map((g) => (
                            <span key={g.id} className="chip border-pink-400/30 bg-pink-500/15">{g.name}</span>
                        ))}
                    </>
                }
                actions={
                    <>
                        <a href={`https://myanimelist.net/anime/${detail.id}`} target="_blank" rel="noreferrer" className="btn-primary px-6 py-3">
                            <ExternalLink className="h-4 w-4" /> Open on MyAnimeList
                        </a>
                        <button onClick={() => window.history.back()} className="btn-secondary px-6 py-3">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </button>
                    </>
                }
            />

            <div className="grid gap-6 px-4 sm:px-8 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Reveal>
                        <div className="card">
                            <h2 className="mb-3 text-xl font-bold">Synopsis</h2>
                            <motion.div
                                animate={{ height: expanded || !longSynopsis ? 'auto' : 168 }}
                                className="relative overflow-hidden"
                            >
                                <p className="whitespace-pre-line leading-relaxed text-purple-100/85">{synopsis}</p>
                                {longSynopsis && !expanded && <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-soft to-transparent" />}
                            </motion.div>
                            {longSynopsis && (
                                <button onClick={() => setExpanded((v) => !v)} className="mt-2 text-sm font-semibold text-pink-300 hover:text-pink-200">
                                    {expanded ? 'Show less' : 'Read more'}
                                </button>
                            )}
                        </div>
                    </Reveal>

                    {stats.length > 0 && (
                        <Reveal delay={0.1}>
                            <div className="card">
                                <h2 className="mb-5 flex items-center gap-2 text-xl font-bold">
                                    <Users className="h-5 w-5 text-purple-400" /> What MAL members are doing with it
                                </h2>
                                <div className="space-y-3">
                                    {stats.map(([key, value], i) => (
                                        <div key={key}>
                                            <div className="mb-1 flex justify-between text-sm">
                                                <span>{STATUS_LABELS[key] ?? humanize(key)}</span>
                                                <span className="text-purple-300/70">{value.toLocaleString()}</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-white/5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${(value / statTotal) * 100}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 1.1, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                                                    className={`h-full rounded-full bg-gradient-to-r ${STAT_COLORS[key] ?? 'from-pink-500 to-purple-500'}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Reveal>
                    )}

                    {detail.background && (
                        <Reveal delay={0.1}>
                            <div className="card">
                                <h2 className="mb-3 text-xl font-bold">Background</h2>
                                <p className="whitespace-pre-line leading-relaxed text-purple-100/80">{detail.background}</p>
                            </div>
                        </Reveal>
                    )}
                </div>

                <div className="space-y-6">
                    <Reveal>
                        <div className="card flex items-center gap-5">
                            <ScoreRing score={detail.mean} />
                            <div className="grid flex-1 gap-2 text-sm">
                                <p className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-purple-300/80"><Trophy className="h-4 w-4" /> Rank</span><b>#{detail.rank ?? '–'}</b></p>
                                <p className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-purple-300/80"><TrendingUp className="h-4 w-4" /> Popularity</span><b>#{detail.popularity ?? '–'}</b></p>
                                <p className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-purple-300/80"><Users className="h-4 w-4" /> Members</span><b>{detail.num_list_users?.toLocaleString() ?? '–'}</b></p>
                            </div>
                        </div>
                    </Reveal>

                    <Reveal delay={0.08}>
                        <div className="card">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Heart className="h-5 w-5 text-pink-400" /> On your list</h2>
                            {mine?.status ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="chip border-pink-400/30 bg-pink-500/15">{STATUS_LABELS[mine.status] ?? humanize(mine.status)}</span>
                                        <span className="text-sm text-purple-200/80">Your score: <b className="text-white">{mine.score || '–'}</b></span>
                                    </div>
                                    <div className="mt-4">
                                        <div className="mb-1 flex justify-between text-xs text-purple-300/80">
                                            <span>Episodes watched</span>
                                            <span>{watched} / {detail.num_episodes || '?'}</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress * 100}%` }}
                                                transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                                            />
                                        </div>
                                    </div>
                                    {(mine.start_date || mine.finish_date) && (
                                        <p className="mt-4 text-xs text-purple-300/70">
                                            {mine.start_date && <>Started {formatDate(mine.start_date)}</>}
                                            {mine.start_date && mine.finish_date && ' · '}
                                            {mine.finish_date && <>Finished {formatDate(mine.finish_date)}</>}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-purple-300/80">Not on your list yet.</p>
                            )}
                        </div>
                    </Reveal>

                    <Reveal delay={0.16}>
                        <div className="card">
                            <h2 className="mb-3 text-lg font-bold">Information</h2>
                            <dl className="divide-y divide-white/5">
                                {info.map(([label, value]) => (
                                    <div key={label} className="flex justify-between gap-4 py-2.5 text-sm">
                                        <dt className="text-purple-300/70">{label}</dt>
                                        <dd className="text-right capitalize">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                            {(detail.alternative_titles?.synonyms?.length ?? 0) > 0 && (
                                <p className="mt-3 text-xs text-purple-300/60">Also known as {detail.alternative_titles?.synonyms?.join(', ')}</p>
                            )}
                        </div>
                    </Reveal>
                </div>
            </div>

            <div className="mt-12">
                <Row title="Related" icon={<Link2 className="h-5 w-5 text-sky-400" />} subtitle="Sequels, prequels and side stories">
                    {(detail.related_anime ?? []).map((r) => (
                        <PosterCard
                            key={r.node.id}
                            to={`/anime/${r.node.id}`}
                            title={r.node.title}
                            image={r.node.main_picture?.medium}
                            subtitle={r.relation_type_formatted}
                        />
                    ))}
                </Row>
                <Row title="Fans also like" icon={<Heart className="h-5 w-5 text-pink-400" />} subtitle="Recommended by MyAnimeList members who loved this">
                    {(detail.recommendations ?? []).map((r) => (
                        <PosterCard
                            key={r.node.id}
                            to={`/anime/${r.node.id}`}
                            title={r.node.title}
                            image={r.node.main_picture?.medium}
                            subtitle={r.num_recommendations ? `${r.num_recommendations} recommendations` : undefined}
                        />
                    ))}
                </Row>
            </div>
        </AppShell>
    );
};

export default AnimeDetail;
