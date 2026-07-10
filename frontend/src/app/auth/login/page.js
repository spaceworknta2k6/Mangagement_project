'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeSlash, User, Lock, Question } from '@phosphor-icons/react';
import useAuthStore from '@/store/auth.store';
import useThemeStore from '@/store/theme.store';
import { authService } from '@/services/auth.service';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUser = useAuthStore((s) => s.setUser);
  const { applyTheme } = useThemeStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
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
      setError('Tên tài khoản hoặc mật khẩu không hợp lệ!');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    let hasError = false;

    if (!email.trim()) {
      setEmailError('Vui lòng nhập tài khoản hoặc email!');
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu!');
      hasError = true;
    }
    if (hasError) return;

    doLogin(email, password);
  };

  const handleGoogleLogin = () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    window.location.href = `${apiBaseUrl}/auth/google`;
  };

  return (
    <div className={styles.page}>
      {/* Background image */}
      <div className={styles.background}>
        <Image
          src="/images/bg-login.jpg"
          alt="background"
          fill
          className={styles.backgroundImage}
          priority
        />
        {/* Blue overlay to match Phenikaa style */}
        <div className={styles.backgroundOverlay} />
      </div>

      {/* Content wrapper */}
      <div className={styles.content}>
        
        {/* Logo at Top */}
        <div className={styles.logoWrap}>
          <Image
            src="/images/logo-Phenikaa-w.png"
            alt="Phenikaa University"
            width={280}
            height={80}
            className={styles.logo}
          />
        </div>

        {/* Main card */}
        <div className={styles.card}>
          {/* Decorative Plane (login-line-1.png) */}
          <div className={styles.decorPlane} />

          {/* Decorative Line (login-line-2.png) */}
          <div className={styles.decorLine} />

          {/* Title */}
          <div className={styles.titleWrap}>
            <h1 className={styles.title}>
              ĐĂNG NHẬP
            </h1>
          </div>

          {/* Error message */}
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* Email field */}
            <div className={styles.fieldWrapper}>
              <div className={styles.field}>
                <span className={styles.fieldIcon}>
                  <User size={18} />
                </span>
                <input
                  type="text"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (e.target.value) setEmailError('');
                  }}
                  placeholder="Nhập tài khoản hoặc email"
                  autoFocus
                  className={`${styles.input} ${emailError ? styles.inputError : ''}`}
                />
              </div>
              {emailError && <div className={styles.fieldErrorMsg}>{emailError}</div>}
            </div>

            {/* Password field */}
            <div className={styles.fieldWrapper}>
              <div className={styles.field}>
                <span className={styles.fieldIcon}>
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (e.target.value) setPasswordError('');
                  }}
                  placeholder="Nhập mật khẩu"
                  className={`${styles.input} ${styles.passwordInput} ${passwordError ? styles.inputError : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={styles.passwordButton}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && <div className={styles.fieldErrorMsg}>{passwordError}</div>}
            </div>

            {/* Links Row */}
            <div className={styles.linksRow}>
              <a href="#" className={styles.link} onClick={(e) => e.preventDefault()}>Quên mật khẩu</a>
              <a href="#" className={styles.helpLink} onClick={(e) => e.preventDefault()}>
                <Question size={16} /> Trợ giúp!
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading && (
                <span className={styles.spinner} />
              )}
              {loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
            </button>
          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span>Hoặc đăng nhập</span>
            <div className={styles.dividerLine} />
          </div>

          {/* Google SSO button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className={styles.googleButton}
          >
            {/* Google logo (inline SVG) */}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>

        {/* Footer text */}
        <p className={styles.footer}>
          © 2026 Đại học Phenikaa - Hệ thống Karl
        </p>
      </div>
    </div>
  );
}
