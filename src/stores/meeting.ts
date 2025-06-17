import { defineStore } from 'pinia';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';

const baseUrl = `${import.meta.env.VITE_API_URL}`;


export const useMeetingStore = defineStore({
    id: 'meetings',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        // @ts-ignore
        
        group: {} as any,
        editmeeting: {} as any,
        groups: {},
        meetingss: {},
        groupsbyuserid: {},
        meetings:[] as any[],
        selectedgroup:[] as any[],
        meetinggridtable:[] as any[],
        selectedmeeting:[] as any[],

    }),
    actions: {

        async addGroup(args: any) {
            const meetingGroupData = await fetchWrapper.post(`${baseUrl}/group/creategroup`, args);
            this.group = meetingGroupData;
            return meetingGroupData;
          },
        async editGroup(args: any){
            const meetingGroupData = await fetchWrapper.post(`${baseUrl}/group/editgroup`,args);
            this.group = meetingGroupData;
            return meetingGroupData;
        },
        async editMeeting(args: any){
            const meetingEditData = await fetchWrapper.post(`${baseUrl}/meeting/edit`,args);
            this.editmeeting = meetingEditData;
            return meetingEditData;
        },
        async getAllGroup(){
            const groupData = await fetchWrapper.get(`${baseUrl}/group/getallgroup`);
            this.groups = groupData;
            return groupData;
        },
        async getGroupByUserId(){
            const groupData = await fetchWrapper.get(`${baseUrl}/group/groupbyuserid`);
            this.groupsbyuserid = groupData;
            return groupData;
        },
        async getSelectedGroupByUserId(){
            const groupData = await fetchWrapper.get(`${baseUrl}/group/selectedgroupbyuserid`);
            this.selectedgroup = groupData;
            return groupData;
        },
        async getMeetingGridTableByUserId(){
            const gridtable = await fetchWrapper.get(`${baseUrl}/meeting/gridtablemeetingbyuserid`);
            this.meetinggridtable = gridtable;
            return gridtable;
        },
        async getSelectedMeetingByUserId(){
            const groupData = await fetchWrapper.get(`${baseUrl}/meeting/selectedmeetingbyuserid`);
            this.selectedmeeting = groupData;
            return groupData;
        },
        async addMeeting(args: any){
            const meetingCreateData = await fetchWrapper.post(`${baseUrl}/meeting/create`,args);
            this.group = meetingCreateData;
            return meetingCreateData;
        },
        async getMeetingByUserId(){
            const meetingByUserId = await fetchWrapper.get(`${baseUrl}/meeting/getmeetingbyuserid`);
            this.meetings = meetingByUserId;
            return meetingByUserId;
        },
        async getGroupById(id:any){
            
            const groupData = await fetchWrapper.get(`${baseUrl}/group/getgroupbyid?groupId=${id}`).then((x) => {
                this.groups = x.value
                return x;
            });
            return groupData;
        },

        async getMeetingById(id:any){
            
            const groupData = await fetchWrapper.get(`${baseUrl}/meeting/getmeetingbyid?meetingId=${id}`).then((x) => {
                this.meetingss = x.value
                return x;
            });
            return groupData;
        },

        async softDeleteMeeting(id:any) {
            const deleteResponse = await fetchWrapper.delete(`${baseUrl}/meeting/soft-delete/${id}`);
            return deleteResponse;
        },

        async softDeleteMeetingGroup(id:any) {
            const deleteResponse = await fetchWrapper.delete(`${baseUrl}/group/soft-delete/${id}`);
            return deleteResponse;
        },

        
    }
});
