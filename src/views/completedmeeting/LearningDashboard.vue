<script setup>
import { ref, onMounted, computed  } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import * as XLSX from 'xlsx';
import { useToast } from 'primevue/usetoast';
import { useLayoutStore } from '@/stores/layout';
import { useCompletedMeetingStore } from '@/stores/completedmeeting';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';
import Tooltip from 'primevue/tooltip';
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const toast = useToast();
const layoutStore = useLayoutStore();
const completedMeetingStore = useCompletedMeetingStore();

const meetingData = ref(null);
const selectedPoll = ref(null);
const selectedAttendee = ref(null);
const showPollDialog = ref(false);
const showAttendeeDialog = ref(false);
const pollResponses = ref([]);
const attendeeSessions = ref([]);
const attendeePollVotes = ref([]);

onMounted(async () => {
  layoutStore.setLoading(true);
  const id = route.params.id;
  if (id) {
    const response = await completedMeetingStore.getLearningDashboardByMeetingId(id);
    if (response.success) {
      meetingData.value = response.value;
      layoutStore.setLoading(false);
    } else {
      toast.add({ severity: 'error', summary: 'Failed to fetch', detail: t('participant.form.fetchError'), life: 3000 });
      layoutStore.setLoading(false);
    }
  }
});

const formatDuration = (duration) => {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  return `${hours > 0 ? hours + 'h ' : ''}${minutes}m`;
};

const calculateMeetingDurationPercentage = (duration) => {
  if (!meetingData.value || !meetingData.value.duration) return 0;
  return (duration / meetingData.value.duration) * 100;
};

const handlePollRowSelect = (event) => {
  const rowData = event.data;
  selectedPoll.value = rowData;
  pollResponses.value = rowData.pollVotes.map(vote => {
    const attendee = meetingData.value.attendees.find(attendee => attendee.extUserId === vote.userId);
    return {
      userName: attendee ? attendee.name : 'Unknown User',
      vote: vote.vote
    };
  });
  showPollDialog.value = true;
};

const handleAttendeeRowSelect = (event) => {
  const rowData = event.data;
  selectedAttendee.value = rowData;

  attendeeSessions.value = rowData.sessions.map(session => {
    const joinTime = new Date(session.joinTime);
    let leaveTime = new Date(session.leaveTime);

    // Eğer joinTime ve leaveTime aynıysa, duration üzerinden leaveTime'ı hesapla
    if (joinTime.getTime() === leaveTime.getTime()) {
      // rowData.duration değerini kullanarak doğru leaveTime'ı hesapla (saniye cinsinden)
      leaveTime = new Date(joinTime.getTime() + (rowData.duration * 1000));
    }

    // Süreyi saniye cinsinden hesapla
    const durationInSeconds = (leaveTime - joinTime) / 1000;

    return {
      joinTime: joinTime,
      leaveTime: leaveTime,
      duration: formatDuration(durationInSeconds) // Süreyi doğru formatta yazdır
    };
  });

  attendeePollVotes.value = meetingData.value.polls.flatMap(poll => 
    poll.pollVotes.filter(vote => vote.userId === rowData.extUserId).map(vote => ({
      pollQuestion: poll.question,
      vote: vote.vote
    }))
  );

  showAttendeeDialog.value = true;

};


const calculatePosition = (time) => {
  if (!meetingData.value?.start || !meetingData.value?.finish) return '0%';
  const startTime = new Date(meetingData.value.start).getTime();
  const finishTime = new Date(meetingData.value.finish).getTime();
  const eventTime = new Date(time).getTime();
  
  // Pozisyon hesaplaması
  const position = (eventTime - startTime) / (finishTime - startTime);
  return `${Math.min(Math.max(position, 0), 1) * 100}%`; 
};

const calculateWidth = (startTime, endTime) => {
  if (!meetingData.value?.start || !meetingData.value?.finish) return '0%';
  const meetingStart = new Date(meetingData.value.start).getTime();
  const meetingEnd = new Date(meetingData.value.finish).getTime();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  // Genişlik hesaplaması
  const duration = (end - start) / (meetingEnd - meetingStart);
  const width = Math.min(Math.max(duration, 0), 1) * 100;
  return width > 0 ? `${width}%` : '1%'; // Minimum genişlik %1 olacak şekilde ayarlanıyor
};



const calculateActivityScore = (attendee) => {
  const engagementChats = attendee.engagementChats * 1;
  const engagementTalks = attendee.engagementTalks * 2;
  const engagementRaisehand = attendee.engagementRaisehand * 3;
  const engagementPollVotes = attendee.engagementPollVotes * 1;
  const engagementTalkTime = attendee.engagementTalkTime / 60; // dakika cinsinden

  return engagementChats + engagementTalks + engagementRaisehand + engagementPollVotes + engagementTalkTime;
};


const totalMessages = computed(() => {
  return meetingData.value?.attendees.reduce((sum, attendee) => sum + attendee.engagementChats, 0) || 0;
});

const totalRaiseHands = computed(() => {
  return meetingData.value?.attendees.reduce((sum, attendee) => sum + attendee.engagementRaisehand, 0) || 0;
});

const totalEmojis = computed(() => {
  return meetingData.value?.attendees.reduce((sum, attendee) => sum + attendee.engagementEmojis, 0) || 0;
});

const exportToExcel = () => {
  const wb = XLSX.utils.book_new();
  
  // Genel Bilgiler
  const generalData = [
    { key: 'Toplantı Adı', value: meetingData.value.meetingName },
    { key: 'Toplantı Süresi', value: formatDuration(meetingData.value.duration) },
    { key: 'Toplam Katılımcı Sayısı', value: meetingData.value.attendees.length },
    { key: 'Toplam Anket Sayısı', value: meetingData.value.polls.length },
  ];
  const wsGeneral = XLSX.utils.json_to_sheet(generalData.map(item => ({ Key: item.key, Value: item.value })));
  XLSX.utils.book_append_sheet(wb, wsGeneral, 'Genel Bilgiler');

  // Katılımcılar
  const attendeesData = meetingData.value.attendees.map(attendee => ({
    Name: attendee.name,
    Duration: formatDuration(attendee.duration),
    Moderator: attendee.moderator ? 'Yes' : 'No',
    Chats: attendee.engagementChats,
    Talks: attendee.engagementTalks,
    RaiseHand: attendee.engagementRaisehand,
    PollVotes: attendee.engagementPollVotes,
    TalkTime: formatDuration(attendee.engagementTalkTime),
    Emojis: attendee.engagementEmojis
  }));
  const wsAttendees = XLSX.utils.json_to_sheet(attendeesData);
  XLSX.utils.book_append_sheet(wb, wsAttendees, 'Katılımcılar');

  // Anketler
  const pollsData = meetingData.value.polls.map(poll => ({
    Question: poll.question,
    Type: poll.type,
    Published: poll.published ? 'DOĞRU' : 'YANLIŞ',
    Start: new Date(poll.start).toLocaleString()
  }));
  const wsPolls = XLSX.utils.json_to_sheet(pollsData);
  XLSX.utils.book_append_sheet(wb, wsPolls, 'Anketler');

  // Anket Cevapları
  const pollResponsesData = meetingData.value.polls.flatMap(poll => 
    poll.pollVotes.map(vote => {
      const attendee = meetingData.value.attendees.find(attendee => attendee.extUserId === vote.userId);
      return {
        Question: poll.question,
        User: attendee ? attendee.name : 'Unknown User',
        Vote: vote.vote
      };
    })
  );
  const wsPollResponses = XLSX.utils.json_to_sheet(pollResponsesData);
  XLSX.utils.book_append_sheet(wb, wsPollResponses, 'Anket Cevapları');

  XLSX.writeFile(wb, `${meetingData.value.meetingName}.xlsx`);
};



</script>

<template>
  <div class="col-12" v-if="meetingData != null">
    <div class="card">
      <div class="flex justify-content-between mb-3">
        <Button :label="t('dashboard.back')" icon="pi pi-arrow-left" @click="router.go(-1)" rounded />
        <Button :label="t('dashboard.excel')" icon="pi pi-file-excel" @click="exportToExcel" rounded />
      </div>
      <div :style="{
            height: '4px',
            background: 'linear-gradient(90deg, #ffa500 0%, rgba(33, 150, 243, 0) 90%)'
          }"></div>
      <h2>{{ meetingData?.meetingName }} - {{ new Date(meetingData?.start).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}</h2>

      <div class="summary-cards">
        <div class="summary-card">
          <i class="pi pi-clock" style="color: #42a5f5;"></i>
          <p>{{ t('dashboard.duration') }}</p>
          <h2>{{ formatDuration(meetingData?.duration) }}</h2>
        </div>
        <div class="summary-card">
          <i class="pi pi-users" style="color: #66bb6a;"></i>
          <p>{{ t('dashboard.participants') }}</p>
          <h2>{{ meetingData?.attendees.length }}</h2>
        </div>
        <div class="summary-card">
          <i class="pi pi-chart-bar" style="color: #ef5350;"></i>
          <p>{{ t('dashboard.polls') }}</p>
          <h2>{{ meetingData?.polls.length }}</h2>
        </div>
        <div class="summary-card">
          <i class="pi pi-microphone" style="color: #ab47bc;"></i>
          <p>{{ t('dashboard.speakers') }}</p>
          <h2>{{ meetingData?.attendees.filter(a => a.engagementTalks > 0).length }}</h2>
        </div>
        <div class="summary-card">
          <i class="pi pi-comments" style="color: #ffca28;"></i>
          <p>{{ t('dashboard.messages') }}</p>
          <h2>{{ totalMessages }}</h2>
        </div>
        <div class="summary-card">
          <i class="pi pi-thumbs-up" style="color: #ffa500;"></i>
          <p>{{ t('dashboard.raiseHands') }}</p>
          <h2>{{ totalRaiseHands }}</h2>
        </div>
        <div class="summary-card">
          <i class="pi pi-star" style="color: #42a5f5;"></i>
          <p>{{ t('dashboard.emojis') }}</p>
          <h2>{{ totalEmojis }}</h2>
        </div>
      </div>

      <hr class="my-3">      
      <TabView>
        <TabPanel :header="t('dashboard.participants')">
          <DataTable :value="meetingData?.attendees" selectionMode="single" @row-select="handleAttendeeRowSelect" class="custom-datatable">
            <Column field="name" :header="t('dashboard.name')" sortable></Column>
            <Column field="moderator" :header="t('dashboard.moderator')" sortable>
              <template #body="slotProps">
                <div class="flex justify-content-center">
                  <i :class="slotProps.data.moderator ? 'pi pi-check' : 'pi pi-times'" :style="{ color: slotProps.data.moderator ? 'green' : 'blue' }"></i>
                </div>
              </template>
            </Column>
            <Column field="duration" :header="t('dashboard.duration')" sortable>
              <template #body="slotProps">
                {{ formatDuration(slotProps.data.duration) }}
              </template>
            </Column>
            <Column field="engagementChats" :header="t('dashboard.chats')" sortable>
              <template #body="slotProps">
                <i class="pi pi-comments" style="color: #ab47bc; margin-right: 0.5rem"></i>{{ slotProps.data.engagementChats }}
              </template>
            </Column>
            <Column field="engagementTalks" :header="t('dashboard.talks')" sortable>
              <template #body="slotProps">
                <i class="pi pi-microphone" style="color: #ef5350; margin-right: 0.5rem"></i>{{ slotProps.data.engagementTalks }}
              </template>
            </Column>
            <Column field="engagementRaisehand" :header="t('dashboard.raiseHand')" sortable>
              <template #body="slotProps">
                <i class="pi pi-thumbs-up" style="color: #ffca28; margin-right: 0.5rem"></i>{{ slotProps.data.engagementRaisehand }}
              </template>
            </Column>
            <Column field="engagementPollVotes" :header="t('dashboard.pollVotes')" sortable>
              <template #body="slotProps">
                <i class="pi pi-chart-bar" style="color: #66bb6a; margin-right: 0.5rem"></i>{{ slotProps.data.engagementPollVotes }}
              </template>
            </Column>
            <Column field="engagementTalkTime" :header="t('dashboard.talkTime')" sortable>
              <template #body="slotProps">
                <i class="pi pi-stopwatch" style="color: #42a5f5; margin-right: 0.5rem"></i>{{ formatDuration(slotProps.data.engagementTalkTime) }}
              </template>
            </Column>
          </DataTable>
        </TabPanel>
        <TabPanel :header="t('dashboard.polls')">
          <DataTable :value="meetingData?.polls" @row-select="handlePollRowSelect" selectionMode="single" class="custom-datatable">
            <Column field="question" :header="t('dashboard.question')" sortable></Column>
            <Column field="type" :header="t('dashboard.type')" sortable></Column>
            <Column field="published" :header="t('dashboard.published')" sortable>
              <template #body="slotProps">
                <div class="flex justify-content-center">
                  <i :class="slotProps.data.published ? 'pi pi-check' : 'pi pi-times'" :style="{ color: slotProps.data.published ? 'green' : 'red' }"></i>
                </div>
              </template>
            </Column>
            <Column field="start" :header="t('dashboard.start')" sortable>
              <template #body="slotProps">
                <span>{{ new Date(slotProps.data.start).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}</span>
              </template>
            </Column>
          </DataTable>
        </TabPanel>
        <TabPanel :header="t('dashboard.activity')">
          <DataTable :value="meetingData?.attendees" class="custom-datatable">
            <Column field="name" :header="t('dashboard.name')" sortable></Column>
            <Column field="duration" :header="t('dashboard.duration')" sortable>
              <template #body="slotProps">
                <i class="pi pi-clock" style="margin-right: 0.5rem"></i>{{ formatDuration(slotProps.data.duration) }}
              </template>
            </Column>
            <Column field="meetingDuration" :header="t('dashboard.meetingDuration')">
              <template #body="slotProps">
                <div class="flex align-items-center">
                  <i class="pi pi-chart-pie" style="margin-right: 0.5rem"></i>
                  <ProgressBar :value="calculateMeetingDurationPercentage(slotProps.data.duration).toFixed(1)" style="margin-left: 0.5rem; width: 100%;"></ProgressBar>
                </div>
              </template>
            </Column>
            <Column field="activityScore" :header="t('dashboard.activityScore')">
              <template #body="slotProps">
                <div class="flex align-items-center">
                  <i class="pi pi-calculator" style="margin-right: 0.5rem"></i>
                  <ProgressBar :value="calculateActivityScore(slotProps.data).toFixed(1)" style="margin-left: 0.5rem; width: 100%;"></ProgressBar>
                </div>
              </template>
            </Column>
          </DataTable>
        </TabPanel>
      </TabView>
    </div>
  </div>

  <Dialog header="Poll Responses" v-model:visible="showPollDialog" :modal="true" style="width: 50vw;">
    <div class="poll-info">
      <p><strong>{{ t('dashboard.question') }}:</strong> {{ selectedPoll?.question }}</p>
      <p><strong>{{ t('dashboard.type') }}:</strong> {{ selectedPoll?.type }}</p><br>
    </div>
    <DataTable :value="pollResponses" class="custom-datatable">
      <Column field="userName" :header="t('dashboard.userName')" sortable></Column>
      <Column field="vote" :header="t('dashboard.vote')" sortable></Column>
    </DataTable>
  </Dialog>

  <Dialog v-if="meetingData" v-model:visible="showAttendeeDialog" :header="selectedAttendee?.name" :modal="true" style="width: 50vw;">
    <!-- <div v-if="selectedAttendee && !selectedAttendee.moderator"> -->
      <div>

        <h4>{{ t('dashboard.meetingTimeline') }}</h4><br>
      <div class="timeline-container">
        <div class="timeline">
          <div class="timeline-start">
            <h5>{{ new Date(meetingData?.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</h5>
        </div>
          <div class="timeline-bar">
            <template v-for="(session, index) in attendeeSessions" :key="index">
              <div 
                class="timeline-segment"
                :style="{ left: calculatePosition(session.joinTime), width: calculateWidth(session.joinTime, session.leaveTime) }"
                v-tooltip="`${session.joinTime.toLocaleTimeString()} - ${session.leaveTime.toLocaleTimeString()}`">
              </div>
            </template>
          </div>
          <div class="timeline-end">
            <h5>{{ new Date(meetingData?.finish).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</h5>
        </div>
        </div>
      </div>
      <div class="meeting-summary">
        <div class="summary-box">
          <p>{{ t('dashboard.meetingDuration') }}</p>
          <p>{{ formatDuration(meetingData?.duration) }}</p>
        </div>
        <div class="summary-box">
          <p>{{ t('dashboard.participationDuration') }}</p>
          <p>{{ formatDuration(selectedAttendee?.duration) }}</p>
        </div>
        <div class="summary-box">
          <p>{{ t('dashboard.participationPercentage') }}</p>
          <p>{{ calculateMeetingDurationPercentage(selectedAttendee?.duration).toFixed(0) }}%</p>
        </div>
      </div><br>
    </div>
    <DataTable :value="[selectedAttendee]" class="custom-datatable">
      <Column field="duration" :header="t('dashboard.totalDuration')" >
        <template #body="slotProps">
          <i class="pi pi-clock" style="color: #42a5f5; margin-right: 0.5rem"></i>
          {{ formatDuration(slotProps.data.duration) }}
        </template>
      </Column>
      <Column field="engagementRaisehand" :header="t('dashboard.raiseHands')" >
        <template #body="slotProps">
          <i class="pi pi-thumbs-up" style="color: #ffca28; margin-right: 0.5rem"></i>
          {{ slotProps.data.engagementRaisehand }}
        </template>
      </Column>
      <Column field="engagementChats" :header="t('dashboard.chats')" >
        <template #body="slotProps">
          <i class="pi pi-comments" style="color: #ab47bc; margin-right: 0.5rem"></i>
          {{ slotProps.data.engagementChats }}
        </template>
      </Column>
      <Column field="engagementTalks" :header="t('dashboard.talks')" >
        <template #body="slotProps">
          <i class="pi pi-microphone" style="color: #ef5350; margin-right: 0.5rem"></i>
          {{ slotProps.data.engagementTalks }}
        </template>
      </Column>
      <Column field="engagementEmojis" :header="t('dashboard.emojis')" >
        <template #body="slotProps">
          <i class="pi pi-star" style="color: #ffb74d; margin-right: 0.5rem"></i>
          {{ slotProps.data.engagementEmojis }}
        </template>
      </Column>
      <Column field="engagementPollVotes" :header="t('dashboard.pollVotes')" >
        <template #body="slotProps">
          <i class="pi pi-chart-bar" style="color: #66bb6a; margin-right: 0.5rem"></i>
          {{ slotProps.data.engagementPollVotes }}
        </template>
      </Column>
      <Column field="engagementTalkTime" :header="t('dashboard.talkTime')" >
        <template #body="slotProps">
          <i class="pi pi-stopwatch" style="color: #42a5f5; margin-right: 0.5rem"></i>
          {{ formatDuration(slotProps.data.engagementTalkTime) }}
        </template>
      </Column>
    </DataTable>

    <h4>{{ t('dashboard.pollResponses') }}</h4>
    <DataTable :value="attendeePollVotes" class="custom-datatable">
      <Column field="pollQuestion" :header="t('dashboard.pollQuestion')" ></Column>
      <Column field="vote" :header="t('dashboard.vote')" ></Column>
    </DataTable>
  </Dialog>
</template>


<style scoped>
.card {
  padding: 2rem;
}

.gradient-bar {
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color) 0%, rgba(33, 150, 243, 0) 90%);
}

.pi {
  margin-right: 0.5rem;
}

.custom-datatable .pi-check {
  color: green;
}

.custom-datatable .pi-times {
  color: red;
}

.custom-datatable .pi-comments,
.custom-datatable .pi-microphone,
.custom-datatable .pi-hand-paper,
.custom-datatable .pi-chart-bar,
.custom-datatable .pi-clock {
  margin-right: 0.5rem;
}

.timeline-container {
  width: 100%;
  position: relative;
}

.timeline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 40px;
  position: relative;
}

.timeline-start,
.timeline-end {
  position: absolute;
  top: -10px;
  font-size: 12px;
  color: gray;
}

.timeline-start {
  left: 0;
}

.timeline-end {
  right: 0;
}

.timeline-bar {
  display: flex;
  align-items: center;
  width: 100%;
  height: 8px;
  background-color: lightgray;
  position: relative;
  margin: 0 20px;
}

.timeline-segment {
  height: 8px;
  background-color: #0a74da;
  position: absolute;
}

.timeline-segment::before,
.timeline-segment::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background-color: #ffa500;
  border-radius: 50%;
  top: -6px;
}

.timeline-segment::before {
  left: -6px;
}

.timeline-segment::after {
  right: -6px;
}

.timeline-segment[title]::before,
.timeline-segment[title]::after {
  content: attr(title);
  position: absolute;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 5px;
  border-radius: 3px;
  top: -35px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}

.timeline-segment:hover::before,
.timeline-segment:hover::after {
  opacity: 1;
}

.timeline-segment[title]:hover::before,
.timeline-segment[title]:hover::after {
  opacity: 1;
}

.meeting-summary {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.summary-box {
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 5px;
  background-color: #f9f9f9;
  text-align: center;
}

.summary-box p {
  margin: 5px 0;
}

.summary-cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
}

.summary-card {
  flex: 1 1 calc(14% - 10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f7f9fc;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.summary-card i {
  font-size: 2em;
  margin-bottom: 10px;
}

.summary-card p {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 5px;
}

.summary-card h2 {
  font-size: 1.5em;
  margin: 0;
  color: #333;
}

@media (max-width: 768px) {
  .summary-card {
    flex: 1 1 calc(100% - 10px);
  }
}

</style>
