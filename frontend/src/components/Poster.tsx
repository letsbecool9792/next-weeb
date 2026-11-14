import { useState } from 'react';

/**
 * Anime cover image. When MAL has no picture, or the image fails to load,
 * shows the title on a gradient tile instead of a broken-image icon.
 */
const Poster = ({ src, title, className = '' }: { src?: string | null; title: string; className?: string }) => {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <div className={`bg-gradient-to-br from-purple-800 to-fuchsia-900 flex items-center justify-center p-3 text-center text-sm text-purple-200 ${className}`}>
                {title}
            </div>
        );
    }

    return <img src={src} alt={title} loading="lazy" onError={() => setFailed(true)} className={className} />;
};

export default Poster;
