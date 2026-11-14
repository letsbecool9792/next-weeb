/** Shared display helpers. */

/** Shown when a page could not reach the backend. */
export const LOAD_ERROR = "Couldn't reach the server. It may be waking up; try again in a moment.";

/**
 * Average of the scores that were actually given (MAL uses 0 for "not rated").
 * Returns null when nothing is rated, instead of dividing by zero (NaN).
 */
export const averageScore = (scores: (number | null | undefined)[]): number | null => {
    const rated = scores.filter((s): s is number => typeof s === 'number' && s > 0);
    return rated.length ? rated.reduce((sum, s) => sum + s, 0) / rated.length : null;
};

/** "Nov 14, 2026", or the fallback for empty or unparseable input. */
export const formatDate = (value: string | null | undefined, fallback = 'N/A'): string => {
    if (!value) return fallback;
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? fallback
        : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

/** "plan_to_watch" -> "plan to watch" */
export const humanize = (value: string | null | undefined): string => (value ?? '').replace(/_/g, ' ');
