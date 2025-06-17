import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useLayoutStore = defineStore({
    id: 'layoutModule',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        // @ts-ignore
        loading: false
    }),
    actions: {
        async setLoading(args: boolean){
            this.loading = args;
        }
    }
});
