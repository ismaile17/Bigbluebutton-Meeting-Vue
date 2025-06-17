<script setup>
import { onMounted, ref, watch, defineEmits } from 'vue'
import { FilterMatchMode, FilterOperator } from 'primevue/api'
import { useLayout } from '@/layout/composables/layout'
import { useLayoutStore } from '@/stores/layout'
import { useMeetingStore } from '@/stores/meeting'
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';

import {useI18n} from "vue-i18n";
const {t,te} = useI18n();
const router = useRouter();

const layoutStore = useLayoutStore()
const emit = defineEmits(['checkbox:change', 'delete:task', 'open:edit:dialog'])
const { layoutConfig } = useLayout()
const meetingStore = useMeetingStore()
const toast = useToast();

const deleteMeetingDialog = ref(false);
const selectedMeeting = ref(null);

onMounted(() => { meetingStore.getMeetingGridTableByUserId() })

watch(
    layoutConfig.colorScheme,
    () => {
        // setChartData();
    },
    { immediate: true }
)

watch(
    layoutConfig.theme,
    () => {
        // setChartData();
    },
    { immediate: true }
)

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const dt = ref()

const meetingToDeleteId = ref(null); // Silinecek meeting ID'sini saklamak için

const confirmDeleteMeeting = (meeting) => {
    // Gelen meeting nesnesini doğrudan kullanıyoruz
    selectedMeeting.value = meeting; // `meeting` doğrudan nesne
    meetingToDeleteId.value = meeting.id; // ID'yi nesneden al
    if (!meetingToDeleteId.value) {
        toast.add({ severity: 'error', summary: t('error'), detail: t('meeting.form.invalidMeetingId'), life: 3000 });
        return;
    }
    deleteMeetingDialog.value = true;
};


const editMeeting = (rowData) => {
  router.push({ name: 'edit-meeting', params: { id: rowData.id } });
};


const handleDeleteMeeting = async () => {
    if (!meetingToDeleteId.value) {
        toast.add({ severity: 'error', summary: t('error'), detail: t('meeting.form.invalidMeetingId'), life: 3000 })
        return; // ID geçersizse işlemi durdur
    }

    try {
        const response = await meetingStore.softDeleteMeeting(meetingToDeleteId.value);
        if (response.success) {
            toast.add({ severity: 'success', summary: t('success'), detail: t('meeting.form.deleteSuccess'), life: 3000 })
            await meetingStore.getMeetingGridTableByUserId(); // Güncellenmiş toplantı listesini al
            deleteMeetingDialog.value = false;
        } else {
            toast.add({ severity: 'error', summary: t('error'), detail: t('meeting.form.deleteError'), life: 3000 })
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: t('error'), detail: t('meeting.form.deleteError'), life: 3000 })
    }
};


const formatDate = (date) => {
  if (!date) return '-';  // Eğer null veya undefined ise '-' döndür
  const locale = localStorage.getItem('language') || 'en-US';  // Varsayılan dil 'en-US'
  const options = { year: 'numeric', month: 'long', day: 'numeric' };  // Tarih formatı
  return new Date(date).toLocaleDateString(locale, options);
};

const formatTime = (time) => {
  if (!time) return '-';  // Eğer null veya undefined ise '-' döndür
  const locale = localStorage.getItem('language') || 'en-US';  // Dil bilgisi
  const options = { hour: '2-digit', minute: '2-digit' };  // Saat formatı
  return new Date(`1970-01-01T${time}`).toLocaleTimeString(locale, options);
};



</script>

<template>
    <div class="card">
        <div class="grid">
            <div class="col-12 lg:col-12">
                <div class="grid formgrid p-fluid">

                </div>
                <DataTable :value="meetingStore.meetinggridtable.value" ref="dt" v-model:selection="selectedMeeting" dataKey="id"
                    :paginator="true" :rows="10" :filters="filters"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25]"
                    :currentPageReportTemplate="t('meeting.form.pageReport')" filterDisplay="menu"
                    :globalFilterFields="['name', 'description', 'startDate','endDate','startTime','endTime']">

                    <template #header>
                        <div class="col-12">
                            <div class="grid p-fluid">
                                <div class="col-12 md:col-6">
                                    <router-link to="/meeting/createmeetingv2">
                                        <Button icon="pi pi-calendar-plus" :label="t('meeting.form.createMeeting')" class="w-full sm:w-auto"></Button>
                                    </router-link>
                                </div>
                                <div class="col-12 md:col-6">
                                    <span class="block mt-2 md:mt-0 p-input-icon-left w-full">
                                        <i class="pi pi-search" />
                                        <InputText v-model="filters['global'].value" :placeholder="t('meeting.form.search')" />
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

                    <!-- <Column field="id" :header="t('meeting.form.id')" sortable></Column> -->
                    <Column field="name" :header="t('meeting.form.name')" sortable class="line-height-3" :style="{ minWidth: '12rem' }"></Column>
                    <Column field="description" :header="t('meeting.form.description')" sortable class="line-height-3"></Column>

                    <!-- <Column field="scheduleOrSingleDate" :header="t('meeting.form.scheduleOrSingleDate')" sortable class="line-height-3">
                    <template #body="slotProps">
                        <div class="icon-container">
                        <span v-if="slotProps.data.scheduleOrSingleDate" class="big-icon pi pi-calendar-plus calendar-icon"></span>
                        <span v-else class="big-icon pi pi-clock clock-icon"></span>
                        </div>
                    </template>
                    </Column> -->
                    

                    <Column field="startDate" :header="t('meeting.form.startDate')" sortable class="line-height-3">
                    <template #body="slotProps"> {{ formatDate(slotProps.data.startDate) }} </template>
                    </Column>
                    <Column field="startTime" :header="t('meeting.form.startTime')" sortable class="line-height-3">
                    <template #body="slotProps"> {{ formatTime(slotProps.data.startTime) }} </template>
                    </Column>
                    <Column field="endDate" :header="t('meeting.form.endDate')" sortable class="line-height-3">
                    <template #body="slotProps"> {{ formatDate(slotProps.data.endDate) }} </template>
                    </Column>
                    <Column field="endTime" :header="t('meeting.form.endTime')" sortable class="line-height-3">
                    <template #body="slotProps"> {{ formatTime(slotProps.data.endTime) }} </template>
                    </Column>

                    <Column field="totalMeeting" :header="t('meeting.form.totatlMeeting')" sortable class="line-height-3" :style="{ minWidth: '12rem', textAlign: 'center' }"></Column>



                    <Column headerStyle="min-width:10rem;">
                        <template #body="{ data }">
                            <Button icon="pi pi-pencil" class="custom-color-button mr-2" text rounded :label="t('Menu.edit')" @click="editMeeting(data)" />
                            <Button icon="pi pi-trash" class="custom-color-button-delete mr-2" text rounded :label="t('Menu.delete')" @click="confirmDeleteMeeting(data)" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>

    <Dialog v-model:visible="deleteMeetingDialog" :style="{ width: '450px' }" :header="t('meeting.form.confirmDelete')" :modal="true">
        <div class="flex align-items-center justify-content-center">
            <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
            <span>{{ selectedMeeting.value ? `${selectedMeeting.value.name} ${t('meeting.form.confirmDeleteMessage')}` : t('meeting.form.confirmDeleteMessageFallback') }}</span>
        </div>

        <template #footer>
            <Button :label="t('meeting.form.no')" icon="pi pi-times" text @click="deleteMeetingDialog.value = false" />
            <Button :label="t('meeting.form.yes')" icon="pi pi-check" text @click="handleDeleteMeeting" />
        </template>
    </Dialog>
</template>

<style scoped>
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

.big-icon {
  font-size: 1.5rem; /* Simgenin boyutunu büyütüyoruz */
}

.icon-container {
  display: flex;
  justify-content: center; /* Yatayda ortalamak için */
  align-items: center;     /* Dikeyde ortalamak için */
  height: 100%;            /* Tüm hücre yüksekliği boyunca ortalamak için */
}

.big-icon {
  font-size: 2rem;         /* Simgeyi büyütmek için */
}

.calendar-icon {
  color: #5fa023;          /* Takvim simgesine yeşil renk vermek için */
}

.clock-icon {
  color: #0799a3;          /* Saat simgesine kırmızı renk vermek için */
}

</style>