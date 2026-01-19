import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import WrappedTag from './WrappedTag'
import EditableTag from './EditableTag'
import Printable from './Printable'
import PrintSettings from './PrintSettings'
import { PRINTABLE_WIDTH, TAG_MAX_CONTAINER_WIDTH, TAG_WRAPPER_WIDTH, TAG_GAP, getTagDimensionsPx } from './tagConstants'
import { usePrintSettings } from '../hooks/usePrintSettings'
import PrintTagContent from './PrintTagContent'

interface TagData {
    id: number
    tagNumber: string
    tagText: string
}

const PrintTags = () => {
    const navigate = useNavigate()
    const { settings } = usePrintSettings()
    const [cards, setCards] = useState<TagData[]>([{ id: 1, tagNumber: 'Tag #', tagText: 'CUT NAME' }])
    const [isTopAligned, setIsTopAligned] = useState(false)
    const [hoveredCardId, setHoveredCardId] = useState<number | null>(null)
    const [printFn, setPrintFn] = useState<(() => void) | null>(null)
    const [showPreview, setShowPreview] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const checkLayout = () => {
            if (contentRef.current && containerRef.current) {
                const contentHeight = contentRef.current.scrollHeight
                const containerHeight = containerRef.current.clientHeight
                // Switch to top-aligned when content exceeds 70% of container height
                setIsTopAligned(contentHeight > containerHeight * 0.7)
            }
        }

        checkLayout()
        window.addEventListener('resize', checkLayout)
        return () => window.removeEventListener('resize', checkLayout)
    }, [cards])

    const addCard = () => {
        setCards([...cards, { id: Date.now(), tagNumber: 'Tag #', tagText: 'CUT NAME' }])
    }

    const deleteCard = (id: number) => {
        setCards(cards.filter((card) => card.id !== id))
    }

    const updateTag = (id: number, tagNumber: string, tagText: string) => {
        setCards(cards.map((card) => (card.id === id ? { ...card, tagNumber, tagText } : card)))
    }

    const tagElements = () => {
        return cards.map((card) => (
            <WrappedTag
                key={card.id}
                tagNumber={card.tagNumber}
                tagText={card.tagText}
                isHovered={hoveredCardId === card.id}
                onMouseEnter={() => setHoveredCardId(card.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                onDelete={() => deleteCard(card.id)}
                onTagNumberChange={(value) => updateTag(card.id, value, card.tagText)}
                onTagTextChange={(value) => updateTag(card.id, card.tagNumber, value)}
            />
        ))
    }

    const printableTagElements = () => {
        return (
            <div
                className="flex w-full flex-col"
                style={{ maxWidth: `${TAG_MAX_CONTAINER_WIDTH}px`, gap: `${TAG_GAP}px` }}
            >
                {cards.map((card) => (
                    <div key={card.id} className="relative flex items-center print-tag-wrapper">
                        <div className="shrink-0 print-spacer" style={{ width: `${TAG_WRAPPER_WIDTH}px` }} />
                        <div className="print-tag-container">
                            <EditableTag
                                tagNumber={card.tagNumber}
                                tagText={card.tagText}
                                onTagNumberChange={() => { }}
                                onTagTextChange={() => { }}
                            />
                        </div>
                        <div className="shrink-0 print-spacer" style={{ width: `${TAG_WRAPPER_WIDTH}px` }} />
                    </div>
                ))}
            </div>
        )
    }

    // Memoize printData to prevent unnecessary re-renders
    const printData = useMemo(() => ({
        PrintTagContent,
        cards,
    }), [cards])

    return (
        <>
            <Printable
                PrintComponent={printableTagElements()}
                widthPx={PRINTABLE_WIDTH}
                show={showPreview}
                onPrintReady={(fn) => setPrintFn(() => fn)}
                printData={printData}
            />
            <div className="min-h-screen w-full bg-slate-100">
                <div className="flex h-screen w-full flex-col border border-slate-200 bg-slate-50 shadow-2xl">
                    <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-slate-50 px-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <button
                                type="button"
                                className="text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                                onClick={() => navigate('/')}
                            >
                                Main Menu
                            </button>
                            <span className="text-slate-400">›</span>
                            <span>Print Tags</span>
                        </div>
                        <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-md text-xl text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                            onClick={() => navigate('/')}
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>
                    <div
                        ref={containerRef}
                        className={`flex flex-1 overflow-y-auto bg-slate-50 px-8 py-8 ${isTopAligned ? 'items-start' : 'items-center'} justify-center`}
                    >
                        <div
                            ref={contentRef}
                            className="flex w-full flex-col items-center"
                            style={{ maxWidth: `${TAG_MAX_CONTAINER_WIDTH}px`, gap: `${TAG_GAP}px` }}
                        >
                            {tagElements()}
                            <div className="flex items-center">
                                <div className="shrink-0" style={{ width: `${TAG_WRAPPER_WIDTH}px` }} />
                                <button
                                    type="button"
                                    onClick={addCard}
                                    className="flex h-20 items-center justify-center border-2 border-dashed border-slate-400 bg-slate-100 text-slate-600 transition-all hover:border-slate-500 hover:bg-slate-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                                    style={{ width: `${getTagDimensionsPx(settings.labelWidthInches, settings.labelHeightInches).width}px` }}
                                >
                                    <span className="text-xl font-medium">+ Add Tag</span>
                                </button>
                                <div className="shrink-0" style={{ width: `${TAG_WRAPPER_WIDTH}px` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <PrintSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
            <div className="fixed bottom-12 right-12 flex flex-col gap-3">
                <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 rounded-xl bg-slate-600/80 px-6 py-4 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-slate-700/90 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                    aria-label="Print settings"
                >
                    <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-lg font-semibold">Settings</span>
                </button>
                <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className={`flex items-center gap-2 rounded-xl px-6 py-4 text-white shadow-lg backdrop-blur-sm transition-all hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${showPreview
                        ? 'bg-green-600/80 hover:bg-green-700/90 focus-visible:outline-green-500'
                        : 'bg-slate-600/80 hover:bg-slate-700/90 focus-visible:outline-slate-500'
                        }`}
                    aria-label="Toggle preview"
                >
                    <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <span className="text-lg font-semibold">Preview</span>
                </button>
                {printFn && (
                    <button
                        type="button"
                        onClick={() => printFn()}
                        className="flex items-center gap-2 rounded-xl bg-blue-600/80 px-6 py-4 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-blue-700/90 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                        aria-label="Print tags"
                    >
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span className="text-lg font-semibold">Print</span>
                    </button>
                )}
            </div>
        </>
    )
}

export default PrintTags
