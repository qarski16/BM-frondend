import React, { useState, useEffect } from 'react'; 
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom'; 
import heroImg from '../assets/hero-kurir.png'; 

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const navigate = useNavigate();
  const location = useLocation(); 
  const { email, password } = formData;

  // 🌐 MENGAMBIL URL BACKEND SECARA DINAMIS (Bawaan Vite)
  // Jika di Vercel belum diatur, dia akan otomatis kembali ke localhost:5000
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // =========================================================================
  // 🌐 LOGIKA MENANGKAP LEMPARAN DATA LOGIN GOOGLE DARI BACKEND
  // =========================================================================
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      const idKurir = params.get('id');
      const namaFinal = params.get('nama') || 'Kurir BM';
      const roleRaw = params.get('role') || 'kurir';
      const roleValid = roleRaw.toLowerCase().trim();

      const waktuSekarang = new Date().getTime();

      localStorage.setItem('token', token);
      localStorage.setItem('role', roleValid);
      localStorage.setItem('nama', namaFinal);
      localStorage.setItem('loginTime', waktuSekarang.toString());
      
      if (idKurir) {
        localStorage.setItem('kurirId', idKurir);
      }

      alert(`Login Berhasil!\nSelamat Datang, ${namaFinal}!`);

      if (roleValid === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/kurir/dashboard');
      }
    }
  }, [location, navigate]);

  // =========================================================================
  // 🌐 AKSI KLIK TOMBOL GOOGLE (DIPERBARUI)
  // =========================================================================
  const handleGoogleLogin = () => {
    window.location.href = `${BASE_URL}/api/auth/google`;
  };

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // =========================================================================
  // 🔐 LOGIKA LOGIN MANUAL (DIPERBARUI DENGAN API CLOUD)
  // =========================================================================
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      // ⭐ DI-UPDATE: Sekarang menembak URL dinamis sesuai lingkungan server
      const res = await axios.post(`${BASE_URL}/api/auth/login`, formData);
      console.log("Respon Login Backend:", res.data);

      const token = res.data.token;
      const roleRaw = res.data.user?.role || res.data.role || res.data.roleUser || '';
      const roleValid = roleRaw.toLowerCase().trim();
      const userEmail = res.data.user?.email || formData.email || ''; 

      let namaPanggilan = "Kurir BM";
      if (userEmail.includes('@')) {
        namaPanggilan = userEmail.split('@')[0]; 
      }

      const namaFinal = res.data.user?.namaLengkap || res.data.nama || namaPanggilan;
      
      const waktuSekarang = new Date().getTime();

      if (token) localStorage.setItem('token', token);
      if (roleValid) localStorage.setItem('role', roleValid);
      localStorage.setItem('nama', namaFinal); 
      localStorage.setItem('loginTime', waktuSekarang.toString()); 
      if (userEmail) localStorage.setItem('kurirEmail', userEmail);

      const idKurir = res.data.user?._id || res.data.user?.id || res.data._id || res.data.id || res.data.userId || '';
                        
      if (idKurir) {
        localStorage.setItem('kurirId', idKurir);
      } else {
        localStorage.setItem('kurirId', userEmail);
        console.log("[Login] ID Kosong dari backend, menggunakan email sebagai identifier:", userEmail);
      }

      alert("Login Berhasil!");

      if (roleValid === 'admin') {
        navigate('/dashboard'); 
      } else {
        navigate('/kurir/dashboard'); 
      }
      
    } catch (err) {
      console.error("Error login:", err);
      alert(err.response?.data?.msg || err.response?.data?.message || "Gagal terhubung ke server atau Email/Password salah.");
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', margin: 0, padding: 0, overflow: 'hidden' }}>
      {/* SISI KIRI - HERO IMAGE */}
      <div style={{ flex: 1.2, position: 'relative', height: '100%', backgroundColor: '#2563eb' }}>
        <img 
          src={heroImg} 
          alt="Hero" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} 
        />
      </div>

      {/* SISI KANAN - FORM LOGIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <div style={{ width: '100%', maxWidth: '380px', padding: '20px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>Selamat Datang!</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '30px' }}>Silakan masuk untuk accessing panel BM Kurir.</p>
          
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={inputGroup}>
              <label style={labelStyle}>Email</label>
              <input name="email" type="email" placeholder="Masukkan Email Anda" value={email} onChange={onChange} style={inputStyle} required />
            </div>
            
            <div style={inputGroup}>
              <label style={labelStyle}>Password</label>
              <input name="password" type="password" placeholder="Masukkan Password Anda" value={password} onChange={onChange} style={inputStyle} required />
            </div>

            <button type="submit" style={buttonStyle}>Login</button>
          </form>

          <div style={{ margin: '20px 0', textAlign: 'center', color: '#ccc', fontSize: '14px' }}>or</div>

          <button type="button" onClick={handleGoogleLogin} style={googleButtonStyle}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px', marginRight: '10px' }} />
            Continue with Google
          </button>

          <p style={{ marginTop: '25px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
            Belum Punya Akun? <Link to="/register" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 'bold' }}>Daftar Sekarang</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// IN-LINE STYLES
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '5px' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#666' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', width: '100%', boxSizing: 'border-box', outline: 'none' };
const buttonStyle = { padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', marginTop: '10px' };
const googleButtonStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#444', fontWeight: '600', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default Login;
