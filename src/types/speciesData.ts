export interface Cut {
    name: string
    tags: number
    perAnimal: boolean
}

export interface Species {
    species: string
    cuts: Cut[]
}

export type SpeciesData = Species[]
