import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

export interface PrintSettings {
    labelWidthInches: number
    labelHeightInches: number
}

const DEFAULT_SETTINGS: PrintSettings = {
    labelWidthInches: 2,
    labelHeightInches: 3,
}

const STORAGE_KEY = 'printSettings'

interface PrintSettingsContextType {
    settings: PrintSettings
    updateSettings: (updates: Partial<PrintSettings>) => void
    resetToDefaults: () => void
}

const PrintSettingsContext = createContext<PrintSettingsContextType | undefined>(undefined)

export const PrintSettingsProvider = ({ children }: { children: ReactNode }) => {
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

    return (
        <PrintSettingsContext.Provider value={{ settings, updateSettings, resetToDefaults }}>
            {children}
        </PrintSettingsContext.Provider>
    )
}

export const usePrintSettings = () => {
    const context = useContext(PrintSettingsContext)
    if (context === undefined) {
        throw new Error('usePrintSettings must be used within a PrintSettingsProvider')
    }
    return context
}
