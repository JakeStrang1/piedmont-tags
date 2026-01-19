import React from 'react'
import { getTagDimensionsPx, TAG_WRAPPER_WIDTH, TAG_MAX_CONTAINER_WIDTH, TAG_GAP } from './tagConstants'
import type { PrintSettings } from '../hooks/usePrintSettings'

interface PrintTagContentProps {
    cards: Array<{ id: number; tagNumber: string; tagText: string }>
    settings: PrintSettings
}

// Print-specific EditableTag that doesn't use context
const PrintEditableTag = ({
    tagNumber,
    tagText,
    settings,
}: {
    tagNumber: string
    tagText: string
    settings: PrintSettings
}) => {
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
                <div className="w-full rounded-md bg-transparent text-center text-5xl font-semibold text-slate-900 px-2 py-1 m-0">
                    {tagNumber}
                </div>
                <br />
                <br />
                <div className="w-full rounded-md bg-transparent text-center text-5xl font-semibold text-slate-900 px-2 py-1 m-0">
                    {tagText}
                </div>
            </div>
        </div>
    )
}

const PrintTagContent = ({ cards, settings }: PrintTagContentProps) => {
    return (
        <div
            className="flex w-full flex-col"
            style={{ maxWidth: `${TAG_MAX_CONTAINER_WIDTH}px`, gap: `${TAG_GAP}px` }}
        >
            {cards.map((card) => (
                <div key={card.id} className="relative flex items-center print-tag-wrapper">
                    <div className="shrink-0 print-spacer" style={{ width: `${TAG_WRAPPER_WIDTH}px` }} />
                    <div className="print-tag-container">
                        <PrintEditableTag
                            tagNumber={card.tagNumber}
                            tagText={card.tagText}
                            settings={settings}
                        />
                    </div>
                    <div className="shrink-0 print-spacer" style={{ width: `${TAG_WRAPPER_WIDTH}px` }} />
                </div>
            ))}
        </div>
    )
}

export default PrintTagContent
