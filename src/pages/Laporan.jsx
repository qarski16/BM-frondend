import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx'; 
import Sidebar from '../components/Sidebar'; // Memanggil sidebar seragam

// Konfigurasi URL Base API agar aman saat dideploy ke Vercel
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Laporan = () => {
  const [dataLaporan, setDataLaporan] = useState([]);
  const [stats, setStats] = useState({ total: 0, komisi: 0, kurirAktif: 0 });
  const [daftarKurir, setDaftarKurir] = useState([]);

  // State untuk kontrol filter interaktif
  const [filterKurir, setFilterKurir] = useState('Semua Kurir');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Menggunakan dual-header auth agar aman di Vercel/Production
      const config = token ? { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token
        } 
      } : {};

      const res = await axios.get(`${API_BASE_URL}/api/pesanan/laporan-detail`, config);
      const resSummary = await axios.get(`${API_BASE_URL}/api/pesanan/summary`, config);
      const resKurir = await axios.get(`${API_BASE_URL}/api/auth/semua-kurir`, config);
      
      const pesananSelesai = res.data || [];
      setDataLaporan(pesananSelesai);
      setDaftarKurir(resKurir.data || []);

      const totalPengantaran = pesananSelesai.length;
      const totalKomisiSistem = totalPengantaran * 2; 

      setStats({
        total: totalPengantaran,
        komisi: totalKomisiSistem,
        kurirAktif: resSummary.data?.kurirAktif || 0
      });
    } catch (err) {
      console.error("Gagal sinkronisasi data laporan:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Logika Penyaringan Data (Filter)
  const dataTerfilter = dataLaporan.filter(item => {
    const tanggalOrder = new Date(item.createdAt);
    tanggalOrder.setHours(0,0,0,0);

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      if (tanggalOrder < start) return false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(0,0,0,0);
      if (tanggalOrder > end) return false;
    }

    const namaKurir = item.kurirId?.namaLengkap || 'Belum Ditentukan';
    if (filterKurir !== 'Semua Kurir' && namaKurir !== filterKurir) {
      return false;
    }

    return true;
  });

  // Eksport Microsoft Excel
  const handleExportExcel = () => {
    if (dataTerfilter.length === 0) return alert("Belum ada data untuk diexport");
    
    const excelData = dataTerfilter.map(item => ({
      Tanggal: new Date(item.createdAt).toLocaleDateString('id-ID'),
      Kurir: item.kurirId?.namaLengkap || 'Belum Ditentukan',
      'Order ID': item._id ? `ORD-${item._id.substring(item._id.length - 6).toUpperCase()}` : '-',
      Status: item.status || 'Selesai',
      'Detail Paket': item.detailPesanan || '-',
      Alamat: item.alamat || '-',
      Komisi: '2%'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Logistik");
    XLSX.writeFile(workbook, `Laporan_BM_Kurir_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div style={containerStyle}>
      <Sidebar />

      <main style={mainContentStyle}>
        <h2 style={{ color: 'white', marginBottom: '30px', fontWeight: 'bold' }}>Laporan Pengantaran</h2>

        {/* Filter Bar Interaktif */}
        <div style={filterBar}>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            style={inputFilter} 
          />
          <span style={{color: '#9ca3af', fontSize: '13px'}}>s/d</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            style={inputFilter} 
          />
          
          <select 
            value={filterKurir} 
            onChange={(e) => setFilterKurir(e.target.value)} 
            style={inputFilter}
          >
            <option value="Semua Kurir">Semua Kurir</option>
            {daftarKurir.map(k => (
              <option key={k._id} value={k.namaLengkap}>{k.namaLengkap}</option>
            ))}
          </select>
          
          <button onClick={fetchData} style={btnTampilkan}>Refresh</button>
          <button onClick={handleExportExcel} style={btnExport}>Export Excel</button>
        </div>

        {/* ==================================================================== */}
        {/* AREA 3 KOTAK STATISTIK MINIMALIS */}
        {/* ==================================================================== */}
        <div style={statsRow}>
          <div style={miniCard}>
            <p style={cardLabel}>Total Pengantaran</p>
            <h3 style={cardValue}>{dataTerfilter.length}</h3>
          </div>
          <div style={miniCard}>
            <p style={cardLabel}>Total Komisi Sistem</p>
            <h3 style={cardValue}>{dataTerfilter.length * 2}%</h3>
          </div>
          <div style={miniCard}>
            <p style={cardLabel}>Kurir Aktif</p>
            <h3 style={cardValue}>{stats.kurirAktif}</h3>
          </div>
        </div>

        {/* Tabel Data Riwayat */}
        <div style={tableWrapper}>
          <table style={tableStyle}>
            <thead>
              <tr style={headerRow}>
                <th style={thStyle}>Tanggal</th>
                <th style={thStyle}>Kurir</th>
                <th style={thStyle}>Order ID</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Komisi</th>
              </tr>
            </thead>
            <tbody>
              {dataTerfilter.length > 0 ? dataTerfilter.map((item, index) => (
                <tr key={item._id || index} style={bodyRow}>
                  <td style={tdStyle}>{new Date(item.createdAt).toLocaleDateString('id-ID')}</td>
                  <td style={tdStyle}>{item.kurirId?.namaLengkap || 'Belum Ditentukan'}</td>
                  <td style={tdStyle}>
                    {item._id ? `ORD-${item._id.substring(item._id.length - 6).toUpperCase()}` : `ORD-00${index + 1}`}
                  </td>
                  <td style={tdStyle}><span style={{color: '#10b981'}}>● {item.status || 'Selesai'}</span></td>
                  <td style={tdStyle}>2%</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center', padding: '30px', color: '#9ca3af'}}>
                    Tidak ditemukan riwayat data laporan pengantaran selesai pada filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

// --- CSS STYLES ---
const containerStyle = { display: 'flex', backgroundColor: '#111827', minHeight: '100vh' };
const mainContentStyle = { flex: 1, padding: '30px', marginLeft: '250px', color: 'white' };
const filterBar = { display: 'flex', gap: '10px', marginBottom: '25px', alignItems: 'center' };
const inputFilter = { backgroundColor: '#1f2937', color: 'white', border: '1px solid #374151', padding: '8px 12px', borderRadius: '8px', outline: 'none', fontSize: '13px', cursor: 'pointer' };
const btnTampilkan = { backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '9px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const btnExport = { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '9px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

const statsRow = { display: 'flex', gap: '20px', marginBottom: '30px' };
const miniCard = { 
  backgroundColor: '#1f2937', 
  padding: '25px 20px', 
  borderRadius: '12px', 
  flex: 1, 
  border: '1px solid #2d3748', 
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
};
const cardLabel = { color: '#9ca3af', fontSize: '14px', margin: '0 0 12px 0', fontWeight: '500' };
const cardValue = { color: 'white', fontSize: '28px', margin: 0, fontWeight: 'bold' };

const tableWrapper = { backgroundColor: '#1f2937', borderRadius: '12px', border: '1px solid #374151', overflow: 'hidden' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const headerRow = { backgroundColor: '#374151' };
const thStyle = { padding: '15px', fontSize: '14px', color: '#9ca3af', fontWeight: '500' };
const bodyRow = { borderBottom: '1px solid #374151' };
const tdStyle = { padding: '15px', fontSize: '13px' };

export default Laporan;
