<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import trLocale from '@fullcalendar/core/locales/tr';

import { useToast } from 'primevue/usetoast';
import { useUserCalendarAndReport } from '@/stores/usercalendarandreport'
import { useMeetingStore } from '@/stores/meeting'
import { format, parseISO, isValid } from 'date-fns';
import { useCompletedMeetingStore } from '@/stores/completedmeeting'
import { useBbbSessionStore } from '@/stores/bbbsession'
import { useLayoutStore } from '@/stores/layout';

import { useRouter } from 'vue-router';
import {useI18n} from "vue-i18n";

const {t,te} = useI18n();
const router = useRouter();
const layoutStore = useLayoutStore();

const bbbSessionStore = useBbbSessionStore()

const completedMeetingStore = useCompletedMeetingStore()

const meetingStore = useMeetingStore()
const selectGroup = ref([]);  // Grupları saklamak için reaktif bir referans
const groupsBySelected = ref([]);  // Grupları saklamak için reaktif bir referans

const startMeetingDialog = ref(false);

const userCalenderAndReportStore = useUserCalendarAndReport();

const toast = useToast();
const today = new Date();

let clickedEvent = null;
const view = ref('display');
const showDialog = ref(false);

const events = ref([]);

const changedEvent = ref({
    title: '',
    start: '',
    end: '',
    description: '',
    starttime:'',
    endtime:'',
    meetingGroupIds: [],
    meetingModeratorList: [],
    meetingScheduleDateList: []
});

const language =  ref (localStorage.getItem("language"));

const options = ref({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialDate: today.toISOString().split('T')[0],
    height: 720,
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    editable: false,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    events: events.value,
    eventClick: (e) => onEventClick(e),
    select: (e) => onDateSelect(e),
    locales: [trLocale], // Dil dosyasını burada belirtiyoruz
    locale: language.value == null ? 'en': language.value.split("-")[0], // Türkçe dilini ayarlıyoruz
    buttonText: {
        today: t("Calendar.today"),  // 'Bugün'
        month: t("Calendar.month"),  // 'Ay'
        week: t("Calendar.week"),    // 'Hafta'
        day: t("Calendar.day")       // 'Gün'
    },
    slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // 24 saatlik format
    },
    eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // 24 saatlik format
    }
});

onMounted(async () => {
    layoutStore.setLoading(true);
    try {
        await getEvents();
        options.value = { ...options.value, events: events.value };

        await meetingStore.getSelectedGroupByUserId();
        groupsBySelected.value = [...meetingStore.selectedgroup.value];

        await getMeetingsSummary();

        // API'den toplam kullanıcı, grup, gün bilgilerini çekelim
        const response = await userCalenderAndReportStore.getUserTotalCountByUserId();
        if (response.success) {
            totalActiveUsers.value = response.value.totalActiveUserCount || totalActiveUsers.value;  // Eğer API'den veri gelirse kullan, gelmezse varsayılanı kullan
            totalGroups.value = response.value.totalActiveGroup || totalGroups.value;
            daysLeftInPackage.value = response.value.totalDay || daysLeftInPackage.value;
            userTimeZoneId.value = response.value.timeZoneId || null;
        }
    } catch (error) {
        console.error('An error occurred:', error);
        // Bu aşamada hata yakalamayı minimal tutuyoruz, çünkü total count verisi gelmezse problem olmayacağını belirttiniz
    } finally {
        layoutStore.setLoading(false);
    }
});



const selectedMeeting = ref({});


const startMeeting = async (meeting) => {
    layoutStore.setLoading(true);  // Yükleme durumunu aktif et
    const meetingId = meeting.id || changedEvent.value.eventId;
    if (!meetingId) {
        console.error('No meeting ID provided.');
        toast.add({ severity: 'error', summary: t('Errors.error'), detail: t('Errors.noMeetingId'), life: 3000 });
        layoutStore.setLoading(false);  // Yükleme durumunu kapat
        return;  // ID yoksa fonksiyonu sonlandırın
    }

    const meetingDetails = await completedMeetingStore.getCompletedMeetingByMeetingId(meetingId);

    layoutStore.setLoading(false);  // Yükleme durumunu pasif et

    if (meetingDetails && meetingDetails.success) {
        selectedMeeting.value = meetingDetails.value;
        loginMeetingModel.value.completedMeetingGuid = selectedMeeting.value.completedGuid;
        startMeetingDialog.value = true;
    } else {
        console.error('Meeting data could not be fetched:', meetingDetails.message);
        toast.add({ severity: 'error', summary: t('Errors.error'), detail: t('Errors.meetingDataFetchFailed'), life: 3000 });
    }
};

const scheduleMeetingModel = ref({}); // scheduleMeetingModel'i başlatın

const createScheduleMeeting = () => {
    layoutStore.setLoading(true);

    scheduleMeetingModel.value.meetingId = changedEvent.value.eventId;
    scheduleMeetingModel.value.meetingExplain = changedEvent.value.description; // MeetingExplain alanını anlamlı bir şekilde doldurun
    scheduleMeetingModel.value.meetingType = 2;
    scheduleMeetingModel.value.guestPolicy = selectedGuestPolicy.value;
    bbbSessionStore
        .createCompletedMeeting(scheduleMeetingModel.value)
        .then((response) => {
            if (response.success) {
                toast.add({ severity: 'success', summary: 'Başarılı!', detail: 'Kayıt başarıyla tamamlandı.', life: 3000 });
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



// #region COPYMEETINGLINK
const copyMeetingName = () => {
        if (selectedMeeting.value.name) {
            navigator.clipboard.writeText(selectedMeeting.value.guestLink)
                .then(() => {
                    toast.add({severity:'success', summary: t('Success.success'), detail: t('Success.linkCopied'), life: 3000});
                })
                .catch(err => {
                    toast.add({severity:'error', summary: t('Errors.error'), detail: t('Errors.linkCopyFailed'), life: 3000});
                });
        } else {
            console.error('No name to copy');
            toast.add({severity:'error', summary: t('Errors.error'), detail: t('Errors.noLinkFound'), life: 3000});
            // Eğer kopyalanacak bir isim yoksa, bu durumu da yönetebilirsiniz.
        }
    };
//#endregion COPYMEETINGLINK

const loginMeetingModel = ref({ appUserId: '1', completedMeetingGuid: '', meetingType: '1', meetingEntryType: '1', guestFullName: 'selam' })

const loginMeeting = async () => {
  layoutStore.setLoading(true);
  try {
    const response = await bbbSessionStore.loginCompletedMeeting(loginMeetingModel.value);
    layoutStore.setLoading(false);
    if (response.success && response.value.link) {
      toast.add({ severity: 'success', summary: t('Success.success'), detail: t('Success.meetingStarted'), life: 3000 });
      window.open(response.value.link, '_blank');
    } else {
      toast.add({ severity: 'error', summary: t('Errors.error'), detail: t('Errors.meetingStartFailed'), life: 3000 });
    }
  } catch (error) {
    layoutStore.setLoading(false);
    console.error('API Error:', error);
    toast.add({ severity: 'error', summary: t('Errors.error'), detail: t('Errors.meetingStartError'), life: 3000 });
  }
};




const submitted = ref(false);
const validateForm = () => {
    submitted.value = true;
    return changedEvent.value.title.trim() !== '' &&
        changedEvent.value.description.trim() !== '' &&
        changedEvent.value.start != null &&
        changedEvent.value.end != null &&
        changedEvent.value.starttime != null &&
        changedEvent.value.endtime != null;
};

const calculatedDates = ref([]); // Hesaplanan tarihler

const saveMeeting = async () => {

    if (!validateForm()) {
        layoutStore.setLoading(false);
        return;
    }

    try {
        // Ensure required fields are properly mapped and not empty
        changedEvent.value.meetingGroupIds = selectGroup.value.length > 0 ? selectGroup.value.map(group => group.id) : null;

        let formattedScheduleDates = [];

        // If calculatedDates has values, format them for the payload
        if (calculatedDates.value.length > 0) {
            formattedScheduleDates = calculatedDates.value.map(date => {
                if (isValid(parseISO(date))) {
                    return format(parseISO(date), 'yyyy-MM-dd');
                }
                return format(new Date(date), 'yyyy-MM-dd'); // Attempt to format if parseISO fails
            });
        } else if (changedEvent.value.start && changedEvent.value.end) {
            // Calculate dates between start and end dates
            let startDate = new Date(changedEvent.value.start);
            let endDate = new Date(changedEvent.value.end);

            while (startDate <= endDate) {
                formattedScheduleDates.push(format(new Date(startDate), 'yyyy-MM-dd'));
                startDate.setDate(startDate.getDate() + 1);
            }
        }




        // Map required fields for the payload
        const payload = {
            appUserId: 0,
            name: changedEvent.value.title || null,
            description: changedEvent.value.description || null,
            welcomeMessage: null,
            recordTF: null,
            startDate: changedEvent.value.start ? format(new Date(changedEvent.value.start), 'yyyy-MM-dd') : null,
            startTime: changedEvent.value.starttime ? format(new Date(changedEvent.value.starttime), 'HH:mm:ss') : null,
            endTime: changedEvent.value.endtime ? format(new Date(changedEvent.value.endtime), 'HH:mm:ss') : null,
            endDate: changedEvent.value.end ? format(new Date(changedEvent.value.end), 'yyyy-MM-dd') : null,
            duration: null,
            webcamsOnlyForModerator: null,
            bannerText: null,
            lockSettingsDisableCam: null,
            lockSettingsDisableMic: null,
            lockSettingsDisablePrivateChat: null,
            lockSettingsDisablePublicChat: null,
            lockSettingsHideUserList: null,
            allowModsToEjectCameras: null,
            allowRequestsWithoutSession: null,
            meetingCameraCap: null,
            logo: null,
            recordVisibility: null,
            GuestPolicy: selectedGuestPolicy.value,
            meetingGroupIds: changedEvent.value.meetingGroupIds,
            singleOrRepeated: false,
            meetingModeratorListIds: [],
            meetingGuestEmailLists: [],
            meetingScheduleDateListDates: formattedScheduleDates.length > 0 ? formattedScheduleDates : null
        };

        console.log(payload);

        const meetingCreateData = await meetingStore.addMeeting(payload);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Meeting saved successfully.', life: 3000 });

          // Update events after saving
          await getEvents();

            // Close dialog and refresh calendar events
            showDialog.value = false;
            options.value = { ...options.value, events: events.value };

    } catch (error) {
        console.error('Error saving meeting:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save meeting.', life: 3000 });
    }
};



const getEvents = async () => {
    try {
        const response = await userCalenderAndReportStore.getUserCalendarPageByUserId();
        if (response && response.value) {
            events.value = response.value.map(event => {
                const startDate = new Date(event.startDateAndTime);
                const endDate = new Date(event.endDateAndTime);

                // Zaman dilimi ayarlamasını kaldırdık
                const localStartDate = startDate;
                const localEndDate = endDate;

                // Today's date check
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Set today's date to midnight for comparison

                const isToday = localStartDate.toDateString() === today.toDateString();

                // Determine the className based on meeting type and whether it's today
                let className = '';
                if (event.meetingType === 4) {
                    className = 'meeting-type-4'; // Type 4 is prioritized
                } else if (isToday) {
                    className = 'event-today'; // Combine Type 1 and today's event
                } else {
                    className = `meeting-type-${event.meetingType}`;
                }

                return {
                    id: event.id + '-' + event.startDateAndTime, // Orijinal id alanı
                    eventId: event.id, // Benzersiz id oluşturma
                    title: event.title,
                    description: event.description,
                    start: localStartDate,
                    end: localEndDate,
                    allDay: false,
                    className: className // CSS sınıfı ekleme
                };
            });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error!', detail: 'Etkinlikler yüklenirken bir hata oluştu.', life: 3000 });
    }
};




const isEventToday = ref(false);

watch(() => [clickedEvent, view.value], () => {
    isEventToday.value = clickedEvent && clickedEvent.classNames && clickedEvent.classNames.includes('event-today') && view.value === 'display';
}, { immediate: true });

const onEventClick = (e) => {
    clickedEvent = e.event;
    let plainEvent = e.event.toPlainObject({ collapseExtendedProps: true, collapseColor: true });
    view.value = 'display';
    showDialog.value = true;

    changedEvent.value = { ...plainEvent, ...clickedEvent.extendedProps };
    changedEvent.value.start = clickedEvent.start;
    changedEvent.value.end = clickedEvent.end ? clickedEvent.end : clickedEvent.start;
    changedEvent.value.id = clickedEvent.eventId; // ID bilgisini ekleyin
    changedEvent.value.starttime = clickedEvent.start;
    changedEvent.value.endtime = clickedEvent.end ? clickedEvent.end : clickedEvent.start;

    isEventToday.value = clickedEvent.classNames && 
                     (clickedEvent.classNames.includes('event-today') || clickedEvent.classNames.includes('meeting-type-4')) && 
                     view.value === 'display';

};

const onDateSelect = (e) => {
    const startDate = new Date(e.startStr);
    const endDate = new Date(e.endStr);
    endDate.setDate(endDate.getDate() - 1);
    selectGroup.value = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
        toast.add({ severity: 'info', summary: 'Info!', detail: 'Günün tarihinden öncesine toplantı oluşturulamaz.', life: 3000 });
        return;
    }

    view.value = 'new';
    showDialog.value = true;

    // Varsayılan olarak mevcut zamanı ve bir saat sonrasını ayarla
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + (60 * 60 * 1000));

    changedEvent.value = {
        start: startDate,
        end: endDate,
        starttime: now,
        endtime: oneHourLater,
        title: '',
        description: '',
        allDay: false,
        id: null
    };
};


const formattedDateTime = ref(''); // Yeni reaktif değişken tanımlandı


watch(
  [() => changedEvent.value.start, () => changedEvent.value.end, () => changedEvent.value.starttime, () => changedEvent.value.endtime],
  () => {
    const startDate = new Date(changedEvent.value.start);
    const endDate = new Date(changedEvent.value.end);
    const startTime = changedEvent.value.starttime 
            ? isNaN(new Date(changedEvent.value.starttime).getTime()) 
                ? '00:00'
                : new Date(changedEvent.value.starttime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) 
            : '';

            const endTime = changedEvent.value.endtime 
            ? isNaN(new Date(changedEvent.value.endtime).getTime()) 
                ? '00:00'
                : new Date(changedEvent.value.endtime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) 
            : '';


    // Eğer tarih veya saat bilgisi eksikse cümleyi boş bırak
    if (!changedEvent.value.start || !changedEvent.value.end || !changedEvent.value.starttime || !changedEvent.value.endtime) {
      formattedDateTime.value = '';
      return;
    }

    const startDateString = startDate.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
    const endDateString = endDate.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

    const daysArray = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      daysArray.push(currentDate.toLocaleDateString('tr-TR', { day: 'numeric' }));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const daysString = daysArray.join(',');
    const monthYearString = startDate.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });

    if (daysArray.length > 15) {
      formattedDateTime.value = `${startDateString} - ${endDateString} Tarihlerinde, saat ${startTime ?? '00:00'} ile ${endTime} arasında.`;
    } else if (daysArray.length === 1) {
      formattedDateTime.value = `${startDateString} Tarihinde, saat ${startTime} ile ${endTime} arasında.`;
    } else {
      formattedDateTime.value = `${daysString} ${monthYearString} Tarihlerinde, saat ${startTime} ile ${endTime} arasında.`;
    }
  }
);


const totalPastMeetings = ref(0);
const userTimeZoneId = ref("");
const totalFutureMeetings = ref(0);
const totalTodayMeetings = ref(0);
const totalActiveUsers = ref(0);
const totalGroups = ref(0);
const daysLeftInPackage = ref(0);

const meetingInfoCards = computed(() => [
  { label: t("Cards.activeUsers"), value: `${totalActiveUsers.value}`, icon: 'pi pi-users', iconColor: 'blue' },
  { label: t("Cards.groups"), value: `${totalGroups.value}`, icon: 'pi pi-globe', iconColor: 'green' },
  { label: t("Cards.pastFtureMeetings"), value: `${totalPastMeetings.value}+${totalFutureMeetings.value}=${totalPastMeetings.value + totalFutureMeetings.value}`, icon: 'pi pi-calendar-plus', iconColor: totalPastMeetings.value ? 'purple' : 'grey' },
  { label: t("Cards.todaysMeeting"), value: totalTodayMeetings.value, icon: 'pi pi-calendar', iconColor: totalTodayMeetings.value ? 'red' : 'grey' },
//   { label: t("Cards.smsCount"), value: totalSmsCount.value, icon: 'pi pi-envelope', iconColor: 'blue' },
  { label: t("Cards.packageDaysLeft"), value: daysLeftInPackage.value, icon: 'pi pi-clock', iconColor: 'green' },
]);

const getMeetingsSummary = async () => {
    try {
        const response = await userCalenderAndReportStore.getUserCalendarPageByUserId();
        if (response && response.value) {
            totalPastMeetings.value = response.value.filter(event => event.meetingType === 2 || event.meetingType === 3).length;
            totalFutureMeetings.value = response.value.filter(event => event.meetingType === 1 || event.meetingType === 4 || event.meetingType === 5).length;
            totalTodayMeetings.value = response.value.filter(event => event.meetingType === 4 || event.meetingType === 5).length;
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error!', detail: 'Etkinlik özetleri yüklenirken bir hata oluştu.', life: 3000 });
    }
};



const redirectToDetailMeeting = () => {
  router.push('/meeting/createmeetingv2');
};

const selectedGuestPolicy = ref(2); // Varsayılan olarak "Tümü" seçili
const guestPolicyOptions = ref([
    { label: t('meeting.alwaysAccept'), value: 0 },
    { label: t('meeting.alwaysDeny'), value: 1 },
    { label: t('meeting.askModerator'), value: 2 }
]);

const goToUserSettings = async () => {
    await router.push("/authorization/detailsetting");
};

</script>

<template>
    <div class="grid">
        <div class="col-12">

            <div @click="goToUserSettings" style="cursor: pointer;" v-if="!userTimeZoneId">
                <Message severity="info" :closable="false">{{ t('Calendar.timeZoneError') }}</Message>
            </div>

            <div class="surface-section px-4 py-1 md:px-1 lg:px-1 mb-1">
                <div class="grid-container mb-2">
                <div v-for="info in meetingInfoCards" :key="info.label" class="grid-item surface-card shadow-3 p-2 border-round">
                    <i :class="info.icon" :style="{ color: info.iconColor }" class="text-2xl mb-2"></i>
                    <div class="text-900 text-xl font-medium">{{ info.value }}</div>
                    <div class="text-600">{{ info.label }}</div>
                </div>
                </div>
                <div :style="{
                      height: '4px', 
                      width: '100%', 
                      background: 'linear-gradient(90deg, #ffa500 30%, #0a74da 70%)'
                      }"></div>
            </div>



            <div class="card">
                <FullCalendar :events="events" :options="options" />

                <Dialog
                    v-model:visible="showDialog"
                    :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
                    :style="{ width: view !== 'display' ? '56rem' : '36rem', 'max-height': view !== 'display' ? '80vh' : '60vh', overflow: 'auto' }"
                    modal
                    closable
                    @onHide="view = ''"
                >
                    <template #header>
                        <span class="text-900 font-semibold text-xl">{{ view === 'display' ? changedEvent.title : view === 'new' ? 'New Meeting' : 'Edit Meeting' }}</span>
                    </template>

                    <div v-if="view === 'display'">
                        <span class="text-900 font-semibold block mb-2"> {{ t('Calendar.description') }} </span>
                        <span class="block mb-3">{{ changedEvent.description }}</span>

                        <hr class="my-3">

                        <div class="grid">
                            <div class="col-6">
                                <div class="text-900 font-semibold mb-2">{{ t('Calendar.start') }}</div>
                                <p class="flex align-items-center m-0">
                                    <i class="pi pi-fw pi-calendar text-700 mr-2"></i>
                                    <span>{{ t('Calendar.date') }} {{ changedEvent.start.toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) }}</span>

                                </p>
                                <p class="flex align-items-center m-0">
                                    <i class="pi pi-fw pi-clock text-700 mr-2"></i>
                                    <span>{{ t('Calendar.time') }} {{ changedEvent.starttime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }}</span>
                                </p>
                            </div>
                            <div class="col-6">
                                <div class="text-900 font-semibold mb-2">{{ t('Calendar.end') }}</div>
                                <p class="flex align-items-center m-0">
                                    <i class="pi pi-fw pi-calendar text-700 mr-2"></i>
                                    <span>{{ t('Calendar.date') }} {{ changedEvent.end.toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) }}</span>
                                </p>
                                <p class="flex align-items-center m-0">
                                    <i class="pi pi-fw pi-clock text-700 mr-2"></i>
                                    <span>{{ t('Calendar.time') }} {{ changedEvent.endtime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }}</span>
                                </p>
                                <p class="flex align-items-center m-0">
                                    <i class="pi pi-fw pi-clock text-700 mr-2"></i>
                                    <span>id: {{ changedEvent.eventId }}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div v-if="view !== 'display'">
                        <div class="p-fluid">

                            <div class="field">
                                <label for="name">{{ t('Calendar.meetingName') }}</label>
                                <InputText id="title" type="text" v-model="changedEvent.title" 
                                :class="{ 'p-invalid': submitted && changedEvent.title.trim() === '' }"
                                />
                            </div>
                            <div class="field">
                                <label for="description">{{ t('Calendar.meetingDescription') }}</label>
                                <InputText id="description" type="description" v-model="changedEvent.description" 
                                :class="{ 'p-invalid': submitted && changedEvent.description.trim() === '' }"
                                />

                            </div>

                            <hr class="my-3">

                            <div class="grid formgrid">
                                <div class="col-12 mb-2 lg:col-3 lg:mb-0">
                                    <label for="startdate" class="text-900 font-semibold">{{ t('Calendar.startDate') }}</label>
                                    <Calendar dateFormat="dd-mm-yy" :minDate="changedEvent.start" :max-date="changedEvent.end" showDate required inputId="startdate" v-model="changedEvent.start" :disabled="true"
                                    :class="{ 'p-invalid': submitted && !changedEvent.start }"
                                    ></Calendar>
                                </div>
                                <div class="col-12 mb-2 lg:col-3 lg:mb-0">
                                    <label for="enddate" class="text-900 font-semibold">{{ t('Calendar.endDate') }}</label>
                                    <Calendar dateFormat="dd-mm-yy" :minDate="changedEvent.start" showDate required inputId="enddate" v-model="changedEvent.end" :disabled="true"
                                    :class="{ 'p-invalid': submitted && !changedEvent.end }"
                                    ></Calendar>
                                </div>
                                <div class="col-12 mb-2 lg:col-3 lg:mb-0">
                                    <label for="starttime" class="text-900 font-semibold">{{ t('Calendar.startTime') }}</label>
                                    <Calendar hourFormat="24" timeOnly required inputId="starttime" v-model="changedEvent.starttime" 
                                    :class="{ 'p-invalid': submitted && !changedEvent.starttime }"
                                    ></Calendar>
                                </div>
                                <div class="col-12 mb-2 lg:col-3 lg:mb-0">
                                    <label for="endtime" class="text-900 font-semibold">{{ t('Calendar.endTime') }}</label>
                                    <Calendar hourFormat="24" timeOnly required inputId="endtime" v-model="changedEvent.endtime"
                                    :class="{ 'p-invalid': submitted && !changedEvent.endtime }"
                                    ></Calendar>
                                </div>
                            </div>

                            <div class="field mt-3">
                            <span>{{ formattedDateTime }}</span>
                            </div>
                            
                            <div class="field mt-3">
                                <hr class="my-3">
                                <Dropdown 
                                    v-model="selectedGuestPolicy"
                                    :options="guestPolicyOptions" 
                                    optionLabel="label" 
                                    optionValue="value" 
                                    @change="applyFilter"
                                />
                                </div>


                            <hr class="my-3">
                            <MultiSelect v-model="selectGroup" :options="groupsBySelected" optionLabel="name" :placeholder="t('Calendar.selectGroups')"  display="chip" :filter="true" class="custom-multiselect"></MultiSelect>

                        </div>
                    </div>

                    <template #footer>
                    <div class="flex justify-content-between w-full">
                        <!-- Create Detail Meeting button on the left side -->
                        <Button v-if="view === 'new' || view === 'edit'" :label="t('Calendar.createDetailMeeting')" outlined rounded icon="pi pi-cog" @click="redirectToDetailMeeting()" :disabled="!changedEvent.start || !changedEvent.end"></Button>

                        <!-- Save and Start Meeting buttons on the right side -->
                        <div class="flex">
                        <Button v-if="view === 'new' || view === 'edit'" :label="t('Calendar.save')" icon="pi pi-check" @click="saveMeeting()" :disabled="!changedEvent.start || !changedEvent.end"></Button>
                        <Button v-if="isEventToday" :label="t('Calendar.startMeeting')" icon="pi pi-caret-right" @click="createScheduleMeeting"></Button>
                        </div>
                    </div>
                    </template>
                    <hr class="my-3">

                    <!-- Renk açıklamaları -->
                    <div v-if="view === 'display'">
                        <!-- First, check if it's type 4 -->
                        <div v-if="changedEvent.classNames.includes('meeting-type-4')" class="p-mb-3">
                            <Badge value="" style="background-color: #7a9c66; color: #7a9c66; border: 1px solid #87CEEB; border-radius: 50%; width: 12px; height: 12px; display: inline-block;"></Badge>
                            <span>->{{ t('Calendar.todayCompletedMeeting') }}</span>
                        </div>

                        <!-- Then, check if it's today (not type 4) -->
                        <div v-else-if="isEventToday" class="p-mb-3">
                            <Badge value="" style="background-color: #FFD700; color: #FFD700; border: 1px solid #c4a601; border-radius: 50%; width: 12px; height: 12px; display: inline-block;"></Badge>
                            <span>->{{ t('Calendar.todayMeeting') }}</span>
                        </div>

                        <!-- Type 1 - Next meeting -->
                        <div v-else-if="changedEvent.classNames.includes('meeting-type-1')" class="p-mb-3">
                            <Badge value="" style="background-color: #6c8fbf; color: #3662a0; border: 1px solid #FFC7E8; border-radius: 50%; width: 12px; height: 12px; display: inline-block;"></Badge>
                            <span>->{{ t('Calendar.nextMeeting') }}</span>
                        </div>

                        <!-- Type 3 - Past not completed -->
                        <div v-else-if="changedEvent.classNames.includes('meeting-type-3')" class="p-mb-3">
                            <Badge value="" style="background-color: #ffb3b3; color: #ffb3b3; border: 1px solid #ff4d4d; border-radius: 50%; width: 12px; height: 12px; display: inline-block;"></Badge>
                            <span>->{{ t('Calendar.pastNotCompetedMeeting') }}</span>
                        </div>

                        <!-- Type 2 - Completed past meeting -->
                        <div v-else-if="changedEvent.classNames.includes('meeting-type-2')" class="p-mb-3">
                            <Badge value="" style="background-color: #8d659c; color: #8d659c; border: 1px solid #87CEEB; border-radius: 50%; width: 12px; height: 12px; display: inline-block;"></Badge>
                            <span>->{{ t('Calendar.completedMeetingPast') }}</span>
                        </div>
                    </div>


                </Dialog>


                <!-- #region START MEETİNG DİALOGU -->
                    <Dialog v-model:visible="startMeetingDialog" :closable="true" :modal="true" :style="{ width: '650px' }" class="p-fluid col-12 md:col-6" header="Login Meeting">
                        <div class="card p-fluid col-12 mb-3">
                            <ul>
                                <li><strong>{{ t('Calendar.name') }}</strong> {{ selectedMeeting.name }}</li>
                                <li><strong>{{ t('Calendar.description') }}</strong> {{ selectedMeeting.description }}</li>
                            </ul>
                        </div>

                        <Button :label="t('Calendar.copyLink')" v-if="selectedMeeting.guestLink" outlined severity="outlined" @click="copyMeetingName" />
                        <h6>By clicking the button above and sharing the link with others, those individuals can join the meeting as guests after you have started the meeting.</h6>
                        
                        
                        <template #footer>
                            <Button :label="t('Calendar.startMeeting')" @click="loginMeeting" />
                        </template>
                    </Dialog>
                <!-- #endregion START MEETİNG DİALOGU -->
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">

.p-invalid input {
  border: 1px solid red !important;
}

:deep(.fc-header-toolbar) {
    .fc-button {
        line-height: 1;
        min-height: 2.07rem;
    }
}

:deep(.fc-event) {
    background-color: var(--fc-event-bg-color);
    border-color: var(--fc-event-border-color);
    color: var(--fc-event-text-color);
}

:deep(.fc-event .fc-title) {
    color: inherit;
}

/* Gelecek toplantılar için */
:deep(.meeting-type-1) {
    --fc-event-bg-color: #a3c4f3; /* Soft Sky Blue */
    --fc-event-border-color: #6c8fbf; /* Muted Blue */
    --fc-event-text-color: #223344; /* Dark Blue-Gray */
}

/* Geçmişte tamamlanan toplantılar için */
:deep(.meeting-type-2) {
    --fc-event-bg-color: #8c7aa9; /* Lavender Gray */
    --fc-event-border-color: #60557b; /* Dark Lavender */
    --fc-event-text-color: #f5f3f7; /* Soft Ivory */
}

/* Geçmişte tamamlanmamış toplantılar için */
:deep(.meeting-type-3) {
    --fc-event-bg-color: #e9a8a8; /* Soft Coral Red */
    --fc-event-border-color: #d17979; /* Muted Red */
    --fc-event-text-color: #4a2222; /* Dark Brownish Red */
}

/* Bugün tamamlanan toplantılar için */
:deep(.meeting-type-4) {
    --fc-event-bg-color: #a9d18e; /* Soft Sage Green */
    --fc-event-border-color: #7a9c66; /* Muted Olive Green */
    --fc-event-text-color: #354b2e; /* Dark Forest Green */
}

/* Bugünkü etkinlikler için */
:deep(.fc .fc-event.event-today) {
    background-color: #ffd966; /* Soft Gold */
    border-color: #bfa644; /* Muted Gold */
    color: #993300; /* Dark Red-Brown */
}

/* Kartların dizilimi için grid yapısı */
.grid-container {
  display: grid;
  grid-template-columns: repeat(6, 1fr); /* 7 eşit sütun */
  gap: 1rem; /* Kartlar arası boşluk */
  width: 100%; /* Kartların tam genişlikte olması */

  @media (max-width: 1024px) {
    grid-template-columns: repeat(4, 1fr); /* Orta ekranlar için 4 sütun */
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr); /* Küçük ekranlar için 2 sütun */
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr; /* Çok küçük ekranlar için 1 sütun */
  }
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); /* Kartların genişliğini ayarlama */
  gap: 1rem; /* Kartlar arası boşluk */
  width: 100%; /* Tam genişlik */
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  min-height: 50px;

  i {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .text-900 {
    font-size: 1.25rem;
    font-weight: bold;
  }

  .text-600 {
    font-size: 0.875rem;
    color: #555555; /* Muted Gray */
  }
}

/* Bugünkü toplantı için renkler */
.today-meeting-indicator {
    display: flex;
    align-items: center;
    font-size: 0.875rem;
    color: #555;
}

.today-meeting-indicator .color-box {
    width: 12px;
    height: 12px;
    background-color: #ffd966; /* Soft Gold */
    border: 1px solid #bfa644; /* Muted Gold */
    margin-right: 8px;
    border-radius: 50%;
}

/* Kaçırılan toplantı için */
.missed-meeting-indicator {
    display: flex;
    align-items: center;
    font-size: 0.875rem;
    color: #555;
}

.missed-meeting-indicator .color-box {
    width: 12px;
    height: 12px;
    background-color: #e9a8a8; /* Soft Coral Red */
    border: 1px solid #d17979; /* Muted Red */
    margin-right: 8px;
    border-radius: 50%;
}

/* Tamamlanan toplantı için */
.completed-meeting-indicator {
    display: flex;
    align-items: center;
    font-size: 0.875rem;
    color: #555;
}

.completed-meeting-indicator .color-box {
    width: 12px;
    height: 12px;
    background-color: #8c7aa9; /* Lavender Gray */
    border: 1px solid #60557b; /* Dark Lavender */
    margin-right: 8px;
    border-radius: 50%;
}

/* Gelecek toplantılar için */
.future-meeting-indicator .color-box {
    width: 12px;
    height: 12px;
    background-color: #5b8bce; /* Soft Sky Blue */
    border: 1px solid #3662a0; /* Muted Blue */
    margin-right: 8px;
    border-radius: 50%;
}

</style>
