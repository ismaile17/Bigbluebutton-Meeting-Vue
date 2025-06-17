<!-- src/components/LayoutTopbar.vue -->
<script setup>
import AppBreadcrumb from './AppBreadcrumb.vue'
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useLayout } from '@/layout/composables/layout'
import { useAuthStore } from '@/stores/auth'
import { useLayoutStore } from '@/stores/layout'
import { useCompletedMeetingStore } from '@/stores/completedmeeting'
import { useMeetingStore } from '@/stores/meeting'
import { useToast } from 'primevue/usetoast';
import { useBbbSessionStore } from '@/stores/bbbsession'

import { useI18n } from "vue-i18n";
const { t } = useI18n();

// PrimeVue Toast
const toast = useToast();

// Store'lar
const meetingStore = useMeetingStore();
const completedMeetingStore = useCompletedMeetingStore();
const bbbSessionStore = useBbbSessionStore();
const layoutStore = useLayoutStore();
const authStore = useAuthStore();

// Layout Composables
const { onMenuToggle, onProfileSidebarToggle, onConfigSidebarToggle } = useLayout();

// Reaktif Referanslar
const outsideClickListener = ref(null);
const topbarMenuActive = ref(false);

// Kullanıcı bilgilerini yerel depolamadan al
const user = JSON.parse(localStorage.getItem('user'));
const userRoles = user?.roles?.map(role => role.name) || [];

// Rol kontrol fonksiyonu (çoklu rol desteği)
const hasRole = (...roleNames) => {
    return roleNames.some(roleName => userRoles.includes(roleName));
};

// Computed property'ler
const isParticipant = computed(() => hasRole('Participant'));
const isAdminOrManager = computed(() => hasRole('Admin', 'Manager'));

// Kullanıcıya uygun rota belirleme
const userRoute = computed(() => {
  if (isAdminOrManager.value) {
    return { name: 'homepage' }; // Admin veya Manager için rota
  } else if (isParticipant.value) {
    return { name: 'participant-homepage' }; // Participant için rota
  } else {
    return { name: 'errors' }; // Diğer kullanıcılar için varsayılan rota
  }
});

// On Mounted Hook
onMounted(() => {
  bindOutsideClickListener();
  
  if (isParticipant.value) {
    onMenuToggle(true);
  }
});


// On Before Unmount Hook
onBeforeUnmount(() => {
  unbindOutsideClickListener();
});

// Dışarıya Tıklama Listener'ını Bağlama
const bindOutsideClickListener = () => {
  if (!outsideClickListener.value) {
    outsideClickListener.value = (event) => {
      if (isOutsideClicked(event)) {
        topbarMenuActive.value = false;
      }
    }
    document.addEventListener('click', outsideClickListener.value);
  }
};

// Dışarıya Tıklama Listener'ını Kaldırma
const unbindOutsideClickListener = () => {
  if (outsideClickListener.value) {
    document.removeEventListener('click', outsideClickListener.value);
    outsideClickListener.value = null;
  }
};

// Dışarıya Tıklanıp Tıklanmadığını Kontrol Etme
const isOutsideClicked = (event) => {
  if (!topbarMenuActive.value) return false;

  const sidebarEl = document.querySelector('.layout-topbar-menu');
  const topbarEl = document.querySelector('.layout-topbar-menu-button');

  return !(
    sidebarEl?.isSameNode(event.target) ||
    sidebarEl?.contains(event.target) ||
    topbarEl?.isSameNode(event.target) ||
    topbarEl?.contains(event.target)
  );
};

// Profile Sidebar'ı Gösterme Fonksiyonu
const showProfileSidebar = () => {
  onProfileSidebarToggle();
};

// Config Sidebar'ı Gösterme Fonksiyonu
const onConfigButtonClick = () => {
  onConfigSidebarToggle();
};

// Dil Ayarlama Fonksiyonu
const setLanguage = (lang) => {
  localStorage.setItem("language", lang.value.key);
  window.location.reload();
};

// Dil Seçenekleri
const language = ref();    
const languages = ref([
  { key: 'tr-TR', value: 'Türkçe' },
  { key: 'en-US', value: 'English' }
]);  
language.value = languages.value.find(x => x.key === localStorage.getItem("language")) || languages.value[0];

//----------------------------------------------------------------------------------------

// Dialog Referansları ve Modelleri
const startMeetingDialog = ref(false);
const nowMeetingDialog = ref(false);
const nowMeetingModel = ref({ id: '', name: '', description:'', meetingGroupIds:[], meetingGuestEmailList:[] });
const groupsBySelected = ref([]);  // Grupları saklamak için reaktif bir referans
const selectedMeeting = ref({ id: null, name: '', description: '', guestLink: '', completedGuid: '' });

// Confirm Now Meeting Fonksiyonu
const confirmNowMeeting = async () => { 
    nowMeetingDialog.value = true; // Dialog penceresini görünür yap
    await meetingStore.getSelectedGroupByUserId(); // API çağrısını tamamlamasını bekle
    groupsBySelected.value = [...meetingStore.selectedgroup.value];
}

// Save Now Meeting Fonksiyonu
const saveNowMeeting = async () => {
    // Toplantı adının uzunluğunu kontrol et
    if (!nowMeetingModel.value.name || nowMeetingModel.value.name.length < 2) {
      toast.add({ severity: 'error', summary: t('error'), detail: t('completedMeeting.form.meetingNameLength'), life: 3000 });
      return; // Toplantı adı geçersizse, işlemi durdur
    }

    layoutStore.setLoading(true);  // Yükleme durumunu aktif et

    nowMeetingModel.value.meetingGroupIds = Array.isArray(multiselectValue.value) ? multiselectValue.value.map(group => group.id) : [];
    nowMeetingModel.value.meetingGuestEmailList = emails.value ? emails.value : []; // E-posta listesini al

    try {
        const response = await bbbSessionStore.createNowMeeting(nowMeetingModel.value);
        if (response.success && response.success) {
            toast.add({ severity: 'success', summary: t('success'), detail: t('completedMeeting.form.meetingCreated'), life: 3000 });
            nowMeetingDialog.value = false; // Dialog penceresini kapat
            completedMeetingStore.getCompletedMeetingByManagerId();
            startMeeting({ id: response.value.id });
        } else {
            toast.add({ severity: 'error', summary: 'error', detail: t('completedMeeting.form.meetingCreateFailed'), life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'error', detail: t('completedMeeting.form.meetingCreateFailed'), life: 3000 });
    }
    layoutStore.setLoading(false);  // Yükleme durumunu kapat
};

// Start Meeting Fonksiyonu
const startMeeting = async (data) => {
    layoutStore.setLoading(true);  // Yükleme durumunu aktif et
    if (!data || data.id === undefined) {
        console.error(t('completedMeeting.form.noMeetingId'));
        return;  // ID yoksa fonksiyonu sonlandırın
    } else {
        layoutStore.setLoading(false);  // Yükleme durumunu pasif et
    }

    const meetingDetails = await completedMeetingStore.getCompletedMeetingByMeetingId(data.id);
    if (meetingDetails && meetingDetails.success) {
        selectedMeeting.value = meetingDetails.value;
        loginMeetingModel.value.CompletedMeetingGuid = selectedMeeting.value.completedGuid;
        startMeetingDialog.value = true;
    } else {
        console.error(t('completedMeeting.form.meetingDataFetchFailed'), meetingDetails.message);
    }
}

const multiselectValue = ref(null);

// Tag Kaldırma Fonksiyonu
const onRemoveTags = (tag) => {
    emails.value = emails.value.filter(t => t !== tag);
}

// E-posta Listesi ve Yeni E-posta
const emails = ref([]);
const newEmail = ref('');

// E-posta Ekleme Fonksiyonu
const addEmail = () => {
  if (isValidEmail(newEmail.value)) {
    emails.value.push(newEmail.value.trim());
    newEmail.value = ''; // TextBox'ı temizle
  }
};

// E-posta Doğrulama Fonksiyonu
const isValidEmail = (email) => {
  // Basit bir e-posta doğrulama kontrolü
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// #region COPYMEETINGLINK
const copyMeetingName = () => {
    if (selectedMeeting.value.name) {
        navigator.clipboard.writeText(selectedMeeting.value.guestLink)
            .then(() => {
                toast.add({ severity: 'success', summary: t('success'), detail: t('completedMeeting.form.linkCopied'), life: 3000 });
            })
            .catch(err => {
                toast.add({ severity: 'error', summary: 'error', detail: t('completedMeeting.form.linkCopyFailed'), life: 3000 });
            });
    } else {
        toast.add({ severity: 'error', summary: 'error', detail: t('completedMeeting.form.linkNotFound'), life: 3000 });
        // Eğer kopyalanacak bir isim yoksa, bu durumu da yönetebilirsiniz.
    }
};
//#endregion COPYMEETINGLINK

// Login Meeting Modeli
const loginMeetingModel = ref({ CompletedMeetingGuid: '', meetingType: '2', meetingEntryType: '1', guestFullName: 'selam' });

// Login Meeting Fonksiyonu
const loginMeeting = async () => {
    try {
        layoutStore.setLoading(true);  // Yükleme durumunu aktif et
        const response = await bbbSessionStore.loginCompletedMeeting(loginMeetingModel.value);
        layoutStore.setLoading(false);  // Yükleme durumunu kapat

        if (response.success && response.value.link) {
            // Başarılı giriş ve link varsa
            toast.add({severity: 'success', summary: 'Başarılı!', detail: 'Toplantı başlatıldı, yönlendiriliyorsunuz.', life: 3000});
            window.open(response.value.link, '_blank');  // Linki yeni sekmede aç
        } else {
            // Başarısız giriş durumu
            toast.add({severity: 'error', summary: 'Hata!', detail: 'Toplantı başlatılamadı.', life: 3000});
        }
    } catch (error) {
        layoutStore.setLoading(false);  // Hata durumunda yükleme durumunu kapat
        toast.add({severity: 'error', summary: 'Hata!', detail: 'Başlatma esnasında bir hata oldu', life: 3000});
    }
};


</script>

<template>
  <div class="layout-topbar">
    <div class="topbar-start">
      <!-- Menu Button sadece Participant değilse gösterilir -->
      <Button 
        type="button" 
        class="topbar-menubutton p-link p-trigger" 
        @click="onMenuToggle"
        v-if="!isParticipant"
      >
        <i class="pi pi-bars"></i>
      </Button>

      <!-- Breadcrumb sadece Participant değilse gösterilir -->
      <AppBreadcrumb class="topbar-breadcrumb" v-if="!isParticipant"></AppBreadcrumb>

      <!-- Participant için Logo -->
      <img src="/images/logo.png" alt="Logo" class="logo" v-if="isParticipant" />
    </div>

    <div class="topbar-end">
      <ul class="topbar-menu">
        <!-- "Now Meeting" Butonu sadece Admin veya Manager rolüne sahip kullanıcılar için -->
        <Button 
          icon="pi pi-calendar-plus" 
          :label="$t('completedMeeting.nowMeeting')" 
          outlined 
          @click="confirmNowMeeting" 
          class="ml-2 mr-3 custom-now-meeting-btn" 
          v-if="isAdminOrManager"
        />

        <!-- Dil Dropdown -->
        <Dropdown 
          :options="languages" 
          optionLabel="value" 
          v-model="language" 
          @change="setLanguage($event)" 
          placeholder="Seçiniz"
        />

        <!-- Profil Avatar -->
        <li class="topbar-profile">
          <Avatar
            class="mr-2"
            size="large"
            shape="circle"
            @click="showProfileSidebar"
            style="cursor: pointer; background-color: #007bff; color: white; font-size: 20px;"
            v-if="authStore.user"
          >
            {{ authStore.user.fullName ? authStore.user.fullName.charAt(0).toUpperCase() : 'U' }}
          </Avatar>
        </li>
      </ul>
    </div>
  </div>

  <!-- #region NOW MEETING DIALOG -->
  <Dialog 
    v-model:visible="nowMeetingDialog" 
    :closable="true" 
    :modal="true" 
    appendTo="body" 
    :style="{ width: '50vw', maxWidth: '600px' }" 
    :header="t('completedMeeting.nowMeeting')"
  >
    <div class="card p-fluid col-12 mb-3">
      <span class="p-float-label md:mb-5 my-2">
        <InputText id="name" type="text" v-model="nowMeetingModel.name" />
        <label for="name">{{ t('completedMeeting.form.meetingName') }} *</label>
      </span>

      <span class="p-float-label">
        <InputText id="description" type="text" v-model="nowMeetingModel.description" />
        <label for="description">{{ t('completedMeeting.form.description') }}</label>
      </span>
    </div>

    <Accordion :activeIndex="1">
      <AccordionTab :header="t('completedMeeting.form.participantGroupOrEmail')">
        <MultiSelect 
          v-model="multiselectValue" 
          :options="groupsBySelected" 
          optionLabel="name" 
          :placeholder="t('completedMeeting.form.selectGroups')" 
          display="chip" 
          :filter="true"
          class="col-12"
        />

        <div class="col-12 field md:mb-0">
          <Divider layout="horizontal"><b>{{ t('participantHomepage.or') }}</b></Divider>
        </div>

        <div class="col-12 md:col-12 border-1 surface-border border-round">
          <div class="p-inputgroup">
            <Button 
              :label="t('completedMeeting.form.add')" 
              icon="pi pi-user-plus" 
              @click="addEmail()" 
              :disabled="!isValidEmail(newEmail)" 
            />
            <InputText 
              :placeholder="t('completedMeeting.form.emailAddress')" 
              v-model="newEmail" 
            />
          </div>

          <div class="p-3 flex flex-wrap gap-1">
            <Chip 
              v-for="(tag, i) in emails" 
              :key="i" 
              :label="tag" 
              class="mr-2 py-2 px-3 text-900 font-bold surface-card border-1 surface-border" 
              style="border-radius: 20px"
            >
              <span class="mr-3">{{ tag }}</span>
              <span 
                class="flex align-items-center justify-content-center border-1 surface-border bg-gray-100 border-circle cursor-pointer" 
                :style="{ width: '1.5rem', height: '1.5rem' }" 
                @click="onRemoveTags(tag)"
              >
                <i class="pi pi-fw pi-times text-black-alpha-60" :style="{ fontSize: '9px' }"></i>
              </span>
            </Chip>
          </div>
        </div>
      </AccordionTab>
    </Accordion>

    <template #footer>
      <Button 
        :label="t('completedMeeting.form.createAndGetParticipantLink')" 
        @click="saveNowMeeting" 
      />
    </template>
  </Dialog>
  <!-- #endregion NOW MEETING DIALOG -->

  <!-- #region START MEETING DIALOG -->
  <Dialog 
    v-model:visible="startMeetingDialog" 
    :closable="true" 
    :modal="true" 
    :style="{ width: '650px' }" 
    class="p-fluid col-12 md:col-6" 
    :header="t('completedMeeting.startMeeting')"
  >
    <div class="card p-fluid col-12 mb-3">
      <ul>
        <li><strong>{{ t('completedMeeting.name') }}:</strong> {{ selectedMeeting.name }}</li>
        <li><strong>{{ t('completedMeeting.description') }}:</strong> {{ selectedMeeting.description }}</li>
      </ul>
    </div>

    <Button 
      :label="t('completedMeeting.form.copyLink')" 
      v-if="selectedMeeting.guestLink" 
      outlined 
      severity="outlined" 
      @click="copyMeetingName" 
    />
    <h6>{{ t('completedMeeting.form.shareLinkInfo') }}</h6>
    
    <template #footer>
      <Button 
        :label="t('completedMeeting.form.startAndJoin')" 
        @click="loginMeeting" 
      />
    </template>
  </Dialog>
  <!-- #endregion START MEETING DIALOG -->
</template>

<style lang="scss" scoped>
.custom-now-meeting-btn {
    background-color: #ffa500 !important;
    color: white !important;
    font-size: 0.875rem;
    padding: 0.5rem 0.5rem;
    height: 2.5rem;
}

.custom-now-meeting-btn:hover {
    background-color: #0a74da !important;
}

.logo {
    height: 40px;
    /* Diğer logo stillerini buraya ekleyebilirsiniz */
}
</style>
