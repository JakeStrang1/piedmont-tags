import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import EditableTag from './EditableTag'

const PrintTags = () => {
    const navigate = useNavigate()
    const [cards, setCards] = useState([{ id: 1 }])
    const [isTopAligned, setIsTopAligned] = useState(false)
    const [hoveredCardId, setHoveredCardId] = useState<number | null>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const checkLayout = () => {
            if (contentRef.current && containerRef.current) {
                const contentHeight = contentRef.current.scrollHeight
                const containerHeight = containerRef.current.clientHeight
                // Switch to top-aligned when content exceeds 70% of container height
                setIsTopAligned(contentHeight > containerHeight * 0.7)
            }
        }

        checkLayout()
        window.addEventListener('resize', checkLayout)
        return () => window.removeEventListener('resize', checkLayout)
    }, [cards])

    const addCard = () => {
        setCards([...cards, { id: Date.now() }])
    }

    const deleteCard = (id: number) => {
        setCards(cards.filter((card) => card.id !== id))
    }

    return (
        <div className="min-h-screen w-full bg-slate-100">
            <div className="flex h-screen w-full flex-col border border-slate-200 bg-slate-50 shadow-2xl">
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
                <div
                    ref={containerRef}
                    className={`flex flex-1 overflow-y-auto bg-slate-50 px-8 py-8 ${isTopAligned ? 'items-start' : 'items-center'} justify-center`}
                >
                    <div ref={contentRef} className="flex w-full max-w-6xl flex-col gap-8">
                        {cards.map((card) => (
                            <EditableTag
                                key={card.id}
                                isHovered={hoveredCardId === card.id}
                                onMouseEnter={() => setHoveredCardId(card.id)}
                                onMouseLeave={() => setHoveredCardId(null)}
                                onDelete={() => deleteCard(card.id)}
                            />
                        ))}
                        <div className="flex items-center">
                            <div className="w-64 shrink-0" />
                            <button
                                type="button"
                                onClick={addCard}
                                className="flex h-20 w-full items-center justify-center border-2 border-dashed border-slate-400 bg-slate-100 text-slate-600 transition-all hover:border-slate-500 hover:bg-slate-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                            >
                                <span className="text-xl font-medium">+ Add Tag</span>
                            </button>
                            <div className="w-64 shrink-0" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PrintTags
