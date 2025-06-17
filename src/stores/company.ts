import { defineStore } from 'pinia';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useCompanyStore = defineStore({
    id: 'company',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        // @ts-ignore
        sidebarMenu: JSON.parse(localStorage.getItem('menu')),
        ScreenWithoutChildren: {} as any,
        actions: {} as any,
        screen: null as any,
        action: null as any,
        roles: null as any,
        roleScreen: null as any,
        companies: {} as any
    }),
    actions: {
        async getAllCompanies(){
              // @ts-ignore
            const companyData = await fetchWrapper.get(`${baseUrl}/company?code=${JSON.parse(localStorage.getItem('user')).companyCode}`);
            this.companies = companyData;
            return companyData;
        },
        async menu(){
            const menuData = await fetchWrapper.get(`${baseUrl}/menu`);
            this.sidebarMenu = menuData;
            localStorage.setItem('menu', JSON.stringify(menuData));
            return menuData;
        },
        async getAllWithChildren(){
            const screenData = await fetchWrapper.get(`${baseUrl}/screen`);
            this.screen = screenData;
            //localStorage.setItem('menu', JSON.stringify(menuData));
            return screenData;
        },
        async getAllWithOutChildren(){
            const screenData = await fetchWrapper.get(`${baseUrl}/screen/without-children`);
            this.screen = screenData;
            //localStorage.setItem('menu', JSON.stringify(menuData));
            return screenData;
        },
        async getAllAction(){
            const actionData = await fetchWrapper.get(`${baseUrl}/menu/action`);
            this.action = actionData;
            //localStorage.setItem('menu', JSON.stringify(menuData));
            return actionData;
        },
        async addScreen(args: any){
            const screenData = await fetchWrapper.post(`${baseUrl}/screen`,args);
            return screenData;
        },
        async deleteScreen(id: number){
            const data = await fetchWrapper.delete(`${baseUrl}/screen/${id}`);
            return data;
        },
        async addAction(args: any){
            const actionData = await fetchWrapper.post(`${baseUrl}/screen/action`,args);
            return actionData;
        },
        async getRole(){
            const roleData = await fetchWrapper.get(`${baseUrl}/role`);
            this.roles = roleData;
            return roleData;
        },
        async getRoleScreen(roleId: number){
            const roleScreenData = await fetchWrapper.get(`${baseUrl}/role/screen?roleId=${roleId}`);
            this.roleScreen = roleScreenData;
            return roleScreenData;
        },
        async addRoleScreen(args: any){
            const roleScreenData = await fetchWrapper.post(`${baseUrl}/role/screen`,args);
            return roleScreenData;
        }
    }
});
