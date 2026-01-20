import { useRef, useState, ReactNode } from 'react'

interface TooltipProps {
    children: ReactNode
    content: ReactNode
    showDelay?: number
    hideDelay?: number
    maxWidth?: string
    onlyIfTruncated?: boolean
}

const Tooltip = ({
    children,
    content,
    showDelay = 450,
    hideDelay = 250,
    maxWidth = 'max-w-xs',
    onlyIfTruncated = false,
}: TooltipProps) => {
    const triggerRef = useRef<HTMLDivElement>(null)
    const showTooltipTimeoutRef = useRef<number | null>(null)
    const hideTooltipTimeoutRef = useRef<number | null>(null)
    const [isTooltipMounted, setIsTooltipMounted] = useState(false)
    const [isTooltipOpen, setIsTooltipOpen] = useState(false)
    const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; position: 'above' | 'below' } | null>(null)

    const isTruncated = () => {
        if (!triggerRef.current) return false
        const el =
            triggerRef.current.querySelector<HTMLElement>('[data-tooltip-truncate]') ??
            triggerRef.current

        // Detect single-line truncation / overflow on the actual text element.
        return el.scrollWidth > el.clientWidth
    }

    const clearShowTimeout = () => {
        if (showTooltipTimeoutRef.current !== null) {
            window.clearTimeout(showTooltipTimeoutRef.current)
            showTooltipTimeoutRef.current = null
        }
    }

    const clearHideTimeout = () => {
        if (hideTooltipTimeoutRef.current !== null) {
            window.clearTimeout(hideTooltipTimeoutRef.current)
            hideTooltipTimeoutRef.current = null
        }
    }

    const openTooltip = () => {
        if (!triggerRef.current) return
        const rect = triggerRef.current.getBoundingClientRect()
        const spaceAbove = rect.top
        const spaceBelow = window.innerHeight - rect.bottom

        // Position above if there's more space above, otherwise below
        const position = spaceAbove > spaceBelow ? 'above' : 'below'
        const top = position === 'above' ? rect.top - 8 : rect.bottom + 8

        setTooltipPosition({ top, left: rect.left, position })
        setIsTooltipMounted(true)
        // next tick so opacity transition can run
        window.setTimeout(() => setIsTooltipOpen(true), 0)
    }

    const closeTooltip = () => {
        setIsTooltipOpen(false)
        window.setTimeout(() => {
            setIsTooltipMounted(false)
            setTooltipPosition(null)
        }, 180)
    }

    const handleTriggerMouseEnter = () => {
        if (onlyIfTruncated && !isTruncated()) return
        clearHideTimeout()
        clearShowTimeout()
        showTooltipTimeoutRef.current = window.setTimeout(() => {
            openTooltip()
        }, showDelay)
    }

    const handleTriggerMouseLeave = () => {
        clearShowTimeout()
        clearHideTimeout()
        hideTooltipTimeoutRef.current = window.setTimeout(() => {
            closeTooltip()
        }, hideDelay)
    }

    const handleTooltipMouseEnter = () => {
        clearHideTimeout()
        clearShowTimeout()
        if (!isTooltipMounted) openTooltip()
    }

    const handleTooltipMouseLeave = () => {
        clearHideTimeout()
        hideTooltipTimeoutRef.current = window.setTimeout(() => {
            closeTooltip()
        }, hideDelay)
    }

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleTriggerMouseEnter}
                onMouseLeave={handleTriggerMouseLeave}
            >
                {children}
            </div>
            {isTooltipMounted && tooltipPosition && (
                <div
                    className={`fixed z-50 ${maxWidth} rounded-md bg-slate-800 px-3 py-2 text-xs text-white shadow-lg select-text transition-opacity duration-200 ${isTooltipOpen ? 'opacity-100' : 'opacity-0'}`}
                    style={{
                        top: `${tooltipPosition.top}px`,
                        left: `${tooltipPosition.left}px`,
                        transform: tooltipPosition.position === 'above' ? 'translateY(-100%)' : 'none',
                        marginTop: tooltipPosition.position === 'above' ? '-8px' : '0',
                    }}
                    onMouseEnter={handleTooltipMouseEnter}
                    onMouseLeave={handleTooltipMouseLeave}
                >
                    {content}
                    {tooltipPosition.position === 'above' ? (
                        <div className="absolute left-4 top-full h-0 w-0 border-4 border-transparent border-t-slate-800" />
                    ) : (
                        <div className="absolute left-4 bottom-full h-0 w-0 border-4 border-transparent border-b-slate-800" />
                    )}
                </div>
            )}
        </>
    )
}

export default Tooltip
