import { useState, useEffect, useRef } from 'react'
import { usePrintSettings, type PrintSettings } from '../hooks/usePrintSettings'

interface PrintSettingsProps {
    isOpen: boolean
    onClose: () => void
}

interface HelpTooltipProps {
    description: string
}

const HelpTooltip = ({ description }: HelpTooltipProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [position, setPosition] = useState<'left' | 'right'>('right')
    const tooltipRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isOpen &&
                tooltipRef.current &&
                buttonRef.current &&
                !tooltipRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            // Add listener on next tick to avoid immediate closure
            setTimeout(() => {
                document.addEventListener('click', handleClickOutside)
            }, 0)
        }

        return () => {
            document.removeEventListener('click', handleClickOutside)
        }
    }, [isOpen])

    return (
        <div className="relative inline-block" ref={tooltipRef}>
            <button
                ref={buttonRef}
                type="button"
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    // Determine if tooltip should appear on left or right
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    const spaceOnRight = window.innerWidth - rect.right
                    const spaceOnLeft = rect.left
                    setPosition(spaceOnRight < 300 && spaceOnLeft > 300 ? 'left' : 'right')
                    setIsOpen(!isOpen)
                }}
                onMouseDown={(e) => e.preventDefault()}
                className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-400 text-xs text-white transition-colors hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Help"
            >
                ?
            </button>
            {isOpen && (
                <div
                    className={`absolute top-6 z-20 w-64 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg ${
                        position === 'left' ? 'right-0' : 'left-0'
                    }`}
                >
                    {description}
                    <div
                        className={`absolute -top-1 h-2 w-2 rotate-45 bg-slate-900 ${
                            position === 'left' ? 'right-2' : 'left-2'
                        }`}
                    ></div>
                </div>
            )}
        </div>
    )
}

const PrintSettings = ({ isOpen, onClose }: PrintSettingsProps) => {
    const { settings, updateSettings, resetToDefaults } = usePrintSettings()
    const [localSettings, setLocalSettings] = useState(settings)

    // Update local settings when modal opens or settings change
    useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings)
        }
    }, [settings, isOpen])

    const handleChange = (key: keyof typeof settings, value: number) => {
        setLocalSettings((prev) => ({ ...prev, [key]: value }))
    }

    const handleSave = () => {
        updateSettings(localSettings)
        onClose()
    }

    const handleCancel = () => {
        setLocalSettings(settings)
        onClose()
    }

    const handleReset = () => {
        // Reset local form to defaults without saving
        const defaultValues: PrintSettings = {
            labelWidthInches: 2,
            labelHeightInches: 3,
            fontSizeInches: 0.4,
            paddingInches: 0.15,
            borderWidthPoints: 2,
            textGapInches: 0.2,
            lineHeight: 1.3,
            textPaddingVerticalInches: 0.05,
            textPaddingHorizontalInches: 0.1,
            printerDPI: 300,
        }
        setLocalSettings(defaultValues)
    }

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            {/* Drawer */}
            <div
                className={`fixed right-0 top-0 z-50 h-full w-full max-w-lg transform bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                        <h2 className="text-xl font-semibold text-slate-900">Print Settings</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-xl text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="space-y-6">
                        {/* Label Dimensions */}
                        <div>
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
                                Label Dimensions
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 flex items-center text-sm font-medium text-slate-700">
                                        Width (inches)
                                        <HelpTooltip description="This is the width set in the @page style attribute of the print iframe. It controls the overall page width when printing, and is used for both the page size and the tag container width. It does not affect the layout you see on screen." />
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.1"
                                        value={localSettings.labelWidthInches}
                                        onChange={(e) =>
                                            handleChange('labelWidthInches', parseFloat(e.target.value) || 0)
                                        }
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 flex items-center text-sm font-medium text-slate-700">
                                        Height (inches)
                                        <HelpTooltip description="This is the height set in the @page style attribute of the print iframe. It controls the overall page height when printing, and is used for both the page size and the tag container height. It does not affect the layout you see on screen." />
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.1"
                                        value={localSettings.labelHeightInches}
                                        onChange={(e) =>
                                            handleChange('labelHeightInches', parseFloat(e.target.value) || 0)
                                        }
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Typography */}
                        <div>
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
                                Typography
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 flex items-center text-sm font-medium text-slate-700">
                                        Font Size (inches)
                                        <HelpTooltip description="Controls the font size of the text inputs (tag number and tag text) when printing. This is applied to the .print-tag-container input elements in the print stylesheet. Larger values will make the text bigger on the printed label." />
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.1"
                                        value={localSettings.fontSizeInches}
                                        onChange={(e) =>
                                            handleChange('fontSizeInches', parseFloat(e.target.value) || 0)
                                        }
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 flex items-center text-sm font-medium text-slate-700">
                                        Line Height
                                        <HelpTooltip description="Controls the line height (leading) of the text inputs when printing. This is a unitless multiplier of the font size. For example, 1.3 means the line height is 1.3 times the font size. Higher values add more vertical space between lines of text." />
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.5"
                                        value={localSettings.lineHeight}
                                        onChange={(e) =>
                                            handleChange('lineHeight', parseFloat(e.target.value) || 0)
                                        }
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Spacing */}
                        <div>
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
                                Spacing
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 flex items-center text-sm font-medium text-slate-700">
                                        Tag Padding (inches)
                                        <HelpTooltip description="Controls the internal padding of the tag container (the white box with border) when printing. This is the space between the border and the text content. This padding is applied uniformly to all sides of the tag container." />
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={localSettings.paddingInches}
                                        onChange={(e) =>
                                            handleChange('paddingInches', parseFloat(e.target.value) || 0)
                                        }
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 flex items-center text-sm font-medium text-slate-700">
                                        Text Gap (inches)
                                        <HelpTooltip description="Controls the vertical gap (spacing) between the two text inputs (tag number and tag text) when printing. This is applied to the flex container's gap property, which spaces out the two input elements vertically." />
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={localSettings.textGapInches}
                                        onChange={(e) =>
                                            handleChange('textGapInches', parseFloat(e.target.value) || 0)
                                        }
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 flex items-center text-sm font-medium text-slate-700">
                                        Text Padding Vertical (inches)
                                        <HelpTooltip description="Controls the vertical (top and bottom) padding inside each text input when printing. This adds space above and below the text within each input field. Combined with horizontal padding, this creates the clickable/editable area around the text." />
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={localSettings.textPaddingVerticalInches}
                                        onChange={(e) =>
                                            handleChange(
                                                'textPaddingVerticalInches',
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 flex items-center text-sm font-medium text-slate-700">
                                        Text Padding Horizontal (inches)
                                        <HelpTooltip description="Controls the horizontal (left and right) padding inside each text input when printing. This adds space to the sides of the text within each input field. Combined with vertical padding, this creates the clickable/editable area around the text." />
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={localSettings.textPaddingHorizontalInches}
                                        onChange={(e) =>
                                            handleChange(
                                                'textPaddingHorizontalInches',
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Border */}
                        <div>
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
                                Border
                            </h3>
                            <div>
                                <label className="mb-1 flex items-center text-sm font-medium text-slate-700">
                                    Border Width (points)
                                    <HelpTooltip description="Controls the width of the border around the tag container when printing. This is specified in points (pt), where 1 point = 1/72 of an inch. The border is a solid black line that frames the entire tag. Set to 0 to remove the border." />
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={localSettings.borderWidthPoints}
                                    onChange={(e) =>
                                        handleChange('borderWidthPoints', parseFloat(e.target.value) || 0)
                                    }
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                        </div>

                        {/* Printer Info */}
                        <div>
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
                                Printer Information
                            </h3>
                            <div>
                                <label className="mb-1 flex items-center text-sm font-medium text-slate-700">
                                    Printer DPI (for reference)
                                    <HelpTooltip description="This setting is for reference only and does not affect the print output. DPI (dots per inch) indicates the printer's resolution. Common values are 300 DPI or 600 DPI. This can help you understand the relationship between inches and pixels when troubleshooting print quality, but the print stylesheet uses inches directly, so this value is not used in the actual printing process." />
                                </label>
                                <input
                                    type="number"
                                    step="1"
                                    min="72"
                                    value={localSettings.printerDPI}
                                    onChange={(e) =>
                                        handleChange('printerDPI', parseFloat(e.target.value) || 0)
                                    }
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    This is for reference only and doesn't affect print output
                                </p>
                            </div>
                        </div>
                    </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                        >
                            Reset to Defaults
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                        >
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default PrintSettings
