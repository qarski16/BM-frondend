import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoBM from '../assets/hero-logo.png'; 

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Fungsi untuk mengecek menu mana yang sedang aktif
  const isActive = (path) => location.pathname === path;

  return (
    <aside style={sidebarStyle}>
      <div style={logoArea}>
        <img src={logoBM} alt="Logo" style={logoStyle} />
        <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px', letterSpacing: '0.5px' }}>Admin Panel</p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <div 
          style={isActive('/dashboard') ? navItemActive : navItem} 
          onClick={() => navigate('/dashboard')}
          onMouseEnter={(e) => !isActive('/dashboard') && (e.currentTarget.style.backgroundColor = '#374151')}
          onMouseLeave={(e) => !isActive('/dashboard') && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <i className="fas fa-th-large" style={iconStyle}></i> 
          <span>Dashboard</span>
        </div>
        
        <div 
          style={isActive('/pesanan-masuk') ? navItemActive : navItem} 
          onClick={() => navigate('/pesanan-masuk')}
          onMouseEnter={(e) => !isActive('/pesanan-masuk') && (e.currentTarget.style.backgroundColor = '#374151')}
          onMouseLeave={(e) => !isActive('/pesanan-masuk') && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <i className="fas fa-box" style={iconStyle}></i> 
          <span>Pesanan Masuk</span>
        </div>
        
        <div 
          style={isActive('/kurir') ? navItemActive : navItem} 
          onClick={() => navigate('/kurir')}
          onMouseEnter={(e) => !isActive('/kurir') && (e.currentTarget.style.backgroundColor = '#374151')}
          onMouseLeave={(e) => !isActive('/kurir') && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <i className="fas fa-users" style={iconStyle}></i> 
          <span>Kurir</span>
        </div>
        
        <div 
          style={isActive('/laporan') ? navItemActive : navItem} 
          onClick={() => navigate('/laporan')}
          onMouseEnter={(e) => !isActive('/laporan') && (e.currentTarget.style.backgroundColor = '#374151')}
          onMouseLeave={(e) => !isActive('/laporan') && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <i className="fas fa-file-alt" style={iconStyle}></i> 
          <span>Laporan</span>
        </div>

        <div 
          style={isActive('/pengaturan') ? navItemActive : navItem} 
          onClick={() => navigate('/pengaturan')}
          onMouseEnter={(e) => !isActive('/pengaturan') && (e.currentTarget.style.backgroundColor = '#374151')}
          onMouseLeave={(e) => !isActive('/pengaturan') && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <i className="fas fa-cog" style={iconStyle}></i> 
          <span>Pengaturan</span>
        </div>
      </nav>

      <div onClick={handleLogout} style={logoutBtn}>
        <i className="fas fa-sign-out-alt" style={iconStyle}></i> 
        <span>Logout</span>
      </div>
    </aside>
  );
};

// --- STYLES ---
const sidebarStyle = { 
  width: '250px', 
  backgroundColor: '#1f2937', 
  padding: '30px 20px', 
  display: 'flex', 
  flexDirection: 'column', 
  borderRight: '1px solid #374151', 
  height: '100vh', 
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 1000
};

const logoArea = { marginBottom: '50px', textAlign: 'center' };
const logoStyle = { width: '100%', maxWidth: '110px', height: 'auto', filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.25))' };

const navItem = { 
  padding: '12px 18px', 
  cursor: 'pointer', 
  borderRadius: '12px', 
  color: '#9ca3af', 
  display: 'flex', 
  gap: '15px', 
  alignItems: 'center', 
  transition: 'all 0.2s ease', 
  fontSize: '15px',
  fontWeight: '500',
  backgroundColor: 'transparent'
};

const navItemActive = { 
  ...navItem, 
  backgroundColor: '#374151', 
  color: '#3b82f6',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
};

const iconStyle = {
  width: '20px',
  textAlign: 'center',
  fontSize: '18px'
};

const logoutBtn = { 
  ...navItem, 
  color: '#ef4444', 
  marginTop: 'auto',
  borderTop: '1px solid #374151',
  borderRadius: '0px',
  paddingTop: '20px'
};

export default Sidebar;