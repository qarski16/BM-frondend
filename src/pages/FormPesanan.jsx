import React, { useState, useEffect } from 'react';
import axios from 'axios';
import heroImg from '../assets/hero-kurir.png'; 

// Konfigurasi URL Base API agar aman saat dideploy ke Vercel
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const FormPesanan = () => {
  // State untuk menyimpan data form input
  const [formData, setFormData] = useState({
    namaLengkap: '',
    noTelpon: '', 
    alamat: '',
    detailPesanan: ''
  });

  // State baru untuk alur pelacakan & rating setelah berhasil order
  const [idPesananSukses, setIdPesananSukses] = useState(null);
  const [dataPesananTerbaru, setDataPesananTerbaru] = useState(null);
  const [bintang, setBintang] = useState(5);
  const [ulasan, setUlasan] = useState("");
  const [sudahKirimRating, setSudahKirimRating] = useState(false);

  // Rentang status yang valid sesuai skema database backend kamu
  const tahapanStatus = ['Pending', 'Proses', 'Ambil Barang', 'Dalam Perjalanan', 'Sampai Tujuan', 'Selesai'];

  const { namaLengkap, noTelpon, alamat, detailPesanan } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // =========================================================================
  // 🚀 SUBMIT FORM: Kirim Data ke Backend & Buka Mode Tracking
  // =========================================================================
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/api/pesanan/tambah`, formData);
      
      if (res.status === 200 || res.status === 201) {
        alert('Pesanan Berhasil Dikirim! Layar pelacakan kurir Anda otomatis dibuka.');
        // Simpan ID Pesanan yang dihasilkan MongoDB agar bisa dilacak real-time
        setIdPesananSukses(res.data._id);
        setFormData({ namaLengkap: '', noTelpon: '', alamat: '', detailPesanan: '' });
      }
    } catch (err) {
      console.error("Error submit pesanan:", err);
      alert(`Gagal mengirim pesanan. Pastikan server backend Anda sudah berjalan di ${API_BASE_URL}`);
    }
  };

  // =========================================================================
  // 🔄 REAL-TIME POLLING: Tarik data status dari backend setiap 4 detik
  // =========================================================================
  useEffect(() => {
    if (!idPesananSukses) return;

    const dapatkanStatusTerbaru = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/pesanan/detail/${idPesananSukses}`);
        setDataPesananTerbaru(res.data);
      } catch (err) {
        console.error("Gagal melakukan polling status:", err.message);
      }
    };

    dapatkanStatusTerbaru(); // Panggil instan pertama kali
    const intervalKunci = setInterval(dapatkanStatusTerbaru, 4000); // Polling tiap 4 detik

    return () => clearInterval(intervalKunci); // Bersihkan memori interval saat komponen hancur
  }, [idPesananSukses]);

  // =========================================================================
  // ⭐ SUBMIT RATING: Kirim feedback bintang dan ulasan ke database
  // =========================================================================
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/api/pesanan/kirim-rating/${idPesananSukses}`, {
        rating: bintang,
        catatanRating: ulasan
      });
      setSudahKirimRating(true);
      alert("Terima kasih atas penilaian Anda! Kurir kami akan terus meningkatkan layanannya.");
    } catch (err) {
      console.error("Gagal mengirim rating:", err);
      alert("Gagal mengirim rating ke server.");
    }
  };

  // Hitung posisi indeks status kurir saat ini (0 = Pending, 1 = Proses, dst)
  const indeksStatusSaatIni = dataPesananTerbaru ? tahapanStatus.indexOf(dataPesananTerbaru.status) : 0;

  return (
    <div style={containerStyle}>
      {/* SISI KIRI - HERO IMAGE (Dibuat Full Height & Width Proporsional) */}
      <div style={heroSide}>
        <img 
          src={heroImg} 
          alt="Hero BM Kurir" 
          style={imageStyle} 
        />
      </div>

      {/* SISI KANAN - KONDISIONAL (FORM ATAU STEPPER TRACKING) */}
      <div style={formSide}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          
          {/* KONDISI A: TAMPILKAN FORM JIKA BELUM MEMESAN */}
          {!idPesananSukses ? (
            <>
              <div style={{ marginBottom: '30px' }}>
                <h2 style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#1e293b', fontSize: '26px' }}>Form Pesanan</h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Isi formulir di bawah untuk memanggil kurir logistik ke lokasi Anda.</p>
              </div>
              
              <form onSubmit={onSubmit} style={formGrid}>
                <div style={inputGroup}>
                  <label style={labelStyle}>Nama Lengkap</label>
                  <input 
                    type="text"
                    name="namaLengkap" 
                    placeholder="Masukkan Nama Lengkap Anda" 
                    value={namaLengkap} 
                    onChange={onChange} 
                    style={inputStyle} 
                    required 
                  />
                </div>

                <div style={inputGroup}>
                  <label style={labelStyle}>No. Telpon / WhatsApp</label>
                  <input 
                    type="tel"
                    name="noTelpon" 
                    placeholder="Contoh: 081234567xxx" 
                    value={noTelpon} 
                    onChange={onChange} 
                    style={inputStyle} 
                    required 
                  />
                </div>

                <div style={inputGroup}>
                  <label style={labelStyle}>Alamat Penjemputan / Tujuan</label>
                  <textarea 
                    name="alamat" 
                    placeholder="Tuliskan alamat lengkap beserta patokan lokasi..." 
                    value={alamat} 
                    onChange={onChange} 
                    // Ditambahkan fontFamily: 'inherit' agar sama dengan input lainnya
                    style={{...inputStyle, height: '90px', resize: 'none', fontFamily: 'inherit'}} 
                    required 
                  />
                </div>

                <div style={inputGroup}>
                  <label style={labelStyle}>Detail Isi Paket</label>
                  <input 
                    type="text"
                    name="detailPesanan" 
                    placeholder="Contoh: Makanan, Dokumen, Pakaian, dll" 
                    value={detailPesanan} 
                    onChange={onChange} 
                    style={inputStyle} 
                    required 
                  />
                </div>

                <button type="submit" style={buttonStyle}>
                  <i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i> Pesan Sekarang
                </button>
              </form>
            </>
          ) : (
            
            /* KONDISI B: TAMPILKAN LAYAR LIVE STEPPER TRACKING JIKA SUDAH BERHASIL ORDER */
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Live Tracking</span>
                <h2 style={{ margin: '6px 0 4px 0', fontWeight: 'bold', color: '#1e293b', fontSize: '24px' }}>Status Pengiriman</h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>ID Pelacakan: <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 'bold' }}>{idPesananSukses}</span></p>
              </div>

              {/* TAMPILAN VISUAL STEPPER BERTAHAP */}
              <div style={stepperWrapper}>
                {tahapanStatus.map((step, index) => {
                  const isAktifAtauSelesai = index <= indeksStatusSaatIni;
                  return (
                    <div key={index} style={{ ...stepItem, opacity: isAktifAtauSelesai ? 1 : 0.35 }}>
                      <div style={{ ...stepCircle, backgroundColor: isAktifAtauSelesai ? '#16a34a' : '#cbd5e1' }}>
                        {index + 1}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', fontWeight: isAktifAtauSelesai ? '700' : '500', color: isAktifAtauSelesai ? '#15803d' : '#475569' }}>{step}</span>
                        {index === indeksStatusSaatIni && (
                          <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600' }}>• Posisi Kurir Saat Ini</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* STATUS KONDISIONAL DINAMIS */}
              <div style={statusInfonote}>
                {dataPesananTerbaru?.status === 'Pending' && "Menunggu admin menunjuk kurir terdekat..."}
                {dataPesananTerbaru?.status === 'Proses' && "Kurir telah menerima pesanan dan bersiap menuju lokasi."}
                {dataPesananTerbaru?.status === 'Ambil Barang' && "🚚 Kurir sedang mengambil barang di tempat pemesan."}
                {dataPesananTerbaru?.status === 'Dalam Perjalanan' && "🏍️ Paket aman dalam perjalanan menuju alamat tujuan."}
                {dataPesananTerbaru?.status === 'Sampai Tujuan' && "Kurir telah sampai di lokasi tujuan pengantaran."}
                {dataPesananTerbaru?.status === 'Selesai' && "🎉 Pengiriman sukses diselesaikan oleh kurir!"}
              </div>

              {/* BOX FORM INPUT RATING (HANYA MUNCUL JIKA STATUS = SELESAI) */}
              {dataPesananTerbaru?.status === 'Selesai' && (
                <div style={ratingBoxContainer}>
                  {!sudahKirimRating ? (
                    <form onSubmit={handleRatingSubmit}>
                      <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '16px', fontWeight: 'bold' }}>Beri Penilaian Kurir</h4>
                      <p style={{ margin: '0 0 14px 0', color: '#64748b', fontSize: '12px' }}>Rating Anda membantu meningkatkan pelayanan BM Kurir.</p>
                      
                      <div style={inputGroup}>
                        <label style={labelStyle}>Pilih Bintang</label>
                        <select 
                          value={bintang} 
                          onChange={(e) => setBintang(Number(e.target.value))} 
                          style={{ ...inputStyle, padding: '10px' }}
                        >
                          <option value="5">⭐⭐⭐⭐⭐ (Sangat Puas)</option>
                          <option value="4">⭐⭐⭐⭐ (Puas)</option>
                          <option value="3">⭐⭐⭐ (Cukup)</option>
                          <option value="2">⭐⭐ (Buruk)</option>
                          <option value="1">⭐ (Sangat Buruk)</option>
                        </select>
                      </div>

                      <div style={{ ...inputGroup, marginTop: '10px' }}>
                        <label style={labelStyle}>Ulasan Singkat (Opsional)</label>
                        <textarea 
                          placeholder="Contoh: Kurir sangat ramah dan pengiriman cepat sekali..." 
                          value={ulasan} 
                          onChange={(e) => setUlasan(e.target.value)}
                          style={{ ...inputStyle, height: '60px', resize: 'none', padding: '10px', fontFamily: 'inherit' }}
                        />
                      </div>

                      <button type="submit" style={{ ...buttonStyle, backgroundColor: '#16a34a', boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.25)' }}>
                        Kirim Rating Pelayanan
                      </button>
                    </form>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                      <p style={{ color: '#16a34a', fontWeight: 'bold', margin: '0 0 8px 0', fontSize: '15px' }}>✓ Penilaian Berhasil Dikirim</p>
                      <button onClick={() => setIdPesananSukses(null)} style={{ ...buttonStyle, padding: '8px 14px', fontSize: '13px', margin: '0 auto', display: 'inline-block' }}>
                        Buat Pesanan Baru Lagi
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// --- STYLES MODIFIKASI LATEST ---
const containerStyle = { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: '"Inter", sans-serif' };

// Mengubah background ke warna dasar agar gambar menyatu mulus ke frame kiri
const heroSide = { flex: 1, backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' };

// objectFit: 'cover' memastikan gambar mengisi penuh porsi kiri tanpa border biru sisa
const imageStyle = { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' };

const formSide = { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', backgroundColor: '#f8fafc', overflowY: 'auto' };
const formGrid = { display: 'flex', flexDirection: 'column', gap: '18px' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '6px' };
const labelStyle = { fontSize: '13px', color: '#475569', fontWeight: '600' };
const inputStyle = { padding: '12px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: 'white', color: '#1e293b', outline: 'none', fontSize: '14px', transition: 'all 0.2s ease', boxSizing: 'border-box', width: '100%' };
const buttonStyle = { padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' };

const stepperWrapper = { display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const stepItem = { display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.3s ease' };
const stepCircle = { width: '28px', height: '28px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.3s ease' };
const statusInfonote = { marginTop: '16px', padding: '14px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '14px', fontWeight: '600', textAlign: 'center' };
const ratingBoxContainer = { marginTop: '20px', padding: '18px', borderRadius: '12px', backgroundColor: 'white', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };

export default FormPesanan;
