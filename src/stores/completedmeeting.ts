import { defineStore } from 'pinia';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';


const baseUrl = `${import.meta.env.VITE_API_URL}`;


export const useCompletedMeetingStore = defineStore({
    id: 'completedmeetings',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        // @ts-ignore
        
        completedmeeting: {} as any,
        learningdashboard: {} as any,
        completedmeetings: {} as any,
        completedmeetingss:[] as any[],
    }),
    actions: {
        // async addGroup(args: any){
        //     const meetingGroupData = await fetchWrapper.post(`${baseUrl}/group/creategroup`,args);
        //     this.group = meetingGroupData;
        //     return meetingGroupData;
        // },

        async getCompletedMeetingByManagerId(){
            const groupData = await fetchWrapper.get(`${baseUrl}/completedmeeting/bymanagerid`);
            this.completedmeetings = groupData;
            return groupData;
        },

        async getCompletedMeetingByMeetingId(id:any){
            const groupData = await fetchWrapper.get(`${baseUrl}/completedmeeting/getcompletedmeetingbyid?completedMeetingId=${id}`);
            this.completedmeeting = groupData;
            return groupData;
        },

        async getLearningDashboardByMeetingId(id:any){
            const learningData = await fetchWrapper.get(`https://ismailerden.com.tr/api/LearningDashboard/${id}`);
            this.learningdashboard = learningData;
            return learningData;
        },

        async softDeleteCompletedMeeting(id:any) {
            const deleteResponse = await fetchWrapper.delete(`${baseUrl}/completedmeeting/soft-delete/${id}`);
            return deleteResponse;
        },

        

        
    }
});