
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Discover from './pages/Discover'
import MangaDetails from './pages/MangaDetails'
import Reader from './pages/Reader'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import UpdatePassword from './pages/UpdatePassword'
import Profile from './pages/Profile'
import Library from './pages/Library'
import Genre from './pages/Genre'
import Admin from './pages/Admin'
import Notifications from './pages/Notifications'
import CreatorSubmission from './pages/CreatorSubmission'
import ExternalComicReader from './pages/ExternalComicReader'
import ExternalComicManagement from './pages/ExternalComicManagement'

import Footer from './components/Footer'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Copyright from './pages/Copyright'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />

        <Route path="/manga/:id" element={<MangaDetails />} />
        <Route
          path="/manga/:id/chapter/:chapterNumber"
          element={<Reader />}
        />

        <Route path="/genre/:genreName" element={<Genre />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />

        <Route path="/profile" element={<Profile />} />
        <Route path="/library" element={<Library />} />
        <Route path="/notifications" element={<Notifications />} />

        <Route path="/admin" element={<Admin />} />
        <Route
          path="/admin/external-comics"
          element={<ExternalComicManagement />}
        />

        <Route
          path="/external-comic/:id"
          element={<ExternalComicReader />}
        />

        <Route path="/creator/submit" element={<CreatorSubmission />} />

        {/* Legal pages */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/copyright" element={<Copyright />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  )
}

export default App
