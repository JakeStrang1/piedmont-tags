import { Route, Routes } from 'react-router-dom'
import { TagSettingsProvider } from './hooks/useTagSettings'
import { SpeciesDataProvider } from './hooks/useSpeciesData'
import { PresetsProvider } from './hooks/usePresets'
import MainMenu from './components/MainMenu'
import PrintTags from './components/PrintTags'

const App = () => (
  <SpeciesDataProvider>
    <PresetsProvider>
      <TagSettingsProvider>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/print" element={<PrintTags />} />
        </Routes>
      </TagSettingsProvider>
    </PresetsProvider>
  </SpeciesDataProvider>
)

export default App
