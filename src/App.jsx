
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import MangaDetails from './pages/MangaDetails'
import Reader from './pages/Reader'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import UpdatePassword from './pages/UpdatePassword'
import Profile from './pages/Profile'
import Library from './pages/Library'
import Genre from './pages/Genre'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

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

        <Route
          path="*"
          element={
            <main className="flex min-h-screen items-center justify-center bg-[#09090e] text-white">
              <div className="text-center">
                <h1 className="text-5xl font-black">404</h1>
                <p className="mt-3 text-gray-400">Page not found</p>
                <a href="/" className="mt-5 inline-block text-purple-400">
                  Return to ABYSSORA
                </a>
              </div>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
