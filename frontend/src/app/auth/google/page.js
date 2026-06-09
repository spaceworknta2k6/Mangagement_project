'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import css from './page.module.css';

/**
 * Trang callback sau khi Google redirect về.
 * URL có dạng: /auth/google?code=<sessionCode>
 *              hoặc: /auth/google?error=<message>
 */
export default function GoogleCallbackPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [status, setStatus] = useState('loading'); // 'loading' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const ranRef = useRef(false);

  useEffect(() => {
    // Chạy đúng 1 lần, tránh StrictMode double-invoke
    if (ranRef.current) return;
    ranRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const callbackError = params.get('error');

    // Trường hợp backend báo lỗi qua query param
    if (callbackError) {
      setStatus('error');
      setErrorMsg(decodeURIComponent(callbackError));
      return;
    }

    // Không có code → quay lại login
    if (!code) {
      router.replace('/auth/login');
      return;
    }

    // Đổi session code lấy JWT
    authService
      .googleSession(code)
      .then((result) => {
        const { accessToken, user } = result.data;
        setAuth(accessToken, user);
        router.replace('/dashboard');
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
      });
  }, [router, setAuth]);

  return (
    <div className={css.s1}>
      <div className={css.s2}>
        {/* Google logo */}
        <div className={css.s3}>
          <svg width="40" height="40" viewBox="0 0 24 24">
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
        </div>

        {status === 'loading' && (
          <>
            {/* Spinner */}
            <div className={css.s4} />
            <h1 className={css.s5}>
              Đang xác thực…
            </h1>
            <p className={css.s6}>
              Vui lòng chờ trong giây lát.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            {/* Error icon */}
            <div className={css.s7}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h1 className={css.s8}>
              Đăng nhập thất bại
            </h1>

            <p className={css.s9}>
              {errorMsg}
            </p>

            <p className={css.s10}>
              Chỉ tài khoản Google của Phenikaa{' '}
              <span className={css.s11}>(@st.phenikaa-uni.edu.vn)</span>{' '}
              mới được phép truy cập hệ thống.
            </p>

            <button
              onClick={() => router.replace('/auth/login')}
              className={css.s12}
            >
              Quay lại đăng nhập
            </button>
          </>
        )}
      </div>

    </div>
  );
}
