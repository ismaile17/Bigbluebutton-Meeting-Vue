<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useLayoutStore } from '@/stores/layout'
import { useMeetingStore } from '@/stores/meeting'
import { useParticipantStore } from '@/stores/participant'
import { useFileSystem } from '@/stores/filesystem'
import { useTaskSystem } from '@/stores/tasksystem';
import { useConfirm } from "primevue/useconfirm";
import { format, max } from 'date-fns'

import {useI18n} from "vue-i18n";
const {t,te} = useI18n();

const router = useRouter()
const route = useRoute()
const toast = useToast()
const layoutStore = useLayoutStore()
const meetingStore = useMeetingStore()
const participantStore = useParticipantStore()
const fileSystemStore = useFileSystem()
const taskSystemStore = useTaskSystem()

const confirm = useConfirm()

const productDialog = ref(false)
const groupModel = ref({
  id: '',
  name: '',
  description: '',
  specialDescription: '',
  meetingGroupUserLists: []
})
const selectedParticipants = ref([])
const addedParticipants = ref([])

const filtersMain = ref({ global: { value: null } })
const filtersDialog = ref({ global: { value: null } })

const selectedParticipantIds = ref([]) // Seçili katılımcıların ID'leri için yeni ref

onMounted(async () => {
  layoutStore.setLoading(true);
  try {
    const a = await meetingStore.getGroupById(route.params.id);
    if (a.success) {
      groupModel.value = a.value;
      
      // appUsers'dan gelen verileri işle ve gerekli alanları doldur
      const preparedParticipants = a.value.appUsers.map((user) => ({
        email: user.email.replace(/_participant$/, ''), // Eğer varsa '_participant' kaldır
        nameSurname: user.participantUserName, // Kullanıcının tam adı
        specialDescription: user.phoneNumber, // Özel açıklama
        participantId: user.id // DataTable ve seçimler için kullanılacak
      }));
      
      selectedParticipants.value = preparedParticipants.map((user) => user);
      addedParticipants.value = [...preparedParticipants];
      selectedParticipantIds.value = preparedParticipants.map((user) => user.participantId); // Seçili katılımcıların ID'lerini ata
    }
  } catch (error) {
    console.error('Veri çekilirken bir hata oluştu:', error);
    // Hata durumunda loading durumunu kapatmayı unutmayın
  } finally {
    layoutStore.setLoading(false); // Veri çekme işlemi tamamlandıktan sonra loading durumunu kapat
  }
});


const editGroup = async () => {
  layoutStore.setLoading(true)

  if (!validateForm()) {
        layoutStore.setLoading(false);
        return;
    }

  try {
    const response = await meetingStore.editGroup({
      ...groupModel.value,
      meetingGroupUserLists: selectedParticipantIds.value

    })
    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Group updated successfully',
        life: 3000
      })
      
      // Listeyi güncelle ve yönlendirme yap
      await meetingStore.getGroupByUserId();
      router.push('/meeting/group/list');
    } else {
      throw new Error(t('group.form.registerError'))
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: t('error'), detail: error.message, life: 3000 })
  } finally {
    layoutStore.setLoading(false)
  }
}

const flattenedParticipants = ref([])

const openNew = async () => {
  layoutStore.setLoading(true)
  productDialog.value = true // Diyalogu göster

  try {
    // Tüm katılımcıları çek
    await participantStore.getAllParticipantByManager()
    
    // flattenedParticipants ve selectedParticipants güncelleme
    flattenedParticipants.value = participantStore.participants.value.flatMap((participant) =>
      participant.managerParticipants.map((subParticipant) => ({
        ...subParticipant,
        id: subParticipant.participantId, // ID'yi kullanarak eşleşme sağla
        email: participant.email.replace(/_participant$/, ''), // Doğru email adresini al
        nameSurname: subParticipant.nameSurname,
        specialDescription: subParticipant.specialDescription
      }))
    )

    // Seçili katılımcıları güncelle
    const selectedIds = selectedParticipants.value.map((p) => p.participantId)
    selectedParticipants.value = flattenedParticipants.value.filter((participant) =>
      selectedIds.includes(participant.id)
    )

    layoutStore.setLoading(false)
  } catch (error) {
    console.error('Veri çekme sırasında bir hata oluştu:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Participants could not be loaded.',
      life: 3000
    })
    layoutStore.setLoading(false)
  }
}


function saveSelectedParticipants() {
  addedParticipants.value = [...selectedParticipants.value]
  selectedParticipantIds.value = selectedParticipants.value.map(p => p.id); // Sadece ID değerleri olmalı
  productDialog.value = false
  toast.add({ severity: 'success', summary: 'Success', detail: 'Participants updated', life: 3000 })
}

function removeParticipant(participantId) {
  // 'selectedParticipants' ve 'addedParticipants' üzerinde 'participantId' kullanarak filtreleme yap
  selectedParticipants.value = selectedParticipants.value.filter(p => p.participantId !== participantId);
  addedParticipants.value = addedParticipants.value.filter(p => p.participantId !== participantId);
  selectedParticipantIds.value = selectedParticipantIds.value.filter(id => id !== participantId);

  toast.add({
    severity: 'success',
    summary: t('success'),
    detail: t('group.form.participantRemoved'),
    life: 3000
  });
}


function closeDialog() {
  // Dialog'u kapat
  productDialog.value = false

  // selectedParticipants'ı önceki duruma (addedParticipants ile aynı olacak şekilde) geri yükle
  selectedParticipants.value = [...addedParticipants.value]
}


//DOSYA KODLARI


const uploadedFiles = ref([]) // Yüklenen dosyalar burada saklanacak
const formData = ref(new FormData()) // Dosya yükleme formData

const pageType = ref(null);
const pageId = ref(null); // Görev ID'si veya Sayfa ID'si

const isUploading = ref(false);
const fileUploadRef = ref(null); // FileUpload bileşenine referans

const activeIndex = ref(0);

// Sekme değişikliklerini yakalayan fonksiyon
const handleTabChange = (event) => {
  const newIndex = event.index; // Yeni aktif sekmenin indeksi

  if (newIndex === 1) { // 'Dosyalar' sekmesi (indeks 1)
    onFilesTabActivated();
  } else if (newIndex === 2) { // 'Görevler' sekmesi (indeks 2)
    onTasksTabActivated();
  }
};

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



const onFileSelect = async (event) => {
  if (event.files && event.files.length > 0) {

    if (!pageId.value || !pageType.value) {
      toast.add({ severity: 'error', summary: 'Hata', detail: 'Geçerli bir pageId veya pageType ayarlanmamış', life: 3000 });
      return;
    }

    isUploading.value = true; // Yükleme işlemi başlıyor
    try {
      const formData = new FormData();
      formData.append('formFile', event.files[0]);
      formData.append('pageId', pageId.value);
      formData.append('pageType', pageType.value);

      const result = await fileSystemStore.uploadFile(formData);
      if (result.success) {
        isFilesLoaded.value = false; 
        toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Dosya Yüklendi', life: 3000 });
        await getFileList();
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

// Dosya listesini al
const getFileList = async () => {
  if (isFilesLoaded.value) {
    // Dosyalar zaten yüklendiyse tekrar yükleme yapma
    return;
  }
  layoutStore.setLoading(true);
  try {
    const result = await fileSystemStore.getFileListByUserId(pageId.value ?? route.params.id, pageType.value ?? 1);
    if (result && result.success && fileSystemStore.files) {
      uploadedFiles.value = fileSystemStore.files;
      isFilesLoaded.value = true; // Dosyalar yüklendi
    } else {
      uploadedFiles.value = [];
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch files', life: 3000 });
  } finally {
    layoutStore.setLoading(false);
  }
};


const getFileListTask = async () => {
  layoutStore.setLoading(true);
  try {
    const result = await fileSystemStore.getFileListByUserId(pageId.value, pageType.value);
    if (result && result.success && fileSystemStore.files && fileSystemStore.files.length > 0) {
      uploadedFilesTask.value = fileSystemStore.files;
    } else {
      uploadedFilesTask.value = [];
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Dosyalar alınamadı', life: 3000 });
  } finally {
    layoutStore.setLoading(false);
  }
};

// Dosya silme işlemi
const deleteFile = async (fileId, pageType) => {
  layoutStore.setLoading(true);
  try {
    const result = await fileSystemStore.deleteFile(fileId, pageType); // Kullanıcı ID sabit olarak 2
    if (result.success) {
      toast.add({ severity: 'success', summary: 'Success', detail: 'File Deleted', life: 3000 });
      isFilesLoaded.value = false;
      if(pageType === 1)
    {
      await getFileList(); // Dosya silindikten sonra listeyi güncelle
    }
    else{
      await getFileListTask(); // Görev dosyalarını yüklüyoruz
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


// Dosya boyutunu formatlamak için bir fonksiyon
function formatFileSize(size) {
  if (size === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Tarihi Türkçe formatta göstermek için bir fonksiyon
function formatDateTR(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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


const submitted = ref(false);
const validateForm = () => {
    submitted.value = true;
    return groupModel.value.name.trim() !== '';
};

const onFilesTabActivated = async () => {
  pageId.value = route.params.id;
  pageType.value = 1;
  await getFileList();
};

const onTasksTabActivated = async () => {
  pageId.value = route.params.id;
  pageType.value = 4;
  await getTaskList();
};

const uploadedFilesTask = ref([]) // Görev dialog'u için dosya listesi

const editTask = async (task) => {
  taskModel.value = { ...task };
  
  // 'isActive' ve 'allowLateSubmissions' alanlarını boolean yapıyoruz
  taskModel.value.isActive = task.isActive === 1;
  taskModel.value.allowLateSubmissions = task.allowLateSubmissions === 1 || task.allowLateSubmissions === true;

  // Tarih alanlarını 'YYYY-MM-DD' formatına çeviriyoruz
  if (task.dueDate) {
    taskModel.value.dueDate = format(new Date(task.dueDate), 'yyyy-MM-dd');
  } else {
    taskModel.value.dueDate = null;
  }

  if (task.lateDueDate) {
    taskModel.value.lateDueDate = format(new Date(task.lateDueDate), 'yyyy-MM-dd');
  } else {
    taskModel.value.lateDueDate = null;
  }

  pageId.value = task.id; // Görev ID'sini ayarlıyoruz
  pageType.value = 4; // Görevler için pageType 4 kullanılıyor
  taskDialog.value = true;
  
  await getFileListTask(); // Görev dosyalarını yüklüyoruz
};


const tasks = ref([]); // Görevleri saklamak için bir ref

const isTasksLoaded = ref(false);

const isFilesLoaded = ref(false);

const getTaskList = async () => {
  if (isTasksLoaded.value) {
    // Görevler zaten yüklendiyse tekrar yükleme yapma
    return;
  }
  layoutStore.setLoading(true);
  try {
    const response = await taskSystemStore.getAllTasksByGroupId(route.params.id);
    if (response && response.success && response.value) {
      tasks.value = response.value;
      isTasksLoaded.value = true; // Görevler yüklendi
    } else {
      tasks.value = [];
    }
  } catch (error) {
    console.error('Görevler alınamadı:', error);
    toast.add({ severity: 'error', summary: 'Hata', detail: 'Görevler alınamadı', life: 3000 });
  } finally {
    layoutStore.setLoading(false);
  }
};



const taskDialog = ref(false);

const taskModel = ref({
  id: null,
  title: '',
  description: '',
  dueDate: null,
  lateDueDate: null,
  maxGrade: 100,
  allowLateSubmissions: false,
  isActive: false,
  meetingGroupId: route.params.id // Grubun ID'si
})

const createOrEditTask = async () => {
  layoutStore.setLoading(true);
  try {
    let response;
    if (!taskModel.value.id) {
      // Yeni görev oluşturma kısmı artık kullanılmıyor
      throw new Error('Yeni görev oluşturmak için ayrı bir fonksiyon kullanın.');
    } else {
      // Var olan görevi güncelleme
      response = await taskSystemStore.createOrEditUserDetail(taskModel.value);
      if (response.success) {
        toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Görev güncellendi', life: 3000 });

        isFilesLoaded.value = false;
        isTasksLoaded.value = false; 

        await getTaskList(); // Görev listesini güncelle        
        await getFileListTask(); // Görev dosya listesini güncelle
        
      } else {
        throw new Error('Görev güncellenemedi');
      }
    }
    taskDialog.value = false; // Dialog'u kapat
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Hata', detail: error.message, life: 3000 });
  } finally {
    layoutStore.setLoading(false);
  }
};



const createTaskAndOpenDialog = async () => {
  layoutStore.setLoading(true);
  try {
    // Görev modelini temizle ve ID'yi null yap
    taskModel.value = {
      id: null,
      title: '',
      description: '',
      dueDate: null,
      lateDueDate: null,
      maxGrade: 0,
      meetingGroupId: route.params.id, // Grubun ID'si
    };

    // API'ye yeni görev oluşturma isteği gönder
    const response = await taskSystemStore.createOrEditUserDetail(taskModel.value);

    if (response.success) {
      // Yeni oluşturulan görevin ID'sini al
      taskModel.value.id = response.value.id;
      pageId.value = response.value.id; // Görev ID'sini ayarlıyoruz
      pageType.value = 4; // Görevler için pageType 4 kullanılıyor

      toast.add({
        severity: 'success',
        summary: 'Başarılı',
        detail: 'Görev oluşturuldu',
        life: 3000,
      });
      isFilesLoaded.value = false;
      isTasksLoaded.value = false; 
      // Görev dosya listesini güncelle
      await getFileListTask();

      // Dialog'u aç
      taskDialog.value = true;

      // Görev listesini güncelle
      await getTaskList();
    } else {
      throw new Error('Görev oluşturulamadı');
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: error.message || 'Görev oluşturma sırasında bir hata oluştu',
      life: 3000,
    });
  } finally {
    layoutStore.setLoading(false);
  }
};



// Görev dialog'u için dosya seçildiğinde çağrılacak fonksiyon
const onFileSelectTask = async (event) => {
  if (event.files && event.files.length > 0) {
    if (!pageId.value || !pageType.value) {
      toast.add({ severity: 'error', summary: 'Hata', detail: 'Geçerli bir pageId veya pageType ayarlanmamış', life: 3000 });
      return;
    }
    
    isUploading.value = true; // Yükleme işlemi başlıyor
    try {
      for (const file of event.files) {
        const formData = new FormData();
        formData.append('formFile', file);
        formData.append('pageId', pageId.value);
        formData.append('pageType', pageType.value);

        const result = await fileSystemStore.uploadFile(formData);
        if (result.success) {
          toast.add({ 
            severity: 'success', 
            summary: 'Başarılı', 
            detail: `Dosya ${file.name} yüklendi.`, 
            life: 3000,
          });
        } else {
          throw new Error(`Dosya ${file.name} yüklenemedi.`);
        }
      }
      await getFileListTask(); // Görev dosya listesini güncelle
    } catch (error) {
      console.error('Hata Detayları:', error);
      const errorMessage = error.message || 'Bilinmeyen bir hata oluştu';
      toast.add({ 
        severity: 'error', 
        summary: 'Hata', 
        detail: errorMessage, 
        life: 3000,
      });
    } finally {
      isUploading.value = false; // Yükleme işlemi tamamlandı veya hata oluştu
      if (fileUploadRef.value) {
        fileUploadRef.value.clear();
      }
    }
  } else {
    toast.add({ 
      severity: 'error', 
      summary: 'Hata', 
      detail: 'Dosya seçilmedi', 
      life: 3000,
    });
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return format(new Date(dateString), 'dd/MM/yyyy');
};


const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}



const isActiveComputed = computed({
  get() {
    return taskModel.value.isActive;
  },
  set(value) {
    if (value) {
      if (taskModel.value.title.trim() === '' || taskModel.value.description.trim() === '') {
        toast.add({
          severity: 'error',
          summary: t('error'),
          detail: t('group.task.activeError'),
          life: 3000
        });
        return;
      }
    }
    taskModel.value.isActive = value;
  }
});



const deleteTaskAssignment = (taskId) => {
  confirm.require({
    message: t('group.task.deleteConfirm'),
    header: t('group.task.deleteHeader'),
    icon: 'pi pi-info-circle',
    acceptLabel: t('group.task.deleteAccept'),
    rejectLabel: t('group.task.deleteReject'),
    acceptProps: {
      severity: 'danger'
    },
    rejectProps: {
      severity: 'secondary',
      outlined: true
    },
    accept: async () => {
      await softDeleteTaskAssignment(taskId);
    },
    reject: () => {
      toast.add({ 
        severity: 'info', 
        summary: t('group.task.deleteCancelled'), 
        detail: t('group.task.deleteCancelledDetail'), 
        life: 3000 
      });
    }
  });
};


const softDeleteTaskAssignment = async (taskId) => {
  if (!taskId) {
      toast.add({ severity: 'error', summary: t('error'), detail: t('completedMeeting.form.invalidMeetingId'), life: 3000 });
      return; // ID geçersizse işlemi durdur
  }

  try {
      const response = await taskSystemStore.softDeleteTaskAssignment(taskId);
      if (response.success) {
          toast.add({ severity: 'success', summary: t('success'), detail: t('group.task.deletedTask'), life: 3000 });
          isTasksLoaded.value = false; 
          await getTaskList();
      } else {
          toast.add({ severity: 'error', summary: t('error'), detail: t('group.error'), life: 3000 });
      }
  } catch (error) {
      toast.add({ severity: 'error', summary: t('error'), detail: t('group.form.error'), life: 3000 });
  }
};


//assignment DİALOG 

// Yeni ref'ler ekleyin
const assignmentDialog = ref(false);
const assignmentData = ref(null);

const openAssignmentDialog = async (taskAssignmentId, isActive) => {
  
  if(isActive != 1){
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Aktif değil.', life: 3000 });
        return;
      }

  layoutStore.setLoading(true);
  try {
    const response = await taskSystemStore.getAllSubmissionListByAssignmentId(taskAssignmentId);
    if (response.success) {
      assignmentData.value = response.value;

    } else {
      throw new Error('Görev ataması verisi alınamadı');
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Hata', detail: error.message, life: 3000 });
  } finally {
    layoutStore.setLoading(false);
    assignmentDialog.value = true;
  }
};




// Katılımcı notu veya puan güncelleme fonksiyonu
const updateParticipant = (index, field, value) => {
  if (assignmentData.value && assignmentData.value.users[index]) {
    assignmentData.value.users[index][field] = value;
  }
};

// Detayları kaydetme fonksiyonu
const saveAssignmentDetails = async () => {
  layoutStore.setLoading(true);
  try {
    // Gönderilecek verileri hazırla
    const payload = {
      assignmentId: assignmentData.value.taskAssignmentId, // Assignment ID
      updates: assignmentData.value.users.map(user => ({
        userId: user.user.id,
        grade: user.grade,
        feedback: user.feedback
      }))
    };

    const response = await taskSystemStore.createTaskAssignmentSubmissionDetails(payload);

    if (response.success) {
      toast.add({ 
        severity: 'success', 
        summary: 'Başarılı', 
        detail: 'Detaylar güncellendi', 
        life: 3000 
      });
      assignmentDialog.value = false;
    } else {
      throw new Error('Güncelleme başarısız oldu');
    }
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Hata', 
      detail: error.message || 'Detaylar güncellenemedi', 
      life: 3000 
    });
  } finally {
    layoutStore.setLoading(false);
  }
};




const bulkOperationDialog = ref(false);
const bulkOperationModel = ref({
  targetGroup: 'all', // 'all', 'submitted', 'notSubmitted'
  grade: null,
  note: ''
});

const openBulkOperationDialog = () => {
  bulkOperationModel.value = {
    targetGroup: 'all',
    grade: null,
    note: ''
  };
  // Dialog'u aç
  bulkOperationDialog.value = true;
};

const applyBulkOperation = () => {
  let targetUsers = [];
  if (bulkOperationModel.value.targetGroup === 'all') {
    targetUsers = assignmentData.value.users;
  } else if (bulkOperationModel.value.targetGroup === 'submitted') {
    targetUsers = assignmentData.value.users.filter(user => user.SubmissionFileId);
  } else if (bulkOperationModel.value.targetGroup === 'notSubmitted') {
    targetUsers = assignmentData.value.users.filter(user => !user.SubmissionFileId);
  }

  targetUsers.forEach(user => {
    user.grade = bulkOperationModel.value.grade;
    user.feedback = bulkOperationModel.value.note;
  });

  bulkOperationDialog.value = false;
};

const formatUserName = (user) => {
  if (user && user.userName) {
    return user.userName.replace('_participant', '');
  }
  return '';
};


// Kullanıcı dosyalarını göstermek için gerekli ref'ler
const userFilesDialogVisible = ref(false)
const selectedUserFiles = ref([])

// ...

// Kullanıcı dosyalarını gösteren fonksiyon
const showUserFiles = (userData) => {
  if (userData.files && userData.files.length > 0) {
    selectedUserFiles.value = userData.files
    userFilesDialogVisible.value = true
  } else {
    toast.add({
      severity: 'info',
      summary: t('group.noFiles'),
      detail: t('group.userHasNoFiles'),
      life: 3000,
    })
  }
}

//Q123W


</script>

<template>
  <div class="flex justify-content-between mb-3">
          <Button :label="t('Menu.back')" icon="pi pi-arrow-left" @click="router.go(-1)" rounded />
          <Button :label="t('group.form.save')" icon="pi pi-save" @click="editGroup" rounded />
  </div>

  <div :style="{ height: '4px', background: 'linear-gradient(90deg, #ffa500 0%, rgba(33, 150, 243, 0) 90%)' }" class="mb-4"></div>
<div v-if="meetingStore.groups">
  <div class="grid">
    <div class="col-12 lg:col-12">

      <Fieldset v-model:collapsed="isCollapsed" :toggleable="true">
            <template #legend>
              <span v-if="isCollapsed">
                {{ groupModel.name.length > 55 ? groupModel.name.substring(0, 55) + '...' : groupModel.name }}
              </span>          
            </template>

          <div class="grid formgrid p-fluid">
            <div class="col-12">
              <div class="field mb-12 col-12">
                <label for="nickname" class="font-medium text-900"> {{ t('group.form.groupName') }} </label>
                <InputText id="name" required="true" autofocus v-model="groupModel.name" 
                :class="{ 'p-invalid': submitted && groupModel.name.trim() === '' }"
                />
                <div class="grid formgrid">
                  <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                    <h5></h5>
                    <label for="description" class="font-medium text-900">
                      {{ t('group.form.description') }}
                    </label>
                    <Textarea
                      id="description"
                      variant="filled"                    
                      rows="3"
                      cols="5"
                      class="mr-4"
                      autofocus
                      v-model="groupModel.description"
                    />
                  </div>
                  <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                    <h5></h5>
                    <label for="specialDescription" class="font-medium text-900">
                      {{ t('group.form.specialDescription') }}
                    </label>
                    <Textarea
                      id="specialDescription"
                      rows="3"
                      cols="5"
                      variant="filled"                    
                      class="mr-4"
                      autofocus
                      v-model="groupModel.specialDescription"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Fieldset>

      <h5></h5>

      <TabView v-model:activeIndex="activeIndex" @tab-change="handleTabChange">
          <TabPanel>
            <template #header>
              <i class="pi pi-users tab-icon1 mr-2"></i>
              {{ t('group.participants') }}
            </template>

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
                    <InputText class="w-full sm:w-auto" v-model="filtersMain['global'].value" :placeholder="t('group.form.search')" />
                  </span>
                </div>
              </template>
            </Toolbar>

              <DataTable :value="addedParticipants" selectionMode="single"
              :filters="filtersMain"
              :paginator="true" :rows="10"
              filterDisplay="menu"
              :globalFilterFields="['nameSurname', 'email', 'specialDescription']"
              >
                <Column field="nameSurname" :header="t('group.form.name')" />
                <Column field="email" :header="t('group.form.email')" />
                <Column field="specialDescription" :header="t('group.form.specialDescriptionHeader')" />
                <Column>
                  <template #body="slotProps">
                    <Button
                      icon="pi pi-times"
                      severity="danger"
                      text
                      rounded
                      @click="() => removeParticipant(slotProps.data.participantId)"
                      class="p-button-rounded p-button-danger"
                    />
                  </template>
                </Column>
              </DataTable>
          </TabPanel>

          <TabPanel>  
            <template #header>
              <i class="pi pi-paperclip tab-icon2 mr-2"></i>
              {{ t('group.files') }}
            </template>  
            
            <Toolbar>
              <template v-slot:start v-if="uploadedFiles.length > 0">
                <div class="flex align-items-center">
                  <i class="pi pi-folder" style="font-size: 1.5rem; margin-right: 0.5rem;"></i>
                  <span class="text-lg font-bold">{{ t('group.uploadedFilesForMembers') }}</span>
                </div>
              </template>


              <template v-slot:end>
                <ProgressSpinner style="width: 25px; height: 25px" strokeWidth="8" fill="transparent" animationDuration=".5s" aria-label="Custom ProgressSpinner" v-if="isUploading"/>
                <div v-if="!isUploading">
                  <FileUpload
                    ref="fileUploadRef"
                    :chooseLabel="t('group.form.browse')"
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

          <div v-if="uploadedFiles.length > 0" class="mt-3">
            <DataTable :value="uploadedFiles" :sortField="'createdTime'" :sortOrder="-1"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[5,10,20]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            responsiveLayout="scroll"
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
              <Column field="fileName" :header="t('group.fileName')" />

              <!-- Dosya Türü -->
              <Column :header="t('group.fileType')">
                <template #body="slotProps">
                  {{ getFileType(slotProps.data.contentType) }}
                </template>
              </Column>

              <!-- Dosya Boyutu -->
              <Column :header="t('group.fileSize')">
                <template #body="slotProps">
                  {{ formatFileSize(slotProps.data.fileSize) }}
                </template>
              </Column>

              <!-- Yüklenme Tarihi -->
              <Column :header="t('group.uploadDate')">
                <template #body="slotProps">
                  {{ formatDateTR(slotProps.data.createdTime) }}
                </template>
              </Column>

              <!-- İşlemler Sütunu -->
              <Column>
                <template #body="slotProps">
                  <!-- İndirme Butonu -->
                  <Button
                    icon="pi pi-download"
                    class="p-button-success mr-4"
                    @click="downloadFile(slotProps.data.id, slotProps.data.fileName)"
                    rounded 
                    />
                  <!-- Silme Butonu -->
                  <Button
                    icon="pi pi-trash"
                    class="p-button-danger"
                    @click="deleteDialog(slotProps.data.id, 1)"
                    rounded
                  />
                </template>
              </Column>
            </DataTable>
          </div>
        </TabPanel>

        <TabPanel>
            <template #header>
              <i class="pi pi-star-fill tab-icon3 mr-2"></i>
              {{ t('group.tasks') }}
            </template> 

            <Toolbar>
              <template v-slot:start>
                <Button
                  :label="t('group.task.taskButton')"
                  icon="pi pi-user-plus"
                  class="mr-1"
                  severity="warning"
                  @click="createTaskAndOpenDialog"
                  
                ></Button>
              </template>
              <template v-slot:end>
                <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                  <h5 class="m-0"></h5>
                  <span class="block mt-2 md:mt-0 p-input-icon-left">
                    <i class="pi pi-search" />
                    <InputText class="w-full sm:w-auto" v-model="filtersMain['global'].value" :placeholder="t('group.form.search')" />
                  </span>
                </div>
              </template>
            </Toolbar>

            <DataTable :value="tasks" selectionMode="single"
              :filters="filtersMain"
              :paginator="true" :rows="10"
              filterDisplay="menu"
              :globalFilterFields="['title', 'description']"
            >
            <Column field="isActive" :header="t('group.task.taskActive')" sortable>
              <template #body="slotProps">
                <i v-if="slotProps.data.isActive === 1" class="pi pi-check-circle" style="color: green; font-size: 1.2em;"></i>
                <i v-else class="pi pi-times-circle" style="color: red; font-size: 1.2em;"></i>
              </template>
            </Column>

              <Column field="title" :header="t('group.task.taskName')" sortable>
                <template #body="slotProps">
                  <span class="truncate-text" :title="slotProps.data.title">
                    {{ truncateText(slotProps.data.title, 80) }}
                  </span>
                </template>
              </Column>

              <Column field="description" :header="t('group.task.taskDescription')" sortable>
                <template #body="slotProps">
                  <span class="truncate-text" :title="slotProps.data.description">
                    {{ truncateText(slotProps.data.description, 80) }}
                  </span>
                </template>
              </Column>

              <Column field="createdTime" :header="t('group.task.createdTime')" sortable>
                <template #body="slotProps">{{ formatDate(slotProps.data.createdTime) }}</template>
              </Column>

              <Column field="dueDate" :header="t('group.task.taskDueDate')" sortable>
                <template #body="slotProps">{{ formatDate(slotProps.data.dueDate) }}</template>
              </Column>
              <Column field="lateDueDate" :header="t('group.task.taskLateDueDate')" sortable>
                <template #body="slotProps">{{ formatDate(slotProps.data.lateDueDate) }}</template>
              </Column>
              <Column field="maxGrade" :header="t('group.task.taskmaxGrade')" sortable/>

              <Column bodyStyle="text-align: center">
                <template #body="slotProps">
                  <!-- dialog assignment -->
                  <Button
                    icon="pi pi-paperclip"
                    class="p-button-rounded p-button mr-2"
                    @click="openAssignmentDialog(slotProps.data.id, slotProps.data.isActive)"
                    rounded
                  />

                  <!-- Düzenle Butonu -->
                  <Button
                    icon="pi pi-pencil"
                    class="p-button-rounded p-button-warning mr-2"
                    @click="editTask(slotProps.data)"
                    rounded
                  />
                  <!-- Silme Butonu -->
                  <Button
                    icon="pi pi-trash"
                    class="p-button-rounded p-button-danger"
                    @click="deleteTaskAssignment(slotProps.data.id)"
                    rounded
                  />
                </template>
              </Column>

            </DataTable>
          </TabPanel>


      </TabView>
    </div>
  </div>
</div>


<!-- Görev Oluşturma veya Düzenleme Dialog -->
<Dialog v-model:visible="taskDialog" :closable="false" :modal="true" class="p-fluid" :header="t('group.task.taskHeader')">

<div class="field">
  <label for="title" class="font-medium text-900">{{ t('group.task.taskTitle') }}</label>
  <InputText id="title" v-model="taskModel.title" />
</div>
<div class="field">
  <label for="description" class="font-medium text-900">{{ t('group.task.taskDescription') }}</label>
  <Textarea id="description" v-model="taskModel.description" rows="3"/>
</div>

<div class="p-fluid grid">
  <div class="field col-12 md:col-6 lg:col-4">
    <div class="p-card" style="height: 80px;"> <!-- Aynı yükseklik ekliyoruz -->
      <div class="p-card-body flex flex-column align-items-center">
        <label for="switch2" class="font-medium text-900 mb-2">{{ t('group.task.taskActive') }}</label>
        <InputSwitch v-model="isActiveComputed" inputId="switch2" />
      </div>
    </div>
  </div>

  <div class="field col-12 md:col-6 lg:col-4">
    <div class="p-card" style="height: 80px;"> <!-- Sabit yükseklik ekliyoruz -->
      <div class="p-card-body flex flex-column align-items-center">
        <label for="switch" class="font-medium text-900 mb-2">{{ t('group.task.lateSubmissionActive') }}</label>
        <InputSwitch v-model="taskModel.allowLateSubmissions" inputId="switch" />
      </div>
    </div>
  </div>

  <div class="field col-12 md:col-12 lg:col-4">
    <div class="p-card" style="height: 80px;"> <!-- Maksimum puan kutusu için de aynı yükseklik -->
      <div class="p-card-body">
        <label for="maxGrade" class="font-medium text-900">{{ t('group.task.maxGrade') }}</label>
        <InputNumber id="maxGrade" v-model="taskModel.maxGrade" class="w-full"/>
      </div>
    </div>
  </div>
</div>

<div class="p-fluid grid">
  <div class="field col-12 md:col-6">
    <label for="dueDate" class="font-medium text-900">{{ t('group.task.dueDate') }}</label>
    <input id="dueDate" type="date" class="p-inputtext w-full mb-4" v-model="taskModel.dueDate"/>
  </div>
  <div class="field col-12 md:col-6" v-if="taskModel.allowLateSubmissions">
    <label for="lateDueDate" class="font-medium text-900">{{ t('group.task.lateDueDate') }}</label>
    <input id="lateDueDate" type="date" class="p-inputtext w-full mb-4" v-model="taskModel.lateDueDate"/>
  </div>
</div>


<h4 class="mt-4">{{ t('group.task.taskFiles') }}</h4>
<Toolbar>
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
        :chooseLabel="t('group.form.browse')"
        mode="basic"
        name="formFile"
        :maxFileSize="1073741824"
        @select="onFileSelectTask"
        :auto="false"
        :disabled="isUploading"
      />
    </div>
  </template>
</Toolbar>

<DataTable :value="uploadedFilesTask" :sortField="'createdTime'" :sortOrder="-1"
  :paginator="true"
  :rows="10"
  :rowsPerPageOptions="[5,10,20]"
  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
  responsiveLayout="scroll"
  class="mt-3"
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
  <Column field="fileName" :header="t('group.fileName')" />

  <!-- Dosya Türü -->
  <Column :header="t('group.fileType')">
    <template #body="slotProps">
      {{ getFileType(slotProps.data.contentType) }}
    </template>
  </Column>

  <!-- Dosya Boyutu -->
  <Column :header="t('group.fileSize')">
    <template #body="slotProps">
      {{ formatFileSize(slotProps.data.fileSize) }}
    </template>
  </Column>

  <!-- Yüklenme Tarihi -->
  <Column :header="t('group.uploadDate')">
    <template #body="slotProps">
      {{ formatDateTR(slotProps.data.createdTime) }}
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
      <!-- Silme Butonu -->
      <Button
        icon="pi pi-trash"
        class="p-button-danger"
        @click="deleteDialog(slotProps.data.id, 4)"
        rounded
      />
    </template>
  </Column>
</DataTable>

<template #footer>
  <Button :label="t('group.task.save')" icon="pi pi-check" @click="createOrEditTask" />
  <Button :label="t('group.task.cancel')" icon="pi pi-times" @click="() => taskDialog = false" class="p-button-text" />
</template>
</Dialog>


<!-- Assignment Detay Dialog -->
<Dialog 
  v-model:visible="assignmentDialog" 
  :closable="false" 
  :modal="true" 
>
  <!-- Header Kısmı -->
  <template #header>
    <div class="flex justify-content-between align-items-center w-full">
      <h3 class="m-0">{{ t('group.assignmentDetails') }}</h3>
      <Button 
        :label="t('group.bulkOperation')"
        icon="pi pi-users" 
        class="ml-auto" 
        severity="warning"
        outlined
        @click="openBulkOperationDialog" 
      />
    </div>
  </template>



  <!-- Assignment Bilgileri -->
  <div class="card mb-4 text-center" v-if="assignmentData">
    <h3 class="text-2xl font-bold text-gray-800">{{ assignmentData.title }}</h3>
    <p class="text-sm text-gray-600 mt-2">{{ assignmentData.description }}</p>
  </div>

  <div class="p-fluid grid">
    <div class="field col-12 md:col-6 lg:col-3">
      <div class="p-card" style="height: 70px; background-color: #f0f8ff; border: 1px solid #dcdcdc; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);"> 
        <div class="p-card-body flex flex-column align-items-center">
          <label for="switch2" class="font-semibold text-800 mb-2" style="font-size: 1.1rem; color: #333333;">{{ t('group.task.dueDate') }}</label>
          <span class="text-lg font-medium" style="color: #555555;">
            {{ formatDate(assignmentData.dueDate) }}
          </span>
        </div>
      </div>
    </div>

    <div class="field col-12 md:col-6 lg:col-3">
      <div class="p-card" style="height: 70px; background-color: #f0f8ff; border: 1px solid #dcdcdc; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);"> 
        <div class="p-card-body flex flex-column align-items-center">
          <label for="switch2" class="font-semibold text-800 mb-2" style="font-size: 1.1rem; color: #333333;">{{ t('group.task.lateDueDate') }}</label>
          <span class="text-lg font-medium" style="color: #555555;">
            {{ formatDate(assignmentData.lateDueDate) }}
          </span>
        </div>
      </div>
    </div>

    <div class="field col-12 md:col-6 lg:col-3">
      <div class="p-card" style="height: 70px; background-color: #f0f8ff; border: 1px solid #dcdcdc; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);"> 
        <div class="p-card-body flex flex-column align-items-center">
          <label for="switch2" class="font-semibold text-800 mb-2" style="font-size: 1.1rem; color: #333333;">{{ t('group.task.lateSubmission') }}</label>
          <span class="text-lg font-medium">
            <i v-if="assignmentData.allowLateSubmissions" class="pi pi-check-circle" style="color: green; font-size: 1.5em;"></i>
            <i v-else class="pi pi-times-circle" style="color: red; font-size: 1.5em;"></i>
          </span>
        </div>
      </div>
    </div>

    <div class="field col-12 md:col-6 lg:col-3">
      <div class="p-card" style="height: 70px; background-color: #f0f8ff; border: 1px solid #dcdcdc; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);"> 
        <div class="p-card-body flex flex-column align-items-center">
          <label for="switch2" class="font-semibold text-800 mb-2" style="font-size: 1.1rem; color: #333333;">{{ t('group.task.maxGrade') }}</label>
          <span class="text-lg font-medium" style="color: #555555;">
            {{ assignmentData.maxGrade }}
          </span>
        </div>
      </div>
    </div>

</div>

  <!-- Katılımcılar Tablosu -->
  <div v-if="assignmentData">
    <h4>{{ t('group.participants') }}</h4>
    <DataTable :value="assignmentData.users" dataKey="user.id" editable>
      <Column 
        field="user.userName" 
        :header="t('group.userName')" 
      >
        <template #body="slotProps">
          {{ formatUserName(slotProps.data.user) }}
        </template>
      </Column>  

      <Column field="hasSubmitted" :header="t('group.hasSubmitted')" :sortable="true">
        <template #body="slotProps">
          <Button
          v-if="slotProps.data.files && slotProps.data.files.length > 0"
          :label="t('group.viewFiles')"
            icon="pi pi-eye"
            @click="showUserFiles(slotProps.data)"
            class="p-button-text"
          ></Button>
          <span v-else>{{ t('group.no') }}</span>
        </template>
      </Column>


      <Column :header="t('group.grade')">
        <template #body="slotProps">
          <InputNumber 
            v-model="slotProps.data.grade" 
            :min="0"
            :max="assignmentData.maxGrade"
            :placeholder="t('group.grade')"
            showButtons
            @input="updateParticipant(slotProps.rowIndex, 'grade', $event.value)"
            :tabindex="(slotProps.rowIndex * 2) + 1"
          />
        </template>
      </Column>

      <Column :header="t('group.note')">
        <template #body="slotProps">
          <InputText 
            v-model="slotProps.data.feedback" 
            :placeholder="t('group.note')" 
            @input="updateParticipant(slotProps.rowIndex, 'feedback', $event.target.value)"
            :tabindex="(slotProps.rowIndex * 2) + 2"
          />
        </template>
      </Column>
    </DataTable>
  </div>

  <template #footer>
    <Button :label="t('group.task.save')" icon="pi pi-check" @click="saveAssignmentDetails" />
    <Button :label="t('group.task.cancel')" icon="pi pi-times" @click="assignmentDialog = false" class="p-button-text" />
  </template>
</Dialog>



  <Dialog v-model:visible="bulkOperationDialog" :modal="true" :header="t('group.bulkOperation')" :closable="false">
    <div class="field">
      <label>{{ t('group.targetAudience') }}</label>
      <div class="flex align-items-center">
        <RadioButton inputId="all" value="all" v-model="bulkOperationModel.targetGroup" />
        <label for="all" class="ml-2 mr-4">{{ t('group.allParticipants') }}</label>

        <RadioButton inputId="submitted" value="submitted" v-model="bulkOperationModel.targetGroup" />
        <label for="submitted" class="ml-2 mr-4">{{ t('group.submittedParticipants') }}</label>

        <RadioButton inputId="notSubmitted" value="notSubmitted" v-model="bulkOperationModel.targetGroup" />
        <label for="notSubmitted" class="ml-2">{{ t('group.notSubmittedParticipants') }}</label>
      </div>
    </div>

    <div class="field">
      <label>{{ t('group.grade') }}</label>
      <InputNumber v-model="bulkOperationModel.grade" :min="0"
      :max="assignmentData.maxGrade" showButtons class="w-full" />
    </div>

    <div class="field">
      <label>{{ t('group.note') }}</label>
      <InputText v-model="bulkOperationModel.note" class="w-full" />
    </div>

    <template #footer>
      <Button :label="t('group.apply')" icon="pi pi-check" @click="applyBulkOperation" />
      <Button :label="t('group.task.cancel')" icon="pi pi-times" @click="() => bulkOperationDialog = false" class="p-button-text" />
    </template>
  </Dialog>



<!-- Participantların yükledikleri dsoyaların diyaloğu -->

  <Dialog v-model:visible="userFilesDialogVisible" :header="t('group.userFiles')" :modal="true" :closable="true" :style="{ width: '50vw' }">
  <DataTable :value="selectedUserFiles" :paginator="true" :rows="5">
    <!-- Dosya Adı -->
    <Column field="fileName" :header="t('group.fileName')" />

    <!-- Dosya Türü -->
    <Column :header="t('group.fileType')">
      <template #body="slotProps">
        {{ getFileType(slotProps.data.contentType) }}
      </template>
    </Column>

    <!-- Dosya Boyutu -->
    <Column :header="t('group.fileSize')">
      <template #body="slotProps">
        {{ formatFileSize(slotProps.data.fileSize) }}
      </template>
    </Column>

    <!-- Yüklenme Tarihi -->
    <Column :header="t('group.uploadDate')">
      <template #body="slotProps">
        {{ formatDateTR(slotProps.data.createdTime) }}
      </template>
    </Column>

    <!-- İşlemler Sütunu -->
    <Column>
      <template #body="slotProps">
        <!-- İndirme Butonu -->
        <Button
          icon="pi pi-download"
          class="p-button-success mr-2"
          @click="downloadFile(slotProps.data.id)"
          rounded
        />
      </template>
    </Column>
  </DataTable>
</Dialog>




<!-- PARTICIPANTS DIALOG -->
<Dialog v-model:visible="productDialog" :closable="false" :modal="true" class="p-fluid">
  <Toolbar class="mb-4">
    <template v-slot:start>
      <div class="my-2">
        <h5 class="m-0">{{ t('group.form.participants') }}</h5>
      </div>
    </template>

    <template v-slot:end>
      <Button outlined type="button" severity="danger" icon="pi pi-times" @click="closeDialog" />
    </template>
  </Toolbar>
  <DataTable
    v-model:selection="selectedParticipants"
    :value="flattenedParticipants"
    selectionMode="multiple"
    :metaKeySelection="false"
    :paginator="true"
    :rows="10"
    :filters="filtersDialog"
    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
    :rowsPerPageOptions="[5, 10, 25]"
    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} groups"
    filterDisplay="menu"
    :globalFilterFields="['nameSurname', 'specialDescription', 'email']"
  >
    <template #header>
      <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
        <h5 class="m-0"></h5>
        <span class="block mt-2 md:mt-0 p-input-icon-left">
          <i class="pi pi-search" />
          <InputText
            class="w-full sm:w-auto"
            v-model="filtersDialog['global'].value"
            :placeholder="t('group.form.search')"
          />
        </span>
      </div>
    </template>
    <Column selectionMode="multiple" style="width: 3em"></Column>
    <Column field="participantId" header="participantId" />
    <Column field="nameSurname" :header="t('group.form.name')" />
    <Column field="email" :header="t('group.form.email')" />
    <Column field="specialDescription" :header="t('group.form.specialDescriptionHeader')" />
  </DataTable>
  <template #footer>
    <Button :label="t('group.form.save')" @click="saveSelectedParticipants" />
  </template>
</Dialog>

<ConfirmDialog></ConfirmDialog>

</template>


<style scoped>

.tab-icon1 {
  font-size: 2em; /* İkonun boyutunu artırır */
  color: #A15D98;  /* Pastel mavi */
}

.tab-icon2 {
  font-size: 2em; /* İkonun boyutunu artırır */
  color: #84A6D6;  /* Pastel mor */
}

.tab-icon3 {
  font-size: 2em; /* İkonun boyutunu artırır */
  color: #E4CEE0;  /* Pastel pembe */
}

.mr-2 {
  margin-right: 0.5rem; /* İkon ile metin arasına boşluk ekler */
}

/* Opsiyonel: İkonlara hover efekti ekleyerek interaktif hale getirebilirsiniz */
.tab-icon1:hover,
.tab-icon2:hover,
.tab-icon3:hover {
  transform: scale(1.2);
  transition: transform 0.2s;
}


.pi-check, .pi-times {
  display: flex;
  align-items: center;
  justify-content: center;
}

.p-invalid input {
  border: 1px solid red !important;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dialog-title {
  font-weight: bold;
  font-size: 1.2rem;
}

.dialog-close-button-container {
  /* Butonu sağa yaslamak için */
  margin-left: auto;
}

.file-icon-pdf {
  color: #E74C3C; /* Kırmızı */
}
.file-icon-image {
  color: #a7e205; /* Yeşil */
}
.file-icon-text {
  color: #a550f5; /* Koyu Gri */
}
.file-icon-excel {
  color: #2ECC71; /* Açık Yeşil */
}
.file-icon-word {
  color: #3498DB; /* Mavi */
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
  color: #1ABC9C; /* Turkuaz */
}
.file-icon-json {
  color: #16A085; /* Koyu Turkuaz */
}
.file-icon-xml {
  color: #2980B9; /* Mavi */
}
.file-icon-default {
  color: #95A5A6; /* Açık Gri */
}

</style>