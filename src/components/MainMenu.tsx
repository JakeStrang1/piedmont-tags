import { useNavigate } from 'react-router-dom'

const MainMenu = () => {
    const navigate = useNavigate()

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[radial-gradient(circle_at_top,_#f5f8ff,_#e4e9f2)] px-4 py-6">
            <div className="w-full max-w-md">
                <button
                    type="button"
                    className="w-full rounded-2xl bg-gradient-to-br from-[#2d7bff] to-[#0047d9] px-8 py-6 text-2xl font-semibold text-white shadow-xl shadow-blue-900/30 transition-all hover:-translate-y-0.5 hover:shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                    onClick={() => navigate('/print')}
                >
                    Print Tags
                </button>
            </div>
        </div>
    )
}

export default MainMenu

