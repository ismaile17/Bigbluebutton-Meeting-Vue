<script setup>
import { ref, onMounted, computed,nextTick  } from 'vue';
import { useTicketStore } from '@/stores/ticket';
import { useToast } from 'primevue/usetoast';
import { useI18n } from "vue-i18n";
import { FilterMatchMode } from 'primevue/api';
import { useLayoutStore } from '@/stores/layout';


const layoutStore = useLayoutStore();

const toast = useToast();
const { t } = useI18n();
const ticketStore = useTicketStore();

const ticketsForAdmin = ref([]); // Ticket list
const selectedTicket = ref(null); // Selected ticket
const dialogVisible = ref(false); // Dialog visibility
const messageContent = ref(''); // New message content
const messages = ref([]); // Messages of the selected ticket

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const ticketStatus = ref(0); // 'open' for Açık Ticketler, 'closed' for Kapalı Ticketler

const ticketOptions = ref([
  { label: 'Açık Ticketler', value: 0 },
  { label: 'Kapalı Ticketler', value: 1 }
]);

// Load tickets on mount
onMounted(async () => {
    await ticketStore.getAllOpenTickets(); // Load tickets without messages
    ticketsForAdmin.value = ticketStore.getOpenTicketsAdmin.value;
});

// Handle ticket selection and load messages
const selectTicket = async (ticket) => {
    selectedTicket.value = ticket;
    dialogVisible.value = true;
    // Fetch messages from API for the selected ticket
    const response = await ticketStore.getTicketAndMessageByTicketId(selectedTicket.value.id);  // Ensure the correct ID is passed

    if (response.success) {
        messages.value = response.value.messages;  // Store messages
        await scrollToBottom(); // Scroll to bottom after loading messages
    } else {
        console.error("Error in response:", response);
        toast.add({ severity: 'error', summary: t('error'), detail: 'Mesajlar yüklenemedi', life: 3000 });
    }
};


const scrollToBottom = async () => {
    await nextTick(); // Vue'nun DOM'u güncellemesini bekle
    const messageContainer = document.querySelector('.message-container');
    if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
};


// Send a new message
const sendMessage = async () => {
    if (messageContent.value.trim() === '') {
        toast.add({ severity: 'warn', summary: t('warning'), detail: 'Mesaj boş olamaz', life: 3000 });
        return;
    }

    const response = await ticketStore.createTicketMessage({
        ticketId: selectedTicket.value.id,
        message: messageContent.value
    });

    if (response.success) {
        const newMessage = {
            id: Date.now(),
            messageText: messageContent.value,
            createdDate: new Date().toISOString(),
            createdByUserId: 2 // Assuming the admin user is ID 2
        };

        // Add the new message to the messages array
        messages.value.push(newMessage);
        messageContent.value = ''; // Clear the message input
        await fetchTickets(); // Call the fetch function again to refresh
        dialogVisible.value = false;

    } else {
        toast.add({ severity: 'error', summary: t('error'), detail: 'Mesaj gönderilemedi', life: 3000 });
    }
};

// Format date in Turkish style (dd.MM.yyyy HH:mm)
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

const refreshTickets = async () => {
    await fetchTickets(); // Call the fetch function again to refresh
};

const fetchTickets = async () => {
    layoutStore.setLoading(true);
    try {
        const response = await ticketStore.getAllOpenTickets(); // Fetch tickets from store
        if (response.success) {
            ticketsForAdmin.value = response.value; // Update the tickets array with new data
            ticketStatus.value === 0;
            toast.add({ severity: 'success', summary: 'Success', detail: 'Tickets refreshed successfully.', life: 3000 });
        } else {
            throw new Error('Failed to fetch tickets');
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    } finally {
        layoutStore.setLoading(false);
    }
};

const statusOptions = ref([
  { label: 'Açık', value: 0 },
  { label: 'Kapalı', value: 1 }
]);

const categoryOptions = ref([
  { label: 'Teknik', value: 1 },
  { label: 'Finansal', value: 2 },
  { label: 'Genel', value: 3 }
]);


const saveTicketChanges = async () => {
  const payload = {
    appUserId: 2, // Assuming admin ID is 2
    ticketId: selectedTicket.value.id,
    statusId: selectedTicket.value.statusId,
    categoryId: selectedTicket.value.categoryId,
    priority: selectedTicket.value.priority
  };

  const response = await ticketStore.createPriorityOrCloseTicket(payload);

  if (response.success) {
    toast.add({ severity: 'success', summary: t('success'), detail: 'Changes saved successfully', life: 3000 });
    dialogVisible.value = false; // Close dialog after saving
    await fetchTickets(); // Refresh the tickets
  } else {
    toast.add({ severity: 'error', summary: t('error'), detail: 'Failed to save changes', life: 3000 });
  }
};

const fetchTicketsByStatus = async () => {
    layoutStore.setLoading(true);
    try {
        let response;
        if (ticketStatus.value === 0) {
            response = await ticketStore.getAllOpenTickets(); // Açık ticketlar
        } else {
            response = await ticketStore.getAllCloseTickets(); // Kapalı ticketlar
        }

        if (response.success) {
            ticketsForAdmin.value = response.value; // Update tickets array
            toast.add({ severity: 'success', summary: 'Success', detail: 'Tickets refreshed successfully.', life: 3000 });
        } else {
            throw new Error('Failed to fetch tickets');
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    } finally {
        layoutStore.setLoading(false);
    }
};

const sortedMessages = computed(() => {
    return [...messages.value].sort((a, b) => new Date(a.id) - new Date(b.id));
});


</script>


<template>
  <div>
      <!-- Ticket List Table -->
      <DataTable :value="ticketsForAdmin" dataKey="id" :paginator="true" :rows="10" :filters="filters" :loading="loading" :sortField="'id'" :sortOrder="-1">
        <template #header>
            <div class="col-12">
                <div class="grid p-fluid justify-content-between">
                    <!-- Refresh Button -->
                    <div class="col-2 md:col-2">
                        <Button 
                            icon="pi pi-refresh" 
                            :label="$t('Refresh')" 
                            class="w-full sm:w-auto" 
                            @click="refreshTickets" />
                    </div>

                    <!-- Dropdown (Ticket Status) -->
                    <div class="col-2 md:col-2 text-center">
                        <Dropdown 
                            v-model="ticketStatus" 
                            :options="ticketOptions" 
                            optionLabel="label" 
                            optionValue="value" 
                            class="w-full" 
                            @change="fetchTicketsByStatus" 
                        />
                    </div>

                    <!-- Search Input -->
                    <div class="col-4 md:col-6 text-right">
                        <span class="block mt-2 md:mt-0 p-input-icon-left w-full">
                            <i class="pi pi-search" />
                            <InputText v-model="filters['global'].value" :placeholder="$t('participant.form.search')" />
                        </span>
                    </div>
                </div>
            </div>

            <!-- Gradient under header -->
            <div :style="{
                height: '4px', 
                width: '100%', 
                background: 'linear-gradient(90deg, #ffa500 30%, #0a74da 70%)'
            }"></div>
        </template>


            <!-- Ticket Title Column -->
            <Column field="title" header="Title" sortable>
                <template #body="slotProps">
                {{ slotProps.data.title }} <!-- Access row data correctly -->
                </template>
            </Column>

            <Column field="categoryName" header="Category Name" sortable>
                <template #body="slotProps">
                {{ slotProps.data.categoryName }} <!-- Access row data correctly -->
                </template>
            </Column>

            <Column field="priority" header="priority" sortable>
                <template #body="slotProps">
                {{ slotProps.data.priority }} <!-- Access row data correctly -->
                </template>
            </Column>

            <Column field="status" header="Status" sortable>
                <template #body="slotProps">
                {{ slotProps.data.status }} 
                </template>
            </Column>

            <Column field="wasReadTicketAdmin" header="WasReadTicketAdmin" sortable>
                <template #body="slotProps">
                    <span 
                        class="flex justify-content-center align-items-center"
                        :style="{
                            color: slotProps.data.wasReadTicketAdmin ? 'green' : 'red', 
                            fontSize: '1.2rem', 
                            fontWeight: 'bold'
                        }"
                    >
                        {{ slotProps.data.wasReadTicketAdmin ? 'OK' : 'CEVAPLA' }}
                    </span>
                </template>
            </Column>



            <Column field="updatedTime" header="Date" sortable>
                <template #body="slotProps">
                <span>{{ formatDate(slotProps.data.updatedTime) }}</span> 
                </template>
            </Column>

            <!-- Edit Button Column -->
            <Column>
                <template #body="slotProps">
                <Button icon="pi pi-pencil" class="custom-color-button" text rounded :label="t('Menu.edit')" @click="selectTicket(slotProps.data)" />
                </template>
            </Column>
        </DataTable>


      <!-- Dialog to Show Ticket Messages -->
      <Dialog v-model:visible="dialogVisible" :modal="true" header="Ticket Details" :style="{ width: '70vw' }">
    <div v-if="selectedTicket">
      <h3>{{ selectedTicket.title }}</h3>


            <div class="grid formgrid">
                <div class="col-12 mb-2 lg:col-7 lg:mb-0">
                    <div class="field mt-4">
                        <InputText v-model="selectedTicket.priority" class="w-full" />
                    </div>
                </div>
                <div class="col-12 mb-2 lg:col-2 lg:mb-0">
                    <div class="field mt-4">
                        <Dropdown v-model="selectedTicket.statusId" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                </div>
                <div class="col-12 mb-2 lg:col-2 lg:mb-0">
                            <!-- Category Dropdown -->
                    <div class="field mt-4">
                        <Dropdown v-model="selectedTicket.categoryId" :options="categoryOptions" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                </div>
                <div class="col-12 mb-2 lg:col-1 lg:mb-0">
                    <Button label="Save" icon="pi pi-check" class="mt-4" @click="saveTicketChanges" />                   
                </div>
            </div>

            <!-- Messages -->
            <div class="message-container" style="max-height: 600px; overflow-y: auto;">
                  <div v-for="message in sortedMessages" :key="message.id" class="mb-3">
                      <!-- Messages from the admin (on the right) -->
                      <div v-if="message.createdByUserId === 2" class="text-right">
                          <p class="bg-blue-100 p-2 border-round" style="display: inline-block; max-width: 80%;">
                              {{ message.messageText }}
                          </p>
                          <small class="block text-right">{{ formatDate(message.createdDate) }}</small>
                      </div>

                      <!-- Other users' messages (on the left) -->
                      <div v-else class="text-left">
                          <p class="bg-gray-200 p-2 border-round" style="display: inline-block; max-width: 80%;">
                              {{ message.messageText }}
                          </p>
                          <small class="block text-left">{{ formatDate(message.createdDate) }}</small>
                      </div>
                  </div>
              </div>

      <!-- Message Input and Send Button (already present) -->
      <div class="field mt-4">
        <Textarea v-model="messageContent" placeholder="Enter your message" :autoResize="true" rows="5" cols="30" class="w-full p-inputtextarea-lg" />
        <Button label="Send" icon="pi pi-send" @click="sendMessage" />
      </div>
    </div>
  </Dialog>

  </div>
</template>

<style scoped>
.message-container {
  max-height: 300px;
  overflow-y: auto;
}

.text-left p, .text-right p {
  border-radius: 10px;
  padding: 10px;
  word-wrap: break-word;
}

.text-left p {
  background-color: #f1f1f1;
}

.text-right p {
  background-color: #d1e7fd;
}
</style>
