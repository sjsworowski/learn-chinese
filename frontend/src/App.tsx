import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Study from './pages/Study'
import ProtectedRoute from './components/ProtectedRoute'
import Test from './pages/Test'
import PinyinTest from './pages/PinyinTest'
import Profile from './pages/Profile'

function App() {
    return (
        <AuthProvider>
            <div className="flex flex-col min-h-screen" style={{ background: 'linear-gradient(135deg, #ddeaff 0%, #f6e3fa 35%, #e6e3fa 70%, #fbeafd 100%)' }}>
                {/* Main content area */}
                <main className="flex-grow flex-1">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        } />
                        <Route path="/study" element={
                            <ProtectedRoute>
                                <Study />
                            </ProtectedRoute>
                        } />
                        <Route path="/test" element={
                            <ProtectedRoute>
                                <Test />
                            </ProtectedRoute>
                        } />
                        <Route path="/pinyin-test" element={
                            <ProtectedRoute>
                                <PinyinTest />
                            </ProtectedRoute>
                        } />
                    </Routes>
                    <Toaster position="top-center" />
                </main>

                {/* Footer */}
                <footer className="w-full p-4 text-center text-m text-gray-500">
                    Version 1.0.3
                </footer>
            </div>
        </AuthProvider>
    )
}

export default App 