<script setup>
import { onMounted, ref, watch, defineEmits } from 'vue'
import { FilterMatchMode, FilterOperator, PrimeIcons } from 'primevue/api'
import { useLayout } from '@/layout/composables/layout'
import { useLayoutStore } from '@/stores/layout'
import { useCompletedMeetingStore } from '@/stores/completedmeeting'
import { useMeetingStore } from '@/stores/meeting'
import { useBbbSessionStore } from '@/stores/bbbsession'
import MultiSelect from 'primevue/multiselect';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';

import {useI18n} from "vue-i18n";
const {t,te} = useI18n();

const meetingStore = useMeetingStore();
const bbbSessionStore = useBbbSessionStore()

const router = useRouter();

const toast = useToast();

const completedMeetingStore = useCompletedMeetingStore()

const layoutStore = useLayoutStore()
const emit = defineEmits(['checkbox:change', 'delete:task', 'open:edit:dialog'])
const { layoutConfig } = useLayout()

const selectedMeetingForTable = ref(null);  // Seçili grupları saklamak için

const meetingsBySelected = ref([]);  // Meetingleri saklamak için reaktif bir referans
const selectedMeetings = ref([]);  // Meetingleri saklamak için reaktif bir referans


const deleteCompletedMeetingDialog = ref(false);

onMounted(async () => { 
    layoutStore.setLoading(true);  // Yükleme durumunu aktif et
    await completedMeetingStore.getCompletedMeetingByManagerId(); 
    allMeetings.value = [...completedMeetingStore.completedmeetings.value]; // Tüm verileri sakla

    layoutStore.setLoading(false);  // Yükleme durumunu pasif et
})


// #region WATCH
    watch(layoutConfig.colorScheme, () => {
        //  setChartData();
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
//#endregion WATCH


const filters = ref(
    {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });


const dt = ref()

const scheduleMeetingDialog = ref(false); // Dialog penceresinin görünürlüğünü kontrol eden değişken

const confirmScheduleMeetingDialog = async () => { // Fonksiyonu asenkron yap
    scheduleMeetingDialog.value = true; // Dialog penceresini görünür yap
    await meetingStore.getSelectedMeetingByUserId(); // API çağrısını tamamlamasını bekle
    meetingsBySelected.value = [...meetingStore.selectedmeeting.value];
}

const meetingToDeleteId = ref(null); // Silinecek meeting ID'sini saklamak için

const confirmDeleteCompletedMeeting = (meeting) => {
    selectedMeetingForTable.value = meeting;
    meetingToDeleteId.value = meeting.id; // Silinecek meeting ID'sini sakla
    deleteCompletedMeetingDialog.value = true;
}


const dashboardRoute = (rowData) => {
  router.push({ name: 'dashboard', params: { id: rowData.internalMeetingId } });
};


const handleDeleteCompletedMeeting = async () => {
    if (!meetingToDeleteId.value) {
        toast.add({ severity: 'error', summary: t('error'), detail: t('completedMeeting.form.invalidMeetingId'), life: 3000 });
        return; // ID geçersizse işlemi durdur
    }

    try {
        const response = await completedMeetingStore.softDeleteCompletedMeeting(meetingToDeleteId.value);
        if (response.success) {
            toast.add({ severity: 'success', summary: t('success'), detail: t('completedMeeting.form.meetingDeleted'), life: 3000 });
            await completedMeetingStore.getCompletedMeetingByManagerId(); // Güncellenmiş toplantı listesini al
            deleteCompletedMeetingDialog.value = false; // Dialog penceresini kapat
        } else {
            toast.add({ severity: 'error', summary: t('error'), detail: t('completedMeeting.form.meetingDeleteFailed'), life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: t('error'), detail: t('completedMeeting.form.meetingDeleteFailed'), life: 3000 });
    }
};


const startMeetingDialog = ref(false);
const selectedMeeting = ref({ id: null, name: '', description: '', guestLink: '', bbbMeetingId: ''});

const startMeeting = async (data) => {
    layoutStore.setLoading(true);  // Yükleme durumunu aktif et
    if (!data || data.id === undefined) {
        console.error(t('completedMeeting.form.noMeetingId'));
        return;  // ID yoksa fonksiyonu sonlandırın
    }else{
        layoutStore.setLoading(false);  // Yükleme durumunu pasif et
    }

    const meetingDetails = await completedMeetingStore.getCompletedMeetingByMeetingId(data.id);

    if (meetingDetails && meetingDetails.success) {
        selectedMeeting.value = meetingDetails.value;
        loginMeetingModel.value.completedBBBMeetingId = selectedMeeting.value.bbbMeetingId;
        startMeetingDialog.value = true;
    } else {
        console.error(t('completedMeeting.form.meetingDataFetchFailed'), meetingDetails.message);
    }
}

const scheduleMeetingModel = ref({ meetingId: '', meetingExplain:'', meetingType:'1' })

const createScheduleMeeting = () => {
    if (!selectedMeetings.value) {
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Bir toplantı seçmeniz zorunludur.', life: 3000 });
        return;
    }

    if (scheduleMeetingModel.value.meetingExplain.length < 3) {
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Toplantı açıklaması en az 3 karakter olmalıdır.', life: 3000 });
        return;
    }

    layoutStore.setLoading(true);
    scheduleMeetingModel.value.meetingId = selectedMeetings.value.id;
    bbbSessionStore
        .createCompletedMeeting(scheduleMeetingModel.value)
        .then((response) => {
            if (response.success) {
                toast.add({ severity: 'success', summary: 'Başarılı!', detail: 'Kayıt başarıyla tamamlandı.', life: 3000 });
                completedMeetingStore.getCompletedMeetingByManagerId();
                startMeeting({ id: response.value.id });
            } else {
                toast.add({ severity: 'error', summary: 'Failed to fetch', detail: response.message || 'Could not fetch data', life: 3000 });
            }
            layoutStore.setLoading(false);
        })
        .catch((error) => {
            layoutStore.setLoading(false);
            toast.add({ severity: 'error', summary: 'Failed to fetch', detail: error.message || 'Could not fetch data', life: 3000 });
        });
};

const loginMeetingModel = ref({ completedBBBMeetingId: '', meetingType: '1' })

const loginMeeting = () => {
    layoutStore.setLoading(true);  // Yükleme durumunu aktif et
    bbbSessionStore
      .loginCompletedMeeting(loginMeetingModel.value)
      .then(response => {
        layoutStore.setLoading(false);  // Yükleme durumunu kapat
        if (response.success && response.value.link) {
          // Başarılı giriş ve link varsa
          toast.add({severity: 'success', summary: 'Başarılı!', detail: 'Toplantı başlatıldı, yönlendiriliyorsunuz.', life: 3000});
          window.open(response.value.link, '_blank');  // Linki yeni sekmede aç
          // Diğer gerekli işlemler
        } else {
          // Başarısız giriş durumu
          toast.add({severity: 'error', summary: 'Hata!', detail: 'Toplantı başlatılamadı.', life: 3000});
        }
      })
      .catch(error => {
        layoutStore.setLoading(false);  // Hata durumunda yükleme durumunu kapat
        toast.add({severity: 'error', summary: 'Hata!', detail: 'Başlatma esnasında bir hata oldu', life: 3000});
      });
}



const
  getRowStyle=(row) => {
    if (row.meetingType === 1) {
      return { backgroundColor: '#edf7f3' };
    } else if (row.meetingType === 2) {
      return { backgroundColor: '#e6edf7' };
    } else {
      return null; // Default style for other meeting types
    }
  }

const shouldShowStartButton = (createdTime) => {
    const createdDate = new Date(createdTime);
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000); // Şimdiki zamandan 5 dakika öncesi

    return createdDate > fiveMinutesAgo; // Eğer oluşturulma zamanı şimdiki zamandan 5 dakika öncesinden daha büyükse, true döndür (göster)
};

// #region COPYMEETINGLINK
    const copyMeetingName = () => {
        if (selectedMeeting.value.name) {
            navigator.clipboard.writeText(selectedMeeting.value.guestLink)
                .then(() => {
                    toast.add({ severity: 'success', summary: t('success'), detail: t('completedMeeting.form.linkCopied'), life: 3000 });
                })
                .catch(err => {
                    toast.add({ severity: 'error', summary: t('error'), detail: t('completedMeeting.form.linkCopyFailed'), life: 3000 });
                });
        } else {
            toast.add({ severity: 'error', summary: t('error'), detail: t('completedMeeting.form.linkNotFound'), life: 3000 });
            // Eğer kopyalanacak bir isim yoksa, bu durumu da yönetebilirsiniz.
        }
    };
//#endregion COPYMEETINGLINK

const allMeetings = ref([]); // Tüm verileri saklayacak değişken
const selectedFilter = ref('all'); // Varsayılan olarak "Tümü" seçili
const filterOptions = ref([
    { label: t('completedMeeting.all'), value: 'all' },
    { label: t('completedMeeting.now'), value: 'now' },
    { label: t('completedMeeting.schedule'), value: 'schedule' }
]);

const applyFilter = () => {
    
    if (selectedFilter.value === 'all') {
        completedMeetingStore.completedmeetings.value = [...allMeetings.value];
    } else if (selectedFilter.value === 'now') {
        completedMeetingStore.completedmeetings.value = allMeetings.value.filter(meeting => meeting.scheduleOrNowMeeting === 1);
    } else if (selectedFilter.value === 'schedule') {
        completedMeetingStore.completedmeetings.value = allMeetings.value.filter(meeting => meeting.scheduleOrNowMeeting === 0);
    }


};




</script>



<template>

    <!-- #region ANA TABLO -->
    <div class="card">
        <div class="grid">
            <div class="col-12 lg:col-12">
                <div class="grid formgrid p-fluid">

                </div>
                <DataTable :value="completedMeetingStore.completedmeetings.value" ref="dt" v-model:selection="selectedMeetingForTable" dataKey="id"
                    :paginator="true" :rows="10" :filters="filters" :rowStyle="getRowStyle"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25, 50]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} meetings" filterDisplay="menu"
                    :globalFilterFields="['name', 'specialDescription', 'description']">

                    <!--<Column :expander="true" headerStyle="width: 3rem" />-->
                    <!--<Column selectionMode="multiple" headerStyle="width: 3rem"></Column>-->


                    <template #header>
                        <div class="col-12">
                            <div class="grid p-fluid">
                                <div class="field col-12 md:col-4 flex justify-content-start">
                                <Button type="button" :label="t('completedMeeting.scheduleMeeting')" icon="pi pi-calendar-plus" @click="confirmScheduleMeetingDialog"/>
                                </div>
                                <div class="field col-2 md:col-3 text-center flex justify-content-center">
                                    <Dropdown 
                                        v-model="selectedFilter"
                                        :options="filterOptions" 
                                        optionLabel="label"
                                        optionValue="value" 
                                        @change="applyFilter"
                                    />
                                </div>
                                <div class="field col-12 md:col-5 flex justify-content-end">
                                    <span class="block mt-2 md:mt-0 p-input-icon-left">
                                        <i class="pi pi-search" />
                                        <InputText v-model="filters['global'].value" :placeholder="t('completedMeeting.form.search')" />
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div :style="{
                        height: '4px', 
                        width: '100%', 
                        background: 'linear-gradient(90deg, #ffa500 30%, #0a74da 70%)'
                        }"></div>

                    </template>
                    <Column>
                        <template #body="slotProps">
                        <div class="flex items-center">
                            <Button :label="t('completedMeeting.start')" icon="pi pi-play" class="ml-2" severity="danger" rounded
                            v-show="shouldShowStartButton(slotProps.data.createdTime)" 
                            @click="startMeeting(slotProps.data)">
                            </Button>
                        </div>
                        </template>

                    </Column>

                    <Column field="name" :header="t('completedMeeting.name')" sortable class="line-height-3" :style="{ minWidth: '12rem' }"></Column>
                    <Column field="description" :header="t('completedMeeting.description')" sortable class="line-height-3" ></Column>

                    <Column field="startTime" :header="t('completedMeeting.createdAt')" sortable>
                    <template #body="slotProps">
                        {{ new Date(slotProps.data.createdTime.replace(" ", "T")).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                    </template>
                    </Column>


                    <Column headerStyle="min-width:10rem;">
                        <template #body="slotProps">
                            <Button icon="pi pi-chart-bar" text rounded label="2ME BOARD"
                                @click="dashboardRoute(slotProps.data)" class="custom-color-button mr-2"  />
                            <Button icon="pi pi-trash" text rounded :label="t('Menu.delete')" class="custom-color-button-delete mr-2"
                                @click="confirmDeleteCompletedMeeting(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>
    <!-- #endregion ANA TABLO SONU -->

    <!-- #region DELETE DIALOG -->
    <Dialog v-model:visible="deleteCompletedMeetingDialog" :style="{ width: '450px' }" :header="t('completedMeeting.form.deleteCompletedMeeting')" :modal="true">
        <div class="flex align-items-center justify-content-center">
            <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
            <span>{{ t('completedMeeting.form.confirmDeleteMessage', { name: selectedMeetingForTable.value ? selectedMeetingForTable.value.name : '' }) }}</span>
        </div>
        <template #footer>
            <Button :label="t('no')" icon="pi pi-times" text @click="deleteCompletedMeetingDialog.value = false" />
            <Button :label="t('yes')" icon="pi pi-check" text @click="handleDeleteCompletedMeeting" />
        </template>
    </Dialog>
    <!-- #endregion DELETE DIALOG -->

    <!-- #region SCHEDULE MEETING DIALOG -->
    <Dialog v-model:visible="scheduleMeetingDialog" :closable="true" :modal="true" :style="{ width: '650px' }" :header="t('completedMeeting.scheduleMeeting')">
        <div class="card p-fluid col-12 mb-3">
            <span class="p-float-label md:mb-5 my-2">
                <Dropdown v-model="selectedMeetings" :options="meetingsBySelected" optionLabel="name" />
                <label for="selectedMeetings">{{ t('completedMeeting.form.selectMeeting') }} *</label>
            </span>

            <span class="p-float-label">
                <InputText id="meetingexplain" type="text" v-model="scheduleMeetingModel.meetingExplain" />
                <label for="meetingexplain">{{ t('completedMeeting.form.giveMeetingName') }}</label>
            </span>
        </div>

        <span class="p-float-label">
                <small>{{ t('completedMeeting.scheduleMeetingNote') }}</small>
            </span>

        <template #footer>
            <Button :label="t('completedMeeting.form.createAndJoin')" @click="createScheduleMeeting" />
        </template>
    </Dialog>
    <!-- #endregion SCHEDULE MEETING DIALOG -->

    <!-- #region START MEETING DIALOG -->
    <Dialog v-model:visible="startMeetingDialog" :closable="true" :modal="true" :style="{ width: '650px' }" class="p-fluid col-12 md:col-6" :header="t('completedMeeting.startMeeting')">
        <div class="card p-fluid col-12 mb-3">
            <ul>
                <li><strong>{{ t('completedMeeting.name') }}:</strong> {{ selectedMeeting.name }}</li>
                <li><strong>{{ t('completedMeeting.description') }}:</strong> {{ selectedMeeting.description }}</li>
            </ul>
        </div>

        <Button :label="t('completedMeeting.form.copyLink')" v-if="selectedMeeting.guestLink" outlined severity="outlined" @click="copyMeetingName" />
        <h6>{{ t('completedMeeting.form.shareLinkInfo') }}</h6>
        
        <template #footer>
            <Button :label="t('completedMeeting.form.startAndJoin')" @click="loginMeeting" />
        </template>
    </Dialog>
    <!-- #endregion START MEETING DIALOG -->
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
</style>