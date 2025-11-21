import { useNavigate } from 'react-router-dom'

const PrintTags = () => {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen w-full bg-slate-100">
            <div className="flex h-screen w-full flex-col border border-slate-200 bg-white shadow-2xl">
                <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-slate-50 px-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <button
                            type="button"
                            className="text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                            onClick={() => navigate('/')}
                        >
                            Main Menu
                        </button>
                        <span className="text-slate-400">›</span>
                        <span>Print Tags</span>
                    </div>
                    <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-md text-xl text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                        onClick={() => navigate('/')}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto bg-white px-6 py-6">
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                        Placeholder for the tag preview/workflow.
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PrintTags

