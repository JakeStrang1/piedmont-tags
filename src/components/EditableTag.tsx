import { getTagDimensionsPx } from './tagConstants'
import { usePrintSettings } from '../hooks/usePrintSettings'

interface EditableTagProps {
    tagNumber: string
    tagText: string
    onTagNumberChange: (value: string) => void
    onTagTextChange: (value: string) => void
}

const EditableTag = ({ tagNumber, tagText, onTagNumberChange, onTagTextChange }: EditableTagProps) => {
    const { settings } = usePrintSettings()
    // Calculate pixel dimensions from label dimensions in settings
    const { width: widthPx, height: heightPx } = getTagDimensionsPx(
        settings.labelWidthInches,
        settings.labelHeightInches
    )

    return (
        <div
            className="border border-slate-900 bg-white p-10 shadow-xl"
            style={{
                width: `${widthPx}px`,
                height: `${heightPx}px`,
                boxSizing: 'border-box',
                flexShrink: 0,
                minWidth: `${widthPx}px`,
                maxWidth: `${widthPx}px`,
                minHeight: `${heightPx}px`,
                maxHeight: `${heightPx}px`,
                display: 'block',
            }}
        >
            <div className="flex h-full flex-col items-center justify-center gap-5">
                <input
                    type="text"
                    value={tagNumber}
                    onChange={(e) => onTagNumberChange(e.target.value)}
                    className="w-full rounded-md bg-transparent text-center text-5xl font-semibold text-slate-900 outline-none border border-transparent px-2 py-1 m-0 transition-all hover:bg-slate-100 focus:bg-slate-100 focus:border-dashed focus:border-slate-400 focus:ring-0 focus:outline-none"
                />
                <br />
                <br />
                <input
                    type="text"
                    value={tagText}
                    onChange={(e) => onTagTextChange(e.target.value)}
                    className="w-full rounded-md bg-transparent text-center text-5xl font-semibold text-slate-900 outline-none border border-transparent px-2 py-1 m-0 transition-all hover:bg-slate-100 focus:bg-slate-100 focus:border-dashed focus:border-slate-400 focus:ring-0 focus:outline-none"
                />
            </div>
        </div>
    )
}

export default EditableTag
