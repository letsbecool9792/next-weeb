import { motion } from 'motion/react';

/** Title block for pages without a banner. Leaves room for the fixed header. */
const PageHeader = ({ eyebrow, title, subtitle, actions }: {
    eyebrow?: string;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
}) => (
    <div className="relative overflow-hidden px-4 pb-8 pt-28 sm:px-8">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-pink-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -top-10 left-1/3 h-56 w-56 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-pink-300">{eyebrow}</p>}
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
                {subtitle && <div className="mt-3 max-w-2xl text-purple-200/80">{subtitle}</div>}
            </motion.div>
            {actions && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-wrap gap-3"
                >
                    {actions}
                </motion.div>
            )}
        </div>
    </div>
);

export default PageHeader;
