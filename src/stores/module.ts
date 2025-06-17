import { defineStore } from 'pinia';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useModuleStore = defineStore({
    id: 'module',
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
        modules: {} as any,
        screenActions: {} as any
    }),
    actions: {
        async getAllModules(){
            const moduleData = await fetchWrapper.get(`${baseUrl}/module`);
            this.modules = moduleData;
            return moduleData;
        },
        async getAllScreenActions(){
            const screenActionData = await fetchWrapper.get(`${baseUrl}/screen/action`);
            this.screenActions = screenActionData;
            return screenActionData;
        },
        async addScreenAction(args: any){
            const screenData = await fetchWrapper.post(`${baseUrl}/screen/action`,args);
            return screenData;
        },
        async getAllScreen(moduleId: any,roleId: any){
            const screenData = await fetchWrapper.get(`${baseUrl}/screen/getall?moduleId=${moduleId}&roleId=${roleId}`);
            this.screen = screenData;
            return screenData;
        },
    }
});
