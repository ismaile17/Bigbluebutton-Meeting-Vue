import { defineStore } from 'pinia';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';


const baseUrl = `${import.meta.env.VITE_API_URL}`;


export const useUserCalendarAndReport = defineStore({
    id: 'usercalendarandreport',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        // @ts-ignore

        createuserdetail: {} as any,
        getuserdetail:[] as any[],
        calendarpage:[] as any[],
        totalcount:[] as any[],
        maxlimit:[] as any[],


    }),

    actions: {
        async createOrEditUserDetail(args: any) {
            const groupData1 = await fetchWrapper.post(`${baseUrl}/userdetailsetting/createoredit`, args);
            this.createuserdetail = groupData1;
            return groupData1;
          },
          async getUserDetailSettingByUserId(){
            const groupData = await fetchWrapper.get(`${baseUrl}/userdetailsetting/getbyuserid`);
            this.getuserdetail = groupData;
            return groupData;
        },

        async getUserCalendarPageByUserId(){
            const groupData = await fetchWrapper.get(`${baseUrl}/userreportanddetail/calendarpage`);
            this.calendarpage = groupData;
            return groupData;
        },

        async getUserTotalCountByUserId(){
            const totalsData = await fetchWrapper.get(`${baseUrl}/userreportanddetail/totalcount`);
            this.totalcount = totalsData;
            return totalsData;
        },

        async GetMaxLimitByUserId(){
            const totalsData = await fetchWrapper.get(`${baseUrl}/userreportanddetail/maxlimit`);
            this.maxlimit = totalsData;
            return totalsData;
        },

        
    }
});