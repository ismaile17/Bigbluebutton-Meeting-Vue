import { defineStore } from 'pinia';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';

const baseUrl = `${import.meta.env.VITE_API_URL}`;


export const useTicketStore = defineStore({
    id: 'tickets',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        // @ts-ignore
        
        ticket: {} as any,
        priorityclosed: {} as any,
        tickets: {} as any,
        onlyTicket: {},
        messages: {} as any,
        selectedtickets: {} as any,
        getTicketsByUser:[] as any[],
        getOnlyTicketsByUser:[] as any[],
        getOpenTicketsAdmin:[] as any[],
        getCloseTicketsAdmin:[] as any[],
        createTicket: {} as any

    }),
    actions: {
        async createTicket(args: any) {
            const createTicketData = await fetchWrapper.post(`${baseUrl}/ticket/createticket`, args);
            this.ticket = createTicketData;
            return createTicketData;
          },

          async createPriorityOrCloseTicket(args: any) {
            const createClosed = await fetchWrapper.post(`${baseUrl}/ticket/createcategoryorpriorityorclosed`, args);
            this.priorityclosed = createClosed;
            return createClosed;
          },

          async createTicketMessage(args: any) {
            const createTicketData = await fetchWrapper.post(`${baseUrl}/ticket/createticketmessage`, args);
            this.messages = createTicketData;
            return createTicketData;
          },

          async getTicketByUserId(){
            const ticketsData = await fetchWrapper.get(`${baseUrl}/ticket/getallticketbyuserid`);
            this.getTicketsByUser = ticketsData;
            return ticketsData;
        },

        async getOnlyTicketByUserId(){
          const onlyTickets = await fetchWrapper.get(`${baseUrl}/ticket/getonlyticket`);
          this.getOnlyTicketsByUser = onlyTickets;
          return onlyTickets;
      },

      async getAllOpenTickets(){
        const onlyTickets = await fetchWrapper.get(`${baseUrl}/ticket/getallopenadmin`);
        this.getOpenTicketsAdmin = onlyTickets;
        return onlyTickets;
    },

    async getAllCloseTickets(){
      const onlyTickets = await fetchWrapper.get(`${baseUrl}/ticket/getallcloseadmin`);
      this.getCloseTicketsAdmin = onlyTickets;
      return onlyTickets;
  },

        async getTicketAndMessageByTicketId(id:any){
            
          const ticketData = await fetchWrapper.get(`${baseUrl}/ticket/getonlyticketandmessagebyuserid?ticketId=${id}`).then((x) => {
              this.onlyTicket = x.value
              return x;
          });
          return ticketData;
      },
        
    }
});
