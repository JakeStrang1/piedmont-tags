import { useEffect, useMemo, useState } from 'react'
import { getValidatedPresetName, usePresets } from '../hooks/usePresets'
import ConfirmDialog from './ConfirmDialog'

interface PresetsModalProps {
    isOpen: boolean
    onClose: () => void
    onSelectPreset: (presetId: number) => void
}

const PresetsModal = ({ isOpen, onClose, onSelectPreset }: PresetsModalProps) => {
    const { presets, isLoading, createPreset, renamePreset, deletePreset } =
        usePresets()
    const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [editingPresetId, setEditingPresetId] = useState<number | null>(null)
    const [nameDraft, setNameDraft] = useState('')
    const [confirmDeletePresetId, setConfirmDeletePresetId] = useState<number | null>(
        null
    )
    const [sessionNewPresetIds, setSessionNewPresetIds] = useState<number[]>([])

    const sortedPresets = useMemo(() => {
        const sessionSet = new Set(sessionNewPresetIds)
        const alpha = [...presets]
            .filter((preset) => !sessionSet.has(preset.id))
            .sort((a, b) => a.name.localeCompare(b.name))
        const sessionNew = sessionNewPresetIds
            .map((id) => presets.find((preset) => preset.id === id) ?? null)
            .filter((preset): preset is (typeof presets)[number] => preset !== null)
        return [...alpha, ...sessionNew]
    }, [presets, sessionNewPresetIds])

    const selectedPreset = useMemo(
        () =>
            sortedPresets.find((preset) => preset.id === selectedPresetId) ??
            null,
        [selectedPresetId, sortedPresets]
    )

    useEffect(() => {
        if (!isOpen) return
        setSessionNewPresetIds([])
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        if (selectedPresetId !== null) {
            const stillExists = sortedPresets.some(
                (preset) => preset.id === selectedPresetId
            )
            if (!stillExists) {
                setSelectedPresetId(null)
                setEditingPresetId(null)
            }
            return
        }
        if (sortedPresets.length > 0) {
            setSelectedPresetId(sortedPresets[0].id)
        }
    }, [isOpen, selectedPresetId, sortedPresets])

    const startEditingName = () => {
        if (!selectedPreset) return
        setError(null)
        setNameDraft(selectedPreset.name)
        setEditingPresetId(selectedPreset.id)
    }

    const handleCreateNew = async () => {
        try {
            setIsSaving(true)
            setError(null)
            const created = await createPreset()
            setSelectedPresetId(created.id)
            setSessionNewPresetIds((prev) => [...prev, created.id])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            setIsSaving(true)
            setError(null)
            await deletePreset(id)
            setEditingPresetId(null)
            setNameDraft('')
            setConfirmDeletePresetId(null)
            setSessionNewPresetIds((prev) => prev.filter((item) => item !== id))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveEditedName = async () => {
        if (!selectedPreset) return
        try {
            setIsSaving(true)
            setError(null)
            const validName = getValidatedPresetName(nameDraft)
            await renamePreset(selectedPreset.id, validName)
            setEditingPresetId(null)
            setSessionNewPresetIds((prev) =>
                prev.filter((id) => id !== selectedPreset.id)
            )
        } catch {
            setNameDraft(selectedPreset.name)
            setEditingPresetId(null)
        } finally {
            setIsSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/20"
                onClick={onClose}
                aria-hidden="true"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl rounded-xl border border-slate-300 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                        <h2 className="text-xl font-semibold text-slate-900">
                            Presets
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-xl text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
                            aria-label="Close presets modal"
                        >
                            ×
                        </button>
                    </div>

                    <div className="px-6 py-4">
                        {error && (
                            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {isLoading ? (
                            <div className="py-8 text-center text-slate-500">
                                Loading presets...
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="text-sm text-slate-600">
                                    Select a preset, then choose an action.
                                </div>
                                <div className="h-80 overflow-y-auto rounded-md border border-slate-300 bg-white">
                                    {presets.length === 0 && (
                                        <div className="px-4 py-6 text-sm text-slate-500">
                                            No presets yet.
                                        </div>
                                    )}
                                    {sortedPresets.map((preset) => {
                                        const isSelected =
                                            preset.id === selectedPresetId
                                        const isEditing =
                                            preset.id === editingPresetId
                                        return (
                                            <div
                                                key={preset.id}
                                                onClick={() => {
                                                    setSelectedPresetId(
                                                        preset.id
                                                    )
                                                    setError(null)
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        setSelectedPresetId(
                                                            preset.id
                                                        )
                                                        setError(null)
                                                    }
                                                }}
                                                onDoubleClick={() =>
                                                    onSelectPreset(preset.id)
                                                }
                                                role="button"
                                                tabIndex={0}
                                                className={`flex w-full items-center border-b border-slate-200 px-3 py-2 text-left text-sm ${isSelected
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white text-slate-900 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {isEditing ? (
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={nameDraft}
                                                        maxLength={50}
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        onChange={(e) =>
                                                            setNameDraft(
                                                                e.target.value
                                                            )
                                                        }
                                                        onBlur={() => {
                                                            void handleSaveEditedName()
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault()
                                                                void handleSaveEditedName()
                                                            }
                                                            if (e.key === 'Escape') {
                                                                setNameDraft(
                                                                    preset.name
                                                                )
                                                                setEditingPresetId(
                                                                    null
                                                                )
                                                            }
                                                        }}
                                                        className="max-w-full border-0 border-b-2 border-white bg-transparent px-1 py-0 text-sm text-white focus:border-white focus:outline-none focus:ring-0"
                                                        style={{ width: '50ch' }}
                                                    />
                                                ) : (
                                                    preset.name
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => void handleCreateNew()}
                                        disabled={isSaving}
                                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-60"
                                    >
                                        New
                                    </button>
                                    <button
                                        type="button"
                                        onClick={startEditingName}
                                        disabled={!selectedPreset || isSaving}
                                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-60"
                                    >
                                        Edit Name
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            selectedPreset &&
                                            onSelectPreset(selectedPreset.id)
                                        }
                                        disabled={!selectedPreset || isSaving}
                                        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-60"
                                    >
                                        Open
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!selectedPreset) return
                                            setConfirmDeletePresetId(
                                                selectedPreset.id
                                            )
                                        }}
                                        disabled={!selectedPreset || isSaving}
                                        className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:pointer-events-none disabled:opacity-60"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="ml-auto rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmDialog
                isOpen={confirmDeletePresetId !== null}
                title="Confirm Delete"
                message={`Are you sure you want to delete ${
                    presets.find((preset) => preset.id === confirmDeletePresetId)
                        ?.name ?? 'this preset'
                }?`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                dangerConfirm
                onCancel={() => setConfirmDeletePresetId(null)}
                onConfirm={() => {
                    if (confirmDeletePresetId === null) return
                    void handleDelete(confirmDeletePresetId)
                }}
            />
        </>
    )
}

export default PresetsModal
