<script setup>
import { ref, onMounted, computed } from 'vue';
import { parseISO, addMonths, format } from 'date-fns';
import { useParticipantPagesStore } from '@/stores/participantpages';
import { Calendar } from 'v-calendar';
import 'v-calendar/style.css';
import { useRouter } from 'vue-router';
import { useLayoutStore } from '@/stores/layout'


const layoutStore = useLayoutStore()

const router = useRouter();

const participantPagesStore = useParticipantPagesStore();

const today = new Date();

const meetings = ref([]);
const selectedDate = today;
const selectedMeetings = ref([]);

const maxDate = addMonths(today, 1);

// Toplantıları API'den alıyoruz
onMounted(async () => {
  layoutStore.setLoading(false);
  const [meetingsResponse, startNowResponse, groupResponse] = await Promise.all([
    participantPagesStore.getAllMeetingsToday(),
    participantPagesStore.completedMeetingStartNow(),
    participantPagesStore.getActiveGroups()
  ]);

  if (meetingsResponse.success) {
    meetings.value = meetingsResponse.value;
    selectedDate.value = today;
    filterMeetingsByDate({ date: selectedDate.value });
  } else {
    console.error('Toplantılar alınamadı.');
  }

  if (startNowResponse.success) {
    startNowMeetings.value = startNowResponse.value;
  } else {
    console.error('Başlayan toplantılar alınamadı.');
  }

  if (groupResponse.success) {
    activeGroups.value = groupResponse.value;
  } else {
    console.error('Gruplar alınamadı:', groupResponse.message);
  }
  layoutStore.setLoading(false);
});


const activeGroups = ref([]); // Grupları tutan değişken
const selectedGroup = ref(null); // Seçilen grup

const filters = {
  global: { value: null, matchMode: 'contains' },
};

const goToGroupDetail = (id) => {
  router.push({ name: 'group-detail', params: { id } }); // Yönlendirme
};


const startNowMeetings = ref([]); // Başlayan toplantılar için reaktif değişken
const refreshCooldown = ref(false); // Yenile butonunun aktifliği
const countdown = ref(15); // Geri sayım için değişken
let countdownInterval = null; // setInterval referansı

const loadStartNowMeetings = async () => {
  const response = await participantPagesStore.completedMeetingStartNow();
  if (response.success) {
    startNowMeetings.value = response.value;
  } else {
    console.error('Başlayan toplantılar alınamadı.');
  }
};


const refreshStartNowMeetings = async () => {
  if (refreshCooldown.value) return;

  refreshCooldown.value = true;
  countdown.value = 15;

  await loadStartNowMeetings();

  countdownInterval = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      refreshCooldown.value = false;
      clearInterval(countdownInterval);
    }
  }, 1000);
};

// Toplantı tarihlerini işliyoruz
const meetingDates = computed(() =>
  meetings.value.flatMap((meeting) =>
    meeting.meetingScheduleDateLists.map((schedule) => ({
      date: parseISO(schedule.date),
      name: meeting.name,
      description: meeting.description,
      meeting,
    }))
  )
);

// VCalendar için attributeleri oluşturuyoruz
const attributes = computed(() => {
  // İleride farklı renkli noktalar eklemek için birden fazla attribute tanımlayabilirsiniz
  return [
    {
      key: 'meetings',
      dates: meetingDates.value.map((item) => item.date),
      dot: {
        color: '#155724', // Noktanın rengi
        size: '6px', // Noktanın boyutu
      },
    },
  ];
});

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return format(date, 'dd/MM/yyyy');
};

const formatTime = (time) => {
  if (!time) return '-';
  return time.slice(0, 5); // İlk 5 karakteri alır, "HH:MM" formatında döner
};

const selectedDateFormatted = ref(''); // Yeni bir değişken oluşturuyoruz

const filterMeetingsByDate = ({ date }) => {
  const selectedDay = date.toDateString(); // Seçilen günü string olarak al
  selectedDateFormatted.value = formatDate(date); // Seçilen tarihi formatla ve değişkene ata

  // Seçilen güne göre toplantıları filtrele
  selectedMeetings.value = meetingDates.value.filter(
    (item) => item.date.toDateString() === selectedDay
  );
};

const gotoStartMeetingPage = (id) => {
  const url = router.resolve({ name: 'meeting-login', params: { id } }).href;
  window.open(url, '_blank'); 
};



</script>

<template>
  <div class="grid">
    <!-- Takvim Bölümü -->
    <div class="col-12 lg:col-3">
      <div class="card h-full">
        <Calendar
          v-model="selectedDate"
          :attributes="attributes"
          :min-date="today"
          :max-date="maxDate"
          is-inline
          @dayclick="filterMeetingsByDate"
          :show-month-picker="false"
          :show-year-picker="false"
          :pan="false"
          show-weeknumbers
        />
      </div>
    </div>

    <!-- Seçilen Tarihler Bölümü -->
    <div class="col-12 lg:col-4">
      <div class="card h-full">
        <h5 class="card-header text-center date-header">
          {{ selectedDateFormatted }}
        </h5>
        <div class="card-body scrollable-content">
          <template v-if="selectedMeetings.length">
            <ul class="meeting-list list-unstyled">
              <li
                v-for="(meeting, index) in selectedMeetings"
                :key="index"
                class="pb-3 mb-3 border-bottom"
              >
                <p class="mb-1">
                  <strong class="meeting-title">{{ meeting.name }}</strong>
                </p>
                <span v-if="meeting.meeting.startTime || meeting.meeting.endTime">
                  <strong>{{ formatTime(meeting.meeting.startTime) }}</strong> - 
                  <strong>{{ formatTime(meeting.meeting.endTime) }}</strong>
                </span>
              </li>
            </ul>
          </template>

          <template v-else>
            <p class="no-meetings">{{ $t('participantHomepage.noMeetingsScheduled') }}</p>
          </template>
        </div>
      </div>
    </div>

    <!-- Başlayan Toplantılar Bölümü -->
    <div class="col-12 lg:col-5">
      <div class="card h-full">
        <div class="flex align-items-center justify-content-between mb-3">
          <div class="text-900 text-xl font-semibold">{{ $t('participantHomepage.startingMeetings') }}</div>
          <Button
            :disabled="refreshCooldown"
            @click="refreshStartNowMeetings"
            class="btn btn-primary btn-sm"
            outlined
          >
            <span v-if="!refreshCooldown">
              <i class="pi pi-refresh"></i> {{ $t('participantHomepage.refresh') }}
            </span>
            <span v-else>{{ countdown }} {{ $t('participantHomepage.seconds') }}</span>
          </Button>
        </div>
        <DataTable ref="dt" :value="startNowMeetings" dataKey="id" :rows="5" paginator>
          <template #empty>{{ $t('participantHomepage.noMeetingStarted') }}</template>

          <Column field="meetingName" :header="$t('participantHomepage.meetingName')" class="white-space-nowrap w-6">
            <template #body="{ data }">{{ data.meetingName }}</template>
          </Column>

          <Column field="action" class="white-space-nowrap w-4 text-right">
            <template #body="{ data }">
              <Button
                type="button"
                icon="pi pi-play"
                :label="$t('participantHomepage.start')"
                size="small"
                outlined
                @click="gotoStartMeetingPage(data.completedMeetingGuid)"
              ></Button>
            </template>
          </Column>
          

        </DataTable>

      </div>
    </div>
  </div>

  <!-- Tablo Bölümü -->
  <div class="col-12 mt-1">
    <div>
      <DataTable
        :value="activeGroups"
        ref="dt"
        v-model:selection="selectedGroup"
        dataKey="id"
        :paginator="true"
        :rows="10"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        :currentPageReportTemplate="$t('participantHomepage.showingGroups')"
        filterDisplay="menu"
        :filters="filters"
        :globalFilterFields="['name', 'description']"
      >
        <template #header>
          <div class="grid p-fluid">
            <div class="col-12 md:col-8">
              <div class="flex align-items-center">
                <h3 class="m-0">{{ $t('participantHomepage.groups') }}</h3>
              </div>
            </div>
            <div class="col-12 md:col-4">
              <span class="block mt-2 md:mt-0 p-input-icon-left w-full">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" :placeholder="$t('participantHomepage.searchGroups')" />
              </span>
            </div>
          </div>

          <div
            :style="{
              height: '4px',
              width: '100%',
              background: 'linear-gradient(90deg, #ffa500 30%, #0a74da 70%)',
            }"
          ></div>
        </template>

        <Column field="name" :header="$t('participantHomepage.name')" sortable>
          <template #body="{ data }">
            <span>
              {{ data.name.length > 25 ? data.name.slice(0, 25) + '...' : data.name }}
            </span>
          </template>
        </Column>
        <Column field="description" :header="$t('participantHomepage.description')" sortable>
          <template #body="{ data }">
            <span>
              {{ data.description.length > 25 ? data.description.slice(0, 25) + '...' : data.description }}
            </span>
          </template>
        </Column>
        <Column :header="$t('participantHomepage.activeAssignments')" sortable>
          <template #body="{ data }">
            <span class="member-count">
              <i class="pi pi-tags assignment-icon"></i>
              <span class="count-text">{{ data.activeAssignmentCount }}</span>
            </span>
          </template>
        </Column>
        <Column headerStyle="min-width:10rem;">
          <template #body="{ data }">
            <Button
              icon="pi pi-info-circle"
              class="p-button-text"
              :label="$t('participantHomepage.details')"
              @click="goToGroupDetail(data.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>


<style scoped>

.member-count {
  display: flex;
  align-items: center;
}

.assignment-icon {
  color: #ffa500; /* Mavi renk */
  margin-right: 5px;
  font-size: 1.5em; /* Simge boyutu */
}

.count-text {
  color: #0a74da; /* Yeşil renk */
  font-weight: bold;
  font-size: 1.5em; /* Metin boyutu */
}

.card-header {
  background-color: #f8f9fa;
  padding: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-primary {
  background-color: #007bff;
  color: #fff;
  border: none;
}

.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.btn-success {
  background-color: #28a745;
  color: #fff;
  border: none;
}




.scrollable-content {
  max-height: 250px; /* Div'in maksimum yüksekliği */
  overflow-y: auto; /* Dikey kaydırma çubuğu */
  overflow-x: hidden; /* Yatay kaydırmayı gizle (gerekli değilse) */
  padding: 1rem; /* İçerik için boşluk */
  border: 2px solid #ccc; /* İsteğe bağlı çerçeve */
  border-radius: 8px; /* İsteğe bağlı yuvarlatma */
}

.date-header {
  font-size: 1.2rem; /* Tarih başlığı küçültüldü */
  font-weight: bold;
  background-color: #f8f9fa; /* Hafif gri arka plan */
  padding: 0.5rem;
}

.meeting-list {
  list-style: none; /* Liste simgeleri kaldırıldı */
  padding: 0;
  margin: 0;
}

.no-meetings {
  text-align: center; /* Toplantı yok mesajı ortalandı */
  color: #6c757d; /* Gri renk */
  font-size: 0.9rem;
}

.calendar-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
}

</style>
