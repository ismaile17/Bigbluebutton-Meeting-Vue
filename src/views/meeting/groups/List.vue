<script setup>
import { onMounted, ref, watch, defineEmits } from 'vue'
import { FilterMatchMode, FilterOperator } from 'primevue/api'
import { useLayout } from '@/layout/composables/layout'
import { useToast } from 'primevue/usetoast'
import { useLayoutStore } from '@/stores/layout'
import { useMeetingStore } from '@/stores/meeting'
import { useUserCalendarAndReport } from '@/stores/usercalendarandreport'
import {useI18n} from "vue-i18n";
const {t,te} = useI18n();



const userCalenderAndReportStore = useUserCalendarAndReport();

const layoutStore = useLayoutStore()
const emit = defineEmits(['checkbox:change', 'delete:task', 'open:edit:dialog'])
const { layoutConfig } = useLayout()
const meetingStore = useMeetingStore()
const toast = useToast()

import { useRouter } from 'vue-router';

const router = useRouter();

const deleteGroupDialog = ref(false);
const selectedGroup = ref(null);

onMounted(async () => { 
    layoutStore.setLoading(true);
    await getAllGroup();
    layoutStore.setLoading(false);
})





const getAllGroup = () => {
    meetingStore.getGroupByUserId() ;
}


const addGroupButton = async () => {
  try {
    // Start loading indicator
    layoutStore.setLoading(true);

    // Fetch the maximum limit data
    const responseMaxLimit = await userCalenderAndReportStore.GetMaxLimitByUserId();

    // Check if the maximum group limit has been reached
    if (responseMaxLimit.value.maxGroup === 0 || responseMaxLimit.value.totalDay === 0) {
        toast.add({ severity: 'error', summary: t('error'), detail: "Max Limit", life: 3000 })
      return;
    }

    // Navigate to the add group page
    await router.push("/meeting/group/add");
  } catch (error) {
    // Log any errors that occur during the process
    console.error("An error occurred while adding a group:", error);
  } finally {
    // Stop loading indicator regardless of success or failure
    layoutStore.setLoading(false);
  }
};


watch(layoutConfig.colorScheme, () => {
      //setChartData();
})

watch(
    layoutConfig.colorScheme,
    () => {
        //setChartData();
    },
    { immediate: true }
)
watch(
    layoutConfig.theme,
    () => {
        //setChartData();
    },
    { immediate: true }
)



const filters = ref(
    {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });


const dt = ref()

const confirmDeleteGroup = (group) => {
    selectedGroup.value = group
    deleteGroupDialog.value = true
}

// Yeni deleteGroup fonksiyonu
const deleteGroup = async () => {
    if (!selectedGroup.value) {
        toast.add({ severity: 'error', summary: t('error'), detail: "No group selected.", life: 3000 });
        return;
    }

    try {
        // Yükleme göstergesini başlat
        layoutStore.setLoading(true);
        // API çağrısını yap
        const response = await meetingStore.softDeleteMeetingGroup(selectedGroup.value.id);
        if (response.success) {
            toast.add({ severity: 'success', summary: t('success'), detail: "Group deleted successfully.", life: 3000 });
            deleteGroupDialog.value = false;
            selectedGroup.value = null;
            await getAllGroup(); // Grupları yeniden al
        } else {
            toast.add({ severity: 'error', summary: t('error'), detail: response.message || "Failed to delete the group.", life: 3000 });
        }
    } catch (error) {
        console.error("An error occurred while deleting the group:", error);
        toast.add({ severity: 'error', summary: t('error'), detail: "An unexpected error occurred.", life: 3000 });
    } finally {
        // Yükleme göstergesini durdur
        layoutStore.setLoading(false);
    }
}


const editGroup = (rowData) => {
  router.push({ name: 'group-edit', params: { id: rowData.id } });
};




</script>


<template>
    <div class="card">
        <div class="grid">
            <div class="col-12 lg:col-12">
                <div class="grid formgrid p-fluid">

                </div>
                <div v-if="!meetingStore.groupsbyuserid.value">
                    <p>{{ t('group.form.fetchError') }}</p>
                </div>
                <DataTable :value="meetingStore.groupsbyuserid.value" ref="dt" v-model:selection="selectedGroup" dataKey="id"
                    :paginator="true" :rows="10" :filters="filters"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} groups" filterDisplay="menu"
                    :globalFilterFields="['name', 'specialDescription', 'description']">

                    <!--<Column :expander="true" headerStyle="width: 3rem" />-->
                    <!--<Column selectionMode="multiple" headerStyle="width: 3rem"></Column>-->


                    <template #header>
                        <div class="col-12">
                            <div class="grid p-fluid">
                                <div class="col-12 md:col-6">
                                    <Button
                                        icon="pi pi-plus-circle"
                                        :label="t('group.form.addGroup')"
                                        class="w-full sm:w-auto"
                                        @click="addGroupButton"
                                    ></Button>
                                </div>
                                <div class="col-12 md:col-6">
                                    <span class="block mt-2 md:mt-0 p-input-icon-left w-full">
                                        <i class="pi pi-search" />
                                        <InputText v-model="filters['global'].value" :placeholder="t('group.form.search')" />
                                    </span>
                                </div>

                            </div>
                        </div>
                        <!-- <div :style="{ height: '4px', background: 'linear-gradient(90deg, #ffa500 0%, rgba(33, 150, 243, 0) 90%)' }"></div> -->
                        <div :style="{
                        height: '4px', 
                        width: '100%', 
                        background: 'linear-gradient(90deg, #ffa500 30%, #0a74da 70%)'
                        }"></div>

                    </template>
                    <Column field="name" :header="t('group.form.nameHeader')" sortable>
                        <template #body="{ data }">
                            <span>{{ data.name.length > 25 ? data.name.slice(0, 25) + '...' : data.name }}</span>
                        </template>
                    </Column>
                    <Column field="specialDescription" :header="t('group.form.specialNoteHeader')" sortable>
                        <template #body="{ data }">
                            <span>{{ data.specialDescription.length > 25 ? data.specialDescription.slice(0, 25) + '...' : data.specialDescription }}</span>
                        </template>
                    </Column>
                    <Column field="description" :header="t('group.form.descriptionHeader')" sortable>
                        <template #body="{ data }">
                            <span>{{ data.description.length > 25 ? data.description.slice(0, 25) + '...' : data.description }}</span>
                        </template>
                    </Column>

                    <Column field="memberCount" :header="t('group.form.countUserHeader')" sortable>
                        <template #body="{ data }">
                            <span class="member-count">
                                <i class="pi pi-users user-icon"></i>
                                <span class="count-text">{{ data.memberCount }}</span>
                            </span>
                        </template>
                    </Column>

                    <Column headerStyle="min-width:10rem;">
                        <template #body="rowData">
                            <Button icon="pi pi-pencil" class="custom-color-button mr-2"  text rounded :label="t('Menu.edit')"
                                @click="editGroup(rowData.data)" />
                            <Button icon="pi pi-trash" class="custom-color-button-delete mr-2" text rounded :label="t('Menu.delete')"
                                @click="confirmDeleteGroup(rowData.data)" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>

    <Dialog v-model:visible="deleteGroupDialog" :style="{ width: '450px' }" :header="t('group.form.confirmDelete')" :modal="true">
        <div class="flex align-items-center justify-content-center">
            <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
            <span>{{ t('group.form.confirmDelete') }}</span>
        </div>
        <template #footer>
            <Button :label="t('group.form.no')" icon="pi pi-times" text @click="deleteGroupDialog = false" />
            <Button :label="t('group.form.yes')" icon="pi pi-check" text @click="deleteGroup" />
        </template>
    </Dialog>
</template>


<style scoped>
.member-count {
  display: flex;
  align-items: center;
}

.user-icon {
  color: #ffa500; /* Mavi renk */
  margin-right: 5px;
  font-size: 1.5em; /* Simge boyutu */
}

.count-text {
  color: #0a74da; /* Yeşil renk */
  font-weight: bold;
  font-size: 1.5em; /* Metin boyutu */
}

.custom-color-button {
    color: #0a74da; /* Buton yazı rengi */
}

.custom-color-button:hover {
    background-color: #ffa500; /* Mouse üzerine gelindiğinde koyulaşan renk */
    color: white; /* Buton yazı rengi */
}

.custom-color-button-delete {
    color: #ff0000; /* Buton yazı rengi */
}

.custom-color-button-delete:hover {
    background-color: red; /* Mouse üzerine gelindiğinde koyulaşan renk */
    color: white; /* Buton yazı rengi */
}
</style>