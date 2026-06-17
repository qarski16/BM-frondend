import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar'; 

const DashboardAdmin = () => {
  const navigate = useNavigate();
  
  // Default state aman untuk mencegah crash saat render .map()
  const [stats, setStats] = useState({
    pesananMasuk: 0,
    dalamProses: 0,
    pesananSelesai: 0,
    kurirAktif: 0,
    listKurir: [],
    dataGrafik: [0, 0, 0, 0, 0, 0, 0]
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [namaAdmin, setNamaAdmin] = useState("Admin Utama");

  // 🌐 MENGAMBIL URL BACKEND SECARA DINAMIS (Bawaan Vite)
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Ambil data dari backend API summary & semua pesanan
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Konfigurasi header token otentikasi agar aman dari pembajakan data
      const configHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

      // 1. ⭐ DI-UPDATE: Ambil data statistik ringkasan dashboard beserta manifes kurir dari Cloud
      const resStats = await axios.get(`${BASE_URL}/api/pesanan/summary`, configHeaders);
      
      // 2. ⭐ DI-UPDATE: Ambil data pesanan terbaru untuk melacak alur kurir secara real-time dari Cloud
      const resOrders = await axios.get(`${BASE_URL}/api/pesanan/semua`, configHeaders);
      
      let dataOrders = [];
      if (resOrders.data && Array.isArray(resOrders.data)) {
        dataOrders = resOrders.data;
        setRecentOrders(dataOrders);
      }

      if (resStats.data) {
        const rawKurirList = resStats.data.listKurir || [];

        // Pemetaan status per-kurir
        const normalizedKurirList = rawKurirList.map((kurir) => {
          let statusMentah = kurir.status || 'offline';
          let statusTeks = String(statusMentah).toLowerCase().trim();

          if (statusTeks === 'aktif' || statusTeks === 'online' || statusTeks.includes('aktif')) {
            statusTeks = 'online';
          } else {
            statusTeks = 'offline';
          }
          
          return {
            ...kurir,
            namaLengkap: kurir.namaLengkap || kurir.nama || "Kurir Tanpa Nama",
            statusNormalized: statusTeks
          };
        });

        // Kalkulasi ulang metrik counter box secara dinamis berdasarkan data pesanan ter-update
        const totalMasuk = dataOrders.filter(p => p.status === 'Menunggu Diproses' || p.status === 'Pending').length;
        const totalProses = dataOrders.filter(p => p.status === 'Kurir Sedang Menuju Lokasi' || p.status === 'Dalam Perjalanan' || p.status === 'Sampai Tujuan').length;
        const totalSelesai = dataOrders.filter(p => p.status === 'Selesai').length;
        
        // Menghitung jumlah kurir aktif secara real-time dari hasil seleksi list terbaru
        const totalKurirAktifRealtime = normalizedKurirList.filter(k => 
          k.statusNormalized === 'online'
        ).length;

        setStats({
          pesananMasuk: totalMasuk || resStats.data.pesananMasuk || 0,
          dalamProses: totalProses || resStats.data.dalamProses || 0,
          pesananSelesai: totalSelesai || resStats.data.pesananSelesai || 0,
          kurirAktif: totalKurirAktifRealtime, 
          listKurir: normalizedKurirList, 
          dataGrafik: resStats.data.dataGrafik || [0, 0, 0, 0, 0, 0, 0]
        });
      }
    } catch (err) {
      console.error("Gagal sinkronisasi dengan database cloud:", err);
      
      // Bersihkan data mockup agar tampilan tidak memunculkan data palsu "jumran" saat server offline
      setRecentOrders([]);
      setStats(prev => ({
        ...prev,
        listKurir: []
      }));
    }
  };

  // HELPER PEWARNAAN TEXT STATUS MENGIKUTI TAHAPAN STEPPER AKTIF KURIR
  const dapatkanWarnaStatus = (status) => {
    switch (status) {
      case 'Menunggu Diproses':
      case 'Pending': 
        return '#d97706'; 
      case 'Kurir Sedang Menuju Lokasi': 
        return '#3b82f6'; 
      case 'Dalam Perjalanan': 
        return '#fbbf24'; 
      case 'Sampai Tujuan': 
        return '#10b981'; 
      case 'Selesai': 
        return '#15803d'; 
      case 'Ditolak': 
        return '#ef4444'; 
      default: 
        return '#9ca3af';
    }
  };

  // Fungsi Menghapus Catatan Aktivitas Pesanan dari Dashboard Admin
  const handleHapus = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus catatan aktivitas pesanan ini secara permanen?")) {
      try {
        const token = localStorage.getItem('token'); 
        // ⭐ DI-UPDATE: Mengganti endpoint hapus pesanan ke URL Cloud
        const res = await axios.delete(
          `${BASE_URL}/api/pesanan/hapus/${id}`,
          { headers: { 'Authorization': `Bearer ${token}` } } 
        );
        alert(res.data.message || "Catatan aktivitas berhasil dihapus!");
        fetchData(); 
      } catch (err) {
        console.error("Gagal menghapus data dari cloud:", err);
        setRecentOrders(recentOrders.filter(order => order._id !== id));
      }
    }
  };

  // Proteksi Keamanan Halaman (Satpam Role Admin)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const roleValid = role ? role.toLowerCase().trim() : '';

    if (!token || roleValid !== 'admin') {
      alert("Akses ditolak! Anda harus login sebagai Admin.");
      navigate('/login');
      return;
    }

    const namaSaved = localStorage.getItem('nama');
    if (namaSaved) setNamaAdmin(namaSaved);

    fetchData();
    
    // Polling Real-time: Refresh data otomatis setiap 5 detik demi memantau pergerakan kurir secara konstan
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div style={containerStyle}>
      <Sidebar />

      <main style={mainContentStyle}>
        <header style={headerStyle}>
          <div style={searchBar}>
            <i className="fas fa-search" style={{ color: '#9ca3af' }}></i>
            <input type="text" placeholder="Cari data..." style={searchInput} />
          </div>
          <div style={adminProfile}>
            <i className="fas fa-bell" style={{ marginRight: '15px', color: '#9ca3af', cursor: 'pointer' }}></i>
            <span style={{ marginRight: '15px', color: '#cbd5e1' }}>{namaAdmin}</span>
            <div style={avatar}>A</div>
          </div>
        </header>

        <h2 style={{ marginBottom: '25px', fontWeight: 'bold', fontSize: '26px' }}>Dashboard Overview</h2>

        {/* METRIK DISPLAY COUNTER */}
        <div style={statsGrid}>
          <StatCard title="Pesanan Masuk" value={stats.pesananMasuk} icon="fa-archive" color="#3b82f6" />
          <StatCard title="Dalam Proses" value={stats.dalamProses} icon="fa-sync" color="#fbbf24" />
          <StatCard title="Pesanan Selesai" value={stats.pesananSelesai} icon="fa-check-double" color="#10b981" />
          <StatCard title="Kurir Aktif" value={stats.kurirAktif} icon="fa-user-check" color="#8b5cf6" />
        </div>

        <div style={dataMainGrid}>
          
          {/* Box 1: Grafik Mingguan */}
          <div style={cardLayout}>
            <p style={cardTitle}>Grafik Pesanan Mingguan (7 Hari Terakhir)</p>
            <div style={chartContainer}>
              {stats.dataGrafik.map((jumlah, i) => {
                const tinggiBar = jumlah === 0 ? 6 : Math.min((jumlah / 20) * 100, 100);
                return (
                  <div 
                    key={i} 
                    title={`${jumlah} Pesanan`}
                    style={{ 
                      ...barStyle, 
                      height: `${tinggiBar}%`, 
                      backgroundColor: i === 6 ? '#3b82f6' : '#374151' 
                    }}
                  ></div>
                );
              })}
            </div>
          </div>

          {/* Box 2: Aktivitas Pesanan Terbaru */}
          <div style={cardLayout}>
            <p style={cardTitle}>Aktivitas Pesanan Terbaru</p>
            <div style={{ ...listContainer, maxHeight: '250px', overflowY: 'auto' }}>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order._id} style={activityItemStyle}>
                    <div style={{ flex: 1, marginRight: '10px' }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#f8fafc', textTransform: 'capitalize' }}>{order.namaLengkap}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{order.alamat || 'Alamat Belum Diinput'}</div>
                      
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: dapatkanWarnaStatus(order.status), marginTop: '6px' }}>
                        Status: {order.status}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button onClick={() => handleHapus(order._id)} style={btnHapusStyle}>Hapus</button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>Belum ada data aktivitas pesanan di Cloud.</p>
              )}
            </div>
          </div>

          {/* Box 3: Proporsi Diagram Status */}
          <div style={cardLayout}>
            <p style={cardTitle}>Proporsi Status Pesanan</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '25px', padding: '10px 0' }}>
               <div style={{
                 ...mockPieStyle,
                 borderTopColor: stats.pesananSelesai > 0 ? '#10b981' : '#4b5563',
                 borderRightColor: stats.dalamProses > 0 ? '#fbbf24' : '#4b5563',
                 borderBottomColor: stats.pesananMasuk > 0 ? '#3b82f6' : '#4b5563'
               }}></div>
               <div style={{ fontSize: '13px', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><span style={{ color: '#10b981', marginRight: '6px' }}>●</span> Selesai ({stats.pesananSelesai})</div>
                  <div><span style={{ color: '#fbbf24', marginRight: '6px' }}>●</span> Proses ({stats.dalamProses})</div>
                  <div><span style={{ color: '#3b82f6', marginRight: '6px' }}>●</span> Pending ({stats.pesananMasuk})</div>
               </div>
            </div>
          </div>

          {/* Box 4: STATUS KURIR REAL-TIME */}
          <div style={cardLayout}>
            <p style={cardTitle}>Status Kurir Berdasarkan Database</p>
            <div style={{ ...listContainer, maxHeight: '200px', overflowY: 'auto' }}>
              {stats.listKurir && stats.listKurir.length > 0 ? (
                stats.listKurir.map((kurir, index) => {
                  const isOnline = kurir.statusNormalized === 'online';
                  return (
                    <div key={index} style={activityItemStyle}>
                      <span style={{ textTransform: 'capitalize', fontSize: '14px', fontWeight: '500', color: '#cbd5e1' }}>
                        {kurir.namaLengkap || kurir.nama}
                      </span>
                      <span style={{ 
                        fontSize: '13px',
                        fontWeight: 'bold', 
                        color: isOnline ? '#10b981' : '#ef4444' 
                      }}>
                        ● {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>Belum ada akun kurir terdaftar di database Cloud.</p>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div style={{ backgroundColor: '#1f2937', padding: '20px', borderRadius: '15px', border: '1px solid #374151' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <div style={{ padding: '12px', backgroundColor: '#374151', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <i className={`fas ${icon}`} style={{ fontSize: '18px', color: color }}></i>
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>{title}</p>
        <h3 style={{ margin: 0, fontSize: '24px', color: 'white', fontWeight: 'bold', marginTop: '2px' }}>{value}</h3>
      </div>
    </div>
  </div>
);

// --- CSS STYLING OBJECTS ---
const containerStyle = { display: 'flex', backgroundColor: '#111827', minHeight: '100vh', color: 'white' };
const mainContentStyle = { flex: 1, padding: '30px', marginLeft: '250px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' };
const searchBar = { backgroundColor: '#1f2937', padding: '10px 15px', borderRadius: '10px', display: 'flex', alignItems: 'center', width: '300px', border: '1px solid #374151' };
const searchInput = { background: 'none', border: 'none', color: 'white', marginLeft: '10px', outline: 'none', width: '100%', fontSize: '14px' };
const adminProfile = { display: 'flex', alignItems: 'center' };
const avatar = { width: '35px', height: '35px', backgroundColor: '#3b82f6', borderRadius: '50%', marginLeft: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' };
const dataMainGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '25px' };
const cardLayout = { backgroundColor: '#1f2937', padding: '25px', borderRadius: '15px', border: '1px solid #374151' };
const cardTitle = { fontSize: '15px', fontWeight: '600', marginBottom: '20px', color: '#e5e7eb', letterSpacing: '0.3px' };
const chartContainer = { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '150px', gap: '10px', paddingBottom: '5px', borderBottom: '1px solid #374151' };
const barStyle = { width: '30px', borderRadius: '5px 5px 0 0', transition: 'height 0.3s ease' };
const listContainer = { display: 'flex', flexDirection: 'column', gap: '15px' };
const activityItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #374151' };
const mockPieStyle = { width: '80px', height: '80px', borderRadius: '50%', border: '10px solid #4b5563', transition: 'all 0.3s', transform: 'rotate(45deg)' };
const btnHapusStyle = { backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' };

export default DashboardAdmin;
