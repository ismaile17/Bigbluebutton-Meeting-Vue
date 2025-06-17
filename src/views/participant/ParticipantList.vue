<script setup>
import { onMounted, ref, watch, defineEmits } from 'vue';
import { FilterMatchMode, FilterOperator } from 'primevue/api';
import { useLayout } from '@/layout/composables/layout';
import { useToast } from 'primevue/usetoast'
import { useLayoutStore } from '@/stores/layout';
import { useParticipantStore } from '@/stores/participant';
import { useRouter } from 'vue-router';
import { useUserCalendarAndReport } from '@/stores/usercalendarandreport'


import {useI18n} from "vue-i18n";
const {t,te} = useI18n();

const userCalenderAndReportStore = useUserCalendarAndReport();
const toast = useToast()

const router = useRouter();
const layoutStore = useLayoutStore();
const emit = defineEmits(['checkbox:change', 'delete:task', 'open:edit:dialog']);
const { layoutConfig } = useLayout();
const participantStore = useParticipantStore();

const processedParticipants = ref([]); // İşlenmiş katılımcı verilerini saklamak için bir ref
const showGroupsDialog = ref(false);
const selectedGroups = ref([]);
const loading = ref(false);

onMounted(async () => {
  layoutStore.setLoading(true);
  loading.value = false;
  await participantStore.getAllParticipantByManager();

  // API'den gelen veriyi istenilen formata dönüştürme
  processedParticipants.value = participantStore.participants.value.flatMap(participant => 
  participant.managerParticipants.map(managerParticipant => ({
    id: managerParticipant.participantId,
    nameSurname: managerParticipant.nameSurname,
    email: participant.email.replace('_participant', ''), // Emaildeki '_participant' kısmını kaldırma
    specialDescription: managerParticipant.specialDescription,
    isActive: managerParticipant.isActive,
    expiryDate: managerParticipant.expiryDateIsActive ? managerParticipant.expiryDate : '∞',
    meetingGroups: participant.meetingGroups // Burada grup verilerinin doğru şekilde atanmasını sağlıyoruz
  }))
);

  layoutStore.setLoading(false);
  loading.value = false;
});


const addParticipantButton = async () => {
  try {
    // Start loading indicator
    layoutStore.setLoading(true);

    // Fetch the maximum limit data
    const responseMaxLimit = await userCalenderAndReportStore.GetMaxLimitByUserId();

    // Check if the maximum group limit has been reached
    if (responseMaxLimit.value.maxParticipant === 0 || responseMaxLimit.value.totalDay === 0) {
        toast.add({ severity: 'error', summary: t('error'), detail: "Max Limit", life: 3000 })
      return;
    }

    // Navigate to the add group page
    await router.push("/participant/new");
  } catch (error) {
    // Log any errors that occur during the process
    console.error("An error occurred while adding a group:", error);
  } finally {
    // Stop loading indicator regardless of success or failure
    layoutStore.setLoading(false);
  }
};

watch(layoutConfig.colorScheme, () => {
  // setChartData();
});

watch(
  layoutConfig.colorScheme,
  () => {
    // setChartData();
  },
  { immediate: true }
);
watch(
  layoutConfig.theme,
  () => {
    // setChartData();
  },
  { immediate: true }
);

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const dt = ref();

const editParticipant = (rowData) => {
  router.push({ name: 'edit-participant', params: { id: rowData.id } });
};

function formatDate(dateString) {
  if (dateString === '∞') return '∞';
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('tr-TR', options);
}

function getExpiryClass(expiryDate) {
  if (expiryDate === '∞') return 'expiry-infinity';
  const date = new Date(expiryDate);
  const now = new Date();
  const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
  const oneWeekLater = new Date(now.setDate(now.getDate() + 7));

  if (date < oneWeekAgo) return 'expiry-past';
  if (date <= oneWeekLater) return 'expiry-soon';
  return 'expiry-future';
}

</script>

<template>
  <div class="card">
    <DataTable :value="processedParticipants" dataKey="id" :paginator="true" :rows="10" :filters="filters" :loading="loading" :sortField="'id'"
                        :sortOrder="-1">
      <template #header>
        <div class="col-12">
          <div class="grid p-fluid">
            <div class="col-12 md:col-6">
              <Button
                  icon="pi pi-plus-circle"
                  :label="t('participant.form.newParticipant')"
                  class="w-full sm:w-auto"
                  @click="addParticipantButton"
              ></Button>

            </div>
            <div class="col-12 md:col-6">
              <span class="block mt-2 md:mt-0 p-input-icon-left w-full">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" :placeholder="$t('participant.form.search')" />
              </span>
            </div>
          </div>
        </div>
        <!-- <div :style="{ height: '4px', background: 'linear-gradient(90deg, #ffa500 0%, rgba(76, 175, 80, 0) 90%)' }"></div> -->
        <div :style="{
                      height: '4px', 
                      width: '100%', 
                      background: 'linear-gradient(90deg, #ffa500 30%, #0a74da 70%)'
                      }"></div>

      </template>

      <Column field="nameSurname" :header="$t('participant.list.participantName')" sortable>
        <template #body="slotProps">
          {{ slotProps.data.nameSurname }}
        </template>
      </Column>

      <Column field="email" header="Email" sortable>
        <template #body="slotProps">
          {{ slotProps.data.email }}
        </template>
      </Column>

      <Column field="specialDescription" :header="$t('participant.list.specialDescription')" sortable>
        <template #body="slotProps">
          {{ slotProps.data.specialDescription }}
        </template>
      </Column>

      <Column field="isActive" :header="$t('participant.list.status')" sortable>
        <template #body="slotProps">
          <span class="status-indicator" :class="{ 'active': slotProps.data.isActive, 'inactive': !slotProps.data.isActive }"></span>
        </template>
      </Column>

      <Column field="expiryDate" :header="$t('participant.list.expriyDate')" sortable>
        <template #body="slotProps">
          <span :class="getExpiryClass(slotProps.data.expiryDate)">{{ formatDate(slotProps.data.expiryDate) }}</span>
        </template>
      </Column>

      <!-- Düzenleme butonu -->
      <Column>
        <template #body="rowData">
          <Button icon="pi pi-pencil" class="custom-color-button" text rounded :label="t('Menu.edit')" @click="editParticipant(rowData.data)" />
        </template>
      </Column>
    </DataTable>
  </div>

  <!-- Grup Detayları Dialog -->
  <Dialog v-model:visible="showGroupsDialog" :header="$t('participant.list.groupDetail')">
    <ul>
      <li v-for="group in selectedGroups" :key="group.id">{{ group.name }}</li>
    </ul>
    <template #footer>
      <Button :label="$t('participant.list.close')" icon="pi pi-times" @click="showGroupsDialog = false" />
    </template>
  </Dialog>
</template>

<style>
.status-indicator {
  height: 15px;
  width: 15px;
  border-radius: 50%;
  display: inline-block;
}

.active {
  background-color: green;
  
}

.inactive {
  background-color: red;
}

.expiry-past {
  color: red;
  font-weight: bold;
  font-size: 1.2em; /* Metin boyutu */
}

.expiry-soon {
  color: rgb(219, 135, 86);
  font-weight: bold;
  font-size: 1.2em; /* Metin boyutu */
}

.expiry-future {
  color: green;
  font-weight: bold;
  font-size: 1em; /* Metin boyutu */
}

.expiry-infinity {
  color: blue;
  font-weight: bold;
  font-size: 1.8em; /* Metin boyutu */
}

.custom-color-button {
    color: #0a74da; /* Buton yazı rengi */
}

.custom-color-button:hover {
    background-color: #ffa500; /* Mouse üzerine gelindiğinde koyulaşan renk */
    color: white; /* Buton yazı rengi */
}
</style>
