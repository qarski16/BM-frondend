import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar'; // Panggil file Sidebar pusat

const ManajemenKurir = () => {
  const navigate = useNavigate();
  const [kurirs, setKurirs] = useState([]);
  
  // State untuk Fitur Filter dan Pencarian
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');

  // Fungsi ambil data kurir dari backend
  const fetchKurir = async () => {
    try {
      // Menembak ke endpoint yang sudah kita lengkapi dengan kalkulasi komisi 2% per pengantaran selesai
      const res = await axios.get('http://localhost:5000/api/auth/semua-kurir');
      if (res.data && Array.isArray(res.data)) {
        setKurirs(res.data);
        console.log("Frontend berhasil memuat daftar kurir + data komisi:", res.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data kurir dari backend:", err.message);
    }
  };

  useEffect(() => {
    fetchKurir();
    
    // Fitur sinkronisasi otomatis status kurir setiap 15 detik
    const interval = setInterval(fetchKurir, 15000); 
    return () => clearInterval(interval);
  }, []);

  // ====================================================================
  // LOGIKA UTAMA: Proses Pencarian dan Penyaringan Kurir
  // ====================================================================
  const filteredKurirs = kurirs.filter((kurir) => {
    // 1. Amankan variabel teks agar tidak error jika field di database null/kosong
    const nama = kurir.namaLengkap ? kurir.namaLengkap.toLowerCase() : '';
    const statusKurir = kurir.statusOnline ? kurir.statusOnline : 'Offline';
    
    // 2. Logika pencarian karakter nama
    const cocokNama = nama.includes(searchTerm.toLowerCase());
    
    // 3. Logika dropdown status operasional
    const cocokStatus = statusFilter === 'Semua Status' || 
                        statusKurir.toLowerCase() === statusFilter.toLowerCase();

    return cocokNama && cocokStatus;
  });

  return (
    <div style={containerStyle}>
      {/* 1. SIDEBAR UTAMA */}
      <Sidebar />

      {/* 2. MAIN CONTENT */}
      <main style={mainContentStyle}>
        <h2 style={{ color: 'white', marginBottom: '30px', fontWeight: 'bold' }}>Manajemen Kurir</h2>
        
        {/* Search & Filter Bar */}
        <div style={filterBar}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            style={selectStyle}
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>

          <div style={searchContainer}>
            <i className="fas fa-search" style={searchIcon}></i>
            <input 
              type="text" 
              placeholder="Cari nama kurir..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={searchInput} 
            />
          </div>
        </div>

        {/* Grid Kartu Kurir Dinamis */}
        <div style={kurirGrid}>
          {filteredKurirs.length > 0 ? (
            filteredKurirs.map((kurir) => {
              // Ambil status asli, jika kosong otomatis anggap Offline
              const currentStatus = kurir.statusOnline || 'Offline';
              
              // 🎯 Ambil nilai komisi dari backend, pastikan jika undefined bernilai 0
              const persenKomisi = kurir.komisiSistem !== undefined ? kurir.komisiSistem : 0;
              
              return (
                <div key={kurir._id} style={kurirCard}>
                  <div style={cardHeader}>
                    <div style={avatarCircle}><i className="fas fa-user"></i></div>
                    <div>
                      <h4 style={{ margin: 0, color: 'white' }}>{kurir.namaLengkap}</h4>
                      <p style={{ 
                        ...statusLabel, 
                        color: currentStatus.toLowerCase() === 'online' ? '#10b981' : '#ef4444' 
                      }}>
                        ● {currentStatus}
                      </p> 
                    </div>
                  </div>
                  <div style={cardBody}>
                    <p>ID Kurir: <span style={{color: 'white', fontWeight: 'bold'}}>{kurir._id}</span></p>
                    <p>Email: <span style={{color: 'white'}}>{kurir.email}</span></p>
                    <p>Lokasi terakhir: <span style={{color: 'white'}}>{kurir.lokasiTerakhir || 'Parepare'}</span></p>
                    
                    {/* CONTAINER PROGRESS BAR KOMISI */}
                    <div style={progressBarContainer}>
                       <div style={progressLabel}>
                         <span>Komisi Sistem</span>
                         {/* Menampilkan angka komisi dinamis hasil kalkulasi backend */}
                         <span style={{ fontWeight: 'bold', color: 'white' }}>{persenKomisi}%</span>
                       </div>
                       <div style={progressBar}>
                          {/* Garis biru indikator komisi akan memanjang maju otomatis mengikuti persentase */}
                          <div style={{...progressFill, width: `${Math.min(persenKomisi, 100)}%`}}></div>
                       </div>
                    </div>
                  </div>
                  <div style={cardActions}>
                    <button 
                      onClick={() => navigate('/pesanan-masuk')} 
                      style={btnAssign}
                    >
                      <i className="fas fa-plus-circle"></i> Assign Tugas
                    </button>
                    <button 
                      onClick={() => alert(`Detail kurir ${kurir.namaLengkap} (ID: ${kurir._id})\nTotal Komisi Aktif: ${persenKomisi}%`)} 
                      style={btnDetail}
                    >
                      <i className="fas fa-eye"></i> Detail
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '14px', gridColumn: '1 / -1' }}>
              Tidak ada data kurir terdaftar yang cocok dengan kriteria pencarian Anda.
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

// --- STYLES ---
const containerStyle = { display: 'flex', backgroundColor: '#111827', minHeight: '100vh' };
const mainContentStyle = { flex: 1, padding: '30px', marginLeft: '250px' };

const filterBar = { display: 'flex', justifyContent: 'space-between', marginBottom: '25px', gap: '20px' };
const selectStyle = { backgroundColor: '#1f2937', color: 'white', border: '1px solid #374151', padding: '10px 15px', borderRadius: '8px', outline: 'none', cursor: 'pointer' };
const searchContainer = { position: 'relative', flex: 1, maxWidth: '400px' };
const searchIcon = { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' };
const searchInput = { width: '100%', backgroundColor: '#1f2937', border: '1px solid #374151', padding: '10px 10px 10px 40px', borderRadius: '8px', color: 'white', outline: 'none' };

const kurirGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' };
const kurirCard = { backgroundColor: '#1f2937', padding: '20px', borderRadius: '15px', border: '1px solid #374151', transition: 'transform 0.2s' };
const cardHeader = { display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' };
const avatarCircle = { width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' };
const statusLabel = { margin: 0, fontSize: '12px', fontWeight: 'bold', marginTop: '4px' };

const cardBody = { fontSize: '13px', color: '#9ca3af', marginBottom: '20px', lineHeight: '1.6' };
const progressBarContainer = { marginTop: '15px' };
const progressLabel = { display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '11px' };
const progressBar = { width: '100%', height: '6px', backgroundColor: '#111827', borderRadius: '10px', overflow: 'hidden' };
const progressFill = { height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.4s ease-in-out' }; // Penambahan animasi transisi agar garis bergerak mulus

const cardActions = { display: 'flex', gap: '10px' };
const btnAssign = { flex: 1, backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'background-color 0.2s' };
const btnDetail = { backgroundColor: 'transparent', color: 'white', border: '1px solid #374151', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' };

export default ManajemenKurir;