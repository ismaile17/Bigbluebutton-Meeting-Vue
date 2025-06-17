//utils/helpers/fetch-wrapper.ts
import { useAuthStore } from '@/stores/auth';
import { isTokenExpired, checkTokenValidity } from '@/utils/auth';
import router from '@/router';

export const fetchWrapper = {
    get: request('GET'),
    post: request('POST'),
    put: request('PUT'),
    delete: request('DELETE'),
    login: login('POST')
};

function request(method: string) {
    return (url: any, body?: any) => {
        const requestOptions: any = {
            method,
            headers: authHeader(url)
        };

        const authStore = useAuthStore();
        const token = authStore.user?.accessToken;

        // Token varsa ve süresi dolmamışsa devam et
        if (token) {
            if (isTokenExpired(token)) {
                // Token süresi dolmuşsa logout ve login sayfasına yönlendir
                authStore.logout();
                router.push('/login');
                return Promise.reject('Token süresi doldu');
            }
        }

        if (body) {
            if (body instanceof FormData) {
                // FormData ise, Content-Type başlığını ayarlamayın
                requestOptions.body = body;
            } else {
                requestOptions.headers['Content-Type'] = 'application/json';
                requestOptions.body = JSON.stringify(body);
            }
        }

        return fetch(url, requestOptions).then(handleResponse);
    };
}

function login(method: string) {
    return (url: any, body?: any) => {
        const requestOptions: any = {
            method,
            headers: authHeader(url)
        };
        if (body) {
            requestOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            requestOptions.body = body;
        }
        return fetch(url, requestOptions).then(handleResponse);
    };
}

// Yardımcı fonksiyonlar

function authHeader(url: any) {
    const { user } = useAuthStore();

    const isLoggedIn = !!user?.accessToken;
    const isApiUrl = url.startsWith(import.meta.env.VITE_API_URL);
    if (isLoggedIn && isApiUrl) {
        return { Authorization: `Bearer ${user.accessToken}` };
    } else {
        return {};
    }
}

function handleResponse(response: any) {
    return response.text().then((text: any) => {
        let data;
        try {
            data = text ? JSON.parse(text) : null;
        } catch (error) {
            // JSON olarak parse edilemeyen veriyi loglayın ve uygun şekilde işleyin
            console.error('JSON parsing error:', error, 'Response Text:', text);
            return Promise.reject(`Invalid JSON response: ${text}`);
        }

        if (!response.ok) {
            const { user, logout } = useAuthStore();
            if ([401, 403].includes(response.status) && user) {
                logout(); // Eğer 401 Unauthorized veya 403 Forbidden dönerse otomatik çıkış yap
            }
            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }
        return data;
    });
}

