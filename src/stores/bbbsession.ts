import { defineStore } from 'pinia';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';


const baseUrl = `${import.meta.env.VITE_API_URL}`;


export const useBbbSessionStore = defineStore({
    id: 'bbbsessions',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        // @ts-ignore

        createcompletedmeeting: {} as any,
        createnowmeeting: {} as any,
        logincompletedmeeting: {} as any,
        group:[] as any[],
    }),

    actions: {
        async createCompletedMeeting(args: any) {
            const groupData = await fetchWrapper.post(`${baseUrl}/session/create`, args);
            this.createcompletedmeeting = groupData;
            return groupData;
          },

          async createNowMeeting(args: any) {
            const groupData = await fetchWrapper.post(`${baseUrl}/session/createnowmeeting`, args);
            this.createnowmeeting = groupData;
            return groupData;
          },


        async loginCompletedMeeting(args: any) {
            const groupData = await fetchWrapper.post(`${baseUrl}/session/login`, args);
            this.logincompletedmeeting = groupData;
            return groupData;
          },

        
    }
});