import { defineStore } from 'pinia';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';

const baseUrl = `${import.meta.env.VITE_API_URL}`;


export const useParticipantStore = defineStore({
    id: 'participants',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        // @ts-ignore
        
        participant: {} as any,
        participants: {} as any,
        timeZoneList: {} as any,
        selectedparticipants: {} as any,
        getParticipantByUserId:[] as any[],
        createParticipant: {} as any,
        editparticipant: {} as any,
        userNameEmailEtc: {},
        edituser: {} as any,



    }),
    actions: {
        async getAllParticipantByManager(){
            const participantsData1 = await fetchWrapper.get(`${baseUrl}/participant/getallparticipantbymanagerid`);
            this.participants = participantsData1;
            return participantsData1;
        },

        async getAllTimeZoneList(){
            const timeZoneData = await fetchWrapper.get(`${baseUrl}/participant/timezones`);
            this.timeZoneList = timeZoneData;
            return timeZoneData;
        },

        async getSelectedParticipantByUserId(){
            const participantsData5 = await fetchWrapper.get(`${baseUrl}/participant/getselectedparticipantbyuserid`);
            this.selectedparticipants = participantsData5;
            return participantsData5;
        },

        async getUserNameEmailEtc(){
            const groupData = await fetchWrapper.get(`${baseUrl}/account/usernameemailetc`);
            this.userNameEmailEtc = groupData;
            return groupData;
        },

        async getParticipantByParticipantId(id:any){
            
            const participantData2 = await fetchWrapper.get(`${baseUrl}/participant/getparticipantbyparticipantid?participantId=${id}`).then((x) => {
                this.participant = x.value
                return x;
            });
            return participantData2;
        },

        
        async editUserNameEtc(args: any){
            const edituserrrr = await fetchWrapper.post(`${baseUrl}/account/usernameedit`,args);
            this.edituser = edituserrrr;
            return edituserrrr;
        },

        async createRegisterParticipant(args: any) {
            const participantData3 = await fetchWrapper.post(`${baseUrl}/participant/participantregister`, args);
            this.createParticipant = participantData3;
            return participantData3;
          },

          async editParticipant(args: any){
            const participantData4 = await fetchWrapper.post(`${baseUrl}/participant/editparticipant`,args);
            this.editparticipant = participantData4;
            return participantData4;
        },
        
    }
});
