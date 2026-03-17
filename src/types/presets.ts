export type EditorMode = 'quick' | 'manual'

export interface PresetTag {
    index: number
    cutName: string
    numberOfTags: number
    species?: string
}

export interface PresetComposition {
    species: string
    tags: PresetTag[]
}

export interface Preset {
    id: number
    name: string
    composition: PresetComposition | null
}
