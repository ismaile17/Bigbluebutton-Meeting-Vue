<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useMeetingStore } from '@/stores/meeting';
import { useParticipantStore } from '@/stores/participant';
import { useLayoutStore } from '@/stores/layout';
import { FilterMatchMode } from 'primevue/api';
import Password from 'primevue/password';

import {useI18n} from "vue-i18n";

const {t,te} = useI18n();

const router = useRouter();
const route = useRoute();
const toast = useToast();
const layoutStore = useLayoutStore();
const meetingStore = useMeetingStore();
const participantStore = useParticipantStore();

const expiryDateActive = ref(false);
const today = new Date();
const minDate = today.toISOString().split('T')[0]; // YYYY-MM-DD formatında bugünün tarihi

const participantModel = ref({
  id: '',
  nameSurname: '',
  email: '',
  phoneNumber: '',
  specialDescription: '',
  expiryDate: null,
  isActive: false,
  expiryDateIsActive: false,
  participantMeetingGroups: [],
  passwordEdit: ''
});

const selectedParticipantGroups = ref([]);

onMounted(async () => {
  layoutStore.setLoading(true);
  await meetingStore.getSelectedGroupByUserId();
  const id = route.params.id;
  if (id) {
    const response = await participantStore.getParticipantByParticipantId(id);
    if (response.success) {
      const managerParticipant = response.value.managerParticipants[0];
      participantModel.value = {
        id: response.value.id,
        nameSurname: managerParticipant.nameSurname || '',
        email: response.value.email.replace('_participant', ''),
        specialDescription: managerParticipant.specialDescription || '',
        phoneNumber: managerParticipant.phoneNumber || '',
        expiryDate: managerParticipant.expiryDate 
          ? new Date(managerParticipant.expiryDate).toISOString().split('T')[0] 
          : null,
        expiryDateIsActive: managerParticipant.expiryDateIsActive || false,
        isActive: true,
        participantMeetingGroups: response.value.meetingGroups.map(group => group.id),
      };
      selectedParticipantGroups.value = response.value.meetingGroups.map(group => group);
    } else {
      toast.add({ severity: 'error', summary: 'Failed to fetch', detail: t('participant.form.fetchError'), life: 3000 });
    }
  }
  layoutStore.setLoading(false);
});


const saveEditParticipant = async () => {
  layoutStore.setLoading(true);

  if (!validateForm()) {
        layoutStore.setLoading(false);
        return;
    }

  participantModel.value.participantMeetingGroups = selectedParticipantGroups.value.length > 0 
      ? selectedParticipantGroups.value.map(group => group.id)
      : [];

  if (!participantModel.value.expiryDateIsActive) {
    participantModel.value.expiryDate = null;
  } else if (participantModel.value.expiryDate) {
    // Tarihi ISO formatına dönüştür
    participantModel.value.expiryDate = new Date(participantModel.value.expiryDate).toISOString();
  }

  try {
    // Şifre alanını sadece doluysa ekliyoruz
    const payload = { ...participantModel.value };
    if (!payload.passwordEdit) {
      delete payload.passwordEdit;
    } else {
      // Şifre uzunluğu kontrolü
      if (payload.passwordEdit.length < 6) {
        toast.add({ severity: 'error', summary: t('error'), detail: t('participant.form.passwordMinLength'), life: 3000 });
        layoutStore.setLoading(false);
        return;
      }

      // Şifrede boşluk karakteri kontrolü
      if (/\s/.test(payload.passwordEdit)) {
        toast.add({ severity: 'error', summary: t('error'), detail: t('participant.form.passwordNoSpaces'), life: 3000 });
        layoutStore.setLoading(false);
        return;
      }
    }

    const response = await participantStore.editParticipant(payload);
    layoutStore.setLoading(false);
    if (response.success) {
      toast.add({ severity: 'success', summary: t('success'), detail: t('participant.form.updateSuccess'), life: 3000 });
      router.push('/participant/list');
    } else {
      toast.add({ severity: 'error', summary: t('error'), detail: response.message || t('participant.form.fetchError'), life: 3000 });
    }
  } catch (error) {
    layoutStore.setLoading(false);
    toast.add({ severity: 'error', summary: t('error'), detail: error.message || t('participant.form.fetchError'), life: 3000 });
  }
};


const uniqueId = Math.random().toString(36).substr(2, 9)
const passwordField = ref(null)
// Fonksiyon: Boşluk karakterini engelle
const preventSpace = (event) => {
  if (event.key === ' ') {
    event.preventDefault();
  }
};

// Fonksiyon: Yapıştırma sırasında boşluk karakteri engelle
const handlePaste = (event) => {
  const paste = (event.clipboardData || window.clipboardData).getData('text');
  if (/\s/.test(paste)) {
    event.preventDefault();
    toast.add({ severity: 'error', summary: t('error'), detail: t('participant.form.passwordNoSpaces'), life: 3000 });
  }
};

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const submitted = ref(false);
const validateForm = () => {
    submitted.value = true;
    return participantModel.value.nameSurname.trim() !== '' &&
           participantModel.value.email.trim() !== '';
};

</script>

<template>
  <div class="col-12">
    <div class="flex justify-content-between mb-3">
      <Button :label="$t('Menu.back')" icon="pi pi-arrow-left" @click="router.go(-1)" rounded />
      <Button :label="$t('participant.form.save')" icon="pi pi-save" @click="saveEditParticipant" rounded />
    </div>

    <div :style="{ height: '4px', background: 'linear-gradient(90deg, #ffa500 0%, rgba(33, 150, 243, 0) 90%)' }" class="mb-4"></div>

    <div class="card">
      <h5>{{ $t('participant.form.editParticipant') }}</h5>
      <div class="grid">
        <div class="col-12 lg:col-5">
          <div class="col-24 md:col-12">
            <span class="p-float-label">
              <span class="text-900 text-1xl block font-medium mb-2">{{ $t('participant.form.nameSurname') }}</span>
              <InputText id="nameSurname" type="text" v-model="participantModel.nameSurname" class="p-inputtext w-full mb-4"
              :class="{ 'p-invalid': submitted && participantModel.nameSurname.trim() === '' }"
              />
            </span>
            <span class="p-float-label">
              <span class="text-900 text-1xl block font-medium mb-2">{{ $t('participant.form.emailAddress') }}</span>
              <InputText id="email" type="text" v-model="participantModel.email" class="p-inputtext w-full mb-4" :disabled="true"
              :class="{ 'p-invalid': submitted && participantModel.email.trim() === '' }"
              />
            </span>
            <div class="p-field p-float-label">
              <span class="text-900 text-1xl block font-medium mb-2">{{ $t('participant.form.phoneNumber') }}</span>
              <InputMask id="phonenumber" mask="0 (999) 999 99 99" slotChar=" "  v-model="participantModel.phoneNumber" class="p-inputtext w-full mb-4"></InputMask>
            </div>
            <span class="text-900 text-1xl block font-medium mb-2">{{ $t('participant.form.specialDescription') }}</span>
            <Textarea :autoResize="true" class="p-inputtext w-full mb-4" v-model="participantModel.specialDescription" />

            <div class="col-12 field mb-2">
              <hr class="my-1">
            </div>

              <!-- Şifre Alanı -->
              <!-- Gizli dummy input alanları -->
              <input type="text" name="dummy-username" id="dummy-username" style="display:none;" autocomplete="off" />
              <input type="password" name="dummy-password" id="dummy-password" style="display:none;" autocomplete="new-password" />

              <div class="flex flex-column md:flex-row align-items-center justify-content-start">
                <span class="text-900 text-1xl font-medium mr-2">{{ $t('participant.form.passwordText') }}</span>
                <Password 
                  v-model="participantModel.passwordEdit"
                  toggleMask
                  :feedback="false"
                  autocomplete="new-password"
                  :name="'neww-password-' + uniqueId"
                  :id="'neww-password-' + uniqueId"
                  ref="passwordField"
                  class="p-password-sm"
                  @keydown="preventSpace"
                  @paste="handlePaste"
                />
                <small class="ml-3">{{ $t('participant.form.passwordInfo') }}</small>
              </div>

            <div class="col-12 field mb-2">
              <hr class="my-1">
            </div>

            <div class="flex flex-column md:flex-row align-items-center justify-content-start">
              <div class="flex align-items-center justify-content-start mb-2 md:mb-0">
                <span class="text-900 text-1xl font-medium mr-2">{{ $t('participant.form.expiryDateActive') }}</span>
                <InputSwitch v-model="participantModel.expiryDateIsActive" class="mr-3" />
              </div>
              
              <div v-if="participantModel.expiryDateIsActive" class="ml-2">
                <div class="flex align-items-center">
                  <!-- <Calendar v-model="participantModel.expiryDate" :minDate="minDate" :showIcon="true" :showButtonBar="true" dateFormat="dd/mm/yy" /> -->
                   <input id="expiryDate" type="date" class="p-inputtext w-full mb-4" v-model="participantModel.expiryDate" :min="minDate"/>
                </div>
                <small>{{ $t('participant.form.expiryDateNote') }}</small>
              </div>
            </div>

            <div class="col-12 field mb-2">
              <hr class="my-3">
            </div>

            <div class="flex flex-column md:flex-row align-items-center justify-content-start">
              <div class="flex align-items-center justify-content-start mb-2 md:mb-0">
                <span class="text-900 text-1xl font-medium mr-2">{{ $t('participant.form.participantActive') }}</span>
                <InputSwitch v-model="participantModel.isActive" class="mr-3" />
              </div>
              <div v-if="!participantModel.isActive" class="ml-2">
                <div class="flex align-items-center">
                  <small>{{ $t('participant.form.participantInactiveNote') }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 lg:col-2">
          <Divider layout="vertical"><b>AND</b></Divider>
        </div>


          <div class="col-12 lg:col-5">
            <div class="col-45 align-items-center justify-content-center" style="width: 100%;">
              <DataTable
                        :value="meetingStore.selectedgroup.value"
                        ref="dt"
                        v-model:selection="selectedParticipantGroups"
                        dataKey="id"
                        :sortField="'id'"
                        :sortOrder="-1"
                        :paginator="true"
                        :rows="7"
                        :filters="filters"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        :globalFilterFields="['name']"
                        class="custom-datatable"
                    >
                        <template #header>
                            <div class="flex justify-content-end flex-column sm:flex-row">
                                <span class="p-input-icon-left mb-2">
                                    <i class="pi pi-search" />
                                    <InputText v-model="filters['global'].value" :placeholder="$t('participant.form.search')" />
                                </span>

                            </div>
                        </template>
                        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                        <Column field="name" :header="$t('participant.form.selectParticipantGroups')" sortable></Column>
                    </DataTable>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style>
/* DataTable için daha şık bir görünüm sağlamak amacıyla */
.custom-datatable {
    background-color: #ffffff; /* Arka planı beyaz yap */
    border-radius: 10px; /* Kenarları yuvarlat */
    box-shadow: 0 10px 14px rgba(0, 0, 0, 0.1); /* Hafif bir gölge ekleyerek şıklık kat */
    border: none; /* Varsayılan kenarlığı kaldır */
}

.p-invalid input {
  border: 1px solid red !important;
}

</style>

