/** A failed load: what went wrong and a retry button. */
const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
    <div className="card text-center max-w-xl mx-auto my-12">
        <p className="text-red-300 mb-4">{message}</p>
        {onRetry && (
            <button onClick={onRetry} className="btn-primary mx-auto">
                Try again
            </button>
        )}
    </div>
);

export default ErrorState;
