import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Konfigurasi URL Base API agar aman saat dideploy ke Vercel
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProfilKurir = ({ kurirId, namaKurir, setNamaKurir }) => {
  const [emailKurir, setEmailKurir] = useState('Kurir001@example.com');
  const [nomorHp, setNomorHp] = useState('0812-3456-7890');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  
  // --- STATE UNTUK GAMBAR/FOTO SIM ---
  const [fileSim, setFileSim] = useState(null);
  const [previewSim, setPreviewSim] = useState('');

  // 🛠️ VALIDASI ID JANGKAUAN GANDA
  const activeKurirId = kurirId && !kurirId.startsWith('6a11') ? kurirId : (localStorage.getItem('kurirId') || 'BM001');

  // --- 🔄 FETCH: AMBIL DATA PROFIL DARI BACKEND SAAT HALAMAN DIBUKA ---
  useEffect(() => {
    const fetchProfilData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token ? { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-auth-token': token
          } 
        } : {};
        
        const response = await axios.get(`${API_BASE_URL}/api/auth/kurir/${activeKurirId}`, config);
        if (response.data) {
          setNamaKurir(response.data.namaLengkap || response.data.nama || '');
          setEmailKurir(response.data.email || '');
          setNomorHp(response.data.telepon || response.data.noHp || '');
          
          // Sinkronisasi jalur gambar statis dengan domain server produksi secara dinamis
          if (response.data.fotoSim) {
            setPreviewSim(`${API_BASE_URL}/${response.data.fotoSim}`);
          }
        }
      } catch (err) {
        console.error("Gagal memuat data profil kurir:", err.message);
      }
    };

    fetchProfilData();
  }, [activeKurirId, setNamaKurir]);

  // --- 💾 SUBMIT 1: EDIT DATA PROFIL UTAMA ---
  const handleEditProfil = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = token ? { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token
        } 
      } : {};
      
      await axios.put(`${API_BASE_URL}/api/auth/kurir/update-profil/${activeKurirId}`, {
        namaLengkap: namaKurir, 
        email: emailKurir,
        telepon: nomorHp
      }, config);

      localStorage.setItem('nama', namaKurir); 
      alert("Profil Anda berhasil diperbarui!");
    } catch (err) {
      alert("Gagal memperbarui profil: " + (err.response?.data?.message || err.message));
    }
  };

  // --- 🔑 SUBMIT 2: GANTI PASSWORD BARU ---
  const handleUbahPassword = async (e) => {
    e.preventDefault();
    if (!passwordBaru) return alert("Password baru tidak boleh kosong!");
    if (passwordBaru !== konfirmasiPassword) return alert("Konfirmasi password tidak cocok!");

    try {
      const token = localStorage.getItem('token');
      const config = token ? { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token
        } 
      } : {};
      
      await axios.put(`${API_BASE_URL}/api/auth/kurir/ubah-password/${activeKurirId}`, {
        password: passwordBaru
      }, config);

      alert("Password berhasil diubah!");
      setPasswordBaru('');
      setKonfirmasiPassword('');
    } catch (err) {
      alert("Gagal mengubah password: " + (err.response?.data?.message || err.message));
    }
  };

  // --- 📷 HANDLING PILIHAN FILE FOTO SIM ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileSim(file);
      setPreviewSim(URL.createObjectURL(file)); 
    }
  };

  // --- 🗄️ SUBMIT 3: UNGGAH DAN SIMPAN FOTO SIM ---
  const handleSimpanSim = async () => {
    if (!fileSim) return alert("Silakan pilih foto SIM terlebih dahulu dengan tombol Upload Foto!");
    
    const formData = new FormData();
    formData.append('fotoSim', fileSim);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { 
            'Authorization': `Bearer ${token}`,
            'x-auth-token': token
          })
        }
      };

      await axios.put(`${API_BASE_URL}/api/auth/kurir/upload-sim/${activeKurirId}`, formData, config);
      alert("Foto SIM Anda berhasil diunggah dan disimpan ke sistem!");
    } catch (err) {
      alert("Gagal mengunggah foto SIM: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      {/* Bagian Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #d1d5db', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, color: '#111827', fontSize: '24px', fontWeight: 'bold' }}>Profil Kurir</h2>
        <span style={{ fontSize: '13px', backgroundColor: '#dcfce7', color: '#16a34a', padding: '6px 14px', borderRadius: '20px', fontWeight: '700' }}>● Aktif</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '25px' }}>
        
        {/* Box Atas: Form Informasi Utama */}
        <form onSubmit={handleEditProfil} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Informasi profil anda sebagai kurir:</span>
          </div>
          
          <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '45px', border: '1px solid #cbd5e1' }}>👤</div>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={labelFormStyle}>Nama</label>
                <input type="text" value={namaKurir} onChange={(e) => setNamaKurir(e.target.value)} style={inputFormStyle} required />
              </div>
              <div>
                <label style={labelFormStyle}>ID Kurir</label>
                <input type="text" value={activeKurirId} disabled style={{ ...inputFormStyle, backgroundColor: '#f1f5f9', cursor: 'not-allowed', fontWeight: 'bold' }} />
              </div>
              <div>
                <label style={labelFormStyle}>Email</label>
                <input type="email" value={emailKurir} onChange={(e) => setEmailKurir(e.target.value)} style={inputFormStyle} required />
              </div>
              <div>
                <label style={labelFormStyle}>Nomor HP</label>
                <input type="text" value={nomorHp} onChange={(e) => setNomorHp(e.target.value)} style={inputFormStyle} required />
              </div>
              <button type="submit" style={{ marginTop: '10px', alignSelf: 'flex-start', backgroundColor: '#2f5233', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Edit Profil</button>
            </div>
          </div>
        </form>

        {/* Box Bawah: Grid Ganti Password & SIM */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* Form Ubah Password */}
          <form onSubmit={handleUbahPassword} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#334155', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Ubah Password</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelFormStyle}>Password Baru</label>
                <input type="password" placeholder="Masukkan password baru" value={passwordBaru} onChange={(e) => setPasswordBaru(e.target.value)} style={inputFormStyle} />
              </div>
              <div>
                <label style={labelFormStyle}>Konfirmasi Password</label>
                <input type="password" placeholder="Konfirmasi password baru" value={konfirmasiPassword} onChange={(e) => setKonfirmasiPassword(e.target.value)} style={inputFormStyle} />
              </div>
              <button type="submit" style={{ backgroundColor: '#5b8266', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', marginTop: '5px' }}>Ubah Password</button>
            </div>
          </form>

          {/* Form Unggah SIM */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#334155', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Foto SIM</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
              <div style={{ 
                width: '120px', 
                height: '75px', 
                backgroundColor: '#cbd5e1', 
                borderRadius: '6px',
                backgroundImage: previewSim ? `url(${previewSim})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '11px'
              }}>
                {!previewSim && "Belum ada foto"}
              </div>
              <label style={{ backgroundColor: '#5b8266', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'inline-block', textAlign: 'center' }}>
                Upload Foto
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            </div>
            <button onClick={handleSimpanSim} style={{ width: '100%', marginTop: '20px', backgroundColor: '#2f5233', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>Simpan Perubahan</button>
          </div>

        </div>
      </div>
    </main>
  );
};

const labelFormStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' };
const inputFormStyle = { width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#1e293b', outline: 'none', boxSizing: 'border-box' };

export default ProfilKurir;
