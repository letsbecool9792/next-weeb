import { useEffect, useRef } from 'react';
import { animate, useInView } from 'motion/react';

/**
 * A number that counts up from 0 when it scrolls into view.
 * Writes straight to the DOM on each frame instead of re-rendering React.
 */
const CountUp = ({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        const controls = animate(0, value, {
            duration: 1.4,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: (v) => {
                if (ref.current) ref.current.textContent = v.toFixed(decimals) + suffix;
            },
        });
        return () => controls.stop();
    }, [inView, value, decimals, suffix]);

    return <span ref={ref}>{(0).toFixed(decimals) + suffix}</span>;
};

export default CountUp;
