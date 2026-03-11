'use client';

import { useState, useEffect, useCallback } from 'react';

const COOKIE_NAME = 'vibecart_customer';

/**
 * Read customer session from cookies (client-side).
 *
 * We can't verify the HMAC signature client-side (the secret is server-only),
 * but we can read the cookie to know if the customer is logged in and extract
 * the phone number for display purposes.
 *
 * Actual authentication is verified server-side on every API call.
 */
export function useCustomerSession() {
  const [phone, setPhone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${COOKIE_NAME}=`));

      if (sessionCookie) {
        const value = sessionCookie.split('=')[1];
        const [data] = value.split('.');
        if (data) {
          const payload = JSON.parse(atob(data.replace(/-/g, '+').replace(/_/g, '/')));
          if (payload.phone && payload.exp > Math.floor(Date.now() / 1000)) {
            setPhone(payload.phone);
          }
        }
      }
    } catch {
      // Cookie parsing failed — treat as logged out
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    // Clear the cookie by setting it expired
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    setPhone(null);
  }, []);

  /**
   * Format phone for display: 212612345678 → 06 12 34 56 78
   */
  const displayPhone = phone
    ? `0${phone.slice(3, 4)} ** ** ** ${phone.slice(-2)}`
    : null;

  return {
    isLoggedIn: !!phone,
    phone,
    displayPhone,
    isLoading,
    logout,
  };
}
