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
                                        <HelpTooltip description="The width of the label in inches. This controls both the on-screen tag dimensions (via aspect ratio) and the physical page size when printing. Changing this will update the tag's aspect ratio on screen to match the label dimensions, ensuring what you see matches what will be printed." />
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
                                        <HelpTooltip description="The height of the label in inches. This controls both the on-screen tag dimensions (via aspect ratio) and the physical page size when printing. Changing this will update the tag's aspect ratio on screen to match the label dimensions, ensuring what you see matches what will be printed." />
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
