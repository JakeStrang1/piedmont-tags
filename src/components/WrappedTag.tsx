import EditableTag from './EditableTag'
import { TAG_WRAPPER_WIDTH } from './tagConstants'

interface WrappedTagProps {
    tagNumber: string
    tagText: string
    isHovered: boolean
    onMouseEnter: () => void
    onMouseLeave: () => void
    onDelete: () => void
    onTagNumberChange: (value: string) => void
    onTagTextChange: (value: string) => void
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
}: WrappedTagProps) => {
    return (
        <div
            className="relative flex items-center"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="shrink-0" style={{ width: `${TAG_WRAPPER_WIDTH}px` }} />
            <EditableTag
                tagNumber={tagNumber}
                tagText={tagText}
                onTagNumberChange={onTagNumberChange}
                onTagTextChange={onTagTextChange}
            />
            <div className="relative shrink-0" style={{ width: `${TAG_WRAPPER_WIDTH}px` }}>
                {isHovered && (
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

