/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import type { SpeciesData } from '../types/speciesData'
import { parseCsvToCutData } from '../utilities/parseCsv'
import csvData from '../assets/data.csv?raw'

interface SpeciesDataContextType {
    speciesData: SpeciesData
    isLoading: boolean
}

const SpeciesDataContext = createContext<SpeciesDataContextType | undefined>(undefined)

export const SpeciesDataProvider = ({ children }: { children: ReactNode }) => {
    const [speciesData, setSpeciesData] = useState<SpeciesData>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        try {
            const parsed = parseCsvToCutData(csvData)
            setSpeciesData(parsed)
        } catch (error) {
            console.error('Error parsing species CSV data:', error)
            setSpeciesData([])
        } finally {
            setIsLoading(false)
        }
    }, [])

    return (
        <SpeciesDataContext.Provider value={{ speciesData, isLoading }}>
            {children}
        </SpeciesDataContext.Provider>
    )
}

export const useSpeciesData = () => {
    const context = useContext(SpeciesDataContext)
    if (context === undefined) {
        throw new Error('useSpeciesData must be used within a SpeciesDataProvider')
    }
    return context
}

