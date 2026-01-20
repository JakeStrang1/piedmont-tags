import type { SpeciesData, Cut } from '../types/speciesData'

export const parseCsvToCutData = (csvText: string): SpeciesData => {
    const lines = csvText.trim().split('\n')
    
    // Skip header row
    const dataLines = lines.slice(1)
    
    // Group by species
    const speciesMap = new Map<string, Cut[]>()
    
    for (const line of dataLines) {
        if (!line.trim()) continue
        
        // Parse CSV line (handling quoted values)
        const values: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i]
            
            if (char === '"') {
                inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim())
                current = ''
            } else {
                current += char
            }
        }
        values.push(current.trim()) // Add last value
        
        if (values.length < 4) continue
        
        const species = values[0].toUpperCase()
        const cutName = values[1]
        const tags = parseInt(values[2], 10)
        const perAnimal = values[3].toUpperCase() === 'TRUE'
        
        if (!species || !cutName || isNaN(tags)) continue
        
        const cut: Cut = {
            name: cutName,
            tags,
            perAnimal,
        }
        
        if (!speciesMap.has(species)) {
            speciesMap.set(species, [])
        }
        
        speciesMap.get(species)!.push(cut)
    }
    
    // Convert map to array
    const result: SpeciesData = Array.from(speciesMap.entries()).map(([species, cuts]) => ({
        species,
        cuts,
    }))
    
    return result
}
