/**
 * The NextWeeb mark: an 8-bit heart, pink at the top fading to purple, with
 * one white "shine" pixel. Drawn on a 9 x 8 pixel grid so it stays crisp
 * at 16px (shapeRendering="crispEdges" turns off anti-aliasing).
 */
const ROWS = ['011000110', '111101111', '111111111', '111111111', '011111110', '001111100', '000111000', '000010000'];
const ROW_COLORS = ['#f9a8d4', '#f472b6', '#ec4899', '#e040c8', '#d946ef', '#b84ae8', '#9333ea', '#7c3aed'];

const PixelHeart = ({ className = 'h-8 w-8' }: { className?: string }) => (
    <svg viewBox="0 0 54 48" className={className} shapeRendering="crispEdges" aria-hidden="true">
        {ROWS.map((row, y) =>
            [...row].map((cell, x) =>
                cell === '1' ? <rect key={`${x}-${y}`} x={x * 6} y={y * 6} width="6" height="6" fill={ROW_COLORS[y]} /> : null,
            ),
        )}
        <rect x="12" y="12" width="6" height="6" fill="#fff" />
    </svg>
);

export default PixelHeart;
