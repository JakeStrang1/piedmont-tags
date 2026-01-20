import { useMemo, useState } from 'react'
import { parseLotNumbers } from '../utilities/parseLotNumbers'
import Tooltip from './Tooltip'
import { useSpeciesData } from '../hooks/useSpeciesData'
import Autocomplete from './Autocomplete'
import TagInfo from './TagInfo'

type EditorMode = 'quick' | 'manual'

interface TagData {
    index: number
    tagNumber: string
    cutName: string
    numberOfTags: number
}

interface TagEditorProps {
    tags: TagData[]
    setTags: React.Dispatch<React.SetStateAction<TagData[]>>
    onFocusTagIndex?: (tagIndex: number) => void
}

const TagEditor = ({ tags, setTags, onFocusTagIndex }: TagEditorProps) => {
    const [mode, setMode] = useState<EditorMode>('quick')
    const [tagNumber, setTagNumber] = useState('')
    const [species, setSpecies] = useState('')

    const { speciesData, isLoading } = useSpeciesData()

    const derivedLots = useMemo(() => parseLotNumbers(tagNumber), [tagNumber])
    const meaningfulTextClass = 'text-blue-700'

    const speciesOptions = useMemo(() => {
        const names = speciesData
            .map((s) => s.species)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))

        return names.map((name) => ({ value: name, label: name }))
    }, [speciesData])

    const isSpeciesFromList = useMemo(() => {
        if (!species) return false
        return speciesOptions.some((o) => o.value === species)
    }, [species, speciesOptions])

    const selectedSpeciesCutCount = useMemo(() => {
        if (!isSpeciesFromList) return null
        const match = speciesData.find((s) => s.species === species)
        return match ? match.cuts.length : null
    }, [isSpeciesFromList, species, speciesData])

    const cutTypeOptions = useMemo(() => {
        if (!isSpeciesFromList) return []
        const match = speciesData.find((s) => s.species === species)
        if (!match) return []

        const names = match.cuts
            .map((c) => c.name)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))

        return names.map((name) => ({ value: name, label: name }))
    }, [isSpeciesFromList, species, speciesData])

    const updateTagCutName = (tagIndex: number, cutName: string) => {
        let matchedTagsCount: number | null = null
        if (isSpeciesFromList) {
            const match = speciesData.find((s) => s.species === species)
            const cut = match?.cuts.find((c) => c.name === cutName)
            if (cut) matchedTagsCount = cut.tags
        }

        setTags((prev) =>
            prev.map((tag) => {
                if (tag.index !== tagIndex) return tag
                return {
                    ...tag,
                    cutName,
                    numberOfTags: matchedTagsCount ?? tag.numberOfTags,
                }
            })
        )
    }

    const removeTag = (tagIndex: number) => {
        setTags((prev) => prev.filter((tag) => tag.index !== tagIndex))
    }

    const handleTagNumberChange = (value: string) => {
        const nextValue = value.toUpperCase()
        setTagNumber(nextValue)
        setTags((prev) => prev.map((t) => ({ ...t, tagNumber: nextValue })))
    }

    // (previously: addNewTag via extra empty row; replaced by Add Cut Type button)

    const [focusCutIndex, setFocusCutIndex] = useState<number | null>(null)

    const addEmptyCutType = () => {
        setTags((prev) => {
            const nextIndex = prev.length === 0 ? 1 : Math.max(...prev.map((t) => t.index)) + 1
            setFocusCutIndex(nextIndex)
            return [
                ...prev,
                {
                    index: nextIndex,
                    tagNumber: tagNumber.trim() || 'Tag #',
                    cutName: '',
                    numberOfTags: 1,
                },
            ]
        })
    }

    return (
        <div className="flex h-full w-[400px] flex-col overflow-hidden border-l border-slate-200 bg-white/90 py-0">
            {/* Mode Toggle */}
            <div className="bg-slate-700 px-4 pb-3 pt-4">
                <div className="flex rounded-lg border border-slate-300 bg-slate-100 p-1 shadow-sm">
                    <button
                        type="button"
                        onClick={() => setMode('quick')}
                        className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-all ${mode === 'quick'
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Quick Mode
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('manual')}
                        className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-all ${mode === 'manual'
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Manual Mode
                    </button>
                </div>
            </div>

            {/* Tag # Input */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <div className="bg-slate-700 px-4 py-2 mb-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white">
                        Overview
                    </div>
                </div>

                <div className="px-4">
                    <input
                        type="text"
                        value={tagNumber}
                        onChange={(e) => handleTagNumberChange(e.target.value)}
                        className={`mb-1 w-full border-0 border-b-2 border-slate-300 bg-transparent px-0 py-2 text-2xl font-bold focus:border-blue-500 focus:outline-none focus:ring-0 ${derivedLots.length > 0 ? meaningfulTextClass : 'text-slate-900'}`}
                        placeholder="Tag #, e.g. 1000-02,05"
                    />
                    <div className="min-h-[20px]">
                        {tagNumber.trim() !== '' && (
                            derivedLots.length > 0 ? (
                                <Tooltip
                                    onlyIfTruncated
                                    content={
                                        <>
                                            <div className="mb-1 font-semibold">{derivedLots.length} animal{derivedLots.length !== 1 ? 's' : ''}:</div>
                                            <div className="break-words">{derivedLots.join(', ')}</div>
                                        </>
                                    }
                                >
                                    <div
                                        className="truncate text-xs text-slate-500 cursor-default"
                                        data-tooltip-truncate
                                    >
                                        <span className="font-bold">
                                            {derivedLots.length} animal{derivedLots.length !== 1 ? 's' : ''}:
                                        </span>{' '}
                                        <span>{derivedLots.join(', ')}</span>
                                    </div>
                                </Tooltip>
                            ) : (
                                <div className="truncate text-xs text-slate-500 cursor-default">
                                    Unknown animal count.
                                </div>
                            )
                        )}
                    </div>

                    {/* Species Selector */}
                    <div className="mt-0">
                        <Autocomplete
                            value={species}
                            onChange={setSpecies}
                            options={speciesOptions}
                            placeholder={isLoading ? 'Loading species…' : 'Species'}
                            disabled={isLoading}
                            forceUppercase
                            allowCustomValues
                            inputClassName={`${isSpeciesFromList ? meaningfulTextClass : 'text-slate-900'} !text-2xl !font-bold`}
                        />
                        <div className="mt-1 min-h-[20px]">
                            {!isLoading && species.trim() !== '' && (
                                <div className="text-xs text-slate-500">
                                    {isSpeciesFromList && selectedSpeciesCutCount !== null
                                        ? `${selectedSpeciesCutCount} cut type${selectedSpeciesCutCount === 1 ? '' : 's'} available for ${species}`
                                        : 'Unknown species'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cut Types */}
                <div className="mt-2 bg-slate-700 px-4 py-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white">
                        Cut Types
                    </div>
                </div>
                <div className="cuts flex-1 overflow-y-auto">
                    <div className="flex flex-col">
                        {tags.map((tag) => {
                            const isCutTypeFromList = cutTypeOptions.some((opt) => opt.value === tag.cutName)

                            // Find the cut data for this cut type
                            let cutData: { numberOfTags: number; perAnimal: boolean } | null = null
                            if (isSpeciesFromList && isCutTypeFromList) {
                                const match = speciesData.find((s) => s.species === species)
                                if (match) {
                                    const cut = match.cuts.find((c) => c.name === tag.cutName)
                                    if (cut) {
                                        cutData = {
                                            numberOfTags: cut.tags,
                                            perAnimal: cut.perAnimal,
                                        }
                                    }
                                }
                            }

                            return (
                                <div key={tag.index}>
                                    <TagInfo
                                        value={tag.cutName}
                                        onChange={(v) => updateTagCutName(tag.index, v)}
                                        options={cutTypeOptions}
                                        onRemove={() => removeTag(tag.index)}
                                        showRemove
                                        autoFocus={focusCutIndex === tag.index}
                                        inputClassName={isCutTypeFromList ? meaningfulTextClass : 'text-slate-900'}
                                        numberOfTags={cutData?.numberOfTags}
                                        perAnimal={cutData?.perAnimal}
                                        animalCount={derivedLots.length}
                                        onFocused={() => onFocusTagIndex?.(tag.index)}
                                    />
                                </div>
                            )
                        })}
                        <div className="mb-20">
                            <button
                                type="button"
                                onClick={addEmptyCutType}
                                className="w-full px-12 border-0 border-dashed border-slate-300 py-6 text-left text-sm font-semibold text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                            >
                                + Add Cut Type
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default TagEditor
