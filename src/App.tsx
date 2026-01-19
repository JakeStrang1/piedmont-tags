import { Route, Routes } from 'react-router-dom'
import { PrintSettingsProvider } from './hooks/usePrintSettings'
import MainMenu from './components/MainMenu'
import PrintTags from './components/PrintTags'

const App = () => (
  <PrintSettingsProvider>
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/print" element={<PrintTags />} />
    </Routes>
  </PrintSettingsProvider>
)

export default App
