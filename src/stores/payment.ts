import { defineStore } from 'pinia';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';

const baseUrl = `${import.meta.env.VITE_API_URL}`;


export const usePaymentStore = defineStore({
    id: 'payments',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        // @ts-ignore
        payment: null,
        check: {} as any,
        package: {} as any
    }),
    actions: {
        async addPayment(args: any){
            const paymentData = await fetchWrapper.post(`${baseUrl}/payment`,args);
            return paymentData;
        },
        async checkPayment(orderId: any){
            const paymentData = await fetchWrapper.get(`${baseUrl}/payment/check?order=${orderId}`);
            this.check = paymentData;
            return paymentData;
        },

        async getPAckageById(id:any){
            
            const packageData = await fetchWrapper.get(`${baseUrl}/package/getpackagebyid?packageId=${id}`).then((x) => {
                this.package = x.value
                return x;
            });
            return packageData;
        },

        async checkCupon(code: string, packageId: number) {
            const response = await fetchWrapper.get(`${baseUrl}/cupon/check?code=${code}&packageId=${packageId}`);
            return response;
          }

    }
});
