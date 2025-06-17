<script setup>
import { ref, onMounted } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useUserDetailSettingStore } from '@/stores/userdetailsetting';
import { useI18n } from "vue-i18n";
import { useLayoutStore } from '@/stores/layout'
import { useFileSystem } from '@/stores/filesystem';
import PrimeImage from 'primevue/image';
import ProgressSpinner from 'primevue/progressspinner';
import { useParticipantStore } from '@/stores/participant'

const participantStore = useParticipantStore();

const fileSystemStore = useFileSystem();
const { t, te } = useI18n();
const userDetailSettingStore = useUserDetailSettingStore();

const confirmPopup = useConfirm();
const toast = useToast();
const layoutStore = useLayoutStore()

const passwordDialogVisible = ref(false);

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

const changeUserPassword = async () => {
    console.log("currentPassword Password before check:", currentPassword.value);
    console.log("newPassword Password before check:", newPassword.value);
    console.log("Confirm Password before check:", confirmPassword.value);


    if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Please fill in all password fields.',
            life: 3000,
        });
        return;
    }
    
    try {
        const response = await userDetailSettingStore.changePassword(
            currentPassword.value,
            newPassword.value,
            confirmPassword.value
        );

        // Response kontrolü
        if (response.Success) {
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: response.Message || 'Password changed successfully',
                life: 3000,
            });
            passwordDialogVisible.value = false;
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: response.Message || 'Failed to change password',
                life: 3000,
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'An unexpected error occurred.',
            life: 3000,
        });
        console.error('Error:', error);
    }
};


const activeIndex = ref(0);

const items = ref([
    { label: t('authorizationDetail.managerSetting'), icon: 'pi pi-fw pi-id-card' },
    { label: t('authorizationDetail.meetingSetting'), icon: 'pi pi-fw pi-check-circle' },
    { label: t('authorizationDetail.invoiceSetting'), icon: 'pi pi-fw pi-file-edit' }
]);

// 0 = Bireysel Fatura, 1 = Kurumsal Fatura
// Dil bağımsız numeric değerleri kullanıyoruz.
// Veritabanına kaydederken bu numeric değere göre Türkçe metin gönderilecek.
const invoicetype = ref(0); 
const invoiceoptions = ref([
  { label: t('authorizationDetail.individualInvoice'), value: 0 },
  { label: t('authorizationDetail.corporateInvoice'), value: 1 }
]);

const changeItem = (index) => {
    activeIndex.value = index;
};

const infoMessages = {
    RecordTF: t('infoMessages.RecordTF'),
    WebcamsOnlyForModerator: t('infoMessages.WebcamsOnlyForModerator'),
    LockSettingsDisableCam: t('infoMessages.LockSettingsDisableCam'),
    LockSettingsDisableMic: t('infoMessages.LockSettingsDisableMic'),
    LockSettingsDisablePrivateChat: t('infoMessages.LockSettingsDisablePrivateChat'),
    LockSettingsDisablePublicChat: t('infoMessages.LockSettingsDisablePublicChat'),
    LockSettingsHideUserList: t('infoMessages.LockSettingsHideUserList'),
    GuestPolicy: t('infoMessages.GuestPolicy'),
    AllowModsToEjectCameras: t('infoMessages.AllowModsToEjectCameras'),
    AllowRequestsWithoutSession: t('infoMessages.AllowRequestsWithoutSession'),
    MeetingCameraCap: t('infoMessages.MeetingCameraCap'),
    BannerText: t('infoMessages.BannerText'),
    Description: t('infoMessages.Description'),
    WelcomeMessage: t('infoMessages.WelcomeMessage'),
    Logo: t('infoMessages.Logo'),
    Duration: t('infoMessages.Duration'),
    ScheduleOrSingleDate: t('infoMessages.ScheduleOrSingleDate')
};

const userDetailSettings = ref({
    RecordTF: false,
    WebcamsOnlyForModerator: false,
    LockSettingsDisableCam: false,
    LockSettingsDisableMic: false,
    LockSettingsDisablePrivateChat: false,
    LockSettingsDisablePublicChat: false,
    LockSettingsHideUserList: false,
    GuestPolicy: 0,
    AllowModsToEjectCameras: false,
    AllowRequestsWithoutSession: false,
    MeetingCameraCap: 0,
    BannerText: '',
    Description: '',
    WelcomeMessage: '',
    Logo: '',
    Duration: 0,
    InvoiceType: '',
    InvoiceNameSurname: '',
    InvoicePersonalNumber: '',
    InvoiceAddress: '',
    BusinessName: '',
    BusinessNumber: '',
    BusinessCountry: '',
    BusinessCity: '',
    BusinessProvince: '',
    BusinessAddress: '',
    BusinessVD: '',
    PhoneNumber: '',
    RecordVisibility: 2
});

const fetchUserDetailSettings = async () => {
    try {
        const response = await userDetailSettingStore.GetUserDetailSettingInvoiceAndMeetingByUserId();
        if (response.value) {
            const settings = response.value;
            userDetailSettings.value = {
                RecordTF: settings.recordTF,
                WebcamsOnlyForModerator: settings.webcamsOnlyForModerator,
                LockSettingsDisableCam: settings.lockSettingsDisableCam,
                LockSettingsDisableMic: settings.lockSettingsDisableMic,
                LockSettingsDisablePrivateChat: settings.lockSettingsDisablePrivateChat,
                LockSettingsDisablePublicChat: settings.lockSettingsDisablePublicChat,
                LockSettingsHideUserList: settings.lockSettingsHideUserList,
                GuestPolicy: settings.guestPolicy,
                AllowModsToEjectCameras: settings.allowModsToEjectCameras,
                AllowRequestsWithoutSession: settings.allowRequestsWithoutSession,
                MeetingCameraCap: settings.meetingCameraCap,
                BannerText: settings.bannerText,
                Description: settings.description,
                WelcomeMessage: settings.welcomeMessage,
                Logo: settings.logo,
                Duration: settings.duration,
                InvoiceType: settings.invoiceType,
                InvoiceNameSurname: settings.invoiceNameSurname,
                InvoicePersonalNumber: settings.invoicePersonalNumber,
                InvoiceAddress: settings.invoiceAddress,
                BusinessName: settings.businessName,
                BusinessNumber: settings.businessNumber,
                BusinessCountry: settings.businessCountry,
                BusinessCity: settings.businessCity,
                BusinessProvince: settings.businessProvince,
                BusinessAddress: settings.businessAddress,
                BusinessVD: settings.businessVD,
                RecordVisibility: settings.recordVisibility
            };

            // DB'den gelen text değerlerini numeric değere çevir
            // Eğer 'Bireysel Fatura' geldiyse 0
            // Eğer 'Kurumsal Fatura' geldiyse 1
            if (settings.invoiceType === 'Bireysel Fatura') {
                invoicetype.value = 0;
            } else if (settings.invoiceType === 'Kurumsal Fatura') {
                invoicetype.value = 1;
            } else {
                invoicetype.value = 0; // Varsayılan olarak bireysel
            }
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch user detail settings.', life: 3000 });
    }
};

onMounted( async () => {
    try {
    layoutStore.setLoading(true);
    await fetchUserDetailSettings();
    await fetchUserNameEmailEtc();
    await fetchTimeZoneList();

  } catch (error) {
    console.error("An error:", error);
  } finally {
    layoutStore.setLoading(false);
  }
});

const userNameEmailEtc = ref({
    fullName:'',
    email:'',
    phoneNumber:'',
    timeZoneId:''
});

const saveUserNameEtc = async () => {
    try {
        console.log(userNameEmailEtc.value);
        // Değerleri kontrol et
        if (!userNameEmailEtc.value.fullName || !selectedTimeZone.value) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Lütfen gerekli tüm alanları doldurunuz.', life: 3000 });
            return;
        }

        const userNameUtcApi = ref({
            fullName: userNameEmailEtc.value.fullName,
            phoneNumber: userNameEmailEtc.value.phoneNumber,
            timeZoneId: selectedTimeZone
        });

        // API çağrısı
        const response = await participantStore.editUserNameEtc(userNameUtcApi.value);

        // Gelen yanıtı kontrol et
        if (response.success) {
            toast.add({ severity: 'success', summary: 'Success', detail: response.message || 'Başarılı', life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: response.message || 'Bir hata oluştu.', life: 3000 });
        }
    } catch (error) {
        // Hata durumunda mesaj göster
        toast.add({ severity: 'error', summary: 'Error', detail: 'Sunucuya bağlanırken bir hata oluştu.', life: 3000 });
    }
};



const timeZoneList = ref([]);
const selectedTimeZone = ref('Turkey Standard Time');

const fetchTimeZoneList = async () => {
  if (timeZoneList.value.length === 0) {
    try {
      const response = await participantStore.getAllTimeZoneList();
      timeZoneList.value = response.map((tz) => ({
        label: tz.displayName, // Görünen ad
        value: tz.id,          // Zaman dilimi ID'si
      }));
    } catch (error) {
      console.error('Error fetching time zones:', error);
    }
  }
};


const fetchUserNameEmailEtc = async () => {
    try {
        const response = await participantStore.getUserNameEmailEtc();
        if (response.value) {
            const user = response.value;
            userNameEmailEtc.value = {
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                timeZoneId:user.timeZoneId
            };
            if (userNameEmailEtc.value.timeZoneId) {
                selectedTimeZone.value = userNameEmailEtc.value.timeZoneId;
            }
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch user name and email etc', life: 3000 });
    }
};

const confirm = (event, settingKey) => {
    confirmPopup.require({
        target: event.target,
        message: infoMessages[settingKey],
        icon: 'pi pi-info-circle',
        acceptLabel: t('yes'),
        rejectLabel: t('no'),
        accept: () => {
            userDetailSettings.value[settingKey] = true;
            toast.add({ severity: 'success', summary: 'Confirmed', detail: `${settingKey} set to true`, life: 3000 });
        },
        reject: () => {
            userDetailSettings.value[settingKey] = false;
            toast.add({ severity: 'info', summary: 'Rejected', detail: `${settingKey} set to false`, life: 3000 });
        }
    });
};

const saveUserDetailSettings = async () => {
    try {
        // Numeric invoicetype değerine göre DB'ye Türkçe text gönder
        userDetailSettings.value.InvoiceType = invoicetype.value === 0 ? 'Bireysel Fatura' : 'Kurumsal Fatura';

        const response = await userDetailSettingStore.createOrEditUserDetail(userDetailSettings.value);
        toast.add({ severity: 'success', summary: 'Success', detail: 'User detail settings saved successfully.', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save user detail settings.', life: 3000 });
    }
};

const pageId = 0; 
const pageType = '3'; 
const isUploading = ref(false);
const fileUploadRef = ref(null);

const onFileSelect = async (event) => {
  if (event.files && event.files.length > 0) {
    isUploading.value = true;
    try {
      const file = event.files[0];

      const allowedExtensions = ['png', 'jpg', 'jpeg'];
      const fileName = file.name;
      const fileExtension = fileName.split('.').pop().toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Yalnızca PNG veya JPG dosyalarına izin verilir.', life: 3000 });
        isUploading.value = false;
        return;
      }

      const maxSizeInBytes = 2 * 1024 * 1024; 
      if (file.size > maxSizeInBytes) {
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Dosya boyutu en fazla 2 MB olabilir.', life: 3000 });
        isUploading.value = false;
        return;
      }

      await validateImageDimensions(file);

      const formData = new FormData();
      formData.append('formFile', file);
      formData.append('pageId', pageId);
      formData.append('pageType', pageType);

      const result = await fileSystemStore.uploadFile(formData);
      if (result.success) {
        userDetailSettings.value.Logo = result.value.logoUrl;
        toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Dosya Yüklendi', life: 3000 });
      } else {
        throw new Error('Dosya yükleme başarısız oldu');
      }
    } catch (error) {
      console.error('Hata Detayları:', error);
      const errorMessage = error.message || 'Bilinmeyen bir hata oluştu';
      toast.add({ severity: 'error', summary: 'Hata', detail: errorMessage, life: 3000 });
    } finally {
      isUploading.value = false;
      if (fileUploadRef.value) {
        fileUploadRef.value.clear();
      }
    }
  } else {
    toast.add({ severity: 'error', summary: 'Hata', detail: 'Dosya seçilmedi', life: 3000 });
  }
};

const logoConfirm = (event) => {
    confirmPopup.require({
        target: event.currentTarget,
        group: 'templating',
        message: t('authorizationDetail.logoConfirm'),
        icon: 'pi pi-exclamation-circle',
        acceptLabel: 'Ok',
    });
};

const confirmDeleteLogo = (event) => {
  confirmPopup.require({
    target: event.currentTarget,
    message: t('authorizationDetail.deleteLogoConfirm'),
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: t('yes'),
    rejectLabel: t('no'),
    accept: () => {
      userDetailSettings.value.Logo = '';
      toast.add({
        severity: 'success',
        summary: t('success'),
        detail: t('authorizationDetail.logoDeleted'),
        life: 3000,
      });
    },
    reject: () => {
      toast.add({
        severity: 'info',
        summary: t('cancelled'),
        detail: t('authorizationDetail.logoDeletionCancelled'),
        life: 3000,
      });
    },
  });
};

const validateImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (img.width > 350 || img.height > 150) {
          reject('Görsel boyutları maksimum 250x100 piksel olmalıdır.');
        } else {
          resolve();
        }
      };
      img.onerror = () => {
        reject('Görsel okunamadı. Lütfen geçerli bir görsel dosyası yükleyin.');
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      reject('Dosya okunamadı.');
    };
    reader.readAsDataURL(file);
  });
};

const guestPolicyOptions = ref([
    { label: t('meeting.alwaysAccept'), value: 0 },
    { label: t('meeting.alwaysDeny'), value: 1 },
    { label: t('meeting.askModerator'), value: 2 }
]);

const recordVisibilityOptions = ref([
    { label: t('meeting.participantsForRecord'), value: 0 },
    { label: t('meeting.adminForRecord'), value: 1 },
    { label: t('meeting.moderatorForRecord'), value: 2 }
]);
</script>

<template>
    <div>
        <div class="card">
            <div class="text-900 font-bold text-xl mb-3">{{ t('authorizationDetail.managerDetailSettingsTitle') }}</div>
            <p class="text-600 line-height-3">{{ t('authorizationDetail.managerDetailSettingsDescription') }}</p>
        </div>

        <div class="flex flex-column md:flex-row gap-5">
            <div class="card mb-0 md:w-20rem">
                <div class="text-900 block font-bold mb-3">{{ t('authorizationDetail.settingsTitle') }}</div>
                <ul class="list-none m-0 p-0">
                    <li v-for="(item, i) in items" :key="i" @click="changeItem(i)" class="mb-2">
                        <a
                            v-ripple
                            class="p-ripple flex align-items-center cursor-pointer select-none p-3 transition-colors transition-duration-150 border-round"
                            :class="{
                                'bg-primary': activeIndex === i,
                                'hover:surface-hover': activeIndex !== i
                            }"
                        >
                            <i class="mr-2 text-lg" :class="item.icon"></i>
                            <span>{{ item.label }}</span>
                        </a>
                    </li>
                </ul>
            </div>

            <!-- Profile Settings -->
            <div class="flex-1" v-if="activeIndex === 0">
                <Toolbar>
                    <template #start>
                        <Button :label="t('authorizationDetail.changePassword')" icon="pi pi-key" plain text raised class="p-button-help" @click="passwordDialogVisible = true"></Button>
                    </template>

                    <template #end>
                        <Button :label="t('authorizationDetail.saveProfileSetting')" icon="pi pi-save" raised class="p-button-save" @click="saveUserNameEtc"></Button>
                    </template>
                </Toolbar>
                {{ selectedTimeZone }}
                <div class="card p-fluid">
                    <div class="field">
                     <label for="fullName">{{ t('authorizationDetail.timeSettings') }}</label>
                        <Dropdown
                            v-model="selectedTimeZone"
                            :options="timeZoneList"
                            optionLabel="label"
                            optionValue="value"
                            :class="{ 'p-invalid': !selectedTimeZone }"
                            filter
                            filterPlaceholder="Search..."
                        />
                    </div>
                    <div class="field">
                        <label for="fullName">{{ t('authorizationDetail.name') }}</label>
                        <InputText id="fullName" type="text" v-model="userNameEmailEtc.fullName" />
                    </div>
                    <div class="field">
                        <label for="email">{{ t('authorizationDetail.email') }}</label>
                        <InputText id="email" type="email" v-model="userNameEmailEtc.email" />
                    </div>
                    <div class="field">
                        <label for="phone">{{ t('authorizationDetail.phoneNumber') }}</label>
                        <InputText id="phone" type="phone" v-model="userNameEmailEtc.phoneNumber" />
                    </div>

                    <hr class="my-2">
                </div>
            </div>

            <!-- Meeting Settings -->
            <div class="flex-1" v-if="activeIndex === 1">
                <Toolbar>
                    <template #end>
                        <Button :label="t('authorizationDetail.saveMeetingDetailSetting')" icon="pi pi-save" raised class="p-button-save" severity="success" @click="saveUserDetailSettings"></Button>
                    </template>
                </Toolbar>

                <div class="card p-fluid">
                    <div class="field">
                        <label for="Description">{{ t('authorizationDetail.description') }}</label>
                        <InputText id="Description" type="text" v-model="userDetailSettings.Description" />
                    </div>
                    <div class="field">
                        <label for="WelcomeMessage">{{ t('authorizationDetail.welcomeMessage') }}</label>
                        <InputText id="WelcomeMessage" type="text" v-model="userDetailSettings.WelcomeMessage" />
                    </div>
                    <div class="field">
                        <label for="BannerText">{{ t('authorizationDetail.bannerText') }}</label>
                        <InputText id="BannerText" type="text" v-model="userDetailSettings.BannerText" />
                    </div>

                    <div class="formgrid grid my-5">
                        <div class="field col">
                            <div class="field mb-0">
                                <Dropdown 
                                    v-model="userDetailSettings.GuestPolicy"
                                    :options="guestPolicyOptions" 
                                    optionLabel="label" 
                                    optionValue="value"
                                />
                            </div>
                        </div>
                        <div class="field col">
                            <div class="field mb-0">
                                <Dropdown 
                                    v-model="userDetailSettings.RecordVisibility"
                                    :options="recordVisibilityOptions" 
                                    optionLabel="label" 
                                    optionValue="value"
                                />
                            </div>
                        </div>
                    </div>

                    <hr class="my-5">
                    
                    <!-- InputSwitch Settings -->
                    <div class="formgrid grid">
                        <div class="field col">
                            <div class="field-checkbox mb-0">
                                <InputSwitch v-model="userDetailSettings.RecordTF" />
                                <label>{{ t('authorizationDetail.meetingsCanBeRecorded') }}</label>
                                <ConfirmPopup></ConfirmPopup>
                                <Button ref="popup" @click="confirm($event, 'RecordTF')" icon="pi pi-info-circle" class="mr-2" text></Button>
                            </div>
                        </div>
                        <div class="field col">
                            <div class="field-checkbox mb-0">
                                <InputSwitch v-model="userDetailSettings.WebcamsOnlyForModerator" />
                                <label>{{ t('authorizationDetail.webcamsOnlyForModerator') }}</label>
                                <ConfirmPopup></ConfirmPopup>
                                <Button ref="popup" @click="confirm($event, 'WebcamsOnlyForModerator')" icon="pi pi-info-circle" class="mr-2" text></Button>
                            </div>
                        </div>
                        <div class="field col">
                            <div class="field-checkbox mb-0">
                                <InputSwitch v-model="userDetailSettings.LockSettingsDisableCam" />
                                <label>{{ t('authorizationDetail.disableCameras') }}</label>
                                <ConfirmPopup></ConfirmPopup>
                                <Button ref="popup" @click="confirm($event, 'LockSettingsDisableCam')" icon="pi pi-info-circle" class="mr-2" text></Button>
                            </div>
                        </div>
                    </div>

                    <div class="formgrid grid">
                        <div class="field col">
                            <div class="field-checkbox mb-0">
                                <InputSwitch v-model="userDetailSettings.LockSettingsDisableMic" />
                                <label>{{ t('authorizationDetail.disableMicrophones') }}</label>
                                <ConfirmPopup></ConfirmPopup>
                                <Button ref="popup" @click="confirm($event, 'LockSettingsDisableMic')" icon="pi pi-info-circle" class="mr-2" text></Button>
                            </div>
                        </div>
                        <div class="field col">
                            <div class="field-checkbox mb-0">
                                <InputSwitch v-model="userDetailSettings.LockSettingsDisablePrivateChat" />
                                <label>{{ t('authorizationDetail.disablePrivateChat') }}</label>
                                <ConfirmPopup></ConfirmPopup>
                                <Button ref="popup" @click="confirm($event, 'LockSettingsDisablePrivateChat')" icon="pi pi-info-circle" class="mr-2" text></Button>
                            </div>
                        </div>
                        <div class="field col">
                            <div class="field-checkbox mb-0">
                                <InputSwitch v-model="userDetailSettings.LockSettingsDisablePublicChat" />
                                <label>{{ t('authorizationDetail.disablePublicChat') }}</label>
                                <ConfirmPopup></ConfirmPopup>
                                <Button ref="popup" @click="confirm($event, 'LockSettingsDisablePublicChat')" icon="pi pi-info-circle" class="mr-2" text></Button>
                            </div>
                        </div>
                    </div>

                    <div class="formgrid grid">
                        <div class="field col">
                            <div class="field-checkbox mb-0">
                                <InputSwitch v-model="userDetailSettings.LockSettingsHideUserList" />
                                <label>{{ t('authorizationDetail.hideUserList') }}</label>
                                <ConfirmPopup></ConfirmPopup>
                                <Button ref="popup" @click="confirm($event, 'LockSettingsHideUserList')" icon="pi pi-info-circle" class="mr-2" text></Button>
                            </div>
                        </div>
                        <div class="field col">
                            <div class="field-checkbox mb-0">
                                <InputSwitch v-model="userDetailSettings.AllowModsToEjectCameras" />
                                <label>{{ t('authorizationDetail.allowModsToEjectCameras') }}</label>
                                <ConfirmPopup></ConfirmPopup>
                                <Button ref="popup" @click="confirm($event, 'AllowModsToEjectCameras')" icon="pi pi-info-circle" class="mr-2" text></Button>
                            </div>
                        </div>
                        <div class="field col">
                            <div class="field-checkbox mb-0">
                                <InputSwitch v-model="userDetailSettings.AllowRequestsWithoutSession" />
                                <label>{{ t('authorizationDetail.allowRequestsWithoutSession') }}</label>
                                <ConfirmPopup></ConfirmPopup>
                                <Button ref="popup" @click="confirm($event, 'AllowRequestsWithoutSession')" icon="pi pi-info-circle" class="mr-2" text></Button>
                            </div>
                        </div>
                        </div>
                        <hr class="my-5">

                        <div class="formgrid grid">
                            <div class="field col">
                                <ProgressSpinner style="width: 25px; height: 25px" strokeWidth="8" fill="transparent" animationDuration=".5s" aria-label="Custom ProgressSpinner" v-if="isUploading"/>
                                <div class="field-checkbox mb-0" v-if="!isUploading">
                                    <div v-if="!userDetailSettings.Logo" class="field-checkbox mb-0">
                                        <FileUpload
                                        ref="fileUploadRef"
                                        chooseLabel="Logo Yükle"
                                        mode="basic"
                                        name="formFile"
                                        :maxFileSize="10737418"
                                        @select="onFileSelect"
                                        :auto="false"
                                        :disabled="isUploading"
                                        />
                                        <Button
                                        @click="logoConfirm($event)"
                                        icon="pi pi-info-circle"
                                        class="mr-2"
                                        text
                                        ></Button>
                                        <Toast />
                                    <ConfirmPopup group="templating">
                                    </ConfirmPopup>
                                    </div>

                                    <div v-else>
                                        <PrimeImage :src="userDetailSettings.Logo" alt="Logo" style="max-width: 200px;" />
                                        <Button
                                        label="Delete Logo"
                                        icon="pi pi-trash"
                                        class="p-button-warning mt-3 custom-button"
                                        @click="confirmDeleteLogo($event)"
                                        Raised
                                        ></Button>
                                        <ConfirmPopup></ConfirmPopup>
                                    </div>
                                </div>
                                    <small class="logo-info-text" v-if="!userDetailSettings.Logo">Max 350x100 & 2 Mb</small>
                            </div>
                        </div>
                </div>
            </div>

            <!-- Invoice Settings -->
            <div class="flex-1" v-if="activeIndex === 2">
                <Toolbar>
                    <template #start>
                        <div class="flex justify-content-center">
                            <!-- <SelectButton v-model="invoicetype" :options="invoiceoptions" aria-labelledby="basic" /> -->
                            <Dropdown 
                                v-model="invoicetype"
                                :options="invoiceoptions" 
                                optionLabel="label"
                                optionValue="value" 
                            />
                        </div>
                    </template>

                    <template #end>
                        <Button :label="t('authorizationDetail.saveTax')" icon="pi pi-save" raised class="p-button-save" severity="success" @click="saveUserDetailSettings"></Button>
                    </template>
                </Toolbar>

                <!-- Individual Invoice -->
                <div class="card p-fluid" v-if="invoicetype === 0">
                    <div class="field">
                        <label for="Name">{{ t('authorizationDetail.name') }}</label>
                        <InputText id="Name" type="text" v-model="userDetailSettings.InvoiceNameSurname" />
                    </div>
                    <div class="field">
                        <label for="PersonalN">{{ t('authorizationDetail.personalNumber') }}</label>
                        <InputText id="PersonalN" type="text" v-model="userDetailSettings.InvoicePersonalNumber" />
                    </div>
                    <div class="field">
                        <label for="Address">{{ t('authorizationDetail.invoiceAddress') }}</label>
                        <InputText id="Address" type="text" v-model="userDetailSettings.InvoiceAddress" />
                    </div>
                </div>

                <!-- Corporate Invoice -->
                <div class="card p-fluid" v-if="invoicetype === 1">
                    <div class="field">
                        <label for="fullName">{{ t('authorizationDetail.businessName') }}</label>
                        <InputText id="fullName" type="text" v-model="userDetailSettings.BusinessName" />
                    </div>
                    <div class="field">
                        <label for="Number">{{ t('authorizationDetail.taxNumber') }}</label>
                        <InputText id="Number" type="text" v-model="userDetailSettings.BusinessNumber" />
                    </div>

                    <hr class="my-3">
                    <div class="grid formgrid">
                        <div class="col-12 mb-2 lg:col-3 lg:mb-0 field">
                            <label for="Country">{{ t('authorizationDetail.country') }}</label>
                            <InputText id="Country" type="text" v-model="userDetailSettings.BusinessCountry" />
                        </div>
                        <div class="col-12 mb-2 lg:col-3 lg:mb-0 field">
                            <label for="City">{{ t('authorizationDetail.city') }}</label>
                            <InputText id="City" type="text" v-model="userDetailSettings.BusinessCity" />                    
                        </div>
                        <div class="col-12 mb-2 lg:col-3 lg:mb-0 field">
                            <label for="Province">{{ t('authorizationDetail.province') }}</label>
                            <InputText id="Province" type="text" v-model="userDetailSettings.BusinessProvince" />                    
                        </div>
                        <div class="col-12 mb-2 lg:col-3 lg:mb-0 field">
                            <label for="vd">{{ t('authorizationDetail.vd') }}</label>
                            <InputText id="vd" type="text" v-model="userDetailSettings.BusinessVD" />                    
                        </div>
                    </div>
                    <hr class="my-3">
                    <div class="field">
                        <label for="Address">{{ t('authorizationDetail.businessAddress') }}</label>
                        <InputText id="Address" type="text" v-model="userDetailSettings.BusinessAddress" />
                    </div>
                </div>
            </div>
        </div>
    </div>

    <Dialog v-model:visible="passwordDialogVisible" modal :header="t('authorizationDetail.changePasswordTitle')" :style="{ width: '40%' }">
        <template #header>
            <div class="inline-flex align-items-center justify-content-center gap-2">
                <span class="font-bold white-space-nowrap">{{ t('authorizationDetail.changePasswordTitle') }}</span>
            </div>
        </template>
        <span class="p-text-secondary block mb-5">{{ t('authorizationDetail.updatePassword') }}</span>
        <div class="flex align-items-center gap-3 mb-3">
            <label for="currentPassword" class="font-semibold w-6rem">{{ t('authorizationDetail.currentPassword') }}</label>
            <InputText id="currentPassword" type="password" v-model="currentPassword" class="flex-auto" autocomplete="off" />
        </div>
        <div class="flex align-items-center gap-3 mb-2">
            <label for="newPassword" class="font-semibold w-6rem">{{ t('authorizationDetail.newPassword') }}</label>
            <InputText id="newPassword" type="password" v-model="newPassword" class="flex-auto" autocomplete="off" />
        </div>
        <div class="flex align-items-center gap-3 mb-2">
            <label for="confirmPassword" class="font-semibold w-6rem">{{ t('authorizationDetail.confirmPassword') }}</label>
            <InputText id="confirmPassword" type="password" v-model="confirmPassword" class="flex-auto" autocomplete="off" />
        </div>
        <template #footer>
            <Button :label="t('authorizationDetail.cancel')" text severity="secondary" @click="passwordDialogVisible = false" autofocus />
            <Button :label="t('authorizationDetail.save')" outlined severity="secondary" @click="changeUserPassword" autofocus />
        </template>
    </Dialog>
</template>

<style>
.custom-button {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}
</style>
