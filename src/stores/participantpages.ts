import { defineStore } from 'pinia';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';

const baseUrl = `${import.meta.env.VITE_API_URL}`;


export const useParticipantPagesStore = defineStore({
    id: 'participantpages',
    state: () => ({

        participant: {} as any,
        meetingstoday: {} as any,
        competedmeetingstartnow: {} as any,
        activegroups: {} as any,
    }),
    
    actions: {
        async getParticipantByParticipantId(id:any){
            
            const participantData2 = await fetchWrapper.get(`${baseUrl}/participantgroupetc/groupbyuserid?meetingGroupId=${id}`).then((x) => {
                this.participant = x.value
                return x;
            });
            return participantData2;
        }, 
        
        async getAllMeetingsToday(){
            const meetingsToday = await fetchWrapper.get(`${baseUrl}/participantgroupetc/meetingstoday`);
            this.meetingstoday = meetingsToday;
            return meetingsToday;
        },

        async completedMeetingStartNow(){
            const meetingsToday = await fetchWrapper.get(`${baseUrl}/participantgroupetc/completedmeetingstonowstart`);
            this.competedmeetingstartnow = meetingsToday;
            return meetingsToday;
        },

        async getActiveGroups(){
            const activeGroups = await fetchWrapper.get(`${baseUrl}/participantgroupetc/getallactivegroupforparticipant`);
            this.activegroups = activeGroups;
            return activeGroups;
        },
    },

});
