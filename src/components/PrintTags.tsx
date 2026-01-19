import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactDOM from 'react-dom/client'
import React from 'react'
import WrappedTag from './WrappedTag'
import TagSettings from './TagSettings'
import { TAG_MAX_CONTAINER_WIDTH, TAG_WRAPPER_WIDTH, TAG_GAP, getTagDimensionsPx } from './tagConstants'
import { useTagSettings, TagSettingsProvider } from '../hooks/useTagSettings'
import { getStylesheets } from '../utilities/getStylesheets'

interface TagData {
    id: number
    tagNumber: string
    tagText: string
}

const PrintTags = () => {
    const navigate = useNavigate()
    const { settings } = useTagSettings()
    const [cards, setCards] = useState<TagData[]>([{ id: 1, tagNumber: 'Tag #', tagText: 'CUT NAME' }])
    const [isTopAligned, setIsTopAligned] = useState(false)
    const [hoveredCardId, setHoveredCardId] = useState<number | null>(null)
    const [showSettings, setShowSettings] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
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

    const tagElements = useCallback((printable: boolean = false) => {
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
                printable={printable}
            />
        ))
    }, [cards, hoveredCardId])

    const printIframeRef = useRef<HTMLIFrameElement | null>(null)
    const printRootRef = useRef<ReactDOM.Root | null>(null)

    // Keep iframe content in sync with tags
    useEffect(() => {
        const iframe = printIframeRef.current
        if (!iframe) return

        const iframeDoc = iframe.contentDocument
        if (!iframeDoc) return

        // Get all stylesheets from the main document
        const stylesheets = getStylesheets()

        // Recreate entire iframe HTML structure
        iframeDoc.open()
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Print Tags</title>
                ${stylesheets}
                <style>
                    @page {
                        size: ${settings.labelWidthInches}in ${settings.labelHeightInches}in;
                        margin: 0;
                    }
                    
                    /* Ensure all elements are visible when printing */
                    @media print {
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    }
                </style>
            </head>
            <body>
                <div id="print-root"></div>
            </body>
            </html>
        `)
        iframeDoc.close()

        // Render React components into the iframe
        const rootElement = iframeDoc.getElementById('print-root')
        if (rootElement) {
            // Clean up previous root in cleanup function, not here
            const previousRoot = printRootRef.current
            const root = ReactDOM.createRoot(rootElement)
            printRootRef.current = root

            root.render(
                <React.StrictMode>
                    <TagSettingsProvider>
                        {tagElements(true)}
                    </TagSettingsProvider>
                </React.StrictMode>
            )

            // Cleanup function to unmount when dependencies change or component unmounts
            return () => {
                if (previousRoot) {
                    setTimeout(() => {
                        previousRoot.unmount()
                    }, 0)
                }
            }
        }
    }, [cards, settings, tagElements])

    const handlePrint = () => {
        const iframe = printIframeRef.current
        if (!iframe) return

        const iframeWindow = iframe.contentWindow
        if (!iframeWindow) return

        iframeWindow.focus()
        iframeWindow.print()
    }

    return (
        <>
            <iframe
                ref={printIframeRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: showPreview ? `${settings.labelWidthInches}in` : 0,
                    height: showPreview ? '600px' : 0,
                    margin: 0,
                    padding: 0,
                    border: 'none',
                    zIndex: 9999,
                    backgroundColor: 'green',
                    overflow: 'auto',
                }}
                title="print"
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
                            {tagElements(false)}
                            <div className="flex items-center">
                                <div className="shrink-0" style={{ width: `${TAG_WRAPPER_WIDTH}px` }} />
                                <button
                                    type="button"
                                    onClick={addCard}
                                    className="flex h-20 items-center justify-center border-2 border-dashed border-slate-400 bg-slate-100 text-slate-600 transition-all hover:border-slate-500 hover:bg-slate-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                                    style={{ width: `${settings.labelWidthInches}in` }}
                                >
                                    <span className="text-xl font-medium">+ Add Tag</span>
                                </button>
                                <div className="shrink-0" style={{ width: `${TAG_WRAPPER_WIDTH}px` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <TagSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
            <div className="fixed bottom-12 right-12 flex flex-col gap-3">
                <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 rounded-xl bg-slate-600/80 px-6 py-4 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-slate-700/90 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                    aria-label="Settings"
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
                    aria-label="Preview"
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
                <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-2 rounded-xl bg-blue-600/80 px-6 py-4 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-blue-700/90 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                    aria-label="Print"
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
            </div>
        </>
    )
}

export default PrintTags
