<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useParticipantPagesStore } from '@/stores/participantpages';
import { useTaskSystem } from '@/stores/tasksystem';
import { useI18n } from 'vue-i18n';
import { format, startOfDay } from 'date-fns';
import { useFileSystem } from '@/stores/filesystem'
import { useLayoutStore } from '@/stores/layout'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from "primevue/useconfirm";


const layoutStore = useLayoutStore()
const fileSystemStore = useFileSystem()
const participantPagesStore = useParticipantPagesStore();
const taskSystemStore = useTaskSystem()


const toast = useToast()
const router = useRouter()
const confirm = useConfirm()




const { t } = useI18n();
const route = useRoute();


const isUploading = ref(false);


const groupModel = ref({});
const meetings = ref([]);
const tasks = ref([]);
const groupFiles = ref([]);

const taskDialogVisible = ref(false);
const selectedTask = ref({});

const upcomingMeetings = ref([]);
const pastMeetings = ref([]);

onMounted(async () => {
  layoutStore.setLoading(true);
  const response = await participantPagesStore.getParticipantByParticipantId(route.params.id);
  if (response.success) {
    groupModel.value = response.value;
    meetings.value = response.value.meetings || [];
    tasks.value = response.value.tasks || [];
    groupFiles.value = response.value.groupFiles || [];

    // Toplantıları işlememiz gerekiyor
    processMeetings();
  } else {
    // Hata durumunda işlem yapabilirsiniz
    console.error('Veri alınamadı:', response.message);
  }
  layoutStore.setLoading(false);
});

// Toplantıları işleme fonksiyonu
const processMeetings = () => {
  upcomingMeetings.value = [];
  pastMeetings.value = [];

  meetings.value.forEach(meeting => {
    meeting.dateScheduleList.forEach(schedule => {
      const meetingItem = {
        ...meeting,
        scheduleDate: schedule.date,
        didHappen: schedule.didHappen,
        isPast: schedule.isPast
      };
      if (!schedule.didHappen) {
        upcomingMeetings.value.push(meetingItem);
      } else {
        pastMeetings.value.push(meetingItem);
      }
    });
  });
};

const openTaskDialog = (task) => {
  selectedTask.value = task;
  taskDialogVisible.value = true;
};

// Tarih formatlama fonksiyonu
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return format(date, 'dd/MM/yyyy');
};

const formatTime = (time) => {
  if (!time) return '-';
  return time.slice(0, 5); // İlk 5 karakteri alır, "HH:MM" formatında döner
};


// Dosya boyutunu formatlamak için bir fonksiyon
function formatFileSize(size) {
  if (size === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Dosya türünü almak için bir fonksiyon
function getFileType(contentType) {
  if (!contentType) return '';
  const parts = contentType.split('/');
  return parts[0]; // '/' işaretinden önceki kısmı alır
}

// Dosya ikonu seçmek için bir fonksiyon
function getFileIconClass(contentType) {
  if (!contentType) return 'pi pi-file file-icon-default';

  contentType = contentType.toLowerCase();

  if (contentType.includes('pdf')) return 'pi pi-file-pdf file-icon-pdf';
  if (contentType.includes('image')) return 'pi pi-image file-icon-image';
  if (contentType.includes('text')) return 'pi pi-file file-icon-text';
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return 'pi pi-file-excel file-icon-excel';
  if (contentType.includes('word')) return 'pi pi-file-word file-icon-word';
  if (contentType.includes('powerpoint') || contentType.includes('presentation')) return 'pi pi-file-powerpoint file-icon-powerpoint';
  if (contentType.includes('zip') || contentType.includes('compressed') || contentType.includes('rar')) return 'pi pi-file-archive file-icon-archive';
  if (contentType.includes('audio')) return 'pi pi-volume-up file-icon-audio';
  if (contentType.includes('video')) return 'pi pi-video file-icon-video';
  if (contentType.includes('csv')) return 'pi pi-file-excel file-icon-csv';
  if (contentType.includes('json')) return 'pi pi-cog file-icon-json';
  if (contentType.includes('xml')) return 'pi pi-cog file-icon-xml';
  // Diğer dosya türleri için eklemeler yapabilirsiniz
  return 'pi pi-file file-icon-default'; // Tanınmayan türler için varsayılan ikon ve renk
}

// Dosya indirme işlemi (örnek)
const downloadFile = async (fileId) => {
  layoutStore.setLoading(true);
  try {
    const downloadLink = await fileSystemStore.getDownloadLink(fileId);

    if (downloadLink) {
      // Yeni bir pencerede indirme işlemini başlat
      const link = document.createElement('a');
      link.href = downloadLink;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      throw new Error('İndirme linki alınamadı');
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Hata', detail: error.message, life: 3000 });
  } finally {
    layoutStore.setLoading(false);
  }
};

const deleteFile = async (fileId, pageType) => {
  layoutStore.setLoading(true);
  try {
    const result = await fileSystemStore.deleteFile(fileId, pageType); // Kullanıcı ID sabit olarak 2
    if (result.success) {
      toast.add({ severity: 'success', summary: 'Success', detail: 'File Deleted', life: 3000 });
      isFilesLoaded.value = false;
      if(pageType === 1)
    {
      await onMounted(); // Dosya silindikten sonra listeyi güncelle
    }
    else{
      await onMounted(); // Görev dosyalarını yüklüyoruz
    }
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'File delete failed', life: 3000 });
  } finally {
    layoutStore.setLoading(false);
  }
};

const deleteDialog = (fileId, pageType) => {
  confirm.require({
    message: 'Bu kaydı silmek istiyor musunuz?',
    header: 'Silme Onayı',
    icon: 'pi pi-info-circle',
    acceptLabel: 'Sil', // Kabul butonunun etiketi
    rejectLabel: 'İptal', // Reddetme butonunun etiketi
    acceptProps: {
      severity: 'danger'
    },
    rejectProps: {
      severity: 'secondary',
      outlined: true
    },
    accept: async () => {
      await deleteFile(fileId, pageType);
    },
    reject: () => {
      toast.add({ severity: 'info', summary: 'İptal Edildi', detail: 'Silme işlemi iptal edildi', life: 3000 });
    }
  });
};

const pageType = ref(null);
const pageId = ref(null); // Görev ID'si veya Sayfa ID'si


const onFileSelect = async (event) => {
  // pageType 5 olacak ve pageId seçili olan taskSubmission'ın ID'si olacak
  pageType.value = 5;
  pageId.value = selectedTask.value.taskSubmission.id;

  if (event.files && event.files.length > 0) {
    if (!pageId.value || !pageType.value) {
      toast.add({ severity: 'error', summary: 'Hata', detail: 'Geçerli bir pageId veya pageType ayarlanmamış', life: 3000 });
      return;
    }

    const file = event.files[0]; // Yüklenecek dosyayı al

    // Dosya boyutunu kontrol et (1 GB = 1073741824 Bytes)
    if (file.size > 1073741824) {
      toast.add({ severity: 'error', summary: 'Hata', detail: 'Dosya boyutu 1 GB\'ı geçemez', life: 3000 });
      return;
    }

    isUploading.value = true; // Yükleme işlemi başlıyor
    try {
      const formData = new FormData();
      formData.append('formFile', file);
      formData.append('pageId', pageId.value);
      formData.append('pageType', pageType.value);

      const result = await fileSystemStore.uploadFile(formData);
      if (result.success) {
        toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Dosya Yüklendi', life: 3000 });

        // Dosya bilgilerini manuel olarak oluştur
        const newFile = {
          id: Date.now(), // Benzersiz bir ID oluşturmak için Date.now() kullanabilirsiniz
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          createdTime: new Date().toISOString(),
          iconClass: getFileIconClass(file.type)
        };

        // Yeni dosya verisini submissionFiles listesine ekliyoruz
        if (selectedTask.value.taskSubmission && selectedTask.value.taskSubmission.submissionFiles) {
          selectedTask.value.taskSubmission.submissionFiles.push(newFile);
        } else {
          // Eğer submissionFiles yoksa, yeni bir liste oluşturuyoruz
          selectedTask.value.taskSubmission = {
            ...selectedTask.value.taskSubmission,
            submissionFiles: [newFile]
          };
        }

        // Veri yenilemeye gerek kalmadan yeni dosya eklenmiş oldu
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












// Buton görünürlüğünü belirleyen fonksiyon
const shouldShowButton = (data) => {
  if (!data) return false;
  const today = startOfDay(new Date());
  const dueDate = data.allowLateSubmissions ? new Date(data.lateDueDate) : new Date(data.dueDate);
  const dueDateStart = startOfDay(dueDate);
  return dueDateStart >= today;
};

const getButtonLabel = (data) => {
  if (!data) return '';
  const today = startOfDay(new Date());
  const dueDate = data.allowLateSubmissions ? new Date(data.lateDueDate) : new Date(data.dueDate);
  const dueDateStart = startOfDay(dueDate);
  return dueDateStart > today ? 'Gecikmiş Görev Teslimi' : 'Görev Teslimi';
};


// Yeni dialog için değişkenler
const submissionDialogVisible = ref(false);
const submissionNote = ref('');

// Dialogu açma fonksiyonu
const openSubmissionDialog = () => {
  submissionDialogVisible.value = true;
};

// Notu kaydetme fonksiyonu
const saveSubmission = async () => {
  try {
    // Görev teslimi notunu backend'e gönderiyoruz
    const response = await taskSystemStore.editSubmissionForParticipant({
      TaskSubmissionId: selectedTask.value.taskSubmission.id,
      ParticipantNote: submissionNote.value
    });

    if (response.success) {
      // Başarılı yanıt geldiyse notu Vue bileşeninde güncelle
      selectedTask.value.taskSubmission.participantNote = submissionNote.value;

      // Başarılı bir bildirim göster
      toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Not kaydedildi', life: 3000 });
      
      // Dialogu kapat
      submissionDialogVisible.value = false;
      
      // Notu sıfırla
      submissionNote.value = '';
    } else {
      // Başarısızlık durumunda hata mesajı göster
      toast.add({ severity: 'error', summary: 'Hata', detail: response.message || 'Not kaydedilemedi', life: 3000 });
    }
  } catch (error) {
    // Hata durumunda hata mesajı göster
    toast.add({ severity: 'error', summary: 'Hata', detail: error.message || 'Beklenmeyen bir hata oluştu', life: 3000 });
  }
};


const goBack = () => {
  router.back();
};

</script>

<template>
  <div>
    <!-- Grup Bilgileri -->
    <div class="card p-4 position-relative">
      <div class="d-flex align-items-center">
        <Button
          icon="pi pi-arrow-left"
          class="p-button-text"
          @click="goBack"
        ></Button>

        <h1 class="flex-grow-1 text-center m-0">
          {{ groupModel.name }}
        </h1>
      </div>

      <p class="flex-grow-1 text-center m-0">
        {{ groupModel.description }}
      </p>
    </div>

    <div
            class="mb-4"
            :style="{
              height: '4px',
              width: '100%',
              background: 'linear-gradient(90deg, #ffa500 30%, #0a74da 70%)',
            }"
          ></div>

    <!-- TabPanel -->
    <TabView>
      <!-- Grup Dosyaları -->
      <TabPanel>
        <template #header>
          <i class="pi pi-folder tab-icon4 mr-2"></i>
          {{ t('participantHomepage.groupFiles') }}
        </template>
          <DataTable :value="groupFiles" ref="dt" dataKey="id"
                    :paginator="true" :rows="10"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25]"
                    >
          <!-- İkon sütunu ekliyoruz -->
          <Column header=" " width="50">
            <template #body="slotProps">
              <i
                :class="getFileIconClass(slotProps.data.contentType)"
                style="font-size: 1.5em;"
              ></i>
            </template>
          </Column>

          <!-- Dosya Adı -->
          <Column field="fileName" :header="t('participantHomepage.fileName')" />

          <!-- Dosya Türü -->
          <Column :header="t('participantHomepage.fileType')">
            <template #body="slotProps">
              {{ getFileType(slotProps.data.contentType) }}
            </template>
          </Column>

          <!-- Dosya Boyutu -->
          <Column :header="t('participantHomepage.fileSize')">
            <template #body="slotProps">
              {{ formatFileSize(slotProps.data.fileSize) }}
            </template>
          </Column>

          <!-- Yüklenme Tarihi -->
          <Column :header="t('participantHomepage.uploadDate')">
            <template #body="slotProps">
              {{ formatDate(slotProps.data.createdTime) }}
            </template>
          </Column>

          <!-- İşlemler Sütunu -->
          <Column>
            <template #body="slotProps">
              <!-- İndirme Butonu -->
              <Button
                icon="pi pi-download"
                class="p-button-success mr-4"
                @click="downloadFile(slotProps.data.id)"
                rounded
              />
            </template>
          </Column>
        </DataTable>
      </TabPanel>

      <!-- Görevler -->
      <TabPanel>
        <template #header>
          <i class="pi pi-star-fill tab-icon3 mr-2"></i>
          {{ t('participantHomepage.tasks') }}
        </template>
          <DataTable :value="tasks" ref="dt" dataKey="id"
                    :paginator="true" :rows="10"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25]"
                    >
          <Column field="title" :header="t('participantHomepage.taskTitle')" />
          <Column field="description" :header="t('participantHomepage.taskDescription')">
            <template #body="slotProps">
              {{ slotProps.data.description.length > 35 ? slotProps.data.description.substring(0, 35) + '...' : slotProps.data.description }}
            </template>
          </Column>
          <Column field="dueDate" :header="t('participantHomepage.creationDate')">
            <template #body="slotProps">
              {{ formatDate(slotProps.data.createdTime) }}
            </template>
          </Column>
          <Column field="dueDate" :header="t('participantHomepage.dueDate')">
            <template #body="slotProps">
              {{ formatDate(slotProps.data.dueDate) }}
            </template>
          </Column>
          <Column>
            <template #body="slotProps">
              <Button :label="t('participantHomepage.details')" @click="openTaskDialog(slotProps.data)" />
            </template>
          </Column>
        </DataTable>
      </TabPanel>

      <!-- Gerçekleşen Toplantılar -->
      <TabPanel>
        <template #header>
          <i class="pi pi-calendar-plus tab-icon2 mr-2"></i>
          {{ t('participantHomepage.pastMeetings') }}
        </template>
          <DataTable :value="pastMeetings" ref="dt" dataKey="id"
                    :paginator="true" :rows="10"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25]"
                    >
          <Column field="name" :header="t('participantHomepage.meetingName')" />
          <Column field="description" :header="t('participantHomepage.meetingDescription')">
            <template #body="slotProps">
              {{ slotProps.data.description.length > 35 ? slotProps.data.description.substring(0, 35) + '...' : slotProps.data.description }}
            </template>
          </Column>
          <Column field="scheduleDate" :header="t('participantHomepage.date')">
            <template #body="slotProps">
              {{ formatDate(slotProps.data.scheduleDate) }}
            </template>
          </Column>
          <Column field="startTime" :header="t('participantHomepage.startTime')">
            <template #body="slotProps">
              {{ formatTime(slotProps.data.startTime) }}
            </template>
          </Column>
          <Column field="endTime" :header="t('participantHomepage.endTime')">
            <template #body="slotProps">
              {{ formatTime(slotProps.data.endTime) }}
            </template>
          </Column>
        </DataTable>
      </TabPanel>

      <!-- Gerçekleştirilmeyen Toplantılar -->
      <TabPanel>
        <template #header>
          <i class="pi pi-calendar-minus tab-icon1 mr-2"></i>
          {{ t('participantHomepage.upcomingMeetings') }}
        </template>
          <DataTable :value="upcomingMeetings" ref="dt" dataKey="id"
                    :paginator="true" :rows="10"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25]"
                    >

          <Column field="name" :header="t('participantHomepage.meetingName')" />
          <Column field="description" :header="t('participantHomepage.meetingDescription')">
            <template #body="slotProps">
              {{ slotProps.data.description.length > 35 ? slotProps.data.description.substring(0, 35) + '...' : slotProps.data.description }}
            </template>
          </Column>
          <Column field="scheduleDate" :header="t('participantHomepage.date')">
            <template #body="slotProps">
              {{ formatDate(slotProps.data.scheduleDate) }}
            </template>
          </Column>
          <Column field="startTime" :header="t('participantHomepage.startTime')">
            <template #body="slotProps">
              {{ formatTime(slotProps.data.startTime) }}
            </template>
          </Column>
          <Column field="endTime" :header="t('participantHomepage.endTime')">
            <template #body="slotProps">
              {{ formatTime(slotProps.data.endTime) }}
            </template>
          </Column>
          <!-- Diğer sütunlar -->
        </DataTable>
      </TabPanel>
    </TabView>

    <!-- Görev Detay Dialog  -->
    <Dialog v-model:visible="taskDialogVisible" modal :header="t('participantHomepage.taskDetails')" :style="{ width: '50vw' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
      <div class="mb-4 text-center">
        <h3 class="text-2xl font-bold text-gray-800">{{ selectedTask.title }}</h3>
        <p class="text-sm text-gray-600 mt-2">{{ selectedTask.description }}</p>
      </div>

      <div class="p-fluid grid">
        <div class="field col-12 md:col-6 lg:col-6">
          <div class="p-card" style="height: 70px; background-color: #f0f8ff; border: 2px solid #dcdcdc; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
            <div class="p-card-body flex flex-column align-items-center">
              <label for="switch2" class="font-semibold text-800 mb-2" style="font-size: 1.1rem; color: #333333;">{{ t('participantHomepage.startDate') }}</label>
              <span class="text-lg font-medium" style="color: #555555;">
                {{ formatDate(selectedTask.createdTime) }}
              </span>
            </div>
          </div>
        </div>

        <div class="field col-12 md:col-6 lg:col-6">
          <div class="p-card" style="height: 70px; background-color: #f0f8ff; border: 2px solid #dcdcdc; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
            <div class="p-card-body flex flex-column align-items-center">
              <label for="switch2" class="font-semibold text-800 mb-2" style="font-size: 1.1rem; color: #333333;">{{ t('participantHomepage.dueDate') }}</label>
              <span class="text-lg font-medium" style="color: #555555;">
                {{ formatDate(selectedTask.dueDate) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div :style="{
            height: '4px',
            background: 'linear-gradient(90deg, #ffa500 0%, rgba(33, 150, 243, 0) 90%)',
            marginTop: '1px',
            marginBottom: '10px'
          }"></div>

      <TabView>
        <!-- Görev Dosyaları -->
        <TabPanel>
          <template #header>
            <i class="pi pi-inbox tab-icon5 mr-2"></i>
            {{ t('participantHomepage.taskFiles') }}
          </template>
          <DataTable :value="selectedTask.assignmentFiles">
            <!-- İkon sütunu ekliyoruz -->
            <Column header=" " width="50">
              <template #body="slotProps">
                <i
                  :class="getFileIconClass(slotProps.data.contentType)"
                  style="font-size: 1.5em;"
                ></i>
              </template>
            </Column>

            <!-- Dosya Adı -->
            <Column field="fileName" :header="t('participantHomepage.fileName')" />

            <!-- Dosya Türü -->
            <Column :header="t('participantHomepage.fileType')">
              <template #body="slotProps">
                {{ getFileType(slotProps.data.contentType) }}
              </template>
            </Column>

            <!-- Dosya Boyutu -->
            <Column :header="t('participantHomepage.fileSize')">
              <template #body="slotProps">
                {{ formatFileSize(slotProps.data.fileSize) }}
              </template>
            </Column>

            <!-- Yüklenme Tarihi -->
            <Column :header="t('participantHomepage.uploadDate')">
              <template #body="slotProps">
                {{ formatDate(slotProps.data.createdTime) }}
              </template>
            </Column>

            <!-- İşlemler Sütunu -->
            <Column>
              <template #body="slotProps">
                <!-- İndirme Butonu -->
                <Button
                  icon="pi pi-download"
                  class="p-button-help mr-4"
                  @click="downloadFile(slotProps.data.id)"
                  rounded
                />
              </template>
            </Column>
          </DataTable>
        </TabPanel>

        <TabPanel>
          <template #header>
            <i class="pi pi-thumbs-up-fill tab-icon6 mr-2"></i>
            {{ t('participantHomepage.submittedTaskFilesAndFeedback') }}
          </template>

          <!-- Görev Teslimi -->
          <div v-if="selectedTask.taskSubmission">

            <div class="card field col-12 md:col-12 lg:col-12" v-if="selectedTask.taskSubmission.feedback || selectedTask.taskSubmission.grade">
              <div class="card-body">
                <h5 class="card-title">{{ t('participantHomepage.feedback') }}</h5>
                <p class="card-text">{{ t('participantHomepage.feedbackNote') }}: {{ selectedTask.taskSubmission.feedback }}</p>
                <h3 class="card-text">{{ t('participantHomepage.grade') }}: {{ selectedTask.taskSubmission.grade }}</h3>
              </div>
            </div>

            <div class="card field col-12 md:col-12 lg:col-12" v-if="selectedTask.taskSubmission.participantNote">
              <div class="field col-12 md:col-6 lg:col-6">
                <div class="card-body">
                  <h5 class="card-title">{{ t('participantHomepage.yourSubmissionNote') }}</h5>
                  <p class="card-text">{{ selectedTask.taskSubmission.participantNote }}</p>
                </div>
              </div>
            </div>

            <div class="my-4" :style="{
                            height: '4px', 
                            width: '100%', 
                            background: 'linear-gradient(90deg, #ffa500 30%, #0a74da 70%)'
                            }"></div>

            <!-- Teslim Edilen Dosyalar -->
            <h4>{{ t('participantHomepage.submittedFiles') }}</h4>
            <Toolbar class="mb-4" v-if="shouldShowButton(selectedTask)">
              <template v-slot:start>
                <div class="my-2">
                  <Button :label="selectedTask.taskSubmission.participantNote ? t('participantHomepage.editNote') : t('participantHomepage.addNote')" 
                  icon="pi pi-plus" class="mr-2" severity="warning" @click="openSubmissionDialog" v-if="shouldShowButton(selectedTask)" />
                </div>
              </template>
              <template v-slot:end>
                <ProgressSpinner 
                  style="width: 25px; height: 25px" 
                  strokeWidth="8" 
                  fill="transparent" 
                  animationDuration=".5s" 
                  aria-label="Custom ProgressSpinner"
                  v-if="isUploading"/>
                <div v-if="!isUploading">
                  <FileUpload
                    ref="fileUploadRefTask" 
                    :chooseLabel="t('participantHomepage.browse')"
                    :label="getButtonLabel(selectedTask)"
                    mode="basic"
                    name="formFile"
                    :maxFileSize="1073741824"
                    @select="onFileSelect"
                    :auto="false"
                    :disabled="isUploading"
                  />
                </div>
              </template>
            </Toolbar>

            <DataTable :value="selectedTask.taskSubmission.submissionFiles">
              <!-- İkon sütunu ekliyoruz -->
              <Column header=" " width="50">
                <template #body="slotProps">
                  <i
                    :class="getFileIconClass(slotProps.data.contentType)"
                    style="font-size: 1.5em;"
                  ></i>
                </template>
              </Column>

              <!-- Dosya Adı -->
              <Column field="fileName" :header="t('participantHomepage.fileName')" />

              <!-- Dosya Türü -->
              <Column :header="t('participantHomepage.fileType')">
                <template #body="slotProps">
                  {{ getFileType(slotProps.data.contentType) }}
                </template>
              </Column>

              <!-- Dosya Boyutu -->
              <Column :header="t('participantHomepage.fileSize')">
                <template #body="slotProps">
                  {{ formatFileSize(slotProps.data.fileSize) }}
                </template>
              </Column>

              <!-- Yüklenme Tarihi -->
              <Column :header="t('participantHomepage.uploadDate')">
                <template #body="slotProps">
                  {{ formatDate(slotProps.data.createdTime) }}
                </template>
              </Column>

              <!-- İşlemler Sütunu -->
              <Column>
                <template #body="slotProps">
                  <!-- İndirme Butonu -->
                  <Button
                    icon="pi pi-download"
                    class="p-button-secondary mr-4"
                    @click="downloadFile(slotProps.data.id)"
                    rounded
                  />
                  <Button
                    icon="pi pi-trash"
                    class="p-button-danger"
                    @click="deleteDialog(slotProps.data.id, 1)"
                    rounded 
                    v-if="shouldShowButton(slotProps.data)"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
        </TabPanel>
      </TabView>

      <div :style="{ 
            height: '4px', 
            background: 'linear-gradient(90deg, #ffa500 0%, rgba(33, 150, 243, 0) 90%)',
            marginTop: '10px', 
            marginBottom: '10px'
          }"></div>

      <template #footer>
        <Button :label="t('participantHomepage.close')" icon="pi pi-times" @click="taskDialogVisible = false" class="p-button-text" />
      </template>
    </Dialog>

    <ConfirmDialog />

    <!-- Teslim Etme Dialog -->
    <Dialog
      v-model:visible="submissionDialogVisible"
      modal
      :header="t('participantHomepage.taskSubmissionNote')"
    >
      <div class="p-fluid">
        <!-- Teslim Notu -->
        <div class="field">
          <label for="submissionNote" class="font-semibold">{{ t('participantHomepage.submissionNote') }}</label>
          <Textarea
            id="submissionNote"
            v-model="submissionNote"
            rows="4"
            cols="50"
          />
        </div>
      </div>

      <template #footer>
        <Button
          :label="t('participantHomepage.save')"
          icon="pi pi-check"
          @click="saveSubmission"
          class="mr-2"
        />
        <Button
          :label="t('participantHomepage.cancel')"
          icon="pi pi-times"
          @click="submissionDialogVisible = false"
          class="p-button-text"
        />
      </template>
    </Dialog>

  </div>
</template>


<style scoped>
/* Stil düzenlemeleri */

.d-flex {
  display: flex;
}

.align-items-center {
  align-items: center;
}

.flex-grow-1 {
  flex-grow: 1;
}

.text-center {
  text-align: center;
}

.m-0 {
  margin: 0;
}

.mt-3 {
  margin-top: 1rem;
}


.tab-icon1 {
  font-size: 1.5em;
  color: #E74C3C;
}

.tab-icon2 {
  font-size: 1.5em;
  color: #2ECC71;
}

.tab-icon3 {
  font-size: 1.5em;
  color: #3498DB;
}

.tab-icon4 {
  font-size: 1.5em;
  color: #F1C40F;
}

.tab-icon5 {
  font-size: 1.5em;
  color: #03b395e0;
}

.tab-icon6 {
  font-size: 1.5em;
  color: #524ff1;
}

.mr-2 {
  margin-right: 0.5rem; /* İkon ile metin arasına boşluk ekler */
}

/* Opsiyonel: İkonlara hover efekti ekleyerek interaktif hale getirebilirsiniz */
.tab-icon1:hover,
.tab-icon2:hover,
.tab-icon3:hover,
.tab-icon4:hover {
  transform: scale(1.2);
  transition: transform 0.2s;
}

.file-icon-pdf {
  color: #E74C3C; /* Kırmızı */
}
.file-icon-image {
  color: #2ECC71; /* Yeşil */
}
.file-icon-text {
  color: #34495E; /* Koyu Gri */
}
.file-icon-excel {
  color: #27AE60; /* Açık Yeşil */
}
.file-icon-word {
  color: #2980B9; /* Mavi */
}
.file-icon-powerpoint {
  color: #E67E22; /* Turuncu */
}
.file-icon-archive {
  color: #7F8C8D; /* Gri */
}
.file-icon-audio {
  color: #9B59B6; /* Mor */
}
.file-icon-video {
  color: #8E44AD; /* Koyu Mor */
}
.file-icon-json {
  color: #16A085; /* Koyu Turkuaz */
}
.file-icon-xml {
  color: #D35400; /* Koyu Turuncu */
}
.file-icon-default {
  color: #95A5A6; /* Açık Gri */
}
</style>
