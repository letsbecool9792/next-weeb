import { motion } from 'motion/react';

type LoadingScreenProps = {
    message: string;
    subMessage?: string;
};

/** Full-screen loader for moments with no page layout yet (e.g. finishing login). */
export default function LoadingScreen({ message, subMessage }: LoadingScreenProps) {
    return (
        <div className="overlay-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="overlay-box max-w-sm"
            >
                <div className="relative mx-auto mb-5 h-14 w-14">
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 border-r-purple-500"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                    />
                    <div className="absolute inset-2 rounded-full bg-pink-500/20 blur-md" />
                </div>
                <p className="text-lg font-medium">{message}</p>
                {subMessage && <p className="mt-2 text-sm text-purple-300/80">{subMessage}</p>}
            </motion.div>
        </div>
    );
}
