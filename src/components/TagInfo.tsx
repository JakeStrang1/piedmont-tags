import { useRef, useState, useEffect } from 'react'
import Autocomplete from './Autocomplete'

const TAG_INFO_BG_HOVER = 'hover:bg-slate-100'
const TAG_INFO_BG_FOCUSED = 'bg-blue-100'
const TAG_INFO_BG_FOCUSED_HOVER = 'hover:bg-blue-100'
const TAG_INFO_DIVIDER = 'border-b border-slate-200/80'

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
}

const TagInfo = ({ value, onChange, options, onRemove, showRemove = true, autoFocus = false, inputClassName, numberOfTags, perAnimal, animalCount, onFocused }: TagInfoProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const autocompleteRef = useRef<HTMLDivElement>(null)
    const [isFocused, setIsFocused] = useState(false)
    const hasCalledOnFocusedRef = useRef(false)

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
        // If clicking on the autocomplete or its children, let it handle focus normally
        if (autocompleteRef.current?.contains(e.target as Node)) {
            return
        }
        // Otherwise, just focus the wrapper (which will show focus state but not open autocomplete)
        containerRef.current?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
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
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={`group cursor-pointer outline-none transition-colors ${TAG_INFO_DIVIDER} ${TAG_INFO_BG_HOVER} ${isFocused ? `${TAG_INFO_BG_FOCUSED} ${TAG_INFO_BG_FOCUSED_HOVER}` : ''}`}
        >
            <div className="ms-12 me-4 py-4 flex items-center gap-3">
                <div ref={autocompleteRef} className="min-w-0 flex-1">
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
                    <div className="mt-1 min-h-[20px]">
                        <div className="text-xs text-slate-500">
                            {getHelpText()}
                        </div>
                    </div>
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

