import { defineStore } from 'pinia';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';


const baseUrl = `${import.meta.env.VITE_API_URL}`;


export const useUserDetailSettingStore = defineStore({
    id: 'userdetailsettings',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        // @ts-ignore

        createuserdetail: {} as any,
        getuserdetail:[] as any[],
        getuserdetailinvoiceandmeeting:[] as any[],

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

        async GetUserDetailSettingInvoiceAndMeetingByUserId(){
            const groupData = await fetchWrapper.get(`${baseUrl}/userdetailsetting/invoiceandmeetinggetbyuserid`);
            this.getuserdetailinvoiceandmeeting = groupData;
            return groupData;
        },

        async changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
            const model = {
                currentPassword: currentPassword,
                NewPassword: newPassword,
                ConfirmPassword: confirmPassword
            };
            console.log("MODELLLLL",model)
            try {
                const response = await fetchWrapper.post(`${baseUrl}/account/changepassword`, model);
                return response;
            } catch (error) {
                console.error('Error changing password:', error);
                throw error;
            }
        }

        
    }
});