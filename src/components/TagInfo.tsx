import { useRef, useState, useEffect } from 'react'
import Autocomplete from './Autocomplete'

const TAG_INFO_BG_HOVER = 'hover:bg-slate-100'
const TAG_INFO_BG_FOCUSED = 'bg-blue-100'
const TAG_INFO_BG_FOCUSED_HOVER = 'hover:bg-blue-100'
const TAG_INFO_DIVIDER = 'border-b border-slate-200/80'
const MEANINGFUL_TEXT_CLASS = '!text-blue-700'

type TagInfoProps = {
    value: string
    onChange: (value: string) => void
    options: Array<{ value: string; label: string }>
    onRemove?: () => void
    showRemove?: boolean
    autoFocus?: boolean
    inputClassName?: string
    numberOfTags?: number
    perAnimal?: boolean
    animalCount?: number
    onFocused?: () => void
    quickMode?: boolean
    // Manual mode props
    tagNumber?: string
    onTagNumberChange?: (value: string) => void
    tagNumberOptions?: Array<{ value: string; label: string }>
    species?: string
    onSpeciesChange?: (value: string) => void
    speciesOptions?: Array<{ value: string; label: string }>
    speciesDisabled?: boolean
    numberOfTagsInput?: number
    onNumberOfTagsChange?: (value: number) => void
    // Meaningful color props for manual mode
    tagNumberCanParseToLots?: boolean
    isTagSpeciesFromList?: boolean
    isTagCutTypeFromList?: boolean
    isNumberOfTagsCalculatedMatch?: boolean
    calculatedNumberOfTags?: number
    isManuallyOverridden?: boolean
}

const TagInfo = ({
    value,
    onChange,
    options,
    onRemove,
    showRemove = true,
    autoFocus = false,
    inputClassName,
    numberOfTags,
    perAnimal,
    animalCount,
    onFocused,
    quickMode,
    tagNumber,
    onTagNumberChange,
    tagNumberOptions = [],
    species,
    onSpeciesChange,
    speciesOptions,
    speciesDisabled,
    numberOfTagsInput,
    onNumberOfTagsChange,
    tagNumberCanParseToLots = false,
    isTagSpeciesFromList = false,
    isTagCutTypeFromList = false,
    isNumberOfTagsCalculatedMatch = false,
    calculatedNumberOfTags,
    isManuallyOverridden = false,
}: TagInfoProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const autocompleteRef = useRef<HTMLDivElement>(null)
    const mouseDownFromAutocompleteInputRef = useRef(false)
    const [isFocused, setIsFocused] = useState(false)
    const hasCalledOnFocusedRef = useRef(false)
    const [manualNumText, setManualNumText] = useState<string>('')

    const isCutTypeFromList = options.some((opt) => opt.value === value)

    // Track focus on container or any child element
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as Node
            // If focus is on the container or any child element, mark as focused
            if (container.contains(target)) {
                setIsFocused(true)
                if (!hasCalledOnFocusedRef.current) {
                    hasCalledOnFocusedRef.current = true
                    onFocused?.()
                }
            }
        }

        const handleFocusOut = (e: FocusEvent) => {
            const target = e.target as Node
            const relatedTarget = e.relatedTarget as Node | null
            // If focus is moving outside the container, remove focused state
            if (container.contains(target) && (!relatedTarget || !container.contains(relatedTarget))) {
                setIsFocused(false)
                hasCalledOnFocusedRef.current = false
            }
        }

        container.addEventListener('focusin', handleFocusIn)
        container.addEventListener('focusout', handleFocusOut)

        return () => {
            container.removeEventListener('focusin', handleFocusIn)
            container.removeEventListener('focusout', handleFocusOut)
        }
    }, [onFocused])

    useEffect(() => {
        if (quickMode) return
        if (numberOfTagsInput === undefined || numberOfTagsInput === null) {
            setManualNumText('')
            return
        }
        setManualNumText(String(numberOfTagsInput))
    }, [numberOfTagsInput, quickMode])

    const getHelpText = () => {
        if (!isCutTypeFromList || !numberOfTags) {
            return '1 tag'
        }

        if (!perAnimal) {
            return numberOfTags === 1 ? '1 tag' : `${numberOfTags} tags`
        }

        if (!animalCount || animalCount === 0) {
            return '1 tag'
        }

        const total = numberOfTags * animalCount
        return total === 1
            ? '1 tag'
            : `${numberOfTags} x ${animalCount} animal${animalCount === 1 ? '' : 's'} = ${total} tags`
    }

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // If mouse-down started in an autocomplete text input and mouse-up
        // happens elsewhere in this row, don't steal focus from the input.
        if (mouseDownFromAutocompleteInputRef.current) {
            mouseDownFromAutocompleteInputRef.current = false
            return
        }

        // If clicking on the autocomplete or its children, let it handle focus normally
        if (autocompleteRef.current?.contains(e.target as Node)) {
            return
        }
        // Otherwise, just focus the wrapper (which will show focus state but not open autocomplete)
        containerRef.current?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        // Don't intercept if the event is from an input element (user is typing)
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            return
        }

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            // Focus the input when pressing Enter/Space on the wrapper
            const el = containerRef.current?.querySelector('input')
            if (el instanceof HTMLInputElement) el.focus()
        }
    }

    return (
        <div
            ref={containerRef}
            role="button"
            tabIndex={0}
            onMouseDownCapture={(e) => {
                const target = e.target as HTMLElement
                const isTextInput =
                    target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
                mouseDownFromAutocompleteInputRef.current =
                    isTextInput &&
                    !!autocompleteRef.current?.contains(target)
            }}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            data-quick-mode={quickMode ? 'true' : 'false'}
            className={`group cursor-pointer outline-none transition-colors ${TAG_INFO_DIVIDER} ${isFocused ? `${TAG_INFO_BG_FOCUSED} ${TAG_INFO_BG_FOCUSED_HOVER}` : `${TAG_INFO_BG_HOVER}`}`}
            style={{
                height: "103px" // Ensures the height doesn't change between quick/manual modes
            }}
        >
            <div className="ms-12 me-4 flex items-center gap-3 h-full">
                <div ref={autocompleteRef} className="tag-info-content min-w-0 flex-1">
                    {quickMode ? (
                        <>
                            {isManuallyOverridden ? (
                                <div className="text-lg font-semibold text-slate-900">
                                    {value || 'Cut Type'}{' '}
                                    <span className="text-amber-600">- Manual</span>
                                </div>
                            ) : (
                                <Autocomplete
                                    value={value}
                                    onChange={onChange}
                                    options={options}
                                    placeholder="Cut Type"
                                    allowCustomValues
                                    autoFocus={autoFocus}
                                    forceUppercase={true}
                                    inputClassName={inputClassName}
                                />
                            )}
                            <div className="mt-1 min-h-[20px]">
                                <div className="text-xs text-slate-500">
                                    {isManuallyOverridden
                                        ? `${numberOfTagsInput ?? 1} tag${(numberOfTagsInput ?? 1) === 1 ? '' : 's'}`
                                        : getHelpText()}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="grid h-full grid-cols-12 grid-rows-2 gap-x-3 gap-y-1">
                            {/* Row 1: Tag # + Species */}
                            <div className="col-span-6 min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className="pb-0.5 text-xs font-semibold text-slate-500">
                                        Tag:
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <Autocomplete
                                            value={tagNumber || ''}
                                            onChange={(v) => onTagNumberChange?.(v)}
                                            options={tagNumberOptions}
                                            placeholder="Tag #"
                                            allowCustomValues
                                            forceUppercase={true}
                                            compact
                                            inputClassName={`!text-sm !font-semibold ${tagNumberCanParseToLots ? MEANINGFUL_TEXT_CLASS : ''}`}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-6 min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className="pb-0.5 text-xs font-semibold text-slate-500">
                                        Species:
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <Autocomplete
                                            value={species || ''}
                                            onChange={(v) => onSpeciesChange?.(v)}
                                            options={speciesOptions ?? []}
                                            placeholder="Species"
                                            disabled={speciesDisabled}
                                            allowCustomValues
                                            forceUppercase={true}
                                            compact
                                            inputClassName={`!text-sm !font-semibold ${isTagSpeciesFromList ? MEANINGFUL_TEXT_CLASS : ''}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Cut Type + # tags */}
                            <div className="col-span-9 min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className="pb-0.5 text-xs font-semibold text-slate-500">
                                        Cut:
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <Autocomplete
                                            value={value}
                                            onChange={onChange}
                                            options={options}
                                            placeholder="Cut Type"
                                            allowCustomValues
                                            autoFocus={autoFocus}
                                            forceUppercase={true}
                                            compact
                                            inputClassName={`${inputClassName ?? ''} !text-sm !font-semibold ${isTagCutTypeFromList ? MEANINGFUL_TEXT_CLASS : ''}`}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-3 flex min-w-0 items-end justify-end gap-0">
                                <div className="pb-1 text-sm font-semibold text-slate-500">x&nbsp;</div>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={manualNumText}
                                    onChange={(e) => {
                                        const next = e.target.value
                                        if (next === '') {
                                            setManualNumText('')
                                            return
                                        }
                                        if (!/^\d+$/.test(next)) return
                                        const val = parseInt(next, 10)
                                        if (val < 1 || val > 500) return
                                        setManualNumText(String(val))
                                        onNumberOfTagsChange?.(val)
                                    }}
                                    onBlur={() => {
                                        if (manualNumText.trim() !== '') return
                                        setManualNumText('1')
                                        onNumberOfTagsChange?.(1)
                                    }}
                                    aria-label="Number of tags"
                                    className={`w-12 border-0 border-b-2 border-slate-300 bg-transparent px-0 py-1 text-sm font-semibold focus:border-blue-500 focus:outline-none focus:ring-0 ${tagNumberCanParseToLots && isTagSpeciesFromList && isTagCutTypeFromList && isNumberOfTagsCalculatedMatch ? MEANINGFUL_TEXT_CLASS : 'text-slate-800'}`}
                                    style={{
                                        width: "30px"
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!calculatedNumberOfTags) return
                                        setManualNumText(String(calculatedNumberOfTags))
                                        onNumberOfTagsChange?.(calculatedNumberOfTags)
                                    }}
                                    disabled={!calculatedNumberOfTags || numberOfTagsInput === calculatedNumberOfTags}
                                    className={`px-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-700 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-40 ${numberOfTagsInput === calculatedNumberOfTags ? 'invisible' : ''}`}
                                    aria-label="Reset # of tags to calculated value"
                                    title="Reset to calculated value"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="h-4 w-4"
                                    >
                                        <path
                                            d="M21 12a9 9 0 1 1-2.64-6.36"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M21 3v6h-6"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                {showRemove && onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                        aria-label="Remove cut type"
                    >
                        <span className="inline-flex h-8 w-8 items-center justify-center text-3xl leading-none text-slate-400 hover:text-slate-800">
                            ×
                        </span>
                    </button>
                )}
            </div>
        </div>
    )
}

export default TagInfo

