/** Shapes of the backend's responses, shared by several pages. */

/** A show on the user's own list (GET /api/cached-animelist/) */
export type ListEntry = {
    mal_id: number;
    title: string;
    image_url: string | null;
    image_large: string | null;
    status: string;
    score: number | null;      // 0 or null when not rated
    episodes_watched: number | null;
    is_rewatching: boolean;
    start_date: string | null;
    finish_date: string | null;
    last_updated: string | null;
};

/** A recommended show (recommendations and AI chat) */
export type Pick = {
    id: number;
    title: string;
    image: string | null;
    image_large?: string | null;
    score: number | null;  // MAL community score, when known
    reason: string;        // why it was picked
};

/** The MAL profile (GET /api/cached-profile/) */
export type Profile = {
    name: string | null;
    birthday: string | null;
    location: string | null;
    joined_at: string | null;
    picture: string | null;
};

/** A completed show with details, for stats (GET /api/stats-data/) */
export type StatsEntry = {
    mal_id: number;
    title: string;
    image: string | null;
    score: number;
    genres: string[];
    studios: string[];
    num_episodes: number;
    average_episode_duration: number; // seconds
    media_type: string;
};

export const STATUS_LABELS: Record<string, string> = {
    watching: 'Watching',
    completed: 'Completed',
    on_hold: 'On Hold',
    dropped: 'Dropped',
    plan_to_watch: 'Plan to Watch',
};

/** Tailwind classes per status, used for badges */
export const STATUS_COLORS: Record<string, string> = {
    watching: 'bg-emerald-500/90',
    completed: 'bg-sky-500/90',
    on_hold: 'bg-amber-500/90',
    dropped: 'bg-rose-500/90',
    plan_to_watch: 'bg-purple-500/90',
};
