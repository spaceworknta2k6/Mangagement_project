'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeSlash, User, Lock, Question } from '@phosphor-icons/react';
import useAuthStore from '@/store/auth.store';
import useThemeStore from '@/store/theme.store';
import { authService } from '@/services/auth.service';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUser = useAuthStore((s) => s.setUser);
  const { applyTheme } = useThemeStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Apply saved theme on login page too
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  const doLogin = async (loginEmail, loginPassword) => {
    setLoading(true);
    setError('');
    try {
      const loginResult = await authService.login(loginEmail, loginPassword);
      const token = loginResult.data.accessToken;

      // Fetch full user profile
      const profileResult = await authService.me(token);
      setAuth(token, profileResult.data);
      setUser(profileResult.data);

      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    doLogin(email, password);
  };

  const handleMicrosoftLogin = () => {
    const msEmail = window.prompt("Vui lòng nhập email tài khoản Microsoft của Phenikaa:");
    if (!msEmail) return;

    // Validate email domain
    const emailRegex = /^[0-9]{8}@st\.phenikaa-uni\.edu\.vn$/;
    if (!emailRegex.test(msEmail)) {
      setError('Chỉ cho phép tài khoản sinh viên Phenikaa (VD: 24100351@st.phenikaa-uni.edu.vn).');
      return;
    }

    // Try mock login for SSO testing
    // Mật khẩu mặc định có thể là gì đó cho mục đích test
    doLogin(msEmail, '123456aA@');
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
      }}>
        <Image
          src="/images/bg-login.jpg"
          alt="background"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
        />
        {/* Blue overlay to match Phenikaa style */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(10,40,120,0.85) 0%, rgba(5,25,90,0.85) 100%)',
        }} />
      </div>

      {/* Decorative lines */}
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, opacity: 0.5 }}>
        <Image src="/images/login-line-1.png" alt="" width={300} height={200} style={{ objectFit: 'contain' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 0, right: 0, zIndex: 1, opacity: 0.5 }}>
        <Image src="/images/login-line-2.png" alt="" width={200} height={150} style={{ objectFit: 'contain' }} />
      </div>

      {/* Content wrapper */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: '420px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        margin: '20px',
      }}>
        
        {/* Logo at Top */}
        <div style={{ marginBottom: '32px' }}>
          <Image
            src="/images/logo-Phenikaa-w.png"
            alt="Phenikaa University"
            width={280}
            height={80}
            style={{ objectFit: 'contain' }}
          />
        </div>

        {/* Main card */}
        <div style={{
          width: '100%',
          backgroundColor: '#f5f7fa',
          borderRadius: '20px',
          padding: '36px 40px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
          animation: 'fadeIn 0.4s ease',
        }}>
        {/* Plane Icon */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px', height: '60px',
            borderRadius: '50%',
            backgroundColor: '#eaf1fb',
            transform: 'translateY(-60px)',
            marginBottom: '-60px'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill="#1a56db"/>
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" fill="#1a56db"/>
            </svg>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: '#1a3d9e',
            textTransform: 'uppercase',
          }}>
            ĐĂNG NHẬP
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email field */}
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
              color: '#6b7280', display: 'flex', alignItems: 'center',
            }}>
              <User size={18} />
            </span>
            <input
              type="text"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập tài khoản hoặc email"
              required
              autoFocus
              style={{
                width: '100%',
                height: '46px',
                paddingLeft: '44px',
                paddingRight: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#111827',
                backgroundColor: '#fff',
                outline: 'none',
                transition: 'border-color 0.15s',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => e.target.style.borderColor = '#1a56db'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Password field */}
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
              color: '#6b7280', display: 'flex', alignItems: 'center',
            }}>
              <Lock size={18} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
              style={{
                width: '100%',
                height: '46px',
                paddingLeft: '44px',
                paddingRight: '48px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#111827',
                backgroundColor: '#fff',
                outline: 'none',
                transition: 'border-color 0.15s',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => e.target.style.borderColor = '#1a56db'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#6b7280', display: 'flex', alignItems: 'center', padding: '4px',
              }}
            >
              {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Links Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginTop: '4px', marginBottom: '8px' }}>
            <a href="#" style={{ color: '#1a3d9e', textDecoration: 'none' }} onClick={(e) => e.preventDefault()}>Quên mật khẩu</a>
            <a href="#" style={{ color: '#1a3d9e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.preventDefault()}>
              <Question size={16} /> Trợ giúp!
            </a>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              padding: '10px 12px',
              fontSize: '13px',
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              lineHeight: 1.4,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '46px',
              backgroundColor: loading ? '#3b5fbd' : '#1e3868',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#152a51'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#1e3868'; }}
          >
            {loading && (
              <span style={{
                width: '16px', height: '16px',
                border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
            )}
            {loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          margin: '24px 0', color: '#9ca3af', fontSize: '12px',
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
          <span>Hoặc đăng nhập</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
        </div>

        {/* Microsoft SSO button */}
        <button
          type="button"
          onClick={handleMicrosoftLogin}
          style={{
            width: '100%',
            height: '46px',
            backgroundColor: '#005a9e',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontFamily: 'inherit',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#004578'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#005a9e'}
        >
          {/* Microsoft logo (inline SVG) */}
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          Sign in using Microsoft
        </button>
      </div>


        {/* Footer text */}
        <p style={{
          marginTop: '32px',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          © 2026 Đại học Phenikaa - Hệ thống Karl
        </p>
      </div>
    </div>
  );
}
