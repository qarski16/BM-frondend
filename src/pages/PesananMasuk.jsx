import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const PesananMasuk = () => {
  const [orders, setOrders] = useState([]);
  const [daftarKurir, setDaftarKurir] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null); 
  const [selectedKurirId, setSelectedKurirId] = useState(''); // Akan menampung string kustom kurirId (misal: "BM001")
  const [showModal, setShowModal] = useState(false);
  
  const [stats, setStats] = useState({
    total: 0,
    kurirTersedia: 0,
    ditolak: 0 
  });

  // 🌐 MENGAMBIL URL BACKEND SECARA DINAMIS (Bawaan Vite untuk Vercel)
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // 1. Ambil data pesanan dan hitung statistik secara aman (Isolated Try-Catch)
  const fetchData = async () => {
    const token = localStorage.getItem('token');
    // Siapkan konfigurasi header otentikasi JWT token agar aman saat cloud-to-cloud request
    const configHeaders = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

    // ====================================================================
    // JALUR A: Ambil Data Pesanan Utama (Wajib Berhasil)
    // ====================================================================
    try {
      // ⭐ DI-UPDATE: Menggunakan BASE_URL cloud dinamis
      const resOrders = await axios.get(`${BASE_URL}/api/pesanan/semua`, configHeaders);
      const semuaPesanan = resOrders.data || [];
      
      console.log("Data pesanan cloud berhasil diterima frontend:", semuaPesanan);

      // Memastikan status 'pending' dan 'proses' masuk ke dalam tabel antrean admin
      const pesananDitampilkan = semuaPesanan.filter(order => {
        if (!order.status) return true; // Lolos jika status kosong
        const statusLower = order.status.toLowerCase();
        return statusLower === 'pending' || statusLower === 'proses' || statusLower === 'dalam proses';
      });
      
      setOrders(pesananDitampilkan);

      // Hitung statistik lokal (cadangan jika endpoint summary backend bermasalah)
      const jumlahDitolakRealtime = semuaPesanan.filter(order => order.status && order.status.toLowerCase() === 'ditolak').length;
      setStats(prev => ({
        ...prev,
        total: semuaPesanan.length,
        ditolak: jumlahDitolakRealtime
      }));

    } catch (err) {
      console.error("Gagal mengambil data pesanan utama dari cloud:", err.message);
    }

    // ====================================================================
    // JALUR B: Ambil Data Statistik Widget Atas
    // ====================================================================
    try {
      // ⭐ DI-UPDATE: Menggunakan BASE_URL cloud dinamis
      const resStats = await axios.get(`${BASE_URL}/api/pesanan/summary`, configHeaders);
      if (resStats.data) {
        const pendingCount = resStats.data.pesananMasuk || 0;
        const prosesCount = resStats.data.dalamProses || 0;
        const selesaiCount = resStats.data.pesananSelesai || 0;

        setStats(prev => ({
          ...prev,
          total: (pendingCount + prosesCount + selesaiCount) || prev.total,
          kurirTersedia: resStats.data.kurirAktif || 0,
          ditolak: resStats.data.pesananDitolak || resStats.data.ditolak || prev.ditolak
        }));
      }
    } catch (err) {
      console.warn("Endpoint /summary cloud belum siap atau error. Menggunakan kalkulasi lokal frontend.", err.message);
    }

    // ====================================================================
    // JALUR C: Ambil Data Kurir untuk Modal
    // ====================================================================
    try {
      // ⭐ DI-UPDATE: Menggunakan BASE_URL cloud dinamis
      const resKurir = await axios.get(`${BASE_URL}/api/auth/semua-kurir`, configHeaders);
      setDaftarKurir(resKurir.data || []);
    } catch (err) {
      console.error("Gagal mengambil daftar kurir dari cloud:", err.message);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Sinkronisasi otomatis setiap 15 detik
    return () => clearInterval(interval);
  }, []);

  // 2. Buka Modal Detail
  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setSelectedKurirId(order.kurirId || ''); 
    setShowModal(true);
  };

  // 3. Aksi UPDATE: Menugaskan Kurir
  const handleAssignKurir = async () => {
    if (!selectedOrder || !selectedOrder._id) return alert("Data pesanan tidak valid.");
    if (!selectedKurirId) return alert("Silahkan pilih kurir terlebih dahulu!");
    
    try {
      const token = localStorage.getItem('token');
      const configHeaders = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

      // ⭐ DI-UPDATE: Mengarahkan endpoint PUT assign kurir ke URL Cloud dinamis
      const respon = await axios.put(`${BASE_URL}/api/pesanan/assign/${selectedOrder._id}`, {
        kurirId: selectedKurirId 
      }, configHeaders);
      
      if (respon.data.success || respon.data) {
        alert("Kurir berhasil ditugaskan! Tugas langsung dikirim ke dashboard kurir terkait.");
        setShowModal(false);
        fetchData(); // Muat ulang tabel dan widget atas
      }
    } catch (err) {
      console.error("Gagal menugaskan kurir di cloud:", err);
      alert("Gagal menugaskan kurir. Pastikan rute backend untuk assign pesanan sudah berjalan normal.");
    }
  };

  // 4. Aksi UPDATE: Tolak / Perbarui Status Pesanan
  const handleTolakPesanan = async (orderId) => {
    if (!orderId) return alert("ID Pesanan tidak ditemukan.");
    
    if (window.confirm("Apakah Anda yakin ingin menolak pesanan ini?")) {
      try {
        const token = localStorage.getItem('token');
        const configHeaders = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

        // ⭐ DI-UPDATE: Menembak rute pembaruan status ke server Cloud dinamis
        await axios.put(`${BASE_URL}/api/pesanan/update-status/${orderId}`, {
          status: 'Ditolak' // Menggunakan status penolakan yang sesuai enum backend Anda
        }, configHeaders);
        
        alert("Status pesanan berhasil diperbarui menjadi Ditolak.");
        fetchData(); 
      } catch (err) {
        console.error("Gagal mengubah status pesanan di cloud:", err);
        alert("Gagal memperbarui status pesanan. Periksa proteksi autentikasi token JWT backend.");
      }
    }
  };

  return (
    <div style={containerStyle}>
      <Sidebar />

      <main style={mainContentStyle}>
        <h2 style={{ color: 'white', marginBottom: '30px', fontWeight: 'bold' }}>Pesanan Masuk</h2>

        {/* 3 KOTAK STATISTIK MINIMALIS */}
        <div style={statsRow}>
          <div style={miniCard}>
            <p style={cardLabel}>Total Pesanan</p>
            <h3 style={cardValue}>{stats.total}</h3>
          </div>
          <div style={miniCard}>
            <p style={cardLabel}>Kurir Tersedia</p>
            <h3 style={cardValue}>{stats.kurirTersedia}</h3>
          </div>
          <div style={miniCard}>
            <p style={cardLabel}>Di Tolak Hari Ini</p>
            <h3 style={cardValue}>{stats.ditolak}</h3>
          </div>
        </div>

        {/* TABEL DATA */}
        <div style={tableWrapper}>
          <table style={tableStyle}>
            <thead>
              <tr style={headerRow}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Nama Pelanggan</th>
                <th style={thStyle}>Alamat Tujuan</th>
                <th style={thStyle}>Waktu Masuk</th>
                <th style={thStyle}>Status</th>
                <th style={{...thStyle, textAlign: 'center'}}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order, index) => (
                  <tr key={order._id || index} style={bodyRow}>
                    <td style={tdStyle}>{String(index + 1).padStart(2, '0')}</td>
                    <td style={tdStyle}>{order.namaLengkap}</td>
                    <td style={tdStyle}>{order.alamat}</td>
                    <td style={tdStyle}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        ...statusBadge,
                        backgroundColor: 
                          String(order.status).toLowerCase() === 'pending' ? '#d97706' : '#2563eb'
                      }}>
                        {order.status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={() => handleOpenDetail(order)} style={btnDetail}>
                        <i className="fas fa-eye"></i> Detail / Proses
                      </button>
                      {String(order.status).toLowerCase() === 'pending' && (
                        <button onClick={() => handleTolakPesanan(order._id)} style={btnTolak}>
                          <i className="fas fa-times"></i> Tolak
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <i className="fas fa-box-open" style={{fontSize: '24px', display:'block', marginBottom: '10px'}}></i>
                    Saat ini tidak ada data pesanan antrean atau proses di database Cloud.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL POP-UP DETAIL & PENUGASAN KURIR */}
        {showModal && selectedOrder && (
          <div style={modalOverlay}>
            <div style={modalBox}>
              <div style={modalHeader}>
                <h3>Detail Pemrosesan Pesanan</h3>
                <button onClick={() => setShowModal(false)} style={btnCloseModal}>&times;</button>
              </div>
              
              <div style={modalBody}>
                <div style={infoGroup}>
                  <span style={infoLabel}>Nama Pelanggan:</span>
                  <p style={infoValue}>{selectedOrder.namaLengkap}</p>
                </div>
                <div style={infoGroup}>
                  <span style={infoLabel}>Nomor Telepon:</span>
                  <p style={infoValue}>{selectedOrder.noTelpon || selectedOrder.telepon || '-'}</p>
                </div>
                <div style={infoGroup}>
                  <span style={infoLabel}>Alamat Pengiriman:</span>
                  <p style={infoValue}>{selectedOrder.alamat}</p>
                </div>
                <div style={infoGroup}>
                  <span style={infoLabel}>Isi Paket / Detail Pesanan:</span>
                  <p style={{...infoValue, color: '#f59e0b'}}>{selectedOrder.detailPesanan || 'Paket Umum'}</p>
                </div>

                <hr style={{border: '0', borderTop: '1px solid #374151', margin: '20px 0'}} />

                <div style={infoGroup}>
                  <label style={{...infoLabel, color: '#3b82f6', fontWeight: 'bold', marginBottom: '8px', display:'block'}}>
                    Pilih Kurir untuk Pengantaran:
                  </label>
                  <select 
                    value={selectedKurirId} 
                    onChange={(e) => setSelectedKurirId(e.target.value)} 
                    style={selectKurirStyle}
                  >
                    <option value="">-- Hubungkan dengan Kurir Aktif --</option>
                    {daftarKurir.map(kurir => (
                      <option key={kurir._id} value={kurir.kurirId || kurir.namaLengkap}>
                        {kurir.namaLengkap} ({kurir.statusOnline || 'Aktif'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={modalFooter}>
                <button onClick={() => setShowModal(false)} style={btnBatalModal}>Batal</button>
                <button onClick={handleAssignKurir} style={btnKonfirmasiModal}>
                  <i className="fas fa-motorcycle"></i> Konfirmasi & Kirim
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- CSS STYLES ---
const containerStyle = { display: 'flex', backgroundColor: '#111827', minHeight: '100vh' };
const mainContentStyle = { flex: 1, padding: '30px', marginLeft: '250px', color: 'white' };
const statsRow = { display: 'flex', gap: '20px', marginBottom: '30px' };
const miniCard = { backgroundColor: '#1f2937', padding: '25px 20px', borderRadius: '12px', flex: 1, border: '1px solid #2d3748' };
const cardLabel = { color: '#9ca3af', fontSize: '14px', margin: '0 0 12px 0', fontWeight: '500' };
const cardValue = { color: 'white', fontSize: '28px', margin: 0, fontWeight: 'bold' };
const tableWrapper = { backgroundColor: '#1f2937', borderRadius: '12px', border: '1px solid #374151', overflow: 'hidden' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const headerRow = { backgroundColor: '#374151' };
const thStyle = { padding: '15px', fontSize: '14px', color: '#9ca3af', fontWeight: '500' };
const bodyRow = { borderBottom: '1px solid #374151' };
const tdStyle = { padding: '15px', fontSize: '14px', verticalAlign: 'middle' };
const statusBadge = { color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' };
const btnDetail = { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' };
const btnTolak = { backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalBox = { backgroundColor: '#1f2937', borderRadius: '12px', width: '500px', border: '1px solid #374151', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' };
const modalHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #374151', color: 'white' };
const btnCloseModal = { background: 'none', border: 'none', color: '#9ca3af', fontSize: '24px', cursor: 'pointer' };
const modalBody = { padding: '20px' };
const infoGroup = { marginBottom: '12px' };
const infoLabel = { fontSize: '12px', color: '#9ca3af' };
const infoValue = { fontSize: '14px', color: 'white', margin: '4px 0 0 0', fontWeight: '500' };
const selectKurirStyle = { width: '100%', backgroundColor: '#111827', color: 'white', border: '1px solid #374151', padding: '10px', borderRadius: '8px', outline: 'none', cursor: 'pointer', fontSize: '13px' };
const modalFooter = { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '15px 20px', backgroundColor: '#111827', borderTop: '1px solid #374151' };
const btnBatalModal = { backgroundColor: '#374151', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' };
const btnKonfirmasiModal = { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', gap: '6px', alignItems: 'center' };

export default PesananMasuk;
