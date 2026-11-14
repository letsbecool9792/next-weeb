import { useEffect, useState } from 'react';
import { API_URL } from '../config';

/** A popular show's cover, from the public /api/showcase/ endpoint */
export type Cover = { id: number; title: string; image: string };

// One request per page load, shared by everything that shows covers
let request: Promise<Cover[]> | null = null;

export const loadCovers = () => {
    request ??= fetch(`${API_URL}/api/showcase/`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);
    return request;
};

/** Covers for decoration (poster wall, landing page). Empty until loaded. */
export const useShowcase = () => {
    const [covers, setCovers] = useState<Cover[]>([]);
    useEffect(() => {
        let alive = true;
        loadCovers().then((c) => alive && setCovers(c));
        return () => { alive = false; };
    }, []);
    return covers;
};
