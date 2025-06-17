// src/utils/auth.ts
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from '@/stores/auth';
import router from '@/router';
import { storeToRefs } from 'pinia';

interface DecodedToken {
  exp: number;
  // Diğer gerekli alanlar
}

export function isTokenExpired(token: string): boolean {
    try {
        const decoded: DecodedToken = jwtDecode(token); // Burada doğru kullanımı görüyoruz.
        const currentTime = Date.now() / 1000; // saniye cinsinden
        // console.log('Decoded Token:', decoded);
        // console.log('Current Time:', currentTime, 'Token Exp:', decoded.exp);
        return decoded.exp < currentTime;
      } catch (error) {
        console.error('Token decode error:', error);
        return true; // Token geçersiz ise expired say
      }
    }

export function checkTokenValidity(): boolean {
  const authStore = useAuthStore();
  const { user } = storeToRefs(authStore);
  const token = user.value?.accessToken;

  console.log('Checking token validity:', token);

  if (token && !isTokenExpired(token)) {
    console.log('Token is valid');
    return true;
  } else {
    console.log('Token is invalid or expired');
    authStore.logout();
    router.push('/login');
    return false;
  }
}
