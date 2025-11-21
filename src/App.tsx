import { Route, Routes } from 'react-router-dom'
import MainMenu from './components/MainMenu'
import PrintTags from './components/PrintTags'

const App = () => (
  <Routes>
    <Route path="/" element={<MainMenu />} />
    <Route path="/print" element={<PrintTags />} />
  </Routes>
)

export default App
