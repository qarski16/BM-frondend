import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logoBm from '../assets/hero-logo.png';

// --- 📥 IMPORT KOMPONEN EKSTERNAL ---
import RiwayatKurir from './RiwayatKurir'; 
import ProfilKurir from './ProfilKurir'; 

// Menggunakan standard import Vite Env agar tidak fallback ke localhost di production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DashboardKurir = () => {
  const [pesanans, setPesanans] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // --- 🧭 NAVIGASI MENU ---
  const [activeMenu, setActiveMenu] = useState('dashboard'); 
  
  // --- 👤 STATE UTAMA AKUN KURIR ---
  const [kurirId, setKurirId] = useState(
    localStorage.getItem('kurirId') || localStorage.getItem('userId') || ''
  );
  const [namaKurir, setNamaKurir] = useState(localStorage.getItem('nama') || 'Kurir');
  
  // State lokal mengikuti data dari database MongoDB
  const [statusOperasional, setStatusOperasional] = useState('Offline'); 

  // =========================================================================
  // 🔄 FUNGSI UTAMA: UPDATE STATUS KE MONGODB SECARA OTOMATIS
  // =========================================================================
  const updateStatusKeDatabase = async (statusBaru) => {
    const currentId = kurirId || localStorage.getItem('kurirId') || localStorage.getItem('userId') || '';
    if (!currentId) return;
    
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || '',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      };

      // ✨ PERBAIKAN SINKRONISASI: Mengirim 'statusOnline' agar dibaca oleh MongoDB
      const payload = { 
        statusOnline: statusBaru 
      };

      console.log(`[Otomatis] Mengubah status di MongoDB menjadi: ${statusBaru}`);
      
      await axios.put(
        `${API_BASE_URL}/api/auth/kurir/update-status/${currentId}`, 
        payload, 
        config
      );

      // Sinkronkan state lokal setelah database berhasil diubah
      setStatusOperasional(statusBaru);
    } catch (err) {
      console.error("Gagal memperbarui status ke database secara otomatis:", err.message);
    }
  };

  // Ambil status aktual kurir langsung dari database profil saat pertama kali load
  const fetchProfilDanStatusKurir = async () => {
    const currentId = kurirId || localStorage.getItem('kurirId') || localStorage.getItem('userId') || '';
    if (!currentId) return;
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};
      
      const response = await axios.get(`${API_BASE_URL}/api/auth/kurir/profile/${currentId}`, config);
      if (response.data && response.data.statusOnline) {
        setStatusOperasional(response.data.statusOnline);
      }
    } catch (err) {
      console.error("Gagal sinkronisasi profil status kurir:", err.message);
    }
  };

  const fetchDataKurir = async (showLoadingAnimation = false) => {
    if (showLoadingAnimation) setLoading(true);
    const currentId = kurirId || localStorage.getItem('kurirId') || localStorage.getItem('userId') || '';
    
    if (!currentId) { 
      setLoading(false); 
      return; 
    }

    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};
      
      const response = await axios.get(`${API_BASE_URL}/api/pesanan/kurir/aktif/${currentId}`, config);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setPesanans(response.data);
      } else {
        setPesanans([]); 
      }
    } catch (err) {
      console.error("Gagal memuat tugas aktif dari backend:", err.message);
      setPesanans([]);
    } finally {
      if (showLoadingAnimation) setLoading(false);
    }
  };

  const handleUpdateStatusPesanan = async (pesananId, statusBaru) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Sesi Anda telah berakhir, silakan login kembali.");
        return;
      }

      const config = {
        headers: {
          'x-auth-token': token,
          'Authorization': `Bearer ${token}`
        }
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/pesanan/update-status/${pesananId}`,
        { status: statusBaru },
        config
      );

      if (response.data) {
        alert(`Sukses! Status pesanan berhasil diperbarui menjadi: ${statusBaru}`);
        fetchDataKurir(false);
      }
    } catch (err) {
      console.error("Detail Error update-status:", err.response?.data || err.message);
      const pesanErrorServer = err.response?.data?.message || err.response?.data?.msg;
      
      if (pesanErrorServer === "Status tidak valid") {
        alert(`Error Backend: Teks "${statusBaru}" ditolak karena tidak sesuai enum schema backend.`);
      } else {
        alert(pesanErrorServer || "Gagal memperbarui status pesanan.");
      }
    }
  };

  // =========================================================================
  // ⚡ AUTOMATION TRIGGER (Siklus Hidup Sinkronisasi Otomatis)
  // =========================================================================
  useEffect(() => {
    const targetId = kurirId || localStorage.getItem('kurirId') || localStorage.getItem('userId') || '';
    
    const inisialisasiDashboard = async () => {
      if (targetId) {
        // 1. OTOMATISASI: Set database menjadi Online saat kurir membuka dashboard ini
        await updateStatusKeDatabase('Online');
        // 2. Ambil data terbaru dari MongoDB
        await fetchProfilDanStatusKurir(); 
        // 3. Ambil data pesanan aktif
        await fetchDataKurir(true); 
      }
      setLoading(false);
    };

    inisialisasiDashboard();

    // Sinkronisasi data pesanan berkala setiap 5 detik
    const intervalSinkronisasi = setInterval(() => {
      fetchDataKurir(false); 
    }, 5000);

    return () => {
      clearInterval(intervalSinkronisasi); 
    };
  }, [kurirId]);

  // Tombol manual jika kurir ingin mengubah statusnya sendiri di pojok kanan atas
  const handleToggleStatus = async () => {
    const isOnline = statusOperasional === 'Online';
    const pesanKonfirmasi = isOnline 
      ? "Apakah Anda yakin ingin mengubah status menjadi Offline? Anda tidak akan menerima tugas pesanan baru selama offline."
      : "Apakah Anda yakin ingin mengaktifkan status kerja Anda kembali menjadi Online?";

    if (window.confirm(pesanKonfirmasi)) {
      const statusBaru = isOnline ? 'Offline' : 'Online';
      await updateStatusKeDatabase(statusBaru);
      alert(`Status berhasil diperbarui ke: ${statusBaru === 'Online' ? 'Aktif (Online)' : 'Nonaktif (Offline)'}`);
    }
  };

  // =========================================================================
  // 🚪 LOGOUT UTAMAKAN MENGUBAH DATABASE MENJADI OFFLINE
  // =========================================================================
  const handleLogout = async () => {
    if (window.confirm("Apakah Anda yakin ingin keluar aplikasi?")) {
      // OTOMATISASI: Kembalikan status di database menjadi Offline sebelum keluar sesi
      await updateStatusKeDatabase('Offline');
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#e5e7eb', color: '#374151', fontFamily: 'sans-serif' }}>
        <h3 style={{ fontWeight: '500' }}>🔄 Menghubungkan ke sistem BM Kurir...</h3>
      </div>
    );
  }

  // --- 🔀 LOGIKA RENDER UTAMA ---
  const renderMainContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <main style={mainContentStyle}>
            <div style={headerContent}>
              <h2 style={{ margin: 0, color: '#111827', textTransform: 'capitalize', fontSize: '24px', fontWeight: 'bold' }}>Halo, {namaKurir}</h2>
              <button 
                onClick={handleToggleStatus} 
                style={{
                  ...btnStatusStyle,
                  backgroundColor: statusOperasional === 'Online' ? '#dcfce7' : '#fee2e2',
                  color: statusOperasional === 'Online' ? '#16a34a' : '#dc2626',
                  border: statusOperasional === 'Online' ? '1px solid #bbf7d0' : '1px solid #fca5a5'
                }}
              >
                ● {statusOperasional === 'Online' ? 'Aktif (Online)' : 'Nonaktif (Offline)'}
              </button>
            </div>

            {statusOperasional === 'Offline' ? (
              <div style={{ ...emptyStateBox, borderColor: '#fca5a5', backgroundColor: '#fff5f5' }}>
                <span style={{ fontSize: '50px', marginBottom: '10px' }}>😴</span>
                <h3 style={{ color: '#991b1b', margin: '0 0 8px 0', fontWeight: 'bold' }}>Status Anda Sedang Offline</h3>
                <p style={{ color: '#7f1d1d', fontSize: '14px', margin: 0, maxWidth: '380px', lineHeight: '1.5' }}>
                  Anda tidak akan menerima distribusi pesanan antaran dari Admin selama status Anda Nonaktif. Silakan aktifkan status di pojok kanan atas jika Anda siap bekerja kembali.
                </p>
              </div>
            ) : (
              <>
                {pesanans && pesanans.length > 0 ? (
                  <div style={{ marginTop: '30px' }}>
                    {pesanans.map((pesananAktif, index) => {
                      const currentStatus = pesananAktif.status ? pesananAktif.status.toLowerCase() : '';

                      return (
                        <div key={pesananAktif._id || index} style={{ ...tableTugasWrapper, marginTop: index === 0 ? '0px' : '20px' }}>
                          <div style={tableHeaderTitle}>Tugas #{index + 1}</div>
                          <div style={rowInfo}><span style={labelInfo}>Customer</span><p style={valueInfo}>{pesananAktif.namaLengkap || pesananAktif.customer || '-'}</p></div>
                          <div style={rowInfo}><span style={labelInfo}>No Telpon</span><p style={valueInfo}>{pesananAktif.telepon || pesananAktif.noTelpon || '-'}</p></div>
                          <div style={rowInfo}><span style={labelInfo}>Pickup</span><p style={valueInfo}>{pesananAktif.alamatPickup || 'Lokasi Gudang / Toko'}</p></div>
                          <div style={rowInfo}><span style={labelInfo}>Tujuan</span><p style={valueInfo}>{pesananAktif.alamat || '-'}</p></div>
                          <div style={rowInfo}><span style={labelInfo}>Pesanan</span><p style={{ ...valueInfo, borderBottom: 'none' }}>{pesananAktif.detailPesanan || pesananAktif.pesanan || '-'}</p></div>
                          <div style={{ textAlign: 'center', padding: '15px 0', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                            <span style={badgeStatusProses}>{pesananAktif.status || 'Menunggu Diproses'}</span>
                          </div>
                          
                          {/* --- STEPPER INTERAKTIF --- */}
                          <div style={stepperContainer}>
                            <button 
                              onClick={() => handleUpdateStatusPesanan(pesananAktif._id, 'Ambil Barang')}
                              disabled={currentStatus !== 'proses' && currentStatus !== 'pending'}
                              style={(currentStatus === 'proses' || currentStatus === 'pending') ? stepActiveStyle : stepDisabledStyle}
                            >
                              Mulai Tugas
                            </button>

                            <button 
                              onClick={() => handleUpdateStatusPesanan(pesananAktif._id, 'Dalam Perjalanan')}
                              disabled={currentStatus !== 'ambil barang' && currentStatus !== 'on progress'}
                              style={(currentStatus === 'ambil barang' || currentStatus === 'on progress') ? stepActiveStyle : stepDisabledStyle}
                            >
                              Ambil Barang
                            </button>

                            <button 
                              onClick={() => handleUpdateStatusPesanan(pesananAktif._id, 'Sampai Tujuan')}
                              disabled={currentStatus !== 'dalam perjalanan' && currentStatus !== 'shipping'}
                              style={(currentStatus === 'dalam perjalanan' || currentStatus === 'shipping') ? stepActiveStyle : stepDisabledStyle}
                            >
                              Dalam Perjalanan
                            </button>

                            <button 
                              onClick={() => handleUpdateStatusPesanan(pesananAktif._id, 'Selesai')}
                              disabled={currentStatus !== 'sampai tujuan' && currentStatus !== 'out for delivery'}
                              style={(currentStatus === 'sampai tujuan' || currentStatus === 'out for delivery') ? stepActiveStyle : stepDisabledStyle}
                            >
                              Sampai Tujuan
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={emptyStateBox}>
                    <div style={iconContainer}><span style={{ fontSize: '45px' }}>🏍️</span></div>
                    <h3 style={{ color: '#1f2937', margin: '0 0 6px 0', fontWeight: 'bold', fontSize: '18px' }}>Menunggu Pesanan dari Admin</h3>
                    <p style={{ color: '#6b7280', fontSize: '14px', margin: 0, maxWidth: '360px', lineHeight: '1.6' }}>
                      Status Anda aktif dan siap bekerja! Saat ini Admin belum mendistribusikan pesanan ke akun Anda. Sembari menunggu, tetap siaga ya!
                    </p>
                    <button onClick={() => fetchDataKurir(true)} style={btnCekUlang}>🔄 Periksa Tugas Baru</button>
                  </div>
                )}
              </>
            )}
          </main>
        );
      case 'riwayat':
        return <RiwayatKurir />;
      case 'profil':
        return (
          <ProfilKurir 
            kurirId={kurirId} 
            namaKurir={namaKurir} 
            setNamaKurir={setNamaKurir} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={containerStyle}>
      {/* SIDEBAR NAVIGATION */}
      <aside style={sidebarStyle}>
        <div style={logoWrapper}>
          <img src={logoBm} alt="Logo BM Kurir" style={logoImageStyle} />
        </div>
          
        <nav style={navStyle}>
          <button onClick={() => setActiveMenu('dashboard')} style={activeMenu === 'dashboard' ? navLinkActive : navLink}>
            <i className="fas fa-home" style={{ marginRight: '10px' }}></i> Dashboard
          </button>
          <button onClick={() => setActiveMenu('riwayat')} style={activeMenu === 'riwayat' ? navLinkActive : navLink}>
            <i className="fas fa-history" style={{ marginRight: '10px' }}></i> Riwayat
          </button>
          <button onClick={handleLogout} style={btnLogoutStyle}>
            <i className="fas fa-sign-out-alt" style={{ marginRight: '10px' }}></i> Logout
          </button>
        </nav>

        {/* FOOTER PROFIL SIDEBAR */}
        <div 
          onClick={() => setActiveMenu('profil')} 
          style={{ 
            ...profileFooter, 
            backgroundColor: activeMenu === 'profil' ? '#22c55e' : '#14532d',
            cursor: 'pointer'
          }}
        >
          <div style={avatarStyle}>👤</div>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', textTransform: 'capitalize', fontWeight: 'bold' }}>{namaKurir}</h4>
            <span style={{ fontSize: '11px', color: '#bbf7d0' }}>Kurir</span>
          </div>
        </div>
      </aside>

      {/* RENDER VIEW AREA */}
      <div style={contentWrapperStyle}>
        {renderMainContent()}
      </div>
    </div>
  );
};

// --- STYLES CSS OBJECTS ---
const containerStyle = { display: 'flex', backgroundColor: '#e5e7eb', minHeight: '100vh', fontFamily: 'sans-serif' };
const sidebarStyle = { width: '240px', backgroundColor: '#15803d', color: 'white', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 10 };
const logoWrapper = { padding: '20px 15px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid #166534' };
const logoImageStyle = { maxHeight: '55px', maxWidth: '100%', objectFit: 'contain' };
const navStyle = { flex: 1, padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '4px' };
const navLinkActive = { padding: '12px 20px', backgroundColor: '#22c55e', color: 'white', border: 'none', width: '100%', textAlign: 'left', fontSize: '15px', fontWeight: '500', cursor: 'pointer', display: 'block' };
const navLink = { padding: '12px 20px', color: '#bbf7d0', backgroundColor: 'transparent', border: 'none', width: '100%', textAlign: 'left', fontSize: '15px', cursor: 'pointer', display: 'block' };
const btnLogoutStyle = { padding: '12px 20px', color: '#bbf7d0', backgroundColor: 'transparent', border: 'none', width: '100%', textAlign: 'left', fontSize: '15px', cursor: 'pointer' };
const profileFooter = { padding: '20px', borderTop: '1px solid #166534', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background-color 0.2s' };
const avatarStyle = { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#4b5563', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' };
const contentWrapperStyle = { flex: 1, marginLeft: '240px' };
const mainContentStyle = { padding: '40px' };
const headerContent = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #d1d5db', paddingBottom: '15px' };
const btnStatusStyle = { padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', outline: 'none' };

const tableTugasWrapper = { backgroundColor: 'white', borderRadius: '8px', border: '1px solid #cbd5e1', maxWidth: '600px', margin: '30px auto 0 auto', overflow: 'hidden' };
const tableHeaderTitle = { backgroundColor: '#f8fafc', padding: '12px 20px', fontSize: '16px', fontWeight: 'bold', color: '#334155', borderBottom: '1px solid #e2e8f0' };
const rowInfo = { display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '12px 20px', alignItems: 'baseline' };
const labelInfo = { width: '120px', fontSize: '12px', color: '#64748b', fontWeight: '500' };
const valueInfo = { flex: 1, margin: 0, fontSize: '14px', color: '#1e293b', fontWeight: '500' };
const badgeStatusProses = { backgroundColor: '#fef3c7', color: '#d97706', padding: '6px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' };

const stepperContainer = { display: 'flex', justifyContent: 'center', gap: '10px', padding: '20px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' };
const stepActiveStyle = { backgroundColor: '#15803d', color: 'white', padding: '8px 15px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };
const stepDisabledStyle = { backgroundColor: '#cbd5e1', color: '#64748b', padding: '8px 15px', borderRadius: '4px', fontSize: '12px', border: 'none', cursor: 'not-allowed', opacity: 0.7 };

const emptyStateBox = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', marginTop: '40px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white' };
const iconContainer = { width: '80px', height: '80px', backgroundColor: '#f3f4f6', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' };
const btnCekUlang = { marginTop: '20px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' };

export default DashboardKurir;