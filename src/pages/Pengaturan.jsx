import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const Pengaturan = () => {
  // State Utama Pengaturan Sistem
  const [config, setConfig] = useState({
    komisiSistem: 2,
    maxOrderPerKurir: 5,
    namaAplikasi: "BM Kurir",
    zonaWaktu: "Wita",
    bahasaSistem: "Indonesia",
    verifikasiLogin: false,
    metodeVerifikasi: "Kirim kode ke email",
    batasPercobaanLogin: 5,
    waktuBlokir: 10
  });

  // 🌐 MENGAMBIL URL BACKEND SECARA DINAMIS (Bawaan Vite untuk Vercel)
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Ambil data asli dari MongoDB saat halaman dibuka
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const configHeaders = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

        // ⭐ DI-UPDATE: Menggunakan BASE_URL dinamis dan menambahkan Token Header
        const res = await axios.get(`${BASE_URL}/api/setting`, configHeaders);
        if (res.data) {
          setConfig(res.data);
        }
      } catch (err) {
        console.error("Gagal memuat pengaturan dari database cloud:", err);
      }
    };
    fetchSettings();
  }, []);

  // Handler dinamis untuk mendeteksi perubahan input form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Fungsi kirim data ke backend MongoDB
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const configHeaders = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

      // ⭐ DI-UPDATE: Mengarahkan endpoint POST update setting ke URL Cloud dinamis + Token Header
      const res = await axios.post(`${BASE_URL}/api/setting`, config, configHeaders);
      alert(res.data.msg || "Pengaturan berhasil diperbarui di Cloud!");
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan perubahan ke database cloud.");
    }
  };

  return (
    <div style={containerStyle}>
      <Sidebar />

      <main style={mainContentStyle}>
        {/* SECTION 1: TOPBAR */}
        <div style={topHeader}>
          <div style={searchWrapper}>
            <i className="fas fa-search" style={{ color: '#9ca3af' }}></i>
            <input type="text" placeholder="Search" style={searchInput} />
          </div>
          <div style={adminProfile}>
            <i className="fas fa-user-circle" style={{ fontSize: '24px' }}></i>
            <span>Admin <i className="fas fa-chevron-down" style={{ fontSize: '10px' }}></i></span>
          </div>
        </div>

        <h2 style={titleSection}>Pengaturan Sistem</h2>

        {/* SECTION 2: TABS */}
        <div style={tabContainer}>
          <button style={tabItem}><i className="fas fa-money-bill-wave"></i> Komisi</button>
          <button style={tabItem}><i className="fas fa-motorcycle"></i> Kurir</button>
          <button style={tabItem}><i className="fas fa-desktop"></i> Sistem</button>
          <button style={tabItemActive}><i className="fas fa-shield-alt"></i> Keamanan</button>
        </div>

        {/* Form pembungkus utama agar aksi simpan tersentralisasi */}
        <form onSubmit={handleSaveSettings}>
          
          {/* SECTION 3: GRID ATAS (KOMISI, KURIR, SISTEM) */}
          <div style={gridRow3}>
            {/* Card Komisi */}
            <div style={card}>
              <h4 style={cardTitle}>Pengaturan Komisi</h4>
              <div style={infoRowInline}>
                <span style={cardSubtitle}>Komisi Sistem Per Pengantaran</span>
                <span style={badgeSmall}>{config.komisiSistem}%</span>
              </div>
              <p style={descText}>Ubah nilai komisi flat sistem database:</p>
              <input 
                type="number" 
                name="komisiSistem"
                value={config.komisiSistem}
                onChange={handleInputChange}
                style={inputField} 
              />
            </div>

            {/* Card Kurir */}
            <div style={card}>
              <h4 style={cardTitle}>Pengaturan Kurir</h4>
              <label style={labelStyle}>Jumlah Maksimal Order Per Kurir</label>
              <input 
                type="number" 
                name="maxOrderPerKurir"
                value={config.maxOrderPerKurir}
                onChange={handleInputChange}
                style={inputField} 
              />
              <div style={{ marginTop: '15px' }}>
                <p style={descText}>Manajemen batas tampung tas kurir aktif.</p>
              </div>
            </div>

            {/* Card Sistem */}
            <div style={card}>
              <h4 style={cardTitle}>Pengaturan Sistem</h4>
              <div style={rowInfoBorder}>
                <span>Nama Aplikasi</span> 
                <input 
                  type="text" 
                  name="namaAplikasi" 
                  value={config.namaAplikasi} 
                  onChange={handleInputChange} 
                  style={inputInlineBlur}
                />
              </div>
              <div style={rowInfoBorder}>
                <span>Zona Waktu</span> 
                <span style={{color:'white'}}>{config.zonaWaktu}</span>
              </div>
              <div style={rowInfoBorder}>
                <span>Bahasa Sistem</span> 
                <span style={{color:'white'}}>{config.bahasaSistem}</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: KEAMANAN (GRID 3 KOLOM) */}
          <div style={cardFull}>
            <h4 style={cardTitle}>Pengaturan Keamanan</h4>
            <p style={descText}>Atur keamanan akun admin dan sistem untuk melindungi data akses tidak sah</p>
            
            <div style={gridRow3Inner}>
              <div style={innerColumn}>
                <h5 style={innerTitle}>Verifikasi Login</h5>
                <p style={descSmall}>Aktifkan verifikasi dua langkah untuk keamanan tambahan saat login.</p>
                <label style={{...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                  <input 
                    type="checkbox" 
                    name="verifikasiLogin"
                    checked={config.verifikasiLogin}
                    onChange={handleInputChange}
                  /> Aktifkan Verifikasi
                </label>
                <label style={{...labelStyle, marginTop: '10px'}}>Metode Verifikasi</label>
                <select 
                  name="metodeVerifikasi" 
                  value={config.metodeVerifikasi} 
                  onChange={handleInputChange} 
                  style={inputField}
                >
                  <option value="Kirim kode ke email">Kirim kode ke email</option>
                  <option value="Aplikasi Authenticator">Aplikasi Authenticator</option>
                </select>
              </div>

              <div style={innerColumn}>
                <h5 style={innerTitle}>Batas Percobaan Login</h5>
                <p style={descSmall}>Tentukan jumlah maksimal percobaan login yang salah.</p>
                <label style={labelStyle}>Batas Percobaan Login</label>
                <div style={inputWithUnit}>
                  <input 
                    type="number" 
                    name="batasPercobaanLogin"
                    value={config.batasPercobaanLogin} 
                    onChange={handleInputChange}
                    style={inputInner} 
                  />
                  <span style={unitTag}>Kali</span>
                </div>
                <p style={descTiny}>Akun diblokir sementara jika mencapai batas ini.</p>
              </div>

              <div style={innerColumn}>
                <h5 style={innerTitle}>Waktu Blokir Akun</h5>
                <p style={descSmall}>Tentukan berapa lama akun akan diblokir setelah percobaan gagal.</p>
                <label style={labelStyle}>Waktu Blokir</label>
                <div style={inputWithUnit}>
                  <input 
                    type="number" 
                    name="waktuBlokir"
                    value={config.waktuBlokir} 
                    onChange={handleInputChange}
                    style={inputInner} 
                  />
                  <span style={unitTag}>Menit</span>
                </div>
                <p style={descTiny}>Proteksi serangan brute-force otomatis.</p>
              </div>
            </div>
          </div>

          {/* SECTION 5: PASSWORD & ACTIONS */}
          <div style={gridRowCustom}>
            <div style={card}>
              <h4 style={cardTitle}>Ubah Password Admin</h4>
              <p style={descSmall}>Gunakan form di bawah untuk mengganti password admin lama Anda.</p>
              <div style={flexGroup}>
                <div style={{flex: 1}}>
                  <label style={labelStyle}>Password Lama</label>
                  <input type="password" placeholder="******" style={inputField} />
                </div>
                <div style={{flex: 1}}>
                  <label style={labelStyle}>Password Baru</label>
                  <input type="password" placeholder="******" style={inputField} />
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={{marginBottom: '15px'}}>
                <h4 style={cardTitle}>Sesi Global</h4>
                <p style={descSmall}>Keluar dari semua perangkat lain yang terhubung ke sistem.</p>
                <button type="button" onClick={() => alert('Sesi dibersihkan!')} style={btnRed}>
                  <i className="fas fa-sign-out-alt"></i> Logout Semua Session
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 6: BACKUP DATABASE */}
          <div style={cardBackup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={cardTitle}>Backup Database</h4>
                <p style={descSmall}>Lakukan backup database sistem logistik BM Kurir secara berkala.</p>
                <div style={backupMeta}>
                  <span>Backup Terakhir: <b style={{color:'white'}}>Hari Ini</b></span>
                  <span>Ukuran Backup: <b style={{color:'white'}}>142,5 MB</b></span>
                  <span>Simpan di: <b style={{color:'white'}}>Cloud Atlas</b></span>
                </div>
              </div>
              <button type="button" onClick={() => alert('Backup Berhasil Diunduh!')} style={btnGreenBackup}>
                <i className="fas fa-database"></i> Backup Sekarang
              </button>
            </div>
          </div>

          {/* SECTION 7: FINAL GLOBAL ACTION */}
          <div style={footerAction}>
            <button type="submit" style={btnGlobalSave}>
              <i className="fas fa-check-circle"></i> Simpan Semua Perubahan
            </button>
            <p style={descTinyCenter}>Klik untuk menerapkan seluruh konfigurasi baru ke database cloud</p>
          </div>
        </form>
      </main>
    </div>
  );
};

// --- STYLES ---
const containerStyle = { display: 'flex', backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif" };
const mainContentStyle = { flex: 1, padding: '20px 40px', marginLeft: '250px', display: 'flex', flexDirection: 'column', minHeight: '100vh' };
const topHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const searchWrapper = { backgroundColor: '#1e293b', padding: '10px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', width: '350px', border: '1px solid #334155' };
const searchInput = { background: 'none', border: 'none', color: 'white', outline: 'none', width: '100%' };
const adminProfile = { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', backgroundColor: '#1e293b', padding: '8px 15px', borderRadius: '8px' };
const titleSection = { fontSize: '24px', fontWeight: 'bold', marginBottom: '25px' };
const tabContainer = { display: 'flex', gap: '12px', marginBottom: '30px' };
const tabItem = { backgroundColor: '#1e293b', color: '#94a3b8', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' };
const tabItemActive = { ...tabItem, backgroundColor: '#334155', color: 'white' };
const gridRow3 = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' };
const card = { backgroundColor: '#1e293b', padding: '25px', borderRadius: '12px', border: '1px solid #334155' };
const cardFull = { ...card, marginBottom: '25px' };
const cardTitle = { fontSize: '16px', fontWeight: '600', marginBottom: '15px' };
const cardSubtitle = { fontSize: '13px', color: '#94a3b8' };
const badgeSmall = { backgroundColor: '#0f172a', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#fbbf24' };
const descText = { fontSize: '12px', color: '#94a3b8', marginBottom: '15px', lineHeight: '1.6' };
const descSmall = { fontSize: '12px', color: '#64748b', marginBottom: '15px' };
const labelStyle = { display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px' };
const inputField = { width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', padding: '12px', borderRadius: '8px', color: 'white', outline: 'none', fontSize: '13px', boxSizing: 'border-box' };
const inputInlineBlur = { background: 'none', border: 'none', color: 'white', textAlign: 'right', outline: 'none', width: '100px', fontSize: '13px' };
const rowInfoBorder = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '10px 0', borderBottom: '1px solid #334155', color: '#94a3b8' };
const infoRowInline = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' };
const gridRow3Inner = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' };
const innerColumn = { display: 'flex', flexDirection: 'column' };
const innerTitle = { fontSize: '15px', fontWeight: '600', marginBottom: '8px' };
const inputWithUnit = { display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', paddingRight: '12px' };
const inputInner = { ...inputField, border: 'none' };
const unitTag = { color: '#4b5563', fontSize: '12px' };
const descTiny = { fontSize: '10px', color: '#4b5563', marginTop: '5px' };
const gridRowCustom = { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px', marginBottom: '25px' };
const flexGroup = { display: 'flex', gap: '15px' };
const btnRed = { backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', width: '100%', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'center', gap: '10px' };
const cardBackup = { ...card, border: '1px dashed #3b82f6', marginBottom: '25px' };
const backupMeta = { display: 'flex', gap: '30px', fontSize: '12px', color: '#94a3b8', marginTop: '10px' };
const btnGreenBackup = { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' };
const footerAction = { textAlign: 'center', padding: '20px 0 60px 0' };
const btnGlobalSave = { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '15px 45px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', transition: '0.2s', ':hover': { backgroundColor: '#059669' } };
const descTinyCenter = { fontSize: '11px', color: '#4b5563', marginTop: '12px' };

export default Pengaturan;
