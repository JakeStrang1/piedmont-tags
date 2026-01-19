import { useTagSettings } from '../hooks/useTagSettings'

const CHECKERBOARD_WIDTH = 3
const CHECKERBOARD_HEIGHT = 3

// Color palette for checkerboards (5 colors that rotate)
const CHECKERBOARD_COLORS = [
    { even: 'bg-blue-500', odd: 'bg-blue-300' },
    { even: 'bg-green-500', odd: 'bg-green-300' },
    { even: 'bg-purple-500', odd: 'bg-purple-300' },
    { even: 'bg-orange-500', odd: 'bg-orange-300' },
    { even: 'bg-pink-500', odd: 'bg-pink-300' },
]

interface EditableTagProps {
    tagNumber: string
    tagText: string
    onTagNumberChange: (value: string) => void
    onTagTextChange: (value: string) => void
    printable?: boolean
    colorIndex?: number
}

const EditableTag = ({ tagNumber, tagText, onTagNumberChange, onTagTextChange, printable = false, colorIndex = 0 }: EditableTagProps) => {
    const { settings } = useTagSettings()

    // Base dimensions in inches (without scale)
    const baseWidth = settings.labelWidthInches
    const baseHeight = settings.labelHeightInches

    // Apply scale only for on-screen display using CSS transform
    // For printable, scale is always 1 (no transform)
    const scaleValue = printable ? 1 : settings.scale

    // Get colors for this tag (rotate through 5 colors)
    const colors = CHECKERBOARD_COLORS[colorIndex % CHECKERBOARD_COLORS.length]

    // Render a checkerboard corner
    const renderCheckerboard = (position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
        if (!settings.showPrintCorners) return null

        const positionClasses = {
            'top-left': 'left-0 top-0',
            'top-right': 'right-0 top-0',
            'bottom-left': 'left-0 bottom-0',
            'bottom-right': 'right-0 bottom-0',
        }

        return (
            <div className={`absolute ${positionClasses[position]} grid`} style={{ gridTemplateColumns: `repeat(${CHECKERBOARD_WIDTH}, 1fr)`, gridTemplateRows: `repeat(${CHECKERBOARD_HEIGHT}, 1fr)` }}>
                {Array.from({ length: CHECKERBOARD_WIDTH * CHECKERBOARD_HEIGHT }).map((_, index) => {
                    const row = Math.floor(index / CHECKERBOARD_WIDTH)
                    const col = index % CHECKERBOARD_WIDTH
                    const isEven = (row + col) % 2 === 0
                    return (
                        <div
                            key={index}
                            className={isEven ? colors.even : colors.odd}
                            style={{ width: '20px', height: '20px' }}
                        />
                    )
                })}
            </div>
        )
    }

    return (
        <div
            className={`relative border border-slate-900 bg-white p-6 ${printable ? '' : 'shadow-xl'}`}
            style={{
                width: `${baseWidth}in`,
                height: `${baseHeight}in`,
                boxSizing: 'border-box',
                flexShrink: 0,
                minWidth: `${baseWidth}in`,
                maxWidth: `${baseWidth}in`,
                minHeight: `${baseHeight}in`,
                maxHeight: `${baseHeight}in`,
                display: 'block',
                transform: scaleValue !== 1 ? `scale(${scaleValue})` : undefined,
                transformOrigin: 'center center',
            }}
        >
            {renderCheckerboard('top-left')}
            {renderCheckerboard('top-right')}
            {renderCheckerboard('bottom-left')}
            {renderCheckerboard('bottom-right')}
            <div className="flex h-full flex-col items-center justify-center gap-3">
                <input
                    type="text"
                    value={tagNumber}
                    onChange={(e) => onTagNumberChange(e.target.value)}
                    readOnly={printable}
                    disabled={printable}
                    className="w-full rounded-md bg-transparent text-center text-3xl font-semibold text-slate-900 outline-none border border-transparent px-1.5 py-0.5 m-0 transition-all hover:bg-slate-100 focus:bg-slate-100 focus:border-dashed focus:border-slate-400 focus:ring-0 focus:outline-none disabled:hover:bg-transparent disabled:cursor-default"
                />
                <input
                    type="text"
                    value={tagText}
                    onChange={(e) => onTagTextChange(e.target.value)}
                    readOnly={printable}
                    disabled={printable}
                    className="w-full rounded-md bg-transparent text-center text-3xl font-semibold text-slate-900 outline-none border border-transparent px-1.5 py-0.5 m-0 transition-all hover:bg-slate-100 focus:bg-slate-100 focus:border-dashed focus:border-slate-400 focus:ring-0 focus:outline-none disabled:hover:bg-transparent disabled:cursor-default"
                />
            </div>
        </div>
    )
}

export default EditableTag
