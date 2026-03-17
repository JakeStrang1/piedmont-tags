/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react'
import type { Preset, PresetComposition } from '../types/presets'

interface PresetsContextType {
    presets: Preset[]
    isLoading: boolean
    createPreset: () => Promise<Preset>
    renamePreset: (id: number, name: string) => Promise<void>
    deletePreset: (id: number) => Promise<void>
    savePresetComposition: (
        id: number,
        name: string,
        composition: PresetComposition
    ) => Promise<void>
}

const PresetsContext = createContext<PresetsContextType | undefined>(undefined)

const normalizeNameForSave = (name: string) => name.trim()

const validatePresetName = (name: string) => {
    const trimmed = normalizeNameForSave(name)
    if (trimmed.length < 1 || trimmed.length > 50) {
        throw new Error('Preset name must be between 1 and 50 characters.')
    }
    return trimmed
}

const sanitizePresets = (raw: unknown): Preset[] => {
    if (!Array.isArray(raw)) return []

    return raw
        .map((item) => {
            if (!item || typeof item !== 'object') return null
            const candidate = item as Partial<Preset>
            if (
                typeof candidate.id !== 'number' ||
                typeof candidate.name !== 'string'
            ) {
                return null
            }

            const composition = candidate.composition
            const sanitizedComposition: PresetComposition | null =
                composition &&
                typeof composition === 'object' &&
                Array.isArray((composition as PresetComposition).tags) &&
                typeof (composition as PresetComposition).species === 'string'
                    ? {
                        species: (composition as PresetComposition).species,
                        tags: (composition as PresetComposition).tags,
                    }
                    : null

            return {
                id: candidate.id,
                name: candidate.name,
                composition: sanitizedComposition,
            } satisfies Preset
        })
        .filter((item): item is Preset => item !== null)
}

const readPresets = async (): Promise<Preset[]> => {
    const raw = await window.ipcRenderer.invoke('presets:read')
    return sanitizePresets(raw)
}

const writePresets = async (presets: Preset[]) => {
    await window.ipcRenderer.invoke('presets:write', presets)
}

export const PresetsProvider = ({ children }: { children: ReactNode }) => {
    const [presets, setPresets] = useState<Preset[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                const data = await readPresets()
                if (mounted) {
                    setPresets(data)
                }
            } finally {
                if (mounted) {
                    setIsLoading(false)
                }
            }
        }
        load()
        return () => {
            mounted = false
        }
    }, [])

    const persist = useCallback(async (next: Preset[]) => {
        setPresets(next)
        await writePresets(next)
    }, [])

    const createPreset = useCallback(async () => {
        const nextId = presets.reduce(
            (maxId, preset) => Math.max(maxId, preset.id),
            0
        ) + 1

        const created: Preset = {
            id: nextId,
            name: 'New Preset',
            composition: null,
        }

        const next = [...presets, created]
        await persist(next)
        return created
    }, [persist, presets])

    const renamePreset = useCallback(
        async (id: number, name: string) => {
            const trimmed = validatePresetName(name)
            if (!presets.some((preset) => preset.id === id)) {
                throw new Error('Preset not found.')
            }
            const next = presets.map((preset) =>
                preset.id === id ? { ...preset, name: trimmed } : preset
            )
            await persist(next)
        },
        [persist, presets]
    )

    const deletePreset = useCallback(
        async (id: number) => {
            if (!presets.some((preset) => preset.id === id)) {
                throw new Error('Preset not found.')
            }
            const next = presets.filter((preset) => preset.id !== id)
            await persist(next)
        },
        [persist, presets]
    )

    const savePresetComposition = useCallback(
        async (id: number, name: string, composition: PresetComposition) => {
            const trimmed = validatePresetName(name)
            if (!presets.some((preset) => preset.id === id)) {
                throw new Error('Preset not found.')
            }
            const next = presets.map((preset) =>
                preset.id === id
                    ? { ...preset, name: trimmed, composition }
                    : preset
            )
            await persist(next)
        },
        [persist, presets]
    )

    const value = useMemo(
        () => ({
            presets,
            isLoading,
            createPreset,
            renamePreset,
            deletePreset,
            savePresetComposition,
        }),
        [
            presets,
            isLoading,
            createPreset,
            renamePreset,
            deletePreset,
            savePresetComposition,
        ]
    )

    return (
        <PresetsContext.Provider value={value}>
            {children}
        </PresetsContext.Provider>
    )
}

export const usePresets = () => {
    const context = useContext(PresetsContext)
    if (!context) {
        throw new Error('usePresets must be used within a PresetsProvider')
    }
    return context
}

export const getValidatedPresetName = (name: string) => validatePresetName(name)
