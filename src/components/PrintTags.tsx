import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ReactDOM from 'react-dom/client'
import React from 'react'
import WrappedTag from './WrappedTag'
import TagSettings from './TagSettings'
import TagEditor from './TagEditor'
import { TAG_MAX_CONTAINER_WIDTH, TAG_GAP } from './tagConstants'
import { useTagSettings, TagSettingsProvider } from '../hooks/useTagSettings'
import { getStylesheets } from '../utilities/getStylesheets'
import {
    usePresets,
    getValidatedPresetName,
} from '../hooks/usePresets'
import type { EditorMode, PresetComposition } from '../types/presets'
import ConfirmDialog from './ConfirmDialog'

interface TagData {
    index: number
    tagNumber: string
    cutName: string
    numberOfTags: number
    species?: string
}

const EMPTY_PRESET_COMPOSITION: PresetComposition = {
    species: '',
    tags: [],
}

const buildPresetComposition = (
    species: string,
    tags: TagData[]
): PresetComposition => ({
    species,
    tags: tags
        .map((tag) => ({
            index: tag.index,
            cutName: tag.cutName,
            numberOfTags: tag.numberOfTags,
            species: tag.species,
        }))
        .sort((a, b) => a.index - b.index),
})

const PrintTags = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const {
        presets,
        isLoading: presetsLoading,
        savePresetComposition,
    } = usePresets()
    const { settings } = useTagSettings()

    const selectedPresetIdRaw = searchParams.get('presetId')
    const selectedPresetId = selectedPresetIdRaw
        ? Number.parseInt(selectedPresetIdRaw, 10)
        : null
    const isPresetMode = selectedPresetId !== null && Number.isFinite(selectedPresetId)
    const activePreset = useMemo(
        () =>
            isPresetMode
                ? presets.find((preset) => preset.id === selectedPresetId) ?? null
                : null,
        [isPresetMode, presets, selectedPresetId]
    )

    const [tags, setTags] = useState<TagData[]>([])
    const [tagNumber, setTagNumber] = useState('')
    const [species, setSpecies] = useState('')
    const [editorMode, setEditorMode] = useState<EditorMode>('quick')
    const [presetNameDraft, setPresetNameDraft] = useState('')
    const [isEditingPresetName, setIsEditingPresetName] = useState(false)
    const [presetError, setPresetError] = useState<string | null>(null)
    const [isSavingPreset, setIsSavingPreset] = useState(false)
    const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
    const [pendingLeavePath, setPendingLeavePath] = useState<string | null>(null)
    const [isTopAligned, setIsTopAligned] = useState(false)
    const [hoveredCardKey, setHoveredCardKey] = useState<string | null>(null)
    const [showSettings, setShowSettings] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isPresetMode) return
        if (presetsLoading) return
        if (!activePreset) {
            navigate('/')
            return
        }

        const composition = activePreset.composition ?? EMPTY_PRESET_COMPOSITION
        setEditorMode('quick')
        setSpecies(composition.species)
        setTagNumber('')
        setPresetNameDraft(activePreset.name)
        setIsEditingPresetName(false)
        setPresetError(null)
        setTags(
            composition.tags.map((tag) => ({
                index: tag.index,
                tagNumber: '',
                cutName: tag.cutName,
                numberOfTags: tag.numberOfTags,
                species: tag.species,
            }))
        )
    }, [activePreset, isPresetMode, navigate, presetsLoading])

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
    }, [tags])

    const savedComposition = useMemo(
        () => activePreset?.composition ?? EMPTY_PRESET_COMPOSITION,
        [activePreset]
    )
    const currentComposition = useMemo(
        () => buildPresetComposition(species, tags),
        [species, tags]
    )
    const isCompositionDirty = useMemo(() => {
        if (!isPresetMode || !activePreset) return false
        return (
            JSON.stringify(savedComposition) !==
            JSON.stringify(currentComposition)
        )
    }, [
        activePreset,
        currentComposition,
        isPresetMode,
        savedComposition,
    ])

    const canSavePresetChanges = isCompositionDirty
    const isPresetNameDirty = useMemo(() => {
        if (!isPresetMode || !activePreset) return false
        return presetNameDraft.trim() !== activePreset.name
    }, [activePreset, isPresetMode, presetNameDraft])
    const canSaveAnyPresetChanges = canSavePresetChanges || isPresetNameDirty

    const handlePresetNameBlur = () => {
        if (!activePreset) return
        const trimmed = presetNameDraft.trim()
        if (trimmed.length < 1 || trimmed.length > 50) {
            setPresetNameDraft(activePreset.name)
        } else {
            setPresetNameDraft(trimmed)
        }
        setIsEditingPresetName(false)
    }

    const handleSavePreset = async () => {
        if (!activePreset) return
        try {
            setPresetError(null)
            setIsSavingPreset(true)
            const validatedName = getValidatedPresetName(presetNameDraft)
            await savePresetComposition(
                activePreset.id,
                validatedName,
                currentComposition
            )
            setPresetNameDraft(validatedName)
        } catch (error) {
            setPresetError(
                error instanceof Error
                    ? error.message
                    : 'Failed to save preset changes.'
            )
        } finally {
            setIsSavingPreset(false)
        }
    }

    const confirmLeavePreset = () => {
        if (!isPresetMode) return true
        return !canSaveAnyPresetChanges
    }

    const requestLeave = (path: string) => {
        if (confirmLeavePreset()) {
            navigate(path)
            return
        }
        setPendingLeavePath(path)
        setIsDiscardDialogOpen(true)
    }

    const addCard = () => {
        setTags((prev) => {
            const nextIndex =
                prev.length === 0 ? 1 : Math.max(...prev.map((c) => c.index)) + 1
            return [
                ...prev,
                { index: nextIndex, tagNumber: tagNumber, species: species, cutName: '', numberOfTags: 1 },
            ]
        })
    }

    const deleteCard = useCallback((index: number) => {
        // When deleting a rendered tag instance, decrement numberOfTags on the shared entry.
        // If it would go below 1, remove the entry entirely.
        setTags((prevTags) =>
            prevTags
                .map((tag) => {
                    if (tag.index !== index) return tag
                    const nextCount = Math.max(0, Math.floor(tag.numberOfTags || 1) - 1)
                    return { ...tag, numberOfTags: nextCount }
                })
                .filter((tag) => Math.max(0, Math.floor(tag.numberOfTags || 0)) > 0)
        )
    }, [])

    const updateTagNumber = useCallback((index: number, tagNumber: string) => {
        setTags((prevTags) =>
            prevTags.map((tag) =>
                tag.index === index ? { ...tag, tagNumber } : tag
            )
        )
    }, [])

    const updateTagCutName = useCallback((index: number, cutName: string) => {
        setTags((prevTags) =>
            prevTags.map((tag) =>
                tag.index === index ? { ...tag, cutName } : tag
            )
        )
    }, [])

    const expandedCards = useCallback(() => {
        const sorted = [...tags].sort((a, b) => a.index - b.index)
        const out: Array<{
            key: string
            baseIndex: number
            tagNumber: string
            cutName: string
            displayIndex: number
            instanceIndex: number
        }> = []

        let displayIndex = 0
        for (const card of sorted) {
            const count = Math.max(1, Math.floor(card.numberOfTags || 1))
            for (let i = 1; i <= count; i++) {
                out.push({
                    key: `${card.index}-${i}`,
                    baseIndex: card.index,
                    tagNumber: card.tagNumber,
                    cutName: card.cutName,
                    displayIndex,
                    instanceIndex: i,
                })
                displayIndex++
            }
        }
        return out
    }, [tags])

    const scrollPreviewToTagIndex = useCallback((tagIndex: number) => {
        const container = containerRef.current
        if (!container) return

        const el = container.querySelector(
            `[data-tag-index="${tagIndex}"]`
        ) as HTMLElement | null

        if (!el) return

        const containerRect = container.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        const top = elRect.top - containerRect.top + container.scrollTop

        container.scrollTo({ top, behavior: 'smooth' })
    }, [])

    const tagElements = useCallback((printable: boolean = false) => {
        return expandedCards().map((card) => (
            <WrappedTag
                key={card.key}
                tagNumber={card.tagNumber}
                tagText={card.cutName}
                isHovered={hoveredCardKey === card.key}
                onMouseEnter={() => setHoveredCardKey(card.key)}
                onMouseLeave={() => setHoveredCardKey(null)}
                onDelete={() => deleteCard(card.baseIndex)}
                // Edits apply to the shared tag entry so all rendered instances update together.
                onTagNumberChange={(value) => updateTagNumber(card.baseIndex, value)}
                onTagTextChange={(value) => updateTagCutName(card.baseIndex, value)}
                printable={printable}
                colorIndex={card.displayIndex}
                dataTagIndex={!printable && card.instanceIndex === 1 ? card.baseIndex : undefined}
            />
        ))
    }, [expandedCards, hoveredCardKey, deleteCard, updateTagNumber, updateTagCutName])

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
    }, [tags, settings, tagElements])

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
                    height: showPreview ? `${settings.labelHeightInches}in` : 0,
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
                                onClick={() => {
                                    requestLeave('/')
                                }}
                            >
                                Main Menu
                            </button>
                            <span className="text-slate-400">›</span>
                            {!isPresetMode && <span>Print Tags</span>}
                            {isPresetMode && (
                                <>
                                    <button
                                        type="button"
                                        className="text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                                        onClick={() => {
                                            requestLeave('/?presets=1')
                                        }}
                                    >
                                        Presets
                                    </button>
                                    <span className="text-slate-400">›</span>
                                    <span>{activePreset?.name ?? 'Preset'}</span>
                                </>
                            )}
                        </div>
                        <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-md text-xl text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                            onClick={() => {
                                requestLeave('/')
                            }}
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>
                    {isPresetMode && !presetsLoading && activePreset && (
                        <div className="border-b-2 border-emerald-400 bg-emerald-100 px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-xl text-emerald-900">
                                    <span className="font-semibold">PRESET:</span>
                                    {isEditingPresetName ? (
                                        <input
                                            autoFocus
                                            type="text"
                                            value={presetNameDraft}
                                            maxLength={50}
                                            onChange={(e) =>
                                                setPresetNameDraft(
                                                    e.target.value
                                                )
                                            }
                                            onBlur={handlePresetNameBlur}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handlePresetNameBlur()
                                                }
                                                if (e.key === 'Escape') {
                                                    setPresetNameDraft(
                                                        activePreset.name
                                                    )
                                                    setIsEditingPresetName(false)
                                                }
                                            }}
                                            className="max-w-full border-0 border-b-2 border-emerald-700 bg-transparent px-1 py-0 text-xl font-normal text-emerald-900 focus:border-emerald-700 focus:outline-none focus:ring-0"
                                            style={{ width: '50ch' }}
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setIsEditingPresetName(true)
                                            }
                                            className="border-0 border-b-2 border-transparent px-1 text-left text-xl font-normal text-emerald-900 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                                        >
                                            {presetNameDraft}
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void handleSavePreset()}
                                    disabled={
                                        isSavingPreset || !canSaveAnyPresetChanges
                                    }
                                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-400"
                                >
                                    Save Preset
                                </button>
                            </div>
                            {presetError && (
                                <p className="mt-2 text-sm text-red-700">
                                    {presetError}
                                </p>
                            )}
                        </div>
                    )}
                    <div className="flex flex-1 overflow-hidden bg-slate-50">
                        {/* Left Column - Tag Content */}
                        <div className="relative flex flex-1 overflow-hidden">
                            <div
                                ref={containerRef}
                                className={`flex flex-1 overflow-y-auto px-8 py-8 ${isTopAligned ? 'items-start' : 'items-center'} justify-center`}
                            >
                                <div
                                    ref={contentRef}
                                    className="flex w-full flex-col items-center"
                                    style={{ maxWidth: `${TAG_MAX_CONTAINER_WIDTH}px`, gap: `${TAG_GAP}px` }}
                                >
                                    {tagElements(false)}
                                    <div className="flex items-center" style={{ width: `${(settings.labelWidthInches * settings.scale) + (2 * 1.5)}in` }}>
                                        <div className="shrink-0" style={{ width: `1.5in` }} />
                                        <button
                                            type="button"
                                            onClick={addCard}
                                            className="flex h-20 items-center justify-center border-2 border-dashed border-slate-400 bg-slate-100 text-slate-600 transition-all hover:border-slate-500 hover:bg-slate-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                                            style={{
                                                width: `${settings.labelWidthInches * settings.scale}in`,
                                            }}
                                        >
                                            <span className="text-xl font-medium">+ Add Tag</span>
                                        </button>
                                        <div className="shrink-0" style={{ width: `1.5in` }} />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons - Anchored to left column */}
                            <div className="absolute bottom-12 right-12 flex flex-col gap-3">
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
                        </div>

                        {/* Right Column - Tag Editor */}
                        <TagEditor
                            tags={tags}
                            setTags={setTags}
                            tagNumber={tagNumber}
                            setTagNumber={setTagNumber}
                            species={species}
                            setSpecies={setSpecies}
                            onFocusTagIndex={scrollPreviewToTagIndex}
                            mode={editorMode}
                            setMode={setEditorMode}
                            presetMode={isPresetMode}
                        />
                    </div>
                </div>
            </div>
            <TagSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
            <ConfirmDialog
                isOpen={isDiscardDialogOpen}
                title="Discard changes?"
                message="You have unsaved preset changes. Discard them and continue?"
                confirmLabel="Discard"
                cancelLabel="Cancel"
                dangerConfirm
                onCancel={() => {
                    setIsDiscardDialogOpen(false)
                    setPendingLeavePath(null)
                }}
                onConfirm={() => {
                    if (pendingLeavePath) {
                        navigate(pendingLeavePath)
                    }
                    setIsDiscardDialogOpen(false)
                    setPendingLeavePath(null)
                }}
            />
        </>
    )
}

export default PrintTags
