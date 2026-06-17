import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RiwayatKurir = () => {
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pencarian, setPencarian] = useState('');
  
  // Ambil ID Kurir dari localStorage
  const [kurirId] = useState(localStorage.getItem('kurirId') || localStorage.getItem('userId') || '');

  // Mengambil data riwayat dari database lokal backend
  const fetchRiwayat = async () => {
    if (!kurirId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};
      
      // Menembak endpoint riwayat yang sudah diperbarui
      const response = await axios.get(`http://localhost:5000/api/pesanan/kurir/riwayat/${kurirId}`, config);
      setRiwayat(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Gagal memuat data riwayat database:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, [kurirId]);

  // --- LOGIKA PERHITUNGAN STATISTIK DARI DATABASE ---
  const totalPengantaran = riwayat.length;
  const selesaiCount = riwayat.filter(item => item.status?.toLowerCase() === 'selesai').length;
  
  // Menghitung status pengantaran aktif yang sedang berjalan
  const prosesCount = riwayat.filter(item => 
    item.status?.toLowerCase() === 'proses' || 
    item.status?.toLowerCase() === 'ambil barang' || 
    item.status?.toLowerCase() === 'dalam perjalanan' ||
    item.status?.toLowerCase() === 'sampai tujuan'
  ).length;
  
  // Default "-" karena belum ada fitur ulasan/penilaian di database
  const ratingKurir = "-"; 

  // --- LOGIKA FILTER PENCARIAN AMAN ---
  const riwayatFilter = riwayat.filter(item => {
    const searchWord = pencarian.toLowerCase();
    
    const idMatch = item._id ? item._id.toLowerCase().includes(searchWord) : false;
    const namaMatch = item.namaLengkap ? item.namaLengkap.toLowerCase().includes(searchWord) : false;
    const customerMatch = item.customer ? item.customer.toLowerCase().includes(searchWord) : false;
    const alamatMatch = item.alamat ? item.alamat.toLowerCase().includes(searchWord) : false;

    return idMatch || namaMatch || customerMatch || alamatMatch;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontFamily: 'sans-serif', color: '#4b5563' }}>
        <h3>🔄 Memuat data riwayat dari database...</h3>
      </div>
    );
  }

  return (
    <div style={mainContentStyle}>
      {/* HEADER UTAMA */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ margin: 0, color: '#111827', fontSize: '24px', fontWeight: 'bold' }}>Riwayat Pengantaran</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>Berikut adalah riwayat semua pengantaran yang telah anda lakukan.</p>
      </div>

      {/* 📊 BARIS STATISTIK RINGKASAN */}
      <div style={statsContainer}>
        <div style={cardStyle}>
          <div style={iconBox}><i className="fas fa-shopping-cart" style={{ color: '#374151' }}></i></div>
          <div>
            <span style={cardLabel}>Total Pengantaran</span>
            <h3 style={cardValue}>{totalPengantaran}</h3>
            <span style={cardSub}>Pesanan</span>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ ...iconBox, backgroundColor: '#dcfce7' }}><i className="fas fa-check" style={{ color: '#16a34a' }}></i></div>
          <div>
            <span style={cardLabel}>Selesai</span>
            <h3 style={cardValue}>{selesaiCount}</h3>
            <span style={cardSub}>Pesanan</span>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ ...iconBox, backgroundColor: '#fef3c7' }}><i className="fas fa-hourglass-half" style={{ color: '#d97706' }}></i></div>
          <div>
            <span style={cardLabel}>Dalam Proses</span>
            <h3 style={cardValue}>{prosesCount}</h3>
            <span style={cardSub}>Pesanan</span>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ ...iconBox, backgroundColor: '#fee2e2' }}><i className="fas fa-star" style={{ color: '#dc2626' }}></i></div>
          <div>
            <span style={cardLabel}>Rating</span>
            <h3 style={cardValue}>{ratingKurir}</h3>
            <span style={cardSub}>{ratingKurir === "-" ? "Belum Ada Penilaian" : "Dari 5.0"}</span>
          </div>
        </div>
      </div>

      {/* 🔍 INPUT PENCARIAN */}
      <div style={searchWrapper}>
        <i className="fas fa-search" style={searchIcon}></i>
        <input 
          type="text" 
          placeholder="Cari berdasarkan ID pesanan, Customer, atau alamat..." 
          value={pencarian}
          onChange={(e) => setPencarian(e.target.value)}
          style={inputSearchStyle}
        />
      </div>

      {/* 🗂️ TABEL RIWAYAT DATABASE */}
      <div style={tableContainer}>
        <table style={tableStyle}>
          <thead>
            <tr style={thRowStyle}>
              <th style={thStyle}>ID Pesanan</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Alamat Tujuan</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {riwayatFilter.length > 0 ? (
              riwayatFilter.map((item, index) => (
                <tr key={item._id || index} style={trRowStyle}>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: '#4b5563' }}>
                    {item._id ? `ORD-${item._id.substring(item._id.length - 6).toUpperCase()}` : `ORD-00${index+1}`}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.namaLengkap || item.customer || '-'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{item.telepon || item.noTelpon || ''}</div>
                  </td>
                  <td style={{ ...tdStyle, color: '#475569', fontSize: '13px', maxWidth: '250px' }}>
                    {item.alamat || '-'}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      ...badgeStatus,
                      backgroundColor: item.status?.toLowerCase() === 'selesai' ? '#dcfce7' : '#fef3c7',
                      color: item.status?.toLowerCase() === 'selesai' ? '#15803d' : '#b45309'
                    }}>
                      {item.status || 'Proses'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: '#64748b', fontSize: '13px' }}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '4px 0', color: '#94a3b8' }}>
                  <p>Tidak ada data riwayat pengantaran ditemukan.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- OBJECT CSS STYLING ---
const mainContentStyle = { padding: '30px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif' };
const statsContainer = { display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' };
const cardStyle = { flex: 1, minWidth: '200px', backgroundColor: 'white', borderRadius: '8px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const iconBox = { width: '45px', height: '45px', borderRadius: '8px', backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' };
const cardLabel = { fontSize: '12px', color: '#6b7280', fontWeight: '500' };
const cardValue = { margin: '2px 0', fontSize: '22px', fontWeight: 'bold', color: '#111827' };
const cardSub = { fontSize: '11px', color: '#9ca3af' };
const searchWrapper = { position: 'relative', marginBottom: '20px', maxWidth: '500px' };
const searchIcon = { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' };
const inputSearchStyle = { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '25px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', boxSizing: 'border-box' };
const tableContainer = { backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const thRowStyle = { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' };
const thStyle = { padding: '14px 20px', fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' };
const trRowStyle = { borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' };
const tdStyle = { padding: '14px 20px', fontSize: '14px', verticalAlign: 'middle' };
const badgeStatus = { padding: '5px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: '600', display: 'inline-block' };

export default RiwayatKurir;