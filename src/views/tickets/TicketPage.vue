<script setup>
import { ref, nextTick, onMounted, computed, watch } from 'vue';
import { useTicketStore } from '@/stores/ticket';
import { useI18n } from 'vue-i18n';
import { useLayoutStore } from '@/stores/layout';
import { useToast } from 'primevue/usetoast';

// i18n kullanımı
const { t, te } = useI18n();

const toast = useToast();
const layoutStore = useLayoutStore();

// Kullanıcı bilgilerini almak
const currentUserId = ref(2); // Bu dinamik olarak login olan kullanıcının id'si olacak

const ticketStore = useTicketStore();

const activeTicketMessages = ref([]); // Aktif ticket'ın mesajlarını tutan ref
const activeTicket = ref(null); // Aktif ticket'ın bilgilerini tutan ref

// Data refs
const selectedStatus = ref(0); // Varsayılan olarak "Açık" seçilir (0 = Açık)
const statusOptions = ref([
  { label: t('ticket.open_status'), value: 0 },    // 0 = Açık / Open
  { label: t('ticket.closed_status'), value: 1 }   // 1 = Kapalı / Closed
]); // Durumlar için seçenekler


// Ticket'ları filtreleme
const filterTickets = () => {
    const tickets = ticketStore.getOnlyTicketsByUser?.value || []; // Store'daki ticket'ları al

    return tickets.filter(ticket => {
        const matchesSearch = ticket.title.toLowerCase().includes(searchedTicket.value.toLowerCase());
        const matchesStatus = Number(ticket.statusId) === selectedStatus.value; // statusId'yi sayıya çevirerek karşılaştırma
        return matchesSearch && matchesStatus;
    });
};

const activeTicketId = ref(null);
const showDialog = ref(false);
const newTicket = ref({
    title: '',
    priority: '',
    categoryId: null,
    message: ''
});
const textContent = ref('');
const searchedTicket = ref('');
const op = ref(null);

onMounted(async () => {
    await ticketStore.getOnlyTicketByUserId(); // Ticket'ları mesajları olmadan yükler

    const user = JSON.parse(localStorage.getItem('user')); // LocalStorage'den user'ı çek
    if (user && user.id) {
        currentUserId.value = user.id; // ID'yi çekip currentUserId'ye ata
    } else {
        console.error(t('ticket.error') + ': ' + t('ticket.ticket_loading_failed'));
    }
});


const categoryOptions = ref([
  { label: t('ticket.ticket_technic'), value: 1 },
  { label: t('ticket.ticket_financial'), value: 2 },
  { label: t('ticket.ticket_general'), value: 3 }
]);

// Yeni ticket gönder
const submitNewTicket = async () => {
    const newTicketData = {
        title: newTicket.value.title,
        priority: newTicket.value.priority,
        categoryId: newTicket.value.categoryId,
        message: newTicket.value.message
    };

    try {
        // API'ye yeni ticket gönderir
        const response = await ticketStore.createTicket(newTicketData);

        // Eğer API yanıtı başarılı ve mesaj "Ticket başarıyla oluşturuldu" ise
        if (response.success && response.message === t('ticket.ticket_created_success')) {
            // Eğer ticketStore içindeki liste geçerliyse
            if (response.value && Array.isArray(ticketStore.getOnlyTicketsByUser.value)) {
                // Ticket'ı listenin en başına ekleyin
                const updatedTickets = [response.value, ...ticketStore.getOnlyTicketsByUser.value];
                ticketStore.getOnlyTicketsByUser.value = updatedTickets;

                toast.add({ severity: 'success', summary: t('ticket.success'), detail: t('ticket.ticket_created_success'), life: 3000 });
            } else {
                toast.add({ severity: 'error', summary: t('ticket.error'), detail: t('ticket.ticket_list_update_failed'), life: 3000 });
            }

            // Yeni ticket'ı arayüzde göstermek için gerekli işlemler yapılır
            showDialog.value = false; // Dialogu kapat
        } else {
            // Başarısız yanıt durumu
            toast.add({ severity: 'error', summary: t('ticket.error'), detail: response.message || t('ticket.ticket_creation_failed'), life: 3000 });
        }
    } catch (error) {
        // Hata yakalama
        toast.add({ severity: 'error', summary: t('ticket.error'), detail: error.message || t('ticket.ticket_creation_failed'), life: 3000 });
    }
};

watch(activeTicketMessages, async () => {
    await nextTick();
    scrollToLastMessage();
});

const scrollToLastMessage = () => {
    const element = document.querySelector('.user-message-container');
    if (element) element.scrollTop = element.scrollHeight;
};

// Aktif ticket'ı değiştir
const changeActiveTicket = async (ticket) => {
    activeTicketId.value = ticket.id;
    
    // Tıklanan ticket'ın mesajlarını ve bilgilerini yükle
    const response = await ticketStore.getTicketAndMessageByTicketId(activeTicketId.value);
    if (response.success) {
        activeTicket.value = ticket; // Aktif ticket bilgisini kaydet
        activeTicketMessages.value = response.value.messages; // Mesajları kaydet
        
        // Eğer ticket okunmadıysa, wasReadTicket'ı true yapalım
        if (!activeTicket.value.wasReadTicket) {
            activeTicket.value.wasReadTicket = true; // Okundu olarak işaretle
            // Arabellekteki ticketlar arasında da wasReadTicket güncelleniyor
            const ticketInStore = ticketStore.getOnlyTicketsByUser.value.find(t => t.id === activeTicketId.value);
            if (ticketInStore) {
                ticketInStore.wasReadTicket = true; // Arabellek güncelleme
            }
        }

    } else {
        toast.add({ severity: 'error', summary: t('ticket.error'), detail: t('ticket.ticket_loading_failed'), life: 3000 });
    }
    await nextTick();
    scrollToLastMessage();
};

// Yeni ticket oluşturma dialogunu aç
const createNewTicket = () => {
    showDialog.value = true;
};

// Mevcut ticket'ı bul
const findActiveTicket = () => {
    return ticketStore.getTicketsByUser?.value?.find(ticket => ticket.id === activeTicketId.value) || {};
};

// Yeni mesaj gönder (cache'e ekleyerek)
const sendMessage = async () => {
    if (textContent.value.trim() === '') {
        return;
    }

    try {
        // API'ye mesaj gönderimi (veritabanına kaydedilsin)
        const response = await ticketStore.createTicketMessage({
            ticketId: activeTicketId.value,
            message: textContent.value
        });

        // API yanıtı kontrolü
        if (response.success && response.message === t('ticket.ticket_message_added')) {
            // Mesaj alanını sıfırla
            textContent.value = '';

            // Gönderilen mesajdan sonra ticket'ı yeniden seçerek veriyi tekrar çek
            await changeActiveTicket(activeTicket.value);

            toast.add({ severity: 'success', summary: t('ticket.success'), detail: t('ticket.ticket_message_added'), life: 3000 });

        } else {
            // Başarısız olursa hata mesajı göster
            toast.add({ severity: 'error', summary: t('ticket.error'), detail: response.message || t('ticket.ticket_message_failed'), life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: t('ticket.error'), detail: error.message || t('ticket.ticket_message_failed'), life: 3000 });
    }
};




// Ticket'ı yeniden açma (Kilit simgesine tıklayınca açılacak)
const confirmReopen = async () => {
    try {
        // activeTicket ref üzerinden kontrol yapılacak
        if (activeTicket.value) {
            // Ticket'ın durumunu güncelle
            activeTicket.value.statusId = 0; // Açık duruma güncelleniyor (0 = Açık)
            activeTicket.value.status = t('ticket.open_status'); // Açık duruma güncelleniyor

            // API çağrısı yapılmalı (Örneğin ticketStore.updateTicketStatus)
            // Burada API çağrısı eklenmelidir. Örneğin:
            // const response = await ticketStore.updateTicketStatus(activeTicket.value.id, 0);
            // if (response.success) { ... }

            // Geri bildirim gösterebilirsiniz
            toast.add({ severity: 'success', summary: t('ticket.success'), detail: t('ticket.ticket_reopened'), life: 3000 });
        }

        // Overlay panelini kapat
        if (op.value) {
            op.value.hide();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: t('ticket.error'), detail: error.message || t('ticket.ticket_reopened_failed'), life: 3000 });
    }
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const ticketUpdatedTime = (ticket) => {
    const timeToUse = ticket.updatedTime || ticket.createdTime;
    return timeToUse ? formatDate(timeToUse) : t('ticket.no_message');
};

const sortedMessages = computed(() => {
    return [...activeTicketMessages.value].sort((a, b) => new Date(a.id) - new Date(b.id));
});



</script>

<template>
  <div class="flex flex-column md:flex-row gap-5" style="min-height: 81vh">
    <!-- Sidebar -->
    <div class="md:w-25rem card p-0">
      <!-- Yeni Ticket Butonu -->
      <div class="flex flex-column align-items-center border-bottom-1 surface-border p-6">
        <Button :label="t('ticket.new_ticket')" icon="pi pi-send" class="w-full sm:w-auto" rounded @click="createNewTicket"></Button>
      </div>

      <!-- Ticket Statü Filtreleme Dropdown'u -->
      <div class="flex justify-content-center align-items-center p-4">
        <Dropdown 
            v-model="selectedStatus"
            :options="statusOptions" 
            optionLabel="label"
            optionValue="value" 
            @change="filterTickets"
        />
      </div>

      <!-- Ticket Listeleme Alanı -->
      <div class="w-full flex row-gap-4 flex-column surface-border p-4">
        <div class="flex flex-row gap-4 md:flex-column overflow-auto custom-scroll" style="max-height: 400px;">
          <div
            v-for="ticket in filterTickets()"
            :key="ticket.id"
            :class="[
                  'flex flex-nowrap justify-content-between align-items-center border-1 surface-border border-round p-3 cursor-pointer select-none hover:surface-hover transition-colors transition-duration-150',
                  ticket.wasReadTicket ? 'bg-white' : 'bg-green-100' // Eğer wasReadTicket false ise açık yeşil arka plan
              ]"
            @click="changeActiveTicket(ticket)"
          >
            <!-- Ticket Bilgileri -->
            <div class="flex align-items-center">
                      <!-- Yeşil veya gri yuvarlak -->
                  <i
                  :class="['pi', 'mr-2', ticket.wasReadTicket ? 'pi-circle' : 'pi-check-circle']"
                  :style="{ color: ticket.wasReadTicket ? 'gray' : 'green' }"
                  ></i>
              <div class="flex-column hidden md:flex">
                <span class="text-900 font-semibold block">{{ ticket.title }}</span>
                <span class="block text-600 text-overflow-ellipsis overflow-hidden white-space-nowrap w-10rem text-sm">
                  {{ ticketUpdatedTime(ticket) }}
              </span>
              </div>
            </div>
            <!-- Ticket Statü İkonu -->
            <div>
              <i v-if="ticket.statusId === 1" class="pi pi-lock text-700"></i> <!-- Kapalı -->
              <i v-else class="pi pi-lock-open text-700"></i> <!-- Açık -->
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ticket / Chat Box -->
    <div class="flex-1 card p-0" v-if="activeTicket">
      <div class="flex flex-column h-full">
        <!-- Seçilen Ticket Bilgileri -->
        <div class="flex align-items-center border-bottom-1 surface-border p-3 lg:p-6">
          <div class="mr-2">
            <span class="text-900 font-semibold block"> {{ activeTicket.title }} </span>
            <span class="text-700">  {{ t('ticket.status') }}: {{ activeTicket.statusId === 0 ? t('ticket.open_status') : t('ticket.closed_status') }}</span>
          </div>
          <div class="flex align-items-center ml-auto">
            <!-- Ticket Kapalıysa Yeniden Aç Butonu -->
            <Button
              v-if="activeTicket.statusId === 1"
              type="button"
              icon="pi pi-unlock"
              outlined
              severity="secondary"
              rounded
              @click="op.show($event)"
              :label="t('ticket.reopen')"
            ></Button>
            <!-- Ticket Açıksa Kilit Açık İkonu -->
            <Button v-else type="button" icon="pi pi-lock-open" outlined severity="secondary" rounded :label="t('ticket.status')" ></Button>
          </div>
        </div>

        <!-- Mesajların Gösterildiği Alan -->
        <div class="user-message-container p-3 md:px-4 lg:px-6 lg:py-4 mt-2 overflow-y-auto" style="max-height: 53vh">
          <div v-for="message in sortedMessages" :key="message.id">
              <!-- Kullanıcı Mesajı (Sağda Gözükecek) -->
            <div v-if="message.createdByUserId === currentUserId" class="grid grid-nogutter mb-4">
              <div class="col mt-3 text-right">
                <span class="inline-block text-left font-medium border-1 surface-border bg-primary-100 text-primary-900 p-3 white-space-normal border-round" style="word-break: break-word; max-width: 80%">
                  {{ message.messageText }}
                </span>
                <p class="text-700 mt-3">{{ new Date(message.createdDate).toLocaleTimeString() }} <i class="pi pi-check ml-2 text-green-400"></i></p>
              </div>
            </div>

            <!-- Diğer Kullanıcı Mesajı (Solda Gözükecek) -->
            <div v-else class="grid grid-nogutter mb-4">
              <div class="col mt-3">
                <p class="text-900 font-semibold mb-3">{{ findActiveTicket().title }}</p>
                <span class="text-700 inline-block font-medium border-1 surface-border p-3 white-space-normal border-round" style="word-break: break-word; max-width: 80%">
                  {{ message.messageText }}
                </span>
                <p class="text-700 mt-3">{{ new Date(message.createdDate).toLocaleTimeString() }} <i class="pi pi-check ml-2 text-green-400"></i></p>
              </div>
            </div>
          </div>
        </div>

        <!-- Mesaj Gönderme Alanı (Ticket Açıkken Gözükecek) -->
        <div v-if="activeTicket && activeTicket.statusId !== 1" class="p-3 md:p-4 lg:p-6 flex flex-column sm:flex-row align-items-center mt-auto border-top-1 surface-border gap-3">
          <InputText id="message" type="text" :placeholder="t('ticket.type_message')" class="flex-1 w-full sm:w-auto border-round" v-model="textContent" @keydown.enter="sendMessage" />
          <div class="flex w-full sm:w-auto gap-3">
            <Button :label="t('ticket.send')" icon="pi pi-send" class="w-full sm:w-auto" @click="sendMessage"></Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Yeni Ticket Oluşturma Dialogu -->
    <Dialog v-model:visible="showDialog" :header="t('ticket.create_new_ticket')" :modal="true" :style="{ width: '25vw' }" :dismissableMask="true" class="custom-dialog">
      <div class="p-fluid">
        <!-- Ticket Başlık Input'u -->
        <div class="field mt-4">
          <label for="ticketTitle" class="block text-lg font-semibold text-gray-700">{{ t('ticket.title') }}</label>
          <InputText v-model="newTicket.title" class="w-full p-inputtext-lg" :placeholder="t('ticket.title')" />
        </div>

        <!-- Ticket Kategori Seçimi -->
        <div class="field mt-4">
          <label for="ticketCategoryId" class="block text-lg font-semibold text-gray-700">{{ t('ticket.category') }}</label>
          <Dropdown v-model="newTicket.categoryId" :options="categoryOptions" option-label="label" option-value="value" class="w-full" :placeholder="t('ticket.select_status')" />
        </div>

        <!-- Ticket İlk Mesaj Textarea -->
        <div class="field mt-4">
          <label for="ticketMessage" class="block text-lg font-semibold text-gray-700">{{ t('ticket.message') }}</label>
          <Textarea v-model="newTicket.message" :placeholder="t('ticket.type_message')" :autoResize="true" rows="5" cols="30" class="w-full p-inputtextarea-lg" />
        </div>

        <!-- Yeni Ticket Gönder Butonu -->
        <div class="mt-6 text-center">
          <Button :label="t('ticket.submit')" class="p-button-lg p-button-rounded p-button-success w-full" @click="submitNewTicket"></Button>
        </div>
      </div>
    </Dialog>

    <!-- Ticket Yeniden Açma Onay Paneli -->
    <OverlayPanel ref="op">
      <p>{{ t('ticket.confirm_reopen') }}</p>
      <Button :label="t('ticket.yes')" @click="confirmReopen" style="margin-right: 8px;"></Button>
      <Button :label="t('ticket.no')" @click="op.hide()"></Button>
    </OverlayPanel>


  </div>
</template>


<style>
/* Scroll stilini özelleştirmek */
.custom-scroll {
  padding-right: 10px; /* Scroll çubuğunu sağa kaydırmak için padding ekleyin */
}
.custom-scroll::-webkit-scrollbar {
  width: 6px;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

.custom-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
</style>
