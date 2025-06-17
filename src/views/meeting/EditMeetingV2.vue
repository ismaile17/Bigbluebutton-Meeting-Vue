<script setup>
import { ref, onMounted,computed, watch  } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import PrimeImage from 'primevue/image';
import ProgressSpinner from 'primevue/progressspinner';
import  RecurrenceOptions  from './RecurrenceOptions.vue';
import { useMeetingStore } from '@/stores/meeting'
import { useParticipantStore } from '@/stores/participant'
import { useLayout } from '@/layout/composables/layout'
import { useLayoutStore } from '@/stores/layout'
import { format, addDays, addWeeks, addMonths, addYears, isWeekend, parseISO, getDay, startOfMonth, endOfMonth, eachDayOfInterval,isValid,parse } from 'date-fns';
import { useRouter, useRoute } from 'vue-router';
import { useFileSystem } from '@/stores/filesystem' // FileSystem store'u import edildi

const fileSystemStore = useFileSystem() // FileSystem store'u kullanıldı

const router = useRouter();
const route = useRoute()

import {useI18n} from "vue-i18n";
const {t,te} = useI18n();

const layoutStore = useLayoutStore()
const { layoutConfig } = useLayout()

const meetingStore = useMeetingStore()
const participantStore = useParticipantStore()
const today = new Date();
const minDate = today.toISOString().split('T')[0]; // YYYY-MM-DD formatında bugünün tarihi



const confirmPopup = useConfirm();
const toast = useToast();

const groupsBySelected = ref([]);  // Grupları saklamak için reaktif bir referans
const participantsBySelected = ref([]);  // Grupları saklamak için reaktif bir referans
const selectGroup = ref([]);  // Grupları saklamak için reaktif bir referans
const selectParticipant = ref([]);  // Grupları saklamak için reaktif bir referans

onMounted(async () => {
    layoutStore.setLoading(true);
    const meetingId = router.currentRoute.value.params.id; // URL'den ID'yi alın
    const response = await meetingStore.getMeetingById(meetingId); // API çağrısı
    await meetingStore.getSelectedGroupByUserId(); // Tüm grupları yükle
    await participantStore.getSelectedParticipantByUserId(); // Tüm katılımcıları yükle

    groupsBySelected.value = [...meetingStore.selectedgroup.value];

    participantsBySelected.value = participantStore.selectedparticipants.value.map(participant => ({
    id: participant.id,
    fullName: participant.fullName }));

    if (response.success && response.value) {
        const data = response.value;

        // Verileri meetingModel'a atayın
        meetingModel.value.id = data.id;
        meetingModel.value.name = data.name;
        meetingModel.value.description = data.description;
        meetingModel.value.welcomeMessage = data.welcomeMessage;
        meetingModel.value.recordTF = data.recordTF;
        startDate.value = data.startDate;
        startTime.value = data.startTime;
        endDate.value = data.endDate;
        endTime.value = data.endTime;
        meetingModel.value.duration = data.duration;
        meetingModel.value.webcamsOnlyForModerator = data.webcamsOnlyForModerator;
        meetingModel.value.bannerText = data.bannerText;
        meetingModel.value.lockSettingsDisableCam = data.lockSettingsDisableCam;
        meetingModel.value.lockSettingsDisableMic = data.lockSettingsDisableMic;
        meetingModel.value.lockSettingsDisablePrivateChat = data.lockSettingsDisablePrivateChat;
        meetingModel.value.lockSettingsDisablePublicChat = data.lockSettingsDisablePublicChat;
        meetingModel.value.lockSettingsHideUserList = data.lockSettingsHideUserList;
        meetingModel.value.guestPolicy = data.guestPolicy;
        meetingModel.value.allowModsToEjectCameras = data.allowModsToEjectCameras;
        meetingModel.value.allowRequestsWithoutSession = data.allowRequestsWithoutSession;
        meetingModel.value.meetingCameraCap = data.meetingCameraCap;
        meetingModel.value.logo = data.logo;
        meetingModel.value.singleOrRepeated = data.singleOrRepeated;
        meetingModel.value.publicOrPrivate = data.publicOrPrivate;
        meetingModel.value.recordVisibility = data.recordVisibility;

        // Grup ve katılımcıları seçilenlere ekleyin
        selectGroup.value = meetingStore.selectedgroup.value.filter(group =>
            data.meetingGroups.some(selectedGroup => selectedGroup.id === group.id)
        ).map(group => ({
            id: group.id,
            name: group.name
        }));

        selectParticipant.value = participantStore.selectedparticipants.value
        .filter(participant =>
            data.meetingModeratorLists.some(mod => mod.id === participant.id)
        )
        .map(participant => ({
            id: participant.id,
            fullName: participant.fullName
        }));

        // Email listesi ve tarihleri ekleyin
        emails.value = data.meetingGuestEmailLists || [];
        calculatedDates.value = data.meetingScheduleDates.map(date => format(parseISO(date), 'dd-MM-yyyy')) || [];

        // E-posta alanını göster/gizle
        if (emails.value.length > 0) {
            isGuestEmailVisible.value = true;
        }

        // Duration'ı güncelle
        calculateDuration();
        layoutStore.setLoading(false);
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Meeting data could not be loaded.', life: 3000 });
        router.push('/meeting/meetinglist');
        layoutStore.setLoading(false);
    }
});

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


const submitted = ref(false);
const validateForm = () => {
    submitted.value = true;

    // Temel doğrulamalar
    let isValid = meetingModel.value.name?.trim() !== '' &&
        meetingModel.value.description?.trim() !== '' &&
        startDate.value?.trim() !== '' &&
        endTime.value?.trim() !== '' &&
        startTime.value?.trim() !== '';

    // Koşullu doğrulamalar
    if (meetingModel.value.singleOrRepeated === true) {
        isValid = isValid &&
            endDate.value?.trim() !== ''
    }

    return isValid;
};


const meetingModel = ref({
  id:'',
  name: '',
  description: '',
  welcomeMessage: '',
  recordTF: false,
  startTime: null,
  endTime: null,
  startDate: null,
  endDate: null,
  duration: null,
  webcamsOnlyForModerator: false,
  bannerText: '',
  lockSettingsDisableCam: false,
  lockSettingsDisableMic: false,
  lockSettingsDisablePrivateChat: false,
  lockSettingsDisablePublicChat: false,
  lockSettingsHideUserList: false,
  guestPolicy: 0,
  allowModsToEjectCameras: false,
  allowRequestsWithoutSession: false,
  meetingCameraCap: null,
  logo: '',
  singleOrRepeated: false,
  publicOrPrivate: false,
  recordVisibility: 2,

  meetingGroupIds: [],
  meetingModeratorList: [],
  meetingGuestEmailList: [],
  meetingScheduleDateList: []
});


const activeIndex = ref(0);
const items = computed(() => {
    const baseItems = [
        { label: t('ScheduleMeeting.items.generalSettings'), icon: 'pi pi-fw pi-info-circle' },
        { label: t('ScheduleMeeting.items.descriptionSettings'), icon: 'pi pi-fw pi-check-circle' }
    ];
    if (meetingModel.value.singleOrRepeated) {
        baseItems.push({ label: t('ScheduleMeeting.items.scheduleSettings'), icon: 'pi pi-fw pi-calendar' });
    }
    return baseItems;
});

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


const saveMeeting = async () => {

  if (!validateForm()) {
        layoutStore.setLoading(false);
        return;
    }

    try {
        // Seçili grupların ve katılımcıların ID'lerini modelde mapleyin
        meetingModel.value.meetingGroupIds = selectGroup.value.map(group => group.id);
        meetingModel.value.meetingModeratorList = selectParticipant.value.map(participant => participant.id);
        meetingModel.value.meetingGuestEmailList = emails.value.length ? emails.value : [];
        meetingModel.value.meetingScheduleDateList = calculatedDates.value.length ? calculatedDates.value : [];

        // Tarih ve saat formatlarını dönüştürün
        meetingModel.value.startDate = startDate.value ? format(parseISO(startDate.value), 'yyyy-MM-dd') : null;
        meetingModel.value.startTime = startTime.value ? `${startTime.value}:00` : null; // HH:mm formatında olduğunu varsayarak
        meetingModel.value.endDate = endDate.value ? format(parseISO(endDate.value), 'yyyy-MM-dd') : null;
        meetingModel.value.endTime = endTime.value ? `${endTime.value}:00` : null; // HH:mm formatında olduğunu varsayarak

        // Eğer ScheduleOrSingleDate true ise, tarihler formatlanır
        let formattedScheduleDates = [];
        if (meetingModel.value.singleOrRepeated) {
            formattedScheduleDates = meetingModel.value.meetingScheduleDateList.map(date => {
                const parsedDate = parse(date, 'dd-MM-yyyy', new Date());
                return isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : null;
            }).filter(date => date !== null); // Geçersiz tarihler filtrelenir
        }

        // Ensure meetingScheduleDateList is not empty if required
        if (meetingModel.value.singleOrRepeated && meetingModel.value.meetingScheduleDateList.length === 0) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Recurring meetings require a schedule.', life: 3000 });
            return;
        }

        // API'ye gönderilecek veriyi oluşturun
        const payload = {
            id: meetingModel.value.id, // Mevcut toplantının ID'si
            appUserId: 0, // appUserId'yi gerektiği şekilde ayarlayın
            name: meetingModel.value.name,
            description: meetingModel.value.description,
            welcomeMessage: meetingModel.value.welcomeMessage,
            recordTF: meetingModel.value.recordTF,
            startDate: meetingModel.value.startDate,
            startTime: meetingModel.value.startTime,
            endTime: meetingModel.value.endTime,
            endDate: meetingModel.value.endDate,
            duration: meetingModel.value.duration,
            webcamsOnlyForModerator: meetingModel.value.webcamsOnlyForModerator,
            bannerText: meetingModel.value.bannerText,
            lockSettingsDisableCam: meetingModel.value.lockSettingsDisableCam,
            lockSettingsDisableMic: meetingModel.value.lockSettingsDisableMic,
            lockSettingsDisablePrivateChat: meetingModel.value.lockSettingsDisablePrivateChat,
            lockSettingsDisablePublicChat: meetingModel.value.lockSettingsDisablePublicChat,
            lockSettingsHideUserList: meetingModel.value.lockSettingsHideUserList,
            guestPolicy: meetingModel.value.guestPolicy,
            allowModsToEjectCameras: meetingModel.value.allowModsToEjectCameras,
            allowRequestsWithoutSession: meetingModel.value.allowRequestsWithoutSession,
            meetingCameraCap: meetingModel.value.meetingCameraCap,
            logo: meetingModel.value.logo,
            singleOrRepeated: meetingModel.value.singleOrRepeated,
            publicOrPrivate: meetingModel.value.publicOrPrivate, // Gerekirse varsayılan bir değer kullanın
            recordVisibility: meetingModel.value.recordVisibility,
            
            meetingGroupIds: meetingModel.value.meetingGroupIds,
            meetingModeratorListIds: meetingModel.value.meetingModeratorList,
            meetingGuestEmailLists: meetingModel.value.meetingGuestEmailList,
            meetingScheduleDateListDates: formattedScheduleDates
        };

        // API çağrısını yapın
        const response = await meetingStore.editMeeting(payload);

        if (response.success) {
            toast.add({ severity: 'success', summary: 'Success', detail: 'Meeting updated successfully.', life: 3000 });
            router.push('/meeting/meetinglist');
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: response.message || 'Failed to update meeting.', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save meeting.', life: 3000 });
    }
};







const onUpload = () => {
    toast.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000 });
};

const confirm = (event, settingKey) => {
    confirmPopup.require({
        target: event.target,
        message: infoMessages[settingKey],
        icon: 'pi pi-info-circle',
        acceptLabel: t('yes'),
        rejectLabel: t('no'),
        accept: () => {
             meetingModel.value[settingKey] = true;
            toast.add({ severity: 'success', summary: 'Confirmed', detail: `${settingKey} set to true`, life: 3000 });
            if (settingKey === 'ScheduleOrSingleDate' && meetingModel.value[settingKey]) {
                changeItem(2); // Schedule Settings sayfasına geçiş
            }
        },
        reject: () => {
            meetingModel.value[settingKey] = false;
            toast.add({ severity: 'info', summary: 'Rejected', detail: `${settingKey} set to false`, life: 3000 });
        }
    });
};


const isGuestEmailVisible = ref(false);
const toggleGuestEmailVisibility = () => {
  isGuestEmailVisible.value = !isGuestEmailVisible.value;
};

// #region EMAİL
const addEmail = () => {
  const trimmedEmail = newEmail.value.trim();

  if (!isValidEmail(trimmedEmail)) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Invalid email format.', life: 3000 });
    newEmail.value = ''; // TextBox'ı temizle
    return;
  }

  if (emails.value.includes(trimmedEmail)) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Email already added.', life: 3000 });
    newEmail.value = ''; // TextBox'ı temizle
    return;
  }

  emails.value.push(trimmedEmail);
  toast.add({ severity: 'success', summary: 'Success', detail: 'Email added successfully.', life: 3000 });
  newEmail.value = ''; // TextBox'ı temizle
};


const isValidEmail = (email) => {
  // Basit bir e-posta doğrulama kontrolü
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const emails = ref([]);
const newEmail = ref('');

const onRemoveTags = (tag) => {
    emails.value = emails.value.filter(t => t !== tag);
};
// #endregion EMAİL


// #region RECURRENCEOPTINS
// Başlangıç ve Bitiş saatleri için değişkenler
const startTime = ref('');
const endTime = ref('');

watch([startTime, endTime], () => {
  calculateDuration();
});

const calculateDuration = () => {
  if (startTime.value && endTime.value) {
    const start = new Date(`1970-01-01T${startTime.value}:00`);
    const end = new Date(`1970-01-01T${endTime.value}:00`);
    
    if (start >= end) {
      toast.add({ severity: 'error', summary: t('ScheduleMeeting.invalidTime'), detail: t('ScheduleMeeting.startTimeLessThanEndTime'), life: 3000 });
      startTime.value = '';
      duration.value = '';
      return;
    }

    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    duration.value = `${hours} ${t('ScheduleMeeting.hours')}, ${minutes} ${t('ScheduleMeeting.minutes')}`;
  } else {
    duration.value = '';
  }
};

// Süre bilgisi için değişken
const duration = ref('');

// Yinelenme dönemi için değişken
const recurrenceType = ref('daily');

// Günlük yinelenme için interval
const dailyInterval = ref(1);

// occurrenceCount giriş olayını işleme fonksiyonu
const onOccurrenceCountInput = (event) => {
  const value = event.target.value;
  occurrenceCount.value = value === '0' ? null : Number(value);
};

// Haftalık yinelenme için interval ve günler
const weeklyInterval = ref(1);
const weekDays = ref([]);

const onRemoveTagsRecurrence = (tag) => {
  calculatedDates.value = calculatedDates.value.filter(t => t !== tag);
};

// Aylık yinelenme için tür ve gün
const monthlyType = ref('day');
const monthlyDay = ref(1);
const monthlyWeek = ref(1);
const monthlyWeekday = ref('Monday');

// Yıllık yinelenme için tarih ve ay günü
const yearlyDate = ref('');
const yearlyMonthDay = ref(1);
const yearlyMonth = ref(0);

// Yinelenme aralığı için başlangıç ve bitiş tarihleri
const startDate = ref('');
const endDate = ref('');

// Oluşum sayısı ve sonsuzluk için değişkenler
const occurrenceCount = ref(0);
const isInfinite = ref(false);

// Hafta sonlarını çıkartma seçeneği
const excludeWeekends = ref(false);

// Hesaplanan tarihler
const calculatedDates = ref([]);
//const today = new Date();


const calculateDialog = ref(false);

const scheduleOrSingleDateDialog = ref(false);

const openConfirmation = () => {
    calculateDialog.value = true;
};

const closeConfirmation = () => {
    calculateDialog.value = false;
};

const closeScheduleOrSingleDateDialog = () => {
    scheduleOrSingleDateDialog.value = false;
};

const confirmAndCalculate = () => {
            calculateDates();
            closeConfirmation();
        };

const confirmScheduleOrSingleDate = () => {
    scheduleOrSingleDateDialog.value = true;
};

const toggleScheduleOrSingleDate = () => {
  meetingModel.value.singleOrRepeated = !meetingModel.value.singleOrRepeated;
  scheduleOrSingleDateDialog.value = false;
};




// Tarihleri hesaplamak için fonksiyon
const calculateDates = () => {
  calculatedDates.value = []; // Hesaplanan tarihler burada belirlenecek

  let currentDate = parseISO(startDate.value);
  let end = isInfinite.value ? null : parseISO(endDate.value);
  let count = 0;
  const maxOccurrences = 365; // Maksimum oluşum sayısı

  // Oluşumları belirlemek için döngü
  while ((isInfinite.value || (end && currentDate <= end)) && count < (occurrenceCount.value || maxOccurrences)) {
    if (recurrenceType.value === 'daily') {
      // Günlük yinelenme
      if (!excludeWeekends.value || !isWeekend(currentDate)) {
        calculatedDates.value.push(format(currentDate, 'dd-MM-yyyy'));
        count++;
      }
      currentDate = addDays(currentDate, dailyInterval.value);
    }

    if (recurrenceType.value === 'weekly') {
      // Haftalık yinelenme
      for (let day of weekDays.value) {
        let nextDate = new Date(currentDate);
        while (format(nextDate, 'EEEE') !== day) {
          nextDate = addDays(nextDate, 1);
        }
        if (nextDate >= parseISO(startDate.value) && (!end || nextDate <= end)) {
          if (!excludeWeekends.value || !isWeekend(nextDate)) {
            calculatedDates.value.push(format(nextDate, 'dd-MM-yyyy'));
            count++;
          }
        }
      }
      currentDate = addWeeks(currentDate, weeklyInterval.value);
    }

    if (recurrenceType.value === 'monthly') {
      // Aylık yinelenme
      if (monthlyType.value === 'day') {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), monthlyDay.value);
      } else if (monthlyType.value === 'week') {
        let monthStart = startOfMonth(currentDate);
        let monthEnd = endOfMonth(currentDate);
        let days = eachDayOfInterval({ start: monthStart, end: monthEnd });
        let targetDays = days.filter(day => format(day, 'EEEE') === monthlyWeekday.value);
        currentDate = targetDays[monthlyWeek.value - 1] || targetDays[targetDays.length - 1];
      }

      if (currentDate >= parseISO(startDate.value) && (!end || currentDate <= end)) {
        if (!excludeWeekends.value || !isWeekend(currentDate)) {
          calculatedDates.value.push(format(currentDate, 'dd-MM-yyyy'));
          count++;
        }
      }
      currentDate = addMonths(currentDate, 1);
    }

    if (recurrenceType.value === 'yearly') {
      // Yıllık yinelenme
      currentDate = new Date(currentDate.getFullYear(), yearlyMonth.value, yearlyMonthDay.value);
      if (currentDate >= parseISO(startDate.value) && (!end || currentDate <= end)) {
        if (!excludeWeekends.value || !isWeekend(currentDate)) {
          calculatedDates.value.push(format(currentDate, 'dd-MM-yyyy'));
          count++;
        }
      }
      currentDate = addYears(currentDate, 1);
    }
  }
};
// #endregion RECURRENCE

const pageId = route.params.id // Sayfa Id'sini route'dan al
const pageType = '3' // Dosya sayfa türü belirle
const isUploading = ref(false);
const fileUploadRef = ref(null); // FileUpload bileşenine referans


const onFileSelect = async (event) => {
  if (event.files && event.files.length > 0) {
    isUploading.value = true; // Yükleme işlemi başlıyor
    try {
      const file = event.files[0];

      // Dosya Uzantısı Kontrolü
      const allowedExtensions = ['png', 'jpg', 'jpeg'];
      const fileName = file.name;
      const fileExtension = fileName.split('.').pop().toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Yalnızca PNG veya JPG dosyalarına izin verilir.', life: 3000 });
        isUploading.value = false;
        return;
      }

      // Dosya Boyutu Kontrolü
      const maxSizeInBytes = 2 * 1024 * 1024; // 2 MB
      if (file.size > maxSizeInBytes) {
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Dosya boyutu en fazla 2 MB olabilir.', life: 3000 });
        isUploading.value = false;
        return;
      }

      // Görsel Boyutları Kontrolü
      await validateImageDimensions(file);

      // Tüm kontroller geçti, dosyayı yükle
      const formData = new FormData();
      formData.append('formFile', file);
      formData.append('pageId', pageId);
      formData.append('pageType', pageType);

      const result = await fileSystemStore.uploadFile(formData);
      if (result.success) {
        meetingModel.value.logo = result.value.logoUrl;

        toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Dosya Yüklendi', life: 3000 });
      } else {
        throw new Error('Dosya yükleme başarısız oldu');
      }
    } catch (error) {
      console.error('Hata Detayları:', error);
      const errorMessage = error.message || 'Bilinmeyen bir hata oluştu';
      toast.add({ severity: 'error', summary: 'Hata', detail: errorMessage, life: 3000 });
    } finally {
      isUploading.value = false; // Yükleme işlemi tamamlandı veya hata oluştu
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
}

const confirmDeleteLogo = (event) => {
  confirmPopup.require({
    target: event.currentTarget,
    message: t('authorizationDetail.deleteLogoConfirm'),
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: t('yes'),
    rejectLabel: t('no'),
    accept: () => {
      meetingModel.value.logo = '';
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

</script>

<template>
    <div>
            <div class="flex justify-content-between mb-3">
                <Button :label="$t('Menu.back')" icon="pi pi-arrow-left" @click="router.go(-1)" rounded />
                <Button :label="$t('ScheduleMeeting.saveMeeting')" icon="pi pi-save" class="p-button-save" @click="saveMeeting" rounded />
            </div>

            <div
                :style="{
                height: '4px',
                background: 'linear-gradient(90deg, #ffa500 0%, rgba(33, 150, 243, 0) 90%)'
                }" class="mb-4"
            ></div>

        <div class="flex flex-column md:flex-row gap-5">
            <div class="card mb-0 md:w-20rem">
                <div class="text-900 block font-bold mb-3">{{ $t('ScheduleMeeting.settings') }}</div>
                <ul class="list-none m-0 p-0">
                    <li v-for="(item, i) in items" :key="i" @change="changeItem(2)" @click="changeItem(i)" class="mb-2">
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

            <div class="flex-1" v-if="activeIndex === 0">
                <div class="card p-fluid">
                    <div class="field">
                        <label for="name">{{ $t('ScheduleMeeting.meetingName') }}</label>
                        <InputText id="name" type="text" v-model="meetingModel.name" 
                        :class="{ 'p-invalid': submitted && meetingModel.name?.trim() === '' }"
                        />
                    </div>
                    <div class="field">
                        <label for="description">{{ $t('ScheduleMeeting.meetingDescription') }}</label>
                        <InputText id="description" type="description" v-model="meetingModel.description" 
                        :class="{ 'p-invalid': submitted && meetingModel.description?.trim() === '' }"
                        />
                    </div>

                    <hr class="my-5">
                    
                    <MultiSelect v-model="selectGroup" :options="groupsBySelected" optionLabel="name" :placeholder="$t('ScheduleMeeting.selectGroups')" display="chip" :filter="true"></MultiSelect>

                    <hr class="my-5">
                    <MultiSelect v-model="selectParticipant" :options="participantsBySelected" optionLabel="fullName" :placeholder="$t('ScheduleMeeting.selectModerators')" display="chip" :filter="true"></MultiSelect>
                    <hr class="my-6" v-if="meetingModel.singleOrRepeated == false">

                    <div class="grid formgrid" v-if="meetingModel.singleOrRepeated == false">
                        <div class="col-12 mb-2 lg:col-3 lg:mb-0">
                            <label for="startDate">{{ $t('ScheduleMeeting.meetingDate') }}</label>
                            <input id="startDate" type="date" class="p-inputtext w-full mb-4" v-model="startDate" :min="minDate"
                            :class="{ 'p-invalid': submitted && startDate?.trim() === '' }"
                            />
                        </div>
                        <div class="col-12 mb-2 lg:col-3 lg:mb-0">
                            <label for="startTime">{{ $t('ScheduleMeeting.startTime') }}</label>
                            <input id="startTime" type="time" class="p-inputtext w-full mb-4" v-model="startTime" 
                            :class="{ 'p-invalid': submitted && startTime?.trim() === '' }"
                            />                    
                        </div>
                        <div class="col-12 mb-2 lg:col-3 lg:mb-0">
                            <label for="endTime">{{ $t('ScheduleMeeting.endTime') }}</label>
                            <input id="endTime" type="time" class="p-inputtext w-full mb-4" v-model="endTime" 
                            :class="{ 'p-invalid': submitted && endTime?.trim() === '' }"
                            />                    
                        </div>
                        <div class="col-12 mb-2 lg:col-3 lg:mb-0">
                            <label for="duration">{{ $t('ScheduleMeeting.duration') }}</label>
                            <input id="duration" type="text" class="p-inputtext w-full mb-4" v-model="duration" readonly />                  
                        </div>
                    </div>
                    
                    <hr class="my-5">

                    <div class="flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between gap-3">
                        <div class="text-xl text-900 font-semibold flex align-items-center">
                            <InputSwitch inputId="ingredient1" :model-value="meetingModel.singleOrRepeated"  @click="confirmScheduleOrSingleDate" />
                            <label for="ingredient1" class="ml-2">{{ $t('ScheduleMeeting.recurringMeeting') }}</label>
                            <ConfirmPopup class="confirm-popup-message"></ConfirmPopup>
                            <Button ref="popup" @click="confirm($event, 'ScheduleOrSingleDate')" icon="pi pi-info-circle" text></Button>
                        </div>
                        <div class="w-full md:w-15rem flex align-items-center">
                            <Button :label="$t('ScheduleMeeting.addGuestEmail')" text severity="secondary" @click="toggleGuestEmailVisibility" />
                        </div>
                    </div>

                    <div v-if="isGuestEmailVisible">
                        <hr class="my-5">
                        <div class="p-inputgroup">
                            <Button :label="$t('ScheduleMeeting.add')" icon="pi pi-user-plus" @click="addEmail()" :disabled="!isValidEmail(newEmail)"/>
                            <InputText :placeholder="$t('ScheduleMeeting.guestEmailAddress')" v-model="newEmail"/>
                        </div>
                                
                        <div class="p-3 flex flex-wrap gap-1">
                            <Chip v-for="(tag, i) in emails" :key="i" :label="tag" class="mr-2 py-2 px-3 text-900 font-bold surface-card border-1 surface-border" style="border-radius: 20px">
                                <span class="mr-3">{{ tag }}</span>
                                <span class="flex align-items-center justify-content-center border-1 surface-border bg-gray-100 border-circle cursor-pointer" :style="{ width: '1.5rem', height: '1.5rem' }" @click="onRemoveTags(tag)">
                                    <i class="pi pi-fw pi-times text-black-alpha-60" :style="{ fontSize: '9px' }"></i> 
                                </span>
                            </Chip>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex-1" v-if="activeIndex === 1">
                <div class="card p-fluid">
                    <div class="field">
                        <label for="WelcomeMessage">{{ $t('ScheduleMeeting.welcomeMessage') }}</label>
                        <InputText id="WelcomeMessage" type="text" v-model="meetingModel.welcomeMessage" />
                    </div>
                    <div class="field">
                        <label for="BannerText">{{ $t('ScheduleMeeting.bannerText') }}</label>
                        <InputText id="BannerText" type="text" v-model="meetingModel.bannerText" />
                    </div>
                    <div class="formgrid grid my-5">
                        <div class="field col">
                            <div class="field mb-0">
                                <Dropdown 
                                    v-model="meetingModel.guestPolicy"
                                    :options="guestPolicyOptions" 
                                    optionLabel="label" 
                                    optionValue="value" 
                                />
                            </div>
                        </div>
                        <div class="field col">
                            <div class="field mb-0">
                                <Dropdown 
                                    v-model="meetingModel.recordVisibility"
                                    :options="recordVisibilityOptions" 
                                    optionLabel="label" 
                                    optionValue="value" 
                                />
                            </div>
                        </div>
                    </div>

                    <hr class="my-5">

                    <div class="formgrid grid">
                        <div class="col-12 mb-2 lg:col-4 lg:mb-0 text-800 font-semibold flex align-items-center">
                            <InputSwitch inputId="RecordTF" v-model="meetingModel.recordTF" />
                            <label for="RecordTF" class="ml-2">{{ $t('ScheduleMeeting.recordMeetings') }}</label>
                            <ConfirmPopup class="confirm-popup-message"></ConfirmPopup>
                            <Button ref="popup" @click="confirm($event, 'RecordTF')" icon="pi pi-info-circle" text></Button>
                        </div>

                        <div class="col-12 mb-2 lg:col-4 lg:mb-0 text-800 font-semibold flex align-items-center">
                            <InputSwitch inputId="WebcamsOnlyForModerator" v-model="meetingModel.webcamsOnlyForModerator" />
                            <label for="WebcamsOnlyForModerator" class="ml-2">{{ $t('ScheduleMeeting.webcamsOnlyForModerator') }}</label>
                            <ConfirmPopup class="confirm-popup-message"></ConfirmPopup>
                            <Button ref="popup" @click="confirm($event, 'WebcamsOnlyForModerator')" icon="pi pi-info-circle" text></Button>
                        </div>

                        <div class="col-12 mb-2 lg:col-4 lg:mb-0 text-800 font-semibold flex align-items-center">
                            <InputSwitch inputId="LockSettingsDisableCam" v-model="meetingModel.lockSettingsDisableCam" />
                            <label for="LockSettingsDisableCam" class="ml-2">{{ $t('ScheduleMeeting.disableCameras') }}</label>
                            <ConfirmPopup class="confirm-popup-message"></ConfirmPopup>
                            <Button ref="popup" @click="confirm($event, 'LockSettingsDisableCam')" icon="pi pi-info-circle" text></Button>
                        </div>
                    </div>
                    <hr class="my-3">
                    <div class="formgrid grid">
                        <div class="col-12 mb-2 lg:col-4 lg:mb-0 text-800 font-semibold flex align-items-center">
                            <InputSwitch inputId="LockSettingsDisableMic" v-model="meetingModel.lockSettingsDisableMic" />
                            <label for="LockSettingsDisableMic" class="ml-2">{{ $t('ScheduleMeeting.disableMicrophones') }}</label>
                            <ConfirmPopup class="confirm-popup-message"></ConfirmPopup>
                            <Button ref="popup" @click="confirm($event, 'LockSettingsDisableMic')" icon="pi pi-info-circle" text></Button>
                        </div>

                        <div class="col-12 mb-2 lg:col-4 lg:mb-0 text-800 font-semibold flex align-items-center">
                            <InputSwitch inputId="LockSettingsDisablePrivateChat" v-model="meetingModel.lockSettingsDisablePrivateChat" />
                            <label for="LockSettingsDisablePrivateChat" class="ml-2">{{ $t('ScheduleMeeting.disablePrivateChat') }}</label>
                            <ConfirmPopup class="confirm-popup-message"></ConfirmPopup>
                            <Button ref="popup" @click="confirm($event, 'LockSettingsDisablePrivateChat')" icon="pi pi-info-circle" text></Button>
                        </div>

                        <div class="col-12 mb-2 lg:col-4 lg:mb-0 text-800 font-semibold flex align-items-center">
                            <InputSwitch inputId="LockSettingsDisablePublicChat" v-model="meetingModel.lockSettingsDisablePublicChat" />
                            <label for="LockSettingsDisablePublicChat" class="ml-2">{{ $t('ScheduleMeeting.disablePublicChat') }}</label>
                            <ConfirmPopup class="confirm-popup-message"></ConfirmPopup>
                            <Button ref="popup" @click="confirm($event, 'LockSettingsDisablePublicChat')" icon="pi pi-info-circle" text></Button>
                        </div>
                    </div>
                    <hr class="my-3">

                    <div class="formgrid grid">
                        <div class="col-12 mb-2 lg:col-4 lg:mb-0 text-800 font-semibold flex align-items-center">
                            <InputSwitch inputId="LockSettingsHideUserList" v-model="meetingModel.lockSettingsHideUserList" />
                            <label for="LockSettingsHideUserList" class="ml-2">{{ $t('ScheduleMeeting.hideUserList') }}</label>
                            <ConfirmPopup class="confirm-popup-message"></ConfirmPopup>
                            <Button ref="popup" @click="confirm($event, 'LockSettingsHideUserList')" icon="pi pi-info-circle" text></Button>
                        </div>

                        <div class="col-12 mb-2 lg:col-4 lg:mb-0 text-800 font-semibold flex align-items-center">
                            <InputSwitch inputId="AllowModsToEjectCameras" v-model="meetingModel.allowModsToEjectCameras" />
                            <label for="AllowModsToEjectCameras" class="ml-2">{{ $t('ScheduleMeeting.allowModsToEjectCameras') }}</label>
                            <ConfirmPopup class="confirm-popup-message"></ConfirmPopup>
                            <Button ref="popup" @click="confirm($event, 'AllowModsToEjectCameras')" icon="pi pi-info-circle" text></Button>
                        </div>

                        <div class="col-12 mb-2 lg:col-4 lg:mb-0 text-800 font-semibold flex align-items-center">
                            <InputSwitch inputId="AllowRequestsWithoutSession" v-model="meetingModel.allowRequestsWithoutSession" />
                            <label for="AllowRequestsWithoutSession" class="ml-2">{{ $t('ScheduleMeeting.allowRequestsWithoutSession') }}</label>
                            <ConfirmPopup class="confirm-popup-message"></ConfirmPopup>
                            <Button ref="popup" @click="confirm($event, 'AllowRequestsWithoutSession')" icon="pi pi-info-circle" text></Button>
                        </div>
                    </div>

                    <hr class="my-5">

                    <div class="formgrid grid">
                            <div class="field col">
                                <ProgressSpinner style="width: 25px; height: 25px" strokeWidth="8" fill="transparent" animationDuration=".5s" aria-label="Custom ProgressSpinner" v-if="isUploading"/>
                                <div class="field-checkbox mb-0" v-if="!isUploading">
                                    <!-- Eğer Logo yoksa, "Logo Yükle" butonunu göster -->
                                    <div v-if="!meetingModel.logo" class="field-checkbox mb-0">
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
                                        <!-- Bilgi Butonu -->
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

                                    <!-- Eğer Logo varsa, "Logoyu Sil" butonunu göster -->
                                        <div v-else>
                                            <!-- Logoyu Görüntüle -->
                                            <PrimeImage :src="meetingModel.logo" alt="Logo" style="max-width: 200px;" />
                                            <!-- Logoyu Sil Butonu -->
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
                                    <small class="logo-info-text" v-if="!meetingModel.logo">Max 350x100 & 2 Mb</small>
                            </div>
                        </div>
                </div>
            </div>

            <div class="flex-1" v-if="activeIndex === 2">
                <div class="card">
                    <div class="grid formgrid">
                        <div class="col-12 field mb-4">
                            <div class="p-fluid grid formgrid">
                                <div class="field col-12 md:col-4">
                                    <label for="startTime" class="text-900 text-1xl block font-medium mb-2">{{ $t('ScheduleMeeting.startTime') }}</label>
                                    <input id="startTime" type="time" class="p-inputtext w-full mb-4" v-model="startTime" 
                                    :class="{ 'p-invalid': submitted && startTime?.trim() === '' }"
                                    />
                                </div>
                                <div class="field col-12 md:col-4">
                                    <label for="endTime" class="text-900 text-1xl block font-medium mb-2">{{ $t('ScheduleMeeting.endTime') }}</label>
                                    <input id="endTime" type="time" class="p-inputtext w-full mb-4" v-model="endTime" 
                                    :class="{ 'p-invalid': submitted && endTime?.trim() === '' }"
                                    />
                                </div>
                                <div class="field col-12 md:col-4">
                                    <label for="duration" class="text-900 text-1xl block font-medium mb-2">{{ $t('ScheduleMeeting.duration') }}</label>
                                    <input id="duration" type="text" class="p-inputtext w-full mb-4" v-model="duration" readonly />
                                </div>
                            </div>

                            <div class="p-fluid grid formgrid">
                                <div class="field col-12 md:col-4">
                                    <label for="startDate" class="text-900 text-1xl block font-medium mb-2">{{ $t('ScheduleMeeting.startDate') }}</label>
                                    <input id="startDate" type="date" class="p-inputtext w-full mb-4" v-model="startDate" :min="minDate"
                                    :class="{ 'p-invalid': submitted && startDate?.trim() === '' }"
                                    />
                                </div>
                                <div class="field col-12 md:col-4">
                                    <label for="endDate" class="text-900 text-1xl block font-medium mb-2">{{ $t('ScheduleMeeting.endDate') }}</label>
                                    <input id="endDate" type="date" class="p-inputtext w-full mb-4" v-model="endDate" :min="minDate"
                                    :class="{ 'p-invalid': submitted && endDate?.trim() === '' }"
                                    />
                                </div>
                                <div class="field col-12 md:col-4">
                                    <label for="occurrenceCount" class="text-900 text-1xl block font-medium mb-2">{{ $t('ScheduleMeeting.maxSessions') }}</label>
                                    <input id="occurrenceCount" type="number" class="p-inputtext w-full mb-4" v-model="occurrenceCount" min="0" @input="onOccurrenceCountInput" />
                                </div>
                            </div>
                            <div class="field md:col-15">
                                <div :style="{ height: '4px', background: 'linear-gradient(90deg, var(--primary-color) 0%, rgba(33, 150, 243, 0) 90%)' }"></div>
                            </div>

                            <div class="p-fluid grid formgrid align-items-center">
                                <div class="field col-12 md:col-4">
                                    <label for="recurrenceType" class="text-900 text-1xl block font-medium mb-2">{{ $t('ScheduleMeeting.recurrenceType') }}</label>
                                    <select id="recurrenceType" class="p-inputtext w-full mb-4" v-model="recurrenceType">
                                        <option value="daily">{{ $t('ScheduleMeeting.daily') }}</option>
                                        <option value="weekly">{{ $t('ScheduleMeeting.weekly') }}</option>
                                        <option value="monthly">{{ $t('ScheduleMeeting.monthly') }}</option>
                                        <option value="yearly">{{ $t('ScheduleMeeting.yearly') }}</option>
                                    </select>
                                </div>
                                <div class="field col-12 md:col-4">
                                    <div class="field-checkbox mb-0 large-input">
                                        <input type="checkbox" id="excludeWeekends" v-model="excludeWeekends" class="align-middle" />
                                        <label for="excludeWeekends" class="large-label bold-label align-middle ml-2">{{ $t('ScheduleMeeting.excludeWeekends') }}</label>
                                    </div>
                                </div>
                                <div class="field col-12 md:col-4">
                                    <div class="field-checkbox mb-0 large-input">
                                        <input type="checkbox" id="isInfinite" v-model="isInfinite" class="align-middle" />
                                        <label for="isInfinite" class="large-label bold-label align-middle ml-2">{{ $t('ScheduleMeeting.infinite') }}</label>
                                    </div>
                                </div>
                            </div>

                            <div v-if="recurrenceType === 'daily'" class="flexreccurence align-items-center">
                                <label for="dailyInterval" class="text-900 text-2xl block font-medium mb-2">{{ $t('ScheduleMeeting.every') }}</label>
                                <input id="dailyInterval" type="number" class="p-inputtext small-input ml-2 mr-2" v-model="dailyInterval" min="1"/>
                                <span class="text-900 text-2xl block font-medium mb-2">{{ $t('ScheduleMeeting.days') }}</span>
                            </div>

                            <div v-if="recurrenceType === 'weekly'" class="flexreccurence align-items-center">
                                <label for="weeklyInterval" class="text-900 text-2xl block font-medium mb-2">{{ $t('ScheduleMeeting.every') }}</label>
                                <input id="weeklyInterval" type="number" class="p-inputtext small-input ml-2 mr-2" v-model="weeklyInterval" min="1"/>
                                <span class="text-900 text-2xl block font-medium mb-2">{{ $t('ScheduleMeeting.weeksOn') }}</span>
                            </div>

                            <div v-if="recurrenceType === 'weekly'">
                                <div class="p-fluid grid formgrid align-items-center">
                                    <div class="field col-12 md:col-12">
                                        <div class="week-days-container week-large-input">
                                            <div class="week-day-item">
                                                <input type="checkbox" id="monday" value="Monday" v-model="weekDays" />
                                                <label for="monday" class="large-label bold-label">{{ $t('ScheduleMeeting.monday') }}</label>
                                            </div>
                                            <div class="week-day-item">
                                                <input type="checkbox" id="tuesday" value="Tuesday" v-model="weekDays" />
                                                <label for="tuesday" class="large-label bold-label">{{ $t('ScheduleMeeting.tuesday') }}</label>
                                            </div>
                                            <div class="week-day-item">
                                                <input type="checkbox" id="wednesday" value="Wednesday" v-model="weekDays" />
                                                <label for="wednesday" class="large-label bold-label">{{ $t('ScheduleMeeting.wednesday') }}</label>
                                            </div>
                                            <div class="week-day-item">
                                                <input type="checkbox" id="thursday" value="Thursday" v-model="weekDays" />
                                                <label for="thursday" class="large-label bold-label">{{ $t('ScheduleMeeting.thursday') }}</label>
                                            </div>
                                            <div class="week-day-item">
                                                <input type="checkbox" id="friday" value="Friday" v-model="weekDays" />
                                                <label for="friday" class="large-label bold-label">{{ $t('ScheduleMeeting.friday') }}</label>
                                            </div>
                                            <div class="week-day-item">
                                                <input type="checkbox" id="saturday" value="Saturday" v-model="weekDays" />
                                                <label for="saturday" class="large-label bold-label">{{ $t('ScheduleMeeting.saturday') }}</label>
                                            </div>
                                            <div class="week-day-item">
                                                <input type="checkbox" id="sunday" value="Sunday" v-model="weekDays" />
                                                <label for="sunday" class="large-label bold-label">{{ $t('ScheduleMeeting.sunday') }}</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div v-if="recurrenceType === 'monthly'">
                                <div class="p-fluid">
                                    <div class="formgrid grid">
                                        <div class="field col">
                                            <label for="monthlyType" class="text-900 text-2x1 block font-medium mb-2">{{ $t('ScheduleMeeting.recurrenceType') }}</label>
                                            <select id="monthlyType" class="p-inputtext w-full mb-4" v-model="monthlyType">
                                                <option value="day">{{ $t('ScheduleMeeting.dayOfMonth') }}</option>
                                                <option value="week">{{ $t('ScheduleMeeting.weekOfMonth') }}</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div v-if="recurrenceType === 'monthly'">
                                <div class="p-fluid">
                                    <div class="formgrid grid">
                                        <div class="field col">
                                            <div v-if="monthlyType === 'day'" class="flex align-items-center">
                                                <label for="monthlyDay" class="text-900 text-2xl block font-medium mb-2">{{ $t('ScheduleMeeting.everyMonth') }}</label>
                                                <input id="monthlyDay" type="number" class="p-inputtext small-input ml-2 mr-2" v-model="monthlyDay" min="1"/>
                                                <span class="text-900 text-2xl block font-medium mb-2">{{ $t('ScheduleMeeting.onDay') }}</span>
                                            </div>

                                            <div v-if="monthlyType === 'week'">
                                                <label for="monthlyWeek" class="text-900 text-2xl block font-medium mb-2">{{ $t('ScheduleMeeting.everyMonthOnWeek') }}</label>
                                                <select id="monthlyWeek" class="p-inputtext w-full mb-4" v-model="monthlyWeek">
                                                    <option value="1">{{ $t('ScheduleMeeting.first') }}</option>
                                                    <option value="2">{{ $t('ScheduleMeeting.second') }}</option>
                                                    <option value="3">{{ $t('ScheduleMeeting.third') }}</option>
                                                    <option value="4">{{ $t('ScheduleMeeting.fourth') }}</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="field col">
                                            <div v-if="monthlyType === 'week'">
                                                <label for="monthlyWeekday" class="text-900 text-2xl block font-medium mb-2">{{ $t('ScheduleMeeting.dayOfWeek') }}</label>
                                                <select id="monthlyWeekday" class="p-inputtext w-full mb-4" v-model="monthlyWeekday">
                                                    <option value="Monday">{{ $t('ScheduleMeeting.monday') }}</option>
                                                    <option value="Tuesday">{{ $t('ScheduleMeeting.tuesday') }}</option>
                                                    <option value="Wednesday">{{ $t('ScheduleMeeting.wednesday') }}</option>
                                                    <option value="Thursday">{{ $t('ScheduleMeeting.thursday') }}</option>
                                                    <option value="Friday">{{ $t('ScheduleMeeting.friday') }}</option>
                                                    <option value="Saturday">{{ $t('ScheduleMeeting.saturday') }}</option>
                                                    <option value="Sunday">{{ $t('ScheduleMeeting.sunday') }}</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div v-if="recurrenceType === 'yearly'">
                                <div class="p-fluid">
                                    <div class="formgrid grid">
                                        <div class="field col">
                                            <label for="yearlyMonth" class="text-900 text-2xl block font-medium mb-2">{{ $t('ScheduleMeeting.monthOfYear') }}</label>
                                            <select id="yearlyMonth" class="p-inputtext w-full mb-4" v-model="yearlyMonth">
                                                <option value="0">{{ $t('ScheduleMeeting.january') }}</option>
                                                <option value="1">{{ $t('ScheduleMeeting.february') }}</option>
                                                <option value="2">{{ $t('ScheduleMeeting.march') }}</option>
                                                <option value="3">{{ $t('ScheduleMeeting.april') }}</option>
                                                <option value="4">{{ $t('ScheduleMeeting.may') }}</option>
                                                <option value="5">{{ $t('ScheduleMeeting.june') }}</option>
                                                <option value="6">{{ $t('ScheduleMeeting.july') }}</option>
                                                <option value="7">{{ $t('ScheduleMeeting.august') }}</option>
                                                <option value="8">{{ $t('ScheduleMeeting.september') }}</option>
                                                <option value="9">{{ $t('ScheduleMeeting.october') }}</option>
                                                <option value="10">{{ $t('ScheduleMeeting.november') }}</option>
                                                <option value="11">{{ $t('ScheduleMeeting.december') }}</option>
                                            </select>
                                        </div>
                                        <div class="field col">
                                            <label for="yearlyMonthDay" class="text-900 text-2xl block font-medium mb-2">{{ $t('ScheduleMeeting.onDay') }}</label>
                                            <input id="yearlyMonthDay" type="number" class="p-inputtext w-full mb-4" v-model="yearlyMonthDay" min="1" max="31"/>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button @click="openConfirmation" class="p-button p-component p-button-primary p-button-text-icon-left mt-5">
                                <i class="pi pi-check p-button-icon-left"></i><span class="p-button-label">{{ $t('ScheduleMeeting.calculate') }}</span>
                            </button>
                        </div>

                        <div class="col-12">
                            <div v-if="calculatedDates.length > 0">
                                <h4>{{ $t('ScheduleMeeting.calculatedDates') }}</h4>
                                <div class="p-3 flexreccurence flex-wrap gap-1">
                                    <Chip v-for="(tag, i) in calculatedDates" :key="i" :label="tag" class="mr-2 py-2 px-3 text-900 font-bold surface-card border-1 surface-border" style="border-radius: 20px">
                                        <span class="mr-3">{{ tag }}</span>
                                        <span class="flex align-items-center justify-content-center border-1 surface-border bg-gray-100 border-circle cursor-pointer" :style="{ width: '1.5rem', height: '1.5rem' }" @click="onRemoveTagsRecurrence(tag)">
                                            <i class="pi pi-fw pi-times text-black-alpha-60" :style="{ fontSize: '9px' }"></i> 
                                        </span>
                                    </Chip>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <Dialog :header="$t('ScheduleMeeting.calculate')" v-model:visible="calculateDialog" :style="{ width: '450px' }" :modal="true">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span class="text-xl font-bold" v-html="$t('ScheduleMeeting.calculateDialog')"></span>
            </div>
            <template #footer>
                <Button :label="$t('group.form.no')" icon="pi pi-times" @click="closeConfirmation" text />
                <Button :label="$t('group.form.yes')" icon="pi pi-check" @click="confirmAndCalculate" text autofocus />
            </template>
        </Dialog>

        <Dialog :header="$t('ScheduleMeeting.scheduleOrSingleDialogHeader')" v-model:visible="scheduleOrSingleDateDialog" :style="{ width: '450px' }" :modal="true">
            <div class="flex align-items-center justify-content-center">
            <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
            <!-- Koşullu metni buraya taşıdık -->
            <span class="text-xl font-bold" v-html="meetingModel.scheduleOrSingleDate ? $t('ScheduleMeeting.scheduleOrSingleDialogFalse') : $t('ScheduleMeeting.scheduleOrSingleDialogTrue')"></span>
            </div>
            <template #footer>
            <Button :label="$t('group.form.no')" icon="pi pi-times" @click="closeScheduleOrSingleDateDialog" text />
            <Button :label="$t('group.form.yes')" icon="pi pi-check" @click="toggleScheduleOrSingleDate" text autofocus />
            </template>
        </Dialog>

    </div>
</template>

<style>

.p-inputtext.p-invalid,
input.p-invalid {
  border: 1px solid red !important;
}

/* PrimeVue InputText bileşenlerinde p-invalid sınıfını hedefle */
.p-inputtext.p-invalid {
  border: 1px solid red !important;
  box-shadow: 0 0 0 0.2rem rgba(220,53,69,0.25);
}

/* Standart input elementlerinde p-invalid sınıfını hedefle */
input.p-invalid {
  border: 1px solid red !important;
  box-shadow: 0 0 0 0.2rem rgba(220,53,69,0.25);
}

.confirm-popup-message {
    white-space: pre-line;
}

.custom-multiselect {
  width: 100%;
  max-width: 90rem; /* Adjust this value as needed */
}

@media (max-width: 768px) {
  .custom-multiselect {
    max-width: 100%;
  }
}

.multiselect-container .p-multiselect {
  display: flex;
  flex-wrap: wrap;
}

.multiselect-container .p-multiselect .p-multiselect-label-container {
  white-space: normal;
}

.multiselect-container .p-multiselect .p-multiselect-token {
  flex-shrink: 0;
  max-width: 100%;
}

.multiselect-container .p-multiselect .p-multiselect-items {
  display: flex;
  flex-wrap: wrap;
}

.multiselect-container .p-multiselect .p-multiselect-items .p-multiselect-item {
  flex: 1 0 auto;
  white-space: nowrap;
}


/* #region RecurrenceStyle */
.p-fluid .field label {
  display: block;
  margin-bottom: 0.5rem;
}

.p-inputtext {
  font-size: 1.2em; /* Metin boyutunu ayarlayın */
}

.formgrid {
  align-items: start; /* Etiketlerin ve giriş alanlarının hizalanmasını sağlar */
}


/* Form elemanlarının boyutlarını ve yazı tiplerini ayarlamak için CSS sınıfları */
.large-input input {
  width: 20px; /* Checkbox boyutunu ayarlayın */
  height: 20px;
  vertical-align: middle; /* Checkbox'ın ortalanmasını sağlar */

}

.large-label {
  font-size: 1.2rem; /* Yazı tipini büyütün */
  margin-left: 10px; /* Checkbox ile yazı arasında boşluk bırakın */
    vertical-align: middle; /* Etiketin ortalanmasını sağlar */
}

.field-checkbox {
  display: flex;
  align-items: center; /* Checkbox ve etiketi aynı hizaya getirin */
  
}

.bold-label {
  font-weight: 700; /* Yazıyı ekstra kalın yapın */
}

/* Form elemanlarının boyutlarını ve yazı tiplerini ayarlamak için CSS sınıfları */
.large-input input {
  width: 28px; /* Checkbox boyutunu ayarlayın */
  height: 28px;
}

.week-large-input input {
  width: 20px; /* Checkbox boyutunu ayarlayın */
  height: 20px;
}

.field-checkbox {
  display: flex;
  align-items: center; /* Checkbox ve etiketi aynı hizaya getirin */
}

.ml-2 {
  margin-left: 0.5rem; /* Checkbox ile yazı arasında boşluk bırakın */
}

.formgrid {
  align-items: start; /* Etiketlerin ve giriş alanlarının hizalanmasını sağlar */
}

.flexreccurence {
  display: flex;
  align-items: center;
}

.small-input {
  width: 60px; /* Input alanını küçültün */
  font-size: 1.2em; /* Metin boyutunu ayarlayın */
  padding: 0.25rem; /* İç boşlukları ayarlayın */
}

.mr-2 {
  margin-right: 0.5rem; /* Sağ boşluk ekleyin */
}

.week-days-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem; /* Checkbox'lar arasındaki mesafeyi ayarlar */
  align-items: center;
}

.week-day-item {
  display: flex;
  align-items: center;
  margin-right: 1.5rem; /* Bir sonraki checkbox ile arasındaki mesafeyi ayarlar */
  margin-bottom: 0.5rem; /* Mobil görünümde satırlar arasında boşluk bırakır */
}

.week-day-item input[type="checkbox"] {
  margin-right: 0.1rem; /* Checkbox ile yazısı arasındaki mesafeyi ayarlar */
}

.week-day-item label {
  font-size: 1.1rem; /* Yazı tipini büyütün */
  font-weight: 600; /* Yazıyı kalın yapın */
}

select.p-inputtext {
  appearance: none; /* Varsayılan stil kaldırılır */
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns%3D%22http://www.w3.org/2000/svg%22 width%3D%2216%22 height%3D%2216%22 fill%3D%22currentColor%22 class%3D%22bi bi-chevron-down%22 viewBox%3D%220 0 16 16%22%3E%3Cpath fill-rule%3D%22evenodd%22 d%3D%22M1.646 5.646a.5.5 0 0 1 .708 0L8 11.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z%22/%3E%3C/svg%3E');
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2rem; /* Sağda boşluk bırakılır */
}
/* #endregion recurrenceStyle */
</style>