import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Start every page at the top. The router keeps the scroll position when the
 * URL changes, so a page opened from halfway down another page used to open
 * halfway down too. Runs before paint, so there is no visible jump.
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();
    useLayoutEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [pathname]);
    return null;
};

export default ScrollToTop;
