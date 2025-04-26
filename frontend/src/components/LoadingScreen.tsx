type LoadingScreenProps = {
    message: string;
    subMessage?: string;
    spinning?: boolean;
};
  
export default function LoadingScreen({ message, subMessage, spinning }: LoadingScreenProps) {
    return (
        <div className="overlay-center">
            <div className="overlay-box">
                {spinning !== false && (
                    <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent 
                                    rounded-full mx-auto mb-4"></div>
                )}
                <p className="text-lg">{message}</p>
                {subMessage && <p className="text-purple-300 text-sm mt-2">{subMessage}</p>}
            </div>
        </div>
    );
}
  