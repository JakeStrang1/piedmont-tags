import { useState } from 'react'

interface EditableTagProps {
    isHovered: boolean
    onMouseEnter: () => void
    onMouseLeave: () => void
    onDelete: () => void
}

const EditableTag = ({ isHovered, onMouseEnter, onMouseLeave, onDelete }: EditableTagProps) => {
    const [tagNumber, setTagNumber] = useState('Tag #')
    const [tagText, setTagText] = useState('CUT NAME')

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="w-64 shrink-0" />
            <div className="aspect-[3/2] w-full border border-slate-900 bg-white p-10 shadow-xl">
                <div className="flex h-full flex-col items-center justify-center gap-5">
                    <input
                        type="text"
                        value={tagNumber}
                        onChange={(e) => setTagNumber(e.target.value)}
                        className="w-full rounded-md bg-transparent text-center text-5xl font-semibold text-slate-900 outline-none border border-transparent px-2 py-1 m-0 transition-all hover:bg-slate-100 focus:bg-slate-100 focus:border-dashed focus:border-slate-400 focus:ring-0 focus:outline-none"
                    />
                    <br />
                    <br />
                    <input
                        type="text"
                        value={tagText}
                        onChange={(e) => setTagText(e.target.value)}
                        className="w-full rounded-md bg-transparent text-center text-5xl font-semibold text-slate-900 outline-none border border-transparent px-2 py-1 m-0 transition-all hover:bg-slate-100 focus:bg-slate-100 focus:border-dashed focus:border-slate-400 focus:ring-0 focus:outline-none"
                    />
                </div>
            </div>
            <div className="relative w-64 shrink-0">
                {isHovered && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="absolute left-4 top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-xl bg-red-500 text-white shadow-lg transition-all hover:scale-110 hover:bg-red-600 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                        aria-label="Delete tag"
                    >
                        <svg
                            className="h-8 w-8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M6 18L18 6M6 6l12 12"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    )
}

export default EditableTag

