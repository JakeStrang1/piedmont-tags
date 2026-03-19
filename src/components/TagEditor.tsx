import { useMemo, useState, useEffect, useRef } from 'react'
import { parseLotNumbers } from '../utilities/parseLotNumbers'
import Tooltip from './Tooltip'
import { useSpeciesData } from '../hooks/useSpeciesData'
import Autocomplete from './Autocomplete'
import TagInfo from './TagInfo'
import type { EditorMode } from '../types/presets'

interface TagData {
    index: number
    tagNumber: string
    cutName: string
    numberOfTags: number
    species?: string
}

interface TagEditorProps {
    tags: TagData[]
    setTags: React.Dispatch<React.SetStateAction<TagData[]>>
    tagNumber: string
    setTagNumber: React.Dispatch<React.SetStateAction<string>>
    species: string
    setSpecies: React.Dispatch<React.SetStateAction<string>>
    onFocusTagIndex?: (tagIndex: number) => void
    mode: EditorMode
    setMode: React.Dispatch<React.SetStateAction<EditorMode>>
    presetMode?: boolean
}

const TagEditor = ({
    tags,
    setTags,
    tagNumber,
    setTagNumber,
    species,
    setSpecies,
    onFocusTagIndex,
    mode,
    setMode,
    presetMode = false,
}: TagEditorProps) => {
    const { speciesData, isLoading } = useSpeciesData()
    const tagNumberInputRef = useRef<HTMLInputElement>(null)

    const derivedLots = useMemo(() => parseLotNumbers(tagNumber), [tagNumber])
    const meaningfulTextClass = '!text-blue-700'

    const clampTagsCount = (n: number) => Math.min(500, Math.max(1, n))

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

    const getCutForSpecies = (speciesValue: string, cutName: string) => {
        if (!speciesValue || !cutName) return null
        const match = speciesData.find((s) => s.species === speciesValue)
        if (!match) return null
        return match.cuts.find((c) => c.name === cutName) ?? null
    }

    const calcNumberOfTags = (args: {
        tagNumberValue: string
        speciesValue: string
        cutName: string
    }) => {
        const { tagNumberValue, speciesValue, cutName } = args
        const animalCount = parseLotNumbers(tagNumberValue).length
        const cut = getCutForSpecies(speciesValue, cutName)
        if (!cut) return 1
        const base = cut.tags
        const computed = cut.perAnimal ? base * Math.max(1, animalCount) : base
        return clampTagsCount(computed)
    }

    // Keep global Tag # synced to all rows.
    // In preset mode, Tag # is transient and does not drive count changes.
    useEffect(() => {
        setTags((prev) => {
            let didChange = false
            const next = prev.map((t) => {
                const speciesToUse = t.species ?? species
                const nextCount = presetMode
                    ? t.numberOfTags
                    : calcNumberOfTags({
                        tagNumberValue: tagNumber,
                        speciesValue: speciesToUse,
                        cutName: t.cutName,
                    })

                if (
                    t.tagNumber === tagNumber &&
                    t.numberOfTags === nextCount
                ) {
                    return t
                }

                didChange = true
                return {
                    ...t,
                    tagNumber,
                    numberOfTags: nextCount,
                }
            })
            return didChange ? next : prev
        })
    }, [tagNumber, setTags, presetMode]) // eslint-disable-line react-hooks/exhaustive-deps

    // Keep global Species synced to all rows and recalculate derived counts.
    useEffect(() => {
        setTags((prev) => {
            let didChange = false
            const next = prev.map((t) => {
                const nextCount = calcNumberOfTags({
                    tagNumberValue: t.tagNumber,
                    speciesValue: species,
                    cutName: t.cutName,
                })
                const resolvedCount = presetMode ? t.numberOfTags : nextCount

                if (
                    (t.species ?? '') === species &&
                    t.numberOfTags === resolvedCount
                ) {
                    return t
                }

                didChange = true
                return {
                    ...t,
                    species,
                    numberOfTags: resolvedCount,
                }
            })
            return didChange ? next : prev
        })
    }, [species, setTags, presetMode]) // eslint-disable-line react-hooks/exhaustive-deps

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

    const getCutTypeOptionsForSpecies = (speciesValue: string) => {
        if (!speciesValue) return []
        const match = speciesData.find((s) => s.species === speciesValue)
        if (!match) return []

        const names = match.cuts
            .map((c) => c.name)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))

        return names.map((name) => ({ value: name, label: name }))
    }

    const updateTagCutName = (tagIndex: number, cutName: string) => {
        setTags((prev) =>
            prev.map((t) => {
                if (t.index !== tagIndex) return t

                const speciesToUse = t.species ?? ''

                const prevCalculated = calcNumberOfTags({
                    tagNumberValue: t.tagNumber,
                    speciesValue: speciesToUse,
                    cutName: t.cutName,
                })
                const shouldSync = t.numberOfTags === prevCalculated

                const nextCalculated = calcNumberOfTags({
                    tagNumberValue: t.tagNumber,
                    speciesValue: speciesToUse,
                    cutName,
                })

                return {
                    ...t,
                    cutName,
                    numberOfTags:
                        !shouldSync
                            ? t.numberOfTags
                            : nextCalculated,
                }
            })
        )
    }

    const removeTag = (tagIndex: number) => {
        setTags((prev) => prev.filter((tag) => tag.index !== tagIndex))
    }

    const updateTagNumber = (tagIndex: number, tagNumberValue: string) => {
        setTags((prev) =>
            prev.map((t) => {
                if (t.index !== tagIndex) return t

                // Do NOT trim here: allow spaces while typing in the Tag # Autocomplete
                const nextTagNumber = tagNumberValue.toUpperCase() || ''
                const speciesToUse = t.species ?? ''

                const prevCalculated = calcNumberOfTags({
                    tagNumberValue: t.tagNumber,
                    speciesValue: speciesToUse,
                    cutName: t.cutName,
                })
                const shouldSync = t.numberOfTags === prevCalculated

                const nextCalculated = calcNumberOfTags({
                    tagNumberValue: nextTagNumber,
                    speciesValue: speciesToUse,
                    cutName: t.cutName,
                })

                return {
                    ...t,
                    tagNumber: nextTagNumber,
                    numberOfTags:
                        presetMode || !shouldSync
                            ? t.numberOfTags
                            : nextCalculated,
                }
            })
        )
    }

    const updateTagNumberOfTags = (tagIndex: number, numTags: number) => {
        setTags((prev) =>
            prev.map((tag) => {
                if (tag.index !== tagIndex) return tag
                return {
                    ...tag,
                    numberOfTags: clampTagsCount(numTags),
                }
            })
        )
    }

    const updateTagSpecies = (tagIndex: number, speciesValue: string) => {
        setTags((prev) =>
            prev.map((t) => {
                if (t.index !== tagIndex) return t

                const nextSpecies = speciesValue

                const prevCalculated = calcNumberOfTags({
                    tagNumberValue: t.tagNumber,
                    speciesValue: t.species ?? '',
                    cutName: t.cutName,
                })
                const shouldSync = t.numberOfTags === prevCalculated

                const nextCalculated = calcNumberOfTags({
                    tagNumberValue: t.tagNumber,
                    speciesValue: nextSpecies,
                    cutName: t.cutName,
                })

                return {
                    ...t,
                    species: nextSpecies,
                    numberOfTags:
                        !shouldSync
                            ? t.numberOfTags
                            : nextCalculated,
                }
            })
        )
    }

    const tagNumberOptions = useMemo(() => {
        return derivedLots.map((lot) => ({ value: lot, label: lot }))
    }, [derivedLots])

    const handleTagNumberChange = (value: string) => {
        const nextValue = value.toUpperCase()
        setTagNumber(nextValue)
    }

    // (previously: addNewTag via extra empty row; replaced by Add Cut Type button)

    const [focusCutIndex, setFocusCutIndex] = useState<number | null>(null)
    const [showCutTypePicker, setShowCutTypePicker] = useState(false)

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            tagNumberInputRef.current?.focus()
        }, 0)
        return () => window.clearTimeout(timeout)
    }, [])

    useEffect(() => {
        if (!showCutTypePicker) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowCutTypePicker(false)
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [showCutTypePicker])

    const allSpeciesCutTypeNames = useMemo(() => {
        if (!isSpeciesFromList) return []
        const match = speciesData.find((entry) => entry.species === species)
        if (!match) return []
        return match.cuts
            .map((cut) => cut.name)
            .filter(Boolean)
    }, [isSpeciesFromList, species, speciesData])

    const selectedCutTypeSet = useMemo(() => {
        const set = new Set<string>()
        for (const tag of tags) {
            if (tag.cutName) {
                set.add(tag.cutName)
            }
        }
        return set
    }, [tags])

    const toggleCutTypeSelection = (cutName: string) => {
        setTags((prev) => {
            const hasCut = prev.some((tag) => tag.cutName === cutName)
            if (hasCut) {
                return prev.filter((tag) => tag.cutName !== cutName)
            }

            const nextIndex =
                prev.length === 0 ? 1 : Math.max(...prev.map((tag) => tag.index)) + 1
            return [
                ...prev,
                {
                    index: nextIndex,
                    tagNumber,
                    species,
                    cutName,
                    numberOfTags: calcNumberOfTags({
                        tagNumberValue: tagNumber,
                        speciesValue: species,
                        cutName,
                    }),
                },
            ]
        })
    }

    const addEmptyCutType = () => {
        setTags((prev) => {
            const nextIndex = prev.length === 0 ? 1 : Math.max(...prev.map((t) => t.index)) + 1
            setFocusCutIndex(nextIndex)
            return [
                ...prev,
                {
                    index: nextIndex,
                    tagNumber: tagNumber,
                    species: species,
                    cutName: '',
                    numberOfTags: calcNumberOfTags({
                        tagNumberValue: tagNumber,
                        speciesValue: species,
                        cutName: '',
                    }),
                },
            ]
        })
    }

    return (
        <>
            <div className="flex h-full w-[400px] flex-col overflow-hidden border-l border-slate-200 bg-white/90 py-0">
            {/* Mode Toggle */}
            <div className="bg-slate-700 px-4 pb-3 pt-4">
                <div className="flex rounded-lg border border-slate-300 bg-slate-100 p-1 shadow-sm">
                    <button
                        type="button"
                        onClick={() => {
                            setMode('quick')
                        }}
                        className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-all ${mode === 'quick'
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Quick Mode
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setMode('manual')
                        }}
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
                        Apply to All
                    </div>
                </div>

                <div className="px-4">
                    <input
                        ref={tagNumberInputRef}
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
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold uppercase tracking-wider text-white">
                            Cut Types
                        </div>
                        {isSpeciesFromList && (
                            <button
                                type="button"
                                onClick={() => setShowCutTypePicker(true)}
                                className="text-xs font-medium text-blue-200 underline-offset-2 hover:text-blue-100 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200"
                            >
                                Show all options
                            </button>
                        )}
                    </div>
                </div>
                <div className="cuts flex-1 overflow-y-auto">
                    <div className="flex flex-col">
                        {tags.map((tag) => {
                            // In manual mode, use tag's species; in quick mode, use parent species
                            const tagSpecies = mode === 'manual' ? (tag.species || '') : species
                            const tagCutTypeOptions = mode === 'manual'
                                ? getCutTypeOptionsForSpecies(tagSpecies)
                                : cutTypeOptions
                            const isTagSpeciesFromList = !!(tagSpecies && speciesOptions.some((o) => o.value === tagSpecies))
                            const isCutTypeFromList = tagCutTypeOptions.some((opt) => opt.value === tag.cutName)

                            // Find the cut data for this cut type
                            let cutData: { numberOfTags: number; perAnimal: boolean } | null = null
                            if (isTagSpeciesFromList && isCutTypeFromList) {
                                const match = speciesData.find((s) => s.species === tagSpecies)
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

                            // Manual mode meaningful color checks
                            const tagNumberCanParseToLots =
                                mode === 'manual'
                                    ? parseLotNumbers(tag.tagNumber).length > 0
                                    : false

                            const calculatedNumberOfTags =
                                mode === 'manual'
                                    ? calcNumberOfTags({
                                        tagNumberValue: tag.tagNumber,
                                        speciesValue: tagSpecies,
                                        cutName: tag.cutName,
                                    })
                                    : calcNumberOfTags({
                                        tagNumberValue: tagNumber,
                                        speciesValue: species,
                                        cutName: tag.cutName,
                                    })

                            const isNumberOfTagsCalculatedMatch =
                                mode === 'manual'
                                    ? tag.numberOfTags === calculatedNumberOfTags
                                    : false

                            // In quick mode, tag is manually overridden if numberOfTags doesn't match calculated
                            const isManuallyOverridden =
                                mode === 'quick' && calculatedNumberOfTags !== null
                                    ? tag.numberOfTags !== calculatedNumberOfTags
                                    : false

                            return (
                                <div key={tag.index}>
                                    <TagInfo
                                        value={tag.cutName}
                                        onChange={(v) => updateTagCutName(tag.index, v)}
                                        options={tagCutTypeOptions}
                                        onRemove={() => removeTag(tag.index)}
                                        showRemove
                                        autoFocus={focusCutIndex === tag.index}
                                        inputClassName={isCutTypeFromList ? meaningfulTextClass : 'text-slate-900'}
                                        numberOfTags={cutData?.numberOfTags}
                                        perAnimal={cutData?.perAnimal}
                                        animalCount={derivedLots.length}
                                        onFocused={() => onFocusTagIndex?.(tag.index)}
                                        quickMode={mode === 'quick'}
                                        tagNumber={tag.tagNumber}
                                        onTagNumberChange={(v) => updateTagNumber(tag.index, v)}
                                        tagNumberOptions={tagNumberOptions}
                                        species={mode === 'manual' ? (tag.species || '') : species}
                                        onSpeciesChange={mode === 'manual'
                                            ? (v) => updateTagSpecies(tag.index, v)
                                            : setSpecies}
                                        speciesOptions={speciesOptions}
                                        speciesDisabled={isLoading}
                                        numberOfTagsInput={tag.numberOfTags}
                                        onNumberOfTagsChange={(v) => updateTagNumberOfTags(tag.index, v)}
                                        tagNumberCanParseToLots={tagNumberCanParseToLots}
                                        isTagSpeciesFromList={isTagSpeciesFromList}
                                        isTagCutTypeFromList={isCutTypeFromList}
                                        isNumberOfTagsCalculatedMatch={isNumberOfTagsCalculatedMatch}
                                        calculatedNumberOfTags={calculatedNumberOfTags ?? undefined}
                                        isManuallyOverridden={isManuallyOverridden}
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
            </div>

            {showCutTypePicker && (
                <>
                    <div
                        className="fixed inset-0 z-50 bg-black/40"
                        onClick={() => setShowCutTypePicker(false)}
                        aria-hidden="true"
                    />
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
                        <div
                            className="flex w-full max-w-5xl flex-col rounded-xl border border-slate-300 bg-white shadow-2xl"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-900">
                                        All Cut Types
                                    </h3>
                                    <p className="text-sm text-slate-600">
                                        {species}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowCutTypePicker(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-md text-xl text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
                                    aria-label="Close cut type picker"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {allSpeciesCutTypeNames.map((cutName) => {
                                        const isSelected = selectedCutTypeSet.has(cutName)
                                        return (
                                            <button
                                                key={cutName}
                                                type="button"
                                                onClick={() => toggleCutTypeSelection(cutName)}
                                                className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${isSelected
                                                    ? 'border-blue-700 bg-blue-600 text-white'
                                                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {cutName}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

export default TagEditor
