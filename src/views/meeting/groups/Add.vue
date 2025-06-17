<script setup>
import { onMounted, ref, watch, computed } from 'vue'
import { useLayout } from '@/layout/composables/layout'
import { useLayoutStore } from '@/stores/layout'
import { useMeetingStore } from '@/stores/meeting'
import { useParticipantStore } from '@/stores/participant'
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { useUserCalendarAndReport } from '@/stores/usercalendarandreport'

import {useI18n} from "vue-i18n";
const {t,te} = useI18n();

const router = useRouter();
const toast = useToast();
const userCalenderAndReportStore = useUserCalendarAndReport();



const layoutStore = useLayoutStore()
const emit = defineEmits(['checkbox:change', 'delete:task', 'open:edit:dialog'])
const { layoutConfig } = useLayout()
const meetingStore = useMeetingStore()

const participantStore = useParticipantStore()

const productDialog = ref(false);


const selectedParticipants = ref([]);
const addedParticipants = ref([]);
const addedParticipantIds = ref([]);
const flattenedParticipants = ref([]);


const filtersMain = ref({ global: { value: null } })
const filtersDialog = ref({ global: { value: null } })

onMounted(() => {
  meetingStore.groups.value;
});

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



const groupModel = ref({ id: '', name: '', description:'',specialDescription:'',meetingGroupUserLists:[] })


const addGroup = async () => {
  layoutStore.setLoading(true);

  if (!validateForm()) {
        layoutStore.setLoading(false);
        return;
    }

          // Fetch the maximum limit data
          const responseMaxLimit = await userCalenderAndReportStore.GetMaxLimitByUserId();

          // Check if the maximum group limit has been reached
          if (responseMaxLimit.value.maxGroup === 0 || responseMaxLimit.value.totalDay === 0) {
              toast.add({ severity: 'error', summary: t('error'), detail: "Max Limit", life: 3000 })
              layoutStore.setLoading(false);
          return;
          }

  // groupModel'deki meetingGroupUserLists'i eklemeden önce kontrol et
  groupModel.value.meetingGroupUserLists = addedParticipantIds.value; // Sadece ID'leri içeren bir dizi olarak ayarla


  meetingStore.addGroup(groupModel.value)
    .then((response) => {
      if (response.success) {
        toast.add({severity:'success', summary: t('success'), detail: t('group.form.registerSuccess'), life: 3000});
        
        // Listeyi güncelle ve yönlendirme yap
        getAllGroup().then(() => {
          layoutStore.setLoading(false);
          router.push('/meeting/group/list');
        }).catch((error) => {
          layoutStore.setLoading(false);
          toast.add({severity:'error', summary: t('error'), detail: t('group.form.fetchError'), life: 3000});
          console.error(error);
        });
      } else {
        layoutStore.setLoading(false);
        toast.add({severity:'error', summary: t('error'), detail: t('group.form.registerError'), life: 3000});
      }
    })
    .catch((error) => {
      layoutStore.setLoading(false);
      toast.add({severity:'error', summary: t('error'), detail: t('group.form.registerError'), life: 3000});
    });
}

const getAllGroup = () => {
  return meetingStore.getGroupByUserId();
}





const openNew = () => {
  layoutStore.setLoading(true);
  productDialog.value = true;

  // Mevcut seçili katılımcıların ID'lerini al
  const currentSelectedIds = selectedParticipants.value.map(p => p.id);

  participantStore.getAllParticipantByManager()
    .then(() => {
      // Katılımcıları düzleştirme işlemi, burada API'den gelen veri yapısına bağlı olarak değişiklik gösterebilir
      flattenedParticipants.value = participantStore.participants.value.flatMap(participant => 
        participant.managerParticipants.map(managerParticipant => ({
          ...managerParticipant,
          id: managerParticipant.participantId,
          email: participant.email.replace(/_participant$/, ''), // Doğru email adresini al
          selected: currentSelectedIds.includes(managerParticipant.participantId),
        }))
      );

      // Daha önce seçilmiş katılımcıları, yeni açılan diyalogda işaretli olarak ayarla
      selectedParticipants.value = flattenedParticipants.value.filter(participant => participant.selected);

      layoutStore.setLoading(false);
    })
    .catch(error => {
      console.error("Veri çekme sırasında bir hata oluştu:", error);
      layoutStore.setLoading(false);
    });
};





function saveSelectedParticipants() {
  addedParticipants.value = [...selectedParticipants.value];
  addedParticipantIds.value = selectedParticipants.value.map(p => p.id); // Sadece ID değerleri olmalı
  productDialog.value = false;
  toast.add({ severity: 'success', summary: t('success'), detail: t('group.form.participantsUpdated'), life: 3000 });
}




function removeParticipant(participantId) {
  selectedParticipants.value = selectedParticipants.value.filter(p => p.id !== participantId);
  addedParticipants.value = addedParticipants.value.filter(p => p.id !== participantId);
  addedParticipantIds.value = addedParticipantIds.value.filter(id => id !== participantId); // `id` değişkenini kullanarak kaldırma işlemi

  toast.add({ severity: 'success', summary: t('group.form.removeParticipant'), detail: t('group.form.participantRemoved'), life: 3000 });
}




function closeDialog() {
  // Dialog'u kapat
  productDialog.value = false;

  // selectedParticipants'ı önceki duruma (addedParticipants ile aynı olacak şekilde) geri yükle
  selectedParticipants.value = [...addedParticipants.value];
}


const dialogWidth = computed(() => {
  // Ekran genişliğine göre dialog genişliğini ayarla
  const screenWidth = window.innerWidth;
  return screenWidth <= 768 ? '40%' : '90%'; // 768px altı için mobil varsayıyoruz
});


const submitted = ref(false);
const validateForm = () => {
    submitted.value = true;
    return groupModel.value.name.trim() !== '';
};




</script>

<template>
  <div class="flex justify-content-between mb-3">
            <Button :label="$t('Menu.back')" icon="pi pi-arrow-left" @click="router.go(-1)" rounded />
            <Button :label="$t('group.form.save')" icon="pi pi-save" @click="addGroup" rounded />
    </div>
    <div :style="{ height: '4px', background: 'linear-gradient(90deg, #ffa500 0%, rgba(33, 150, 243, 0) 90%)' }"></div>
    <h1></h1>
  <div>
    <div class="grid">
      <div class="col-12 lg:col-12">
        <div class="grid formgrid p-fluid">
          <div class="card col-12">
            <div class="field mb-12 col-12">
              <label for="nickname" class="font-medium text-900">{{ $t('group.form.groupName') }}</label>
              <InputText id="name" required="true" autofocus v-model="groupModel.name" 
              :class="{ 'p-invalid': submitted && groupModel.name.trim() === '' }"
              />
              <div class="grid formgrid">
                <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                  <h5></h5>
                  <label for="description" class="font-medium text-900">{{ $t('group.form.description') }}</label>
                  <Textarea id="description" :autoResize="true" rows="5" cols="5" class="mr-4" autofocus v-model="groupModel.description"/>
                </div>
                <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                  <h5></h5>
                  <label for="specialDescription" class="font-medium text-900">{{ $t('group.form.specialDescription') }}</label>
                  <Textarea id="specialDescription" :autoResize="true" rows="5" cols="5" class="mr-4" autofocus v-model="groupModel.specialDescription"/>
                </div>
              </div>
            </div>
          </div>
        </div>
        <h5></h5>

        <TabView>
            <TabPanel header="Katılımcılar">

              <Toolbar>
                <template v-slot:start>
                  <Button
                    :label="t('group.form.addParticipant')"
                    icon="pi pi-user-plus"
                    class="mr-1"
                    severity="success"
                    @click="openNew"
                    rounded
                  ></Button>
                </template>
                <template v-slot:end>
                  <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                    <h5 class="m-0"></h5>
                    <span class="block mt-2 md:mt-0 p-input-icon-left">
                      <i class="pi pi-search" />
                      <InputText class="w-full sm:w-auto" v-model="filtersMain['global'].value" :placeholder="$t('group.form.search')" />
                    </span>
                  </div>
                </template>
              </Toolbar>

              <DataTable :value="addedParticipants" selectionMode="single" :paginator="true" :rows="10">
                <Column field="nameSurname" :header="$t('group.form.name')" />
                <Column field="email" :header="$t('group.form.email')" />
                <Column field="specialDescription" :header="$t('group.form.specialDescriptionHeader')" />
                <Column>
                  <template #body="slotProps">
                    <Button icon="pi pi-times" severity="danger" text rounded @click="() => removeParticipant(slotProps.data.participantId)" class="p-button-rounded p-button-danger" />
                  </template>
                </Column>
              </DataTable>

            </TabPanel>

            <TabPanel header="Dosyalar">    
              <h3>{{ $t('group.form.fileMessage') }}</h3>
          </TabPanel>

          <TabPanel header="Görevler">    
              <h3>{{ $t('group.form.fileMessage') }}</h3>
          </TabPanel>

        </TabView>
      </div>
    </div>
  </div>

  <Dialog v-model:visible="productDialog" :closable="false" :modal="true" class="p-fluid">
    <Toolbar class="mb-4">
      <template v-slot:start>
        <div class="my-2">
          <h5 class="m-0">{{ $t('group.form.participants') }}</h5>
        </div>
      </template>
      <template v-slot:end>
        <Button outlined type="button" severity="danger" icon="pi pi-times" @click="closeDialog" />
      </template>
    </Toolbar>

    <DataTable v-model:selection="selectedParticipants" :value="flattenedParticipants" selectionMode="multiple"
      :paginator="true" :rows="10" :filters="filtersDialog"
      :metaKeySelection="false"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[5, 10, 25]"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords} groups" filterDisplay="menu"
      :globalFilterFields="['nameSurname', 'specialDescription', 'email']">
      <template #header>
        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
          <h5 class="m-0"></h5>
          <span class="block mt-2 md:mt-0 p-input-icon-left">
            <i class="pi pi-search" />
            <InputText class="w-full sm:w-auto" v-model="filtersDialog['global'].value" :placeholder="$t('group.form.search')" />
          </span>
        </div>
      </template>
      <Column selectionMode="multiple" style="width:3em"></Column>
      <Column field="nameSurname" :header="$t('group.form.name')" sortable />
      <Column field="email" :header="$t('group.form.email')" sortable/>
      <Column field="specialDescription" :header="$t('group.form.specialDescriptionHeader')" sortable/>
    </DataTable>
    <template #footer>
      <Button :label="$t('group.form.save')" @click="saveSelectedParticipants" />
    </template>
  </Dialog>
</template>

<style>
.p-invalid input {
  border: 1px solid red !important;
}
</style>