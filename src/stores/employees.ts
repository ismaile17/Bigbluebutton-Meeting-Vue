import { defineStore } from 'pinia';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';

const baseUrl = `${import.meta.env.VITE_API_URL}`;


export const useEmployeeStore = defineStore({
    id: 'employees',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        // @ts-ignore
        sidebarMenu: JSON.parse(localStorage.getItem('menu')),
        identityEmployees: {} as any,
        
    }),
    actions: {
        async addRole(args: any){
            const roleData = await fetchWrapper.post(`${baseUrl}/role`,args);
            return roleData;
        },
        async getIdentityEmployees(companyId:number){
            const employees = await fetchWrapper.get(`${baseUrl}/role/user?companyId=${companyId}`);
            this.identityEmployees = employees;
            return employees;
        }
    }
});
