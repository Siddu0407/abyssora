
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/manga/:id" element={<MangaDetails />} />
        <Route path="/manga/:id/chapter/:chapterNumber" element={<Reader />} />
        <Route path="/genre/:genreName" element={<Genre />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/library" element={<Library />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
