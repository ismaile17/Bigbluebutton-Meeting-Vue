import { defineStore } from 'pinia';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';
import router from '@/router';
const baseUrl = `${import.meta.env.VITE_API_URL}/`;
export const useAuthStore = defineStore({
    id: 'auth',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        // @ts-ignore
        user: JSON.parse(localStorage.getItem('user')),
        meetingss: {},

        

        //token: localStorage.getItem('auth') != null ? JSON.parse(localStorage.getItem('auth')) : null,
        // returnUrl: null
        returnUrl: '' as string, // Burada returnUrl özelliğini ekliyoruz

    }),
    actions: {
        async login(email: string, password: string) {
            const model = {
                email: email,
                password: password
            };
            const data = await fetchWrapper.post(`${baseUrl}account/login`,model);
            console.log('this.user:', this.user);
            this.user = data.value;
            localStorage.setItem('user', JSON.stringify(data.value));
            return data;
        },
        async loginParticipant(email: string, password: string) {
            const model = {
                email: email,
                password: password
            };
            const data = await fetchWrapper.post(`${baseUrl}participant/participantlogin`,model);
            console.log('this.user:', this.user);
            this.user = data.value;
            localStorage.setItem('user', JSON.stringify(data.value));
            return data;
        },

        async getCompletedLoginMeeting(id: string) {
            const data = await fetchWrapper.get(`${baseUrl}completedmeeting/logincompletedmeeting?completedMeetingGuId=${id}`);
            this.meetingss = data.value;
            return data;
        },


        

        logout() {
            this.clearToken();
            this.user = null;
            localStorage.removeItem('user');
            router.push('/login');
        },

        setToken(token: string) {
            this.user.accessToken = token;
            localStorage.setItem('token', token);
          },
          clearToken() {
            this.user.accessToken = '';
            this.user = null;
            localStorage.removeItem('token');
          }

    }
    
});