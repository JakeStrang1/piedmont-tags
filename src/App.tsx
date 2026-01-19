import { Route, Routes } from 'react-router-dom'
import { TagSettingsProvider } from './hooks/useTagSettings'
import MainMenu from './components/MainMenu'
import PrintTags from './components/PrintTags'

const App = () => (
  <TagSettingsProvider>
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/print" element={<PrintTags />} />
    </Routes>
  </TagSettingsProvider>
)

export default App
