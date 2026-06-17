import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
// FIX CASE-SENSITIVITY: Mengubah 'Register' menjadi 'register' sesuai nama file asli
import Register from './pages/register';
import DashboardAdmin from './pages/DashboardAdmin';
import FormPesanan from './pages/FormPesanan';
import PesananMasuk from './pages/PesananMasuk'; 
import ManajemenKurir from './pages/ManajemenKurir'; 
import Laporan from './pages/Laporan';
import Pengaturan from './pages/Pengaturan';  
import DashboardKurir from './pages/DashboardKurir'; 
import './index.css';

// =========================================================================
// 🛡️ FUNGSI PEMERIKSA KEAWETAN SESI LOGIN (ANTI-LOGOUT SAAT REFRESH)
// =========================================================================
const checkSesiValid = () => {
  const token = localStorage.getItem('token');
  const loginTime = localStorage.getItem('loginTime');

  if (!token) return false;

  // JIKA ADA TIMESTAMP LOGIN, CEK APAKAH SUDAH KEDALUWARSA (MISAL: BATASAN 2 JAM)
  if (loginTime) {
    const batasWaktuSesi = 2 * 60 * 60 * 1000; // 2 Jam dihitung dalam milidetik
    const waktuSekarang = new Date().getTime();

    // Jika waktu saat ini dikurangi waktu login ternyata melebihi 2 jam
    if (waktuSekarang - parseInt(loginTime) > batasWaktuSesi) {
      console.log("Sesi login Anda telah kedalwarsa. Menghapus storage...");
      localStorage.clear(); // Bersihkan data usang agar aman
      return false;
    }
  }

  return true; // Sesi dinyatakan lolos dan aman digunakan
};

// =========================================================================
// 👮 SATPAM PROTEKSI ROUTE (KHUSUS ADMIN - FIX LOGOUT HARIAN)
// =========================================================================
const ProtectedRoute = ({ children }) => {
  const isTokenValid = checkSesiValid();
  const role = localStorage.getItem('role');

  // Evaluasi validitas token serta kecocokan role admin
  if (!isTokenValid || !role || role.toLowerCase().trim() !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// =========================================================================
// 👮 SATPAM PROTEKSI ROUTE (KHUSUS KURIR - FIX LOGOUT HARIAN)
// =========================================================================
const KurirProtectedRoute = ({ children }) => {
  const isTokenValid = checkSesiValid();
  const role = localStorage.getItem('role');

  if (!isTokenValid || !role || role.toLowerCase().trim() !== 'kurir') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* --- ROUTES PUBLIK --- */}
        <Route path="/" element={<FormPesanan />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* --- ROUTE KHUSUS KURIR (DILINDUNGI) --- */}
        <Route 
          path="/kurir/dashboard" 
          element={
            <KurirProtectedRoute>
              <DashboardKurir />
            </KurirProtectedRoute>
          } 
        />

        {/* --- ADMIN ROUTES (DILINDUNGI) --- */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardAdmin />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/pesanan-masuk" 
          element={
            <ProtectedRoute>
              <PesananMasuk />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/kurir"
          element={
            <ProtectedRoute>
              <ManajemenKurir />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/laporan"
          element={
            <ProtectedRoute>
              <Laporan />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/pengaturan"
          element={
            <ProtectedRoute>
              <Pengaturan />
            </ProtectedRoute>
          } 
        />

        {/* Catch-All Redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;