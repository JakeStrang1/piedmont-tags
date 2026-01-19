import { useState, useEffect } from 'react'

export interface PrintSettings {
    labelWidthInches: number
    labelHeightInches: number
    fontSizeInches: number
    paddingInches: number
    borderWidthPoints: number
    textGapInches: number
    lineHeight: number
    textPaddingVerticalInches: number
    textPaddingHorizontalInches: number
    printerDPI: number
}

const DEFAULT_SETTINGS: PrintSettings = {
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

const STORAGE_KEY = 'printSettings'

export const usePrintSettings = () => {
    const [settings, setSettings] = useState<PrintSettings>(() => {
        // Load from localStorage on init
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                const parsed = JSON.parse(stored)
                // Merge with defaults to handle missing properties
                return { ...DEFAULT_SETTINGS, ...parsed }
            } catch {
                return DEFAULT_SETTINGS
            }
        }
        return DEFAULT_SETTINGS
    })

    // Save to localStorage whenever settings change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    }, [settings])

    const updateSettings = (updates: Partial<PrintSettings>) => {
        setSettings((prev) => ({ ...prev, ...updates }))
    }

    const resetToDefaults = () => {
        setSettings(DEFAULT_SETTINGS)
    }

    return {
        settings,
        updateSettings,
        resetToDefaults,
    }
}
