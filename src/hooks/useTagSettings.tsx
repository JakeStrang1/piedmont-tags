import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

export interface TagSettings {
    labelWidthInches: number
    labelHeightInches: number
    scale: number
    showPrintCorners: boolean
}

const DEFAULT_SETTINGS: TagSettings = {
    labelWidthInches: 3,
    labelHeightInches: 2,
    scale: 1.5,
    showPrintCorners: false,
}

const STORAGE_KEY = 'tagSettings'

interface TagSettingsContextType {
    settings: TagSettings
    updateSettings: (updates: Partial<TagSettings>) => void
    resetToDefaults: () => void
}

const TagSettingsContext = createContext<TagSettingsContextType | undefined>(undefined)

export const TagSettingsProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<TagSettings>(() => {
        // Load from localStorage on init
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                const parsed = JSON.parse(stored)
                // Merge with defaults to handle missing properties
                // Ensure scale defaults to 1 if missing or invalid
                const loaded = { ...DEFAULT_SETTINGS, ...parsed }
                if (!loaded.scale || typeof loaded.scale !== 'number' || loaded.scale <= 0) {
                    loaded.scale = 1
                }
                // Ensure showPrintCorners defaults to false if missing or invalid
                if (typeof loaded.showPrintCorners !== 'boolean') {
                    loaded.showPrintCorners = false
                }
                return loaded
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

    const updateSettings = (updates: Partial<TagSettings>) => {
        setSettings((prev) => ({ ...prev, ...updates }))
    }

    const resetToDefaults = () => {
        setSettings(DEFAULT_SETTINGS)
    }

    return (
        <TagSettingsContext.Provider value={{ settings, updateSettings, resetToDefaults }}>
            {children}
        </TagSettingsContext.Provider>
    )
}

export const useTagSettings = () => {
    const context = useContext(TagSettingsContext)
    if (context === undefined) {
        throw new Error('useTagSettings must be used within a TagSettingsProvider')
    }
    return context
}
