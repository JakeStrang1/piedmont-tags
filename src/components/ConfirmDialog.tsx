import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
    isOpen: boolean
    title: string
    message: string
    confirmLabel: string
    cancelLabel?: string
    dangerConfirm?: boolean
    onConfirm: () => void
    onCancel: () => void
}

const ConfirmDialog = ({
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel = 'Cancel',
    dangerConfirm = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) => {
    const cancelButtonRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (!isOpen) return
        cancelButtonRef.current?.focus()
    }, [isOpen])

    if (!isOpen) return null

    return (
        <>
            <div
                className="fixed inset-0 z-[60] bg-black/30"
                onClick={onCancel}
                aria-hidden="true"
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-lg border border-slate-300 bg-white shadow-2xl">
                    <div className="border-b border-slate-200 px-5 py-3">
                        <h3 className="text-lg font-semibold text-slate-900">
                            {title}
                        </h3>
                    </div>
                    <div className="px-5 py-4 text-sm text-slate-700">
                        {message}
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
                        <button
                            ref={cancelButtonRef}
                            type="button"
                            onClick={onCancel}
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className={`rounded-md px-3 py-2 text-sm font-medium text-white ${dangerConfirm
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ConfirmDialog
