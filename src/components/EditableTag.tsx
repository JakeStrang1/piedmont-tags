import { getTagDimensionsPx } from './tagConstants'
import { useTagSettings } from '../hooks/useTagSettings'

const CHECKERBOARD_WIDTH = 3
const CHECKERBOARD_HEIGHT = 3

interface EditableTagProps {
    tagNumber: string
    tagText: string
    onTagNumberChange: (value: string) => void
    onTagTextChange: (value: string) => void
    printable?: boolean
}

const EditableTag = ({ tagNumber, tagText, onTagNumberChange, onTagTextChange, printable = false }: EditableTagProps) => {
    const { settings } = useTagSettings()
    // Calculate pixel dimensions from label dimensions in settings
    // const { width: widthPx, height: heightPx } = getTagDimensionsPx(
    //     settings.labelWidthInches,
    //     settings.labelHeightInches
    // )

    return (
        <div
            className={`relative border border-slate-900 bg-white p-10 ${printable ? '' : 'shadow-xl'}`}
            style={{
                width: `${settings.labelWidthInches}in`,
                height: `${settings.labelHeightInches}in`,
                boxSizing: 'border-box',
                flexShrink: 0,
                minWidth: `${settings.labelWidthInches}in`,
                maxWidth: `${settings.labelWidthInches}in`,
                minHeight: `${settings.labelHeightInches}in`,
                maxHeight: `${settings.labelHeightInches}in`,
                display: 'block',
            }}
        >
            <div className="absolute left-0 top-0 grid" style={{ gridTemplateColumns: `repeat(${CHECKERBOARD_WIDTH}, 1fr)`, gridTemplateRows: `repeat(${CHECKERBOARD_HEIGHT}, 1fr)` }}>
                {Array.from({ length: CHECKERBOARD_WIDTH * CHECKERBOARD_HEIGHT }).map((_, index) => {
                    const row = Math.floor(index / CHECKERBOARD_WIDTH)
                    const col = index % CHECKERBOARD_WIDTH
                    const isEven = (row + col) % 2 === 0
                    return (
                        <div
                            key={index}
                            className={isEven ? 'bg-blue-500' : 'bg-blue-300'}
                            style={{ width: '20px', height: '20px' }}
                        />
                    )
                })}
            </div>
            <div className="flex h-full flex-col items-center justify-center gap-5">
                <input
                    type="text"
                    value={tagNumber}
                    onChange={(e) => onTagNumberChange(e.target.value)}
                    readOnly={printable}
                    disabled={printable}
                    className="w-full rounded-md bg-transparent text-center text-5xl font-semibold text-slate-900 outline-none border border-transparent px-2 py-1 m-0 transition-all hover:bg-slate-100 focus:bg-slate-100 focus:border-dashed focus:border-slate-400 focus:ring-0 focus:outline-none disabled:hover:bg-transparent disabled:cursor-default"
                />
                <br />
                <br />
                <input
                    type="text"
                    value={tagText}
                    onChange={(e) => onTagTextChange(e.target.value)}
                    readOnly={printable}
                    disabled={printable}
                    className="w-full rounded-md bg-transparent text-center text-5xl font-semibold text-slate-900 outline-none border border-transparent px-2 py-1 m-0 transition-all hover:bg-slate-100 focus:bg-slate-100 focus:border-dashed focus:border-slate-400 focus:ring-0 focus:outline-none disabled:hover:bg-transparent disabled:cursor-default"
                />
            </div>
        </div>
    )
}

export default EditableTag
