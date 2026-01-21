import { useState, useRef, useEffect } from 'react'

interface AutocompleteOption {
    value: string
    label: string
}

interface AutocompleteProps {
    value: string
    onChange: (value: string) => void
    options: AutocompleteOption[]
    placeholder?: string
    disabled?: boolean
    className?: string
    inputClassName?: string
    forceUppercase?: boolean
    allowCustomValues?: boolean
    autoFocus?: boolean
    compact?: boolean
}

const Autocomplete = ({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    disabled = false,
    className = '',
    inputClassName = '',
    forceUppercase = false,
    allowCustomValues = false,
    autoFocus = false,
    compact = false,
}: AutocompleteProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)
    const [menuRect, setMenuRect] = useState<{
        top: number
        left: number
        width: number
        maxHeight: number
        placement: 'top' | 'bottom'
    } | null>(null)

    // Find the selected option's label
    const selectedOption = options.find((opt) => opt.value === value)

    // If allowCustomValues is true and value doesn't match any option, use value directly
    const hasCustomValue = allowCustomValues && value && !selectedOption

    const displayValue = selectedOption
        ? forceUppercase
            ? selectedOption.label.toUpperCase()
            : selectedOption.label
        : hasCustomValue
            ? forceUppercase
                ? value.toUpperCase()
                : value
            : forceUppercase
                ? inputValue.toUpperCase()
                : inputValue

    // Filter options based on input
    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(inputValue.toLowerCase())
    )

    // Update input value when value prop changes
    useEffect(() => {
        if (selectedOption) {
            setInputValue(selectedOption.label)
        } else if (allowCustomValues && value) {
            setInputValue(value)
        } else {
            setInputValue('')
        }
    }, [value, selectedOption, allowCustomValues])

    useEffect(() => {
        if (!autoFocus) return
        // next tick so parent layout is stable
        window.setTimeout(() => inputRef.current?.focus(), 0)
    }, [autoFocus])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setHighlightedIndex(-1)
                // Reset input to selected value if no selection was made
                if (selectedOption) {
                    setInputValue(selectedOption.label)
                } else if (allowCustomValues && value) {
                    setInputValue(value)
                } else {
                    setInputValue('')
                }
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, selectedOption, allowCustomValues, value])

    // Scroll highlighted option into view
    useEffect(() => {
        if (isOpen && highlightedIndex >= 0 && listRef.current) {
            const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
            if (highlightedElement) {
                highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
            }
        }
    }, [highlightedIndex, isOpen])

    const recomputeMenuRect = () => {
        if (!inputRef.current) return
        const rect = inputRef.current.getBoundingClientRect()
        const margin = 6
        const desiredMaxHeight = 240
        const spaceBelow = window.innerHeight - rect.bottom - margin
        const spaceAbove = rect.top - margin
        const placement: 'top' | 'bottom' =
            spaceBelow >= 140 || spaceBelow >= spaceAbove ? 'bottom' : 'top'

        const maxHeight = Math.max(
            120,
            Math.min(desiredMaxHeight, placement === 'bottom' ? spaceBelow : spaceAbove)
        )

        const width = rect.width
        const left = Math.max(
            margin,
            Math.min(rect.left, window.innerWidth - width - margin)
        )
        const top = placement === 'bottom' ? rect.bottom + margin : rect.top - margin

        setMenuRect({ top, left, width, maxHeight, placement })
    }

    useEffect(() => {
        if (!isOpen) {
            setMenuRect(null)
            return
        }

        recomputeMenuRect()

        const onResize = () => recomputeMenuRect()
        const onScroll = () => recomputeMenuRect()

        window.addEventListener('resize', onResize)
        // capture=true so we respond to scrolls on any parent scroller
        window.addEventListener('scroll', onScroll, true)
        return () => {
            window.removeEventListener('resize', onResize)
            window.removeEventListener('scroll', onScroll, true)
        }
    }, [isOpen])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = e.target.value
        // Force uppercase if prop is set
        if (forceUppercase) {
            newValue = newValue.toUpperCase()
        }
        setInputValue(newValue)
        setIsOpen(true)
        // Opening can change placement near viewport edges
        window.setTimeout(() => recomputeMenuRect(), 0)
        setHighlightedIndex(-1)

        // Auto-select if there's an exact match (case-insensitive comparison)
        const exactMatch = options.find(
            (opt) => opt.label.toLowerCase() === newValue.toLowerCase()
        )
        if (exactMatch) {
            onChange(exactMatch.value)
        } else if (allowCustomValues) {
            // Allow custom values if prop is enabled
            onChange(newValue)
        } else {
            // Clear selection if no exact match and custom values not allowed
            onChange('')
        }
    }

    const handleInputFocus = () => {
        setIsOpen(true)
        window.setTimeout(() => recomputeMenuRect(), 0)
        setHighlightedIndex(-1)
    }

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const nextFocused = e.relatedTarget as Node | null
        // If focus is still within the autocomplete container (e.g. interacting with the menu),
        // don't close here.
        if (nextFocused && containerRef.current?.contains(nextFocused)) return

        setIsOpen(false)
        setHighlightedIndex(-1)
    }

    const handleSelect = (option: AutocompleteOption) => {
        onChange(option.value)
        setInputValue(option.label)
        setIsOpen(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                if (!isOpen) {
                    setIsOpen(true)
                } else {
                    setHighlightedIndex((prev) =>
                        prev < filteredOptions.length - 1 ? prev + 1 : prev
                    )
                }
                break
            case 'ArrowUp':
                e.preventDefault()
                if (isOpen) {
                    setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
                }
                break
            case 'Enter':
                e.preventDefault()
                if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex])
                } else if (isOpen && filteredOptions.length === 1) {
                    // If only one option matches, select it
                    handleSelect(filteredOptions[0])
                } else if (allowCustomValues && inputValue.trim()) {
                    // Accept custom value if allowCustomValues is enabled
                    onChange(inputValue.trim())
                    setIsOpen(false)
                    setHighlightedIndex(-1)
                    inputRef.current?.blur()
                }
                break
            case 'Escape':
                e.preventDefault()
                setIsOpen(false)
                setHighlightedIndex(-1)
                if (selectedOption) {
                    setInputValue(selectedOption.label)
                } else if (allowCustomValues && value) {
                    setInputValue(value)
                } else {
                    setInputValue('')
                }
                inputRef.current?.blur()
                break
        }
    }

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <input
                ref={inputRef}
                type="text"
                value={displayValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full border-0 border-b-2 border-slate-300 bg-transparent px-0 ${compact ? 'py-0.5' : 'py-2'} text-lg font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 ${inputClassName}`}
            />
            {isOpen && !disabled && filteredOptions.length > 0 && menuRect && (
                <ul
                    ref={listRef}
                    className="fixed z-50 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg"
                    style={{
                        left: `${menuRect.left}px`,
                        width: `${menuRect.width}px`,
                        maxHeight: `${menuRect.maxHeight}px`,
                        top: menuRect.placement === 'bottom' ? `${menuRect.top}px` : undefined,
                        bottom: menuRect.placement === 'top'
                            ? `${window.innerHeight - menuRect.top}px`
                            : undefined,
                    }}
                >
                    {filteredOptions.map((option, index) => {
                        const isOnlyOption = filteredOptions.length === 1
                        const isSelected = option.value === value
                        const isHighlighted = index === highlightedIndex

                        return (
                            <li
                                key={option.value}
                                onMouseDown={(e) => {
                                    // Select before the input loses focus (tabbing/clicking)
                                    e.preventDefault()
                                    handleSelect(option)
                                }}
                                onClick={() => handleSelect(option)}
                                className={`cursor-pointer px-3 py-2 text-sm transition-colors ${isHighlighted
                                    ? 'bg-blue-100 text-blue-900'
                                    : isOnlyOption || isSelected
                                        ? 'bg-blue-50 font-semibold text-slate-900'
                                        : 'text-slate-900 hover:bg-slate-100'
                                    }`}
                            >
                                {option.label}
                            </li>
                        )
                    })}
                </ul>
            )}
            {isOpen && !disabled && filteredOptions.length === 0 && inputValue && menuRect && (
                <ul
                    className="fixed z-50 rounded-md border border-slate-200 bg-white shadow-lg"
                    style={{
                        left: `${menuRect.left}px`,
                        width: `${menuRect.width}px`,
                        top: menuRect.placement === 'bottom' ? `${menuRect.top}px` : undefined,
                        bottom: menuRect.placement === 'top'
                            ? `${window.innerHeight - menuRect.top}px`
                            : undefined,
                    }}
                >
                    <li className="px-3 py-2 text-sm text-slate-500">No matches found</li>
                </ul>
            )}
        </div>
    )
}

export default Autocomplete
