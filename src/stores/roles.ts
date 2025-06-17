import { defineStore } from 'pinia';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';

const baseUrl = `${import.meta.env.VITE_API_URL}`;


export const useRoleStore = defineStore({
    id: 'roles',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        // @ts-ignore
        sidebarMenu: JSON.parse(localStorage.getItem('menu')),
        roles: {} as any,
        
    }),
    actions: {
        async addRole(args: any){
            const roleData = await fetchWrapper.post(`${baseUrl}/role`,args);
            return roleData;
        },
        async getAllRoles(companyId:number){
            const rolesData = await fetchWrapper.get(`${baseUrl}/role?companyId=${companyId}`);
            this.roles = rolesData;
            return rolesData;
        },
        async addEmployeeRole(args: any){
            const roleData = await fetchWrapper.post(`${baseUrl}/role/user`,args);
            return roleData;
        },
        async roleScreenAdd(args: any){
            const roleData = await fetchWrapper.post(`${baseUrl}/role/screen/add`,args);
            return roleData;
        },
    }
});
