import EditableTag from './EditableTag'
import { useTagSettings } from '../hooks/useTagSettings'

interface WrappedTagProps {
    tagNumber: string
    tagText: string
    isHovered: boolean
    onMouseEnter: () => void
    onMouseLeave: () => void
    onDelete: () => void
    onTagNumberChange: (value: string) => void
    onTagTextChange: (value: string) => void
    printable?: boolean
    colorIndex?: number
}

const WrappedTag = ({
    tagNumber,
    tagText,
    isHovered,
    onMouseEnter,
    onMouseLeave,
    onDelete,
    onTagNumberChange,
    onTagTextChange,
    printable = false,
    colorIndex = 0,
}: WrappedTagProps) => {
    const { settings } = useTagSettings()

    function tagContent() {
        return (
            <EditableTag
                tagNumber={tagNumber}
                tagText={tagText}
                onTagNumberChange={onTagNumberChange}
                onTagTextChange={onTagTextChange}
                printable={printable}
                colorIndex={colorIndex}
            />
        )
    }

    if (printable) {
        return tagContent()
    }

    // Calculate the visual width of the tag (base width * scale)
    // The wrapper width should be: visual tag width + fixed spacers on both sides
    const visualTagWidth = settings.labelWidthInches * settings.scale
    const visualTagHeight = settings.labelHeightInches * settings.scale
    const spacerWidthInches = 1.5
    const wrapperWidth = visualTagWidth + (2 * spacerWidthInches)

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                width: `${wrapperWidth}in`,
            }}
        >
            <div className="shrink-0" style={{ width: `${spacerWidthInches}in` }} />
            <div className="flex justify-center items-center" style={{ width: `${visualTagWidth}in`, height: `${visualTagHeight}in` }}>
                {tagContent()}
            </div>
            <div
                className="relative shrink-0"
                style={{
                    width: `${spacerWidthInches}in`,
                }}
            >
                {isHovered && !printable && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="absolute left-4 top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-xl bg-red-500 text-white shadow-lg transition-all hover:scale-110 hover:bg-red-600 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                        aria-label="Delete tag"
                    >
                        <svg
                            className="h-8 w-8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M6 18L18 6M6 6l12 12"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    )
}

export default WrappedTag

