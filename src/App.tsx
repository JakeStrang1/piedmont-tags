import { Route, Routes } from 'react-router-dom'
import { TagSettingsProvider } from './hooks/useTagSettings'
import { SpeciesDataProvider } from './hooks/useSpeciesData'
import MainMenu from './components/MainMenu'
import PrintTags from './components/PrintTags'

const App = () => (
  <SpeciesDataProvider>
    <TagSettingsProvider>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/print" element={<PrintTags />} />
      </Routes>
    </TagSettingsProvider>
  </SpeciesDataProvider>
)

export default App
