<script setup>
import { onMounted, ref, watch } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import { useLayout } from '@/layout/composables/layout';
import { useModuleStore } from '@/stores/module';
import { useCompanyStore } from "@/stores/company"
const { layoutConfig } = useLayout();
const knobValue = ref(90);
const moduleStore = useModuleStore();
const companyStore = useCompanyStore();
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';
const screenActionData = ref([]);
const tempScreenAction = ref([]);
onMounted(() => {
    moduleStore.getAllScreenActions().then((x) => {
        if(x.success){
            screenActionData.value = x.value;
            tempScreenAction.value = x.value;
        }
    })
    companyStore.getAllCompanies().then((x) => {
        if(x.success){            
            companies.value = x.value;
        }
    })
    moduleStore.getAllModules().then((x) => {
        if(x.success){
            modules.value =x.value;
        }
    });
});
watch(layoutConfig.colorScheme, () => {
  //  setChartData();
});

const  getActions = async () => {
    //return await fetchWrapper.get(`https://${selectedModules.value.apiUrl}-${selectedCompany.value.domainName}/screen/action`);
    return await fetchWrapper.get(`http://${'localhost:5022'}/api/screen/controller/action`);
};
watch(
    layoutConfig.colorScheme,
    () => {
        //setChartData();
    },
    { immediate: true }
);
watch(
    layoutConfig.theme,
    () => {
        //setChartData();
    },
    { immediate: true }
);


const modules = ref([]);
const companies = ref([]);
const selectedCompany = ref(null);
const screenActions = ref([]);
const selectedScreenAction = ref(null);
const screens = ref([]);
const selectedModules = ref(null);
const selectedScreens = ref(null);
    const moduleChange = (args) => {
        if(args.value){
            screens.value = args.value.screens;
            getActions().then((d) => {
                screenActions.value = d
    });
        } else {
            screens.value = [];
            selectedScreens.value = null;
        }
        
    }
    const companyChange = (args) => {
        //localStorage.setItem('company', JSON.stringify(user));
        
    }
    const selectedData = ref([]);
    const expandedRows = ref();
    const ali = ref();
    const screenChange = (args) => {
        if(!args.value){
            selectedScreenAction.value = null;
        } else
        screenActionData.value = tempScreenAction.value;
        screenActionData.value = screenActionData.value.filter((x) => x.screenId == args.value.id);
        console.log(screenActions.value.filter((x) => screenActionData.value.some((d) => d.controllerName == x.id)).map((x) => x.actions));
        screenActions.value.filter((x) => screenActionData.value.some((d) => d.controllerName == x.id)).forEach((x,a) => {
            x.actions.forEach((d,b) => {
                selectedData.value.push(d)
            })
        })
        selectedScreenAction.value = selectedData.value.filter((d) => screenActionData.value.map((g) => g.key).some((a) => a == d.id));
    }
const save = () => {
    const model = {
        moduleId: selectedModules.value.id,
        screenId: selectedScreens.value.id,
        actions: selectedScreenAction.value.map((x) => {
            return {
                ControllerName: x.controllerId,
                Key : x.id
            }
        })
    };
    moduleStore.addScreenAction(model);
}
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
</script>
<template>
    <div class="card">
        <span class="text-900 text-xl font-bold mb-4 block">Screen</span>
        <div class="grid">
            <div class="col-12 lg:col-12">
                <div class="grid formgrid p-fluid">
                    <div class="field mb-4 col-12">
                        <label for="nickname" class="font-medium text-900"> Company </label>
                        <Dropdown v-model="selectedCompany" :options="companies" optionLabel="name" :filter="true" placeholder="Select a Company" :showClear="true" @change="companyChange($event)">
                            <template #value="slotProps">
                                <div class="flex align-items-center" v-if="slotProps.value">
                                    <div>{{ slotProps.value.name }}</div>
                                </div>
                                <span v-else>
                                    {{ slotProps.placeholder }}
                                </span>
                            </template>
                            <template #option="slotProps">
                                <div class="flex align-items-center">
                                    <div>{{ slotProps.option.name }}</div>
                                </div>
                            </template>
                        </Dropdown>
                    </div>
                    <div class="field mb-4 col-12" v-if="modules">
                        <label for="nickname" class="font-medium text-900"> Module </label>
                        <Dropdown v-model="selectedModules" :options="modules" optionLabel="name" :filter="true" placeholder="Select a Module" :showClear="true" @change="moduleChange($event)">
                            <template #value="slotProps">
                                <div class="flex align-items-center" v-if="slotProps.value">
                                    <div>{{ slotProps.value.name }}</div>
                                </div>
                                <span v-else>
                                    {{ slotProps.placeholder }}
                                </span>
                            </template>
                            <template #option="slotProps">
                                <div class="flex align-items-center">
                                    <div>{{ slotProps.option.name }}</div>
                                </div>
                            </template>
                        </Dropdown>
                    </div>
                  
                   
                  
                 
                   
                   
                    <div class="field mb-4 col-12">
                        <label for="screens" class="font-medium text-900"> Screens </label>
                        <Dropdown v-model="selectedScreens" :options="screens" optionLabel="name" :filter="true" placeholder="Select a Screen" :showClear="true" @change="screenChange($event)">
                            <template #value="slotProps">
                                <div class="flex align-items-center" v-if="slotProps.value">
                                    <div>{{ slotProps.value.name }}</div>
                                </div>
                                <span v-else>
                                    {{ slotProps.placeholder }}
                                </span>
                            </template>
                            <template #option="slotProps">
                                <div class="flex align-items-center">
                                    <div>{{ slotProps.option.name }}</div>
                                </div>
                            </template>
                        </Dropdown>
                       
                    </div>
{{ selectedScreenAction }}
                    <div class="field mb-4 col-12">
                        <label for="screens" class="font-medium text-900"> Actions </label>
                        <DataTable v-model:expandedRows="expandedRows" v-model:filters="filters" :value="screenActions" dataKey="id"
        @rowExpand="onRowExpand" @rowCollapse="onRowCollapse" tableStyle="min-width: 60rem"  paginator :rows="10" :globalFilterFields="['name', 'displayName', 'actions.name', 'actions.displayName','actions.id']">
        <template #header>
            
        <div class="flex justify-content-end">
            <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" placeholder="Keyword Search" />
            </span>
        </div>
    </template>
    <Column expander style="width: 5rem" />
    <Column header="Name">
        <template #body="slotProps">
            {{ slotProps.data.displayName }} <b>({{ slotProps.data.name }})</b>
        </template>
    </Column>
    <template #expansion="slotProps">
        <div class="p-3">
            <DataTable :value="slotProps.data.actions" v-model:selection="selectedScreenAction">
                <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                <Column field="displayName" header="Name" sortable></Column>
                <Column field="id" header="Id" sortable></Column>
              
                
            </DataTable>
        </div>
    </template>
</DataTable>
                    
                    </div>
                    
                    <div class="col-12">
                        <Button label="Save" class="w-auto mt-3" @click="save()"></Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
