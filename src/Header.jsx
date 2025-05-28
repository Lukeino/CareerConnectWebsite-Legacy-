import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username;

  return (
    <header className="header-main">
      <button
        onClick={() => navigate('/')}
        className="home-button"
      >
        Home
      </button>
      {username && (
        <div className="user-info">
          <span role="img" aria-label="user" className="user-icon">👤</span>
          <span className="username">{username}</span>
        </div>
      )}
    </header>
  );
}

export default Header;