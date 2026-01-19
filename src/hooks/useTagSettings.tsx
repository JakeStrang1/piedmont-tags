import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

export interface TagSettings {
    labelWidthInches: number
    labelHeightInches: number
}

const DEFAULT_SETTINGS: TagSettings = {
    labelWidthInches: 2,
    labelHeightInches: 3,
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
