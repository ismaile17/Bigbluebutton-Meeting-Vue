<script setup>
import { onMounted, ref, watch } from 'vue'
import { FilterMatchMode } from 'primevue/api'
import { useLayout } from '@/layout/composables/layout'
import { useLayoutStore } from '@/stores/layout'
import { useMeetingStore } from '@/stores/meeting'
import { useParticipantStore } from '@/stores/participant'

import { useToast } from 'primevue/usetoast';

const participantStore = useParticipantStore()

const toast = useToast();

const layoutStore = useLayoutStore()
const emit = defineEmits(['checkbox:change', 'delete:task', 'open:edit:dialog'])
const { layoutConfig } = useLayout()
const meetingStore = useMeetingStore()

const moreInformation = ref(false);
const selectedGroups = ref([]);
const selectedModerator = ref([]);

onMounted(async () => {
  layoutStore.setLoading(true);
  await meetingStore.getSelectedGroupByUserId();
  await participantStore.getSelectedParticipantByUserId();
  layoutStore.setLoading(false);
});

watch(layoutConfig.colorScheme, () => {
  //  setChartData();
})

watch(
  layoutConfig.colorScheme,
  () => {
    //setChartData();
  },
  { immediate: true }
)
watch(
  layoutConfig.theme,
  () => {
    //setChartData();
  },
  { immediate: true }
)



const dt = ref()
const meetingModel = ref({ Name: '', Description:'',WelcomeMessage:'',RecordTF:'',StartDate:'',EndDate:'',Duration:'',WebcamsOnlyForModerator:'',BannerText:'',LockSettingsDisableCam:'',LockSettingsDisableMic:'',
LockSettingsDisablePrivateChat:'',LockSettingsDisablePublicChat:'',LockSettingsHideUserList:'',GuestPolicy:'',AllowModsToEjectCameras:'',AllowRequestsWithoutSession:'',MeetingCameraCap:'',Logo:'',SingleOrRepeated:''})

const addMeeting = () => {
  layoutStore.setLoading(true)
  meetingStore
    .addMeeting(meetingModel.value)
    .then((x) => {
      if (x.success) {
        meetingModel.value.name = ''
        layoutStore.setLoading(false)
      } else {
        layoutStore.setLoading(false)
      }
    })
    .catch(() => {
      layoutStore.setLoading(false)
    })

}

const hideMoreInformation = () => {
  moreInformation.value = false;
};

const emails = ref([]);
const newEmail = ref('');

const addEmail = () => {
  if (isValidEmail(newEmail.value)) {
    emails.value.push(newEmail.value.trim());
    newEmail.value = ''; // TextBox'ı temizle
  }
};
const removeEmail = (index) => {
  emails.value.splice(index, 1);
};

const isValidEmail = (email) => {
  // Basit bir e-posta doğrulama kontrolü
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const minDate = new Date();
minDate.setHours(minDate.getHours());

</script>
<template>

    <div class="card">
        <div class="flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between py-4">
            <div class="mb-4 sm:mb-0">
            </div>
            <div>
                <Button label="Save" icon="pi pi-save" rounded @click="addMeeting"></Button>
            </div>
        </div>
        <div :style="{ height: '3px', background: 'linear-gradient(90deg, var(--primary-color) 0%, rgba(33, 150, 243, 0) 90%)' }"></div>
        <div class="grid grid-nogutter">
            <div class="col-12 lg:col-6 h-full px-4 py-4 md:px-6">
                <div class="pb-3 surface-border">
                    <span class="text-900 font-medium text-xl">Settings</span>
                </div>
                <div class="grid formgrid">
                    <div class="col-12 field mb-4">
                        <span class="text-900 text-2xl block font-medium mb-2">Meeting Name</span>
                        <input id="meetingname" type="text" class="p-inputtext w-full mb-4" v-model="meetingModel.Name"/>
                        <span class="text-900 text-2xl block font-medium mb-2">Meeting Description</span>
                        <Textarea id="specialDescription" :type="text" class="p-inputtext w-full mb-4" autofocus v-model="meetingModel.Description"/>
                    </div>
                    <div class="col-12 field mb-6">
                        <hr class="my-1">
                    </div>
                    
                    <div class="col-12 lg:col-6 field mb-4">
                        <h5>Start Date & Time</h5>
                        <Calendar :minDate="minDate" :showIcon="true" :showButtonBar="true" v-model="meetingModel.StartDate" showTime hourFormat="24" ></Calendar>
                    </div>
                    <div class="col-12 lg:col-6 field mb-4">
                        <h5>End Date</h5>
                        <Calendar :minDate="minDate" :showIcon="true" :showButtonBar="true" v-model="meetingModel.EndDate" ></Calendar>
                    </div>
                    <div class="col-12 field mb-3">
                        <hr class="my-1">
                    </div>
                    <div class="col-12 lg:col-6 field mb-4">
                        <Dropdown v-model="meetingModel.GuestPolicy" :options="dropdownValues" optionLabel="name" placeholder="Public Or Private" class="p-inputtext w-full"/>
                    </div>
                    <div class="col-12 lg:col-6 field mb-4">
                        <Dropdown v-model="meetingModel.SingleOrRepeated" :options="dropdownValues" optionLabel="name" placeholder="Single Or Repeated" class="p-inputtext w-full"/>
                    </div>
                    <div class="col-12 field mb-3">
                        <hr class="my-1">
                    </div>
                    <div class="col-12 field">
                    <div class="grid formgrid">

                        

                    <div class="col-12 mb-0 lg:col-10 lg:mb-0">
                        <InputText type="email" placeholder="E-mail" v-model="newEmail" class="p-inputtext w-full mb-6"/>
                    </div>
                    <div class="col-12 mb-4 lg:col-1 lg:mb-0">
                        <Button type="button" label="Add" icon="pi pi-plus" v-tooltip="'Add non-group participant'" @click="addEmail" :disabled="!isValidEmail(newEmail)"/>
                    </div>
                    </div>
                    <table>
                    <tr v-for="(email, index) in emails" :key="index">
                        <td>
                        <span @click="removeEmail(index)" style="cursor: pointer;">X</span> {{ email }}
                        </td>
                    </tr>
                    </table>
                </div>
                    
                    
            </div>
        </div>
            <div class="col-12 lg:col-6 px-4 py-4 md:px-6">
                <div class="pb-3 surface-border">
                    <span class="text-900 font-medium text-xl">Detail Settings</span>
                </div>
                <TabView>
            <TabPanel header="Participant Groups">
                <!-- <p class="line-height-3 text-600 p-0 mx-0 mt-0 mb-4">
                    <img :src="`/images/Meeting-Calender.png`" class="w-full" alt="Meeting Calender" />
                </p> -->

                <DataTable
                        :value="meetingStore.selectedgroup.value"
                        ref="dt"
                        v-model:selection="selectedGroups"
                        dataKey="id"
                        :paginator="true"
                        :rows="10"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        >
                        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                        <Column field="name" header="Select Participant Groups" sortable></Column>
                    </DataTable>
            </TabPanel>
            <TabPanel header="Detail Settings">
                <ul class="list-none p-0 m-0">
                    <li class="pb-5 border-bottom-1 surface-border">
                        <div class="text-900 text-xl my-3">Meeting Banner Text</div>
                        <input id="meetingname" type="text" class="p-inputtext w-full mb-4" v-model="meetingModel.BannerText" />
                   
                        <hr class="my-1">

                        <div class="field-checkbox mb-0">
                            <Checkbox id="WebcamsOnlyForModerator" name="option" value="WebcamsOnlyForModerator" v-model="meetingModel.WebcamsOnlyForModerator" />
                            <label for="WebcamsOnlyForModerator" class="text-900 text-xl my-3">Webcams Only For Moderator</label>
                        </div>

                        <div class="field-checkbox mb-0">
                            <Checkbox id="LockSettingsDisableCam" name="option" value="LockSettingsDisableCam" v-model="meetingModel.LockSettingsDisableCam" />
                            <label for="LockSettingsDisableCam" class="text-900 text-xl my-3">Lock Settings Disable Cam</label>
                        </div>

                        <div class="field-checkbox mb-0">
                            <Checkbox id="LockSettingsDisableMic" name="option" value="LockSettingsDisableMic" v-model="meetingModel.LockSettingsDisableMic" />
                            <label for="LockSettingsDisableMic" class="text-900 text-xl my-3">Lock Settings Disable Microphone</label>
                        </div>

                        <div class="field-checkbox mb-0">
                            <Checkbox id="LockSettingsDisablePrivateChat" name="option" value="LockSettingsDisablePrivateChat" v-model="meetingModel.LockSettingsDisablePrivateChat" />
                            <label for="LockSettingsDisablePrivateChat" class="text-900 text-xl my-3">Lock Settings Disable Private Chat</label>
                        </div>

                        <div class="field-checkbox mb-0">
                            <Checkbox id="LockSettingsDisablePublicChat" name="option" value="LockSettingsDisablePublicChat" v-model="meetingModel.LockSettingsDisablePublicChat" />
                            <label for="LockSettingsDisablePublicChat" class="text-900 text-xl my-3">Lock Settings Disable Public Chat</label>
                        </div>

                        <div class="field-checkbox mb-0">
                            <Checkbox id="LockSettingsHideUserList" name="option" value="LockSettingsHideUserList" v-model="meetingModel.LockSettingsHideUserList" />
                            <label for="LockSettingsHideUserList" class="text-900 text-xl my-3">Lock Settings Hide User List</label>
                        </div>

                        <div class="field-checkbox mb-0">
                            <Checkbox id="AllowModsToEjectCameras" name="option" value="AllowModsToEjectCameras" v-model="meetingModel.AllowModsToEjectCameras" />
                            <label for="AllowModsToEjectCameras" class="text-900 text-xl my-3">Allow Moderator To Eject Cameras</label>
                        </div>

                        <div class="field-checkbox mb-0">
                            <Checkbox id="AllowRequestsWithoutSession" name="option" value="AllowRequestsWithoutSession" v-model="meetingModel.AllowRequestsWithoutSession" />
                            <label for="AllowRequestsWithoutSession" class="text-900 text-xl my-3">Allow Requests Without Session</label>
                        </div>
                    </li>
                    
                </ul>
            </TabPanel>
            <TabPanel header="Moderator List">                    
                    <DataTable
                        :value="participantStore.selectedparticipants.value"
                        ref="dt"
                        v-model:selection="selectedModerator"
                        dataKey="id"
                        :paginator="true"
                        :rowHover="true"
                        :rows="10"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        :globalFilterFields="['name']"
                        showGridlines
                        >
                        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                        <Column field="fullName" header="Select Moderator Name" sortable></Column>                        
                    </DataTable>
            </TabPanel>

            <TabPanel header="File System">   

                <h5>Files that participants will see on their page.</h5>
                <FileUpload name="demo[]" @uploader="onUpload" :multiple="true" accept="image/*" :maxFileSize="1000000" customUpload />
                <div class="col-12 field mb-6">
                        <hr class="my-1">
                    </div>
                <h5>The presentation file to be used when the meeting starts.</h5>
                <FileUpload mode="basic" name="demo[]" accept="image/*" :maxFileSize="1000000" @uploader="onUpload" customUpload />

            </TabPanel>
            
        </TabView>
            </div>
        </div>
    </div>


    <!-- Dialog info component -->
      <Dialog v-model:visible="moreInformation" :style="{ width: '850px' }" header="Detailed information about the group" :modal="true" class="p-fluid">
                    <p class="line-height-3 m-0">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                        consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                    <template #footer>
                        <Button label="Ok" icon="pi pi-check" text="" @click="hideMoreInformation" />
                    </template>
        </Dialog>

</template>

<style>
/* Bu CSS kodunu, Vue komponentinizin <style> bölümüne ekleyin */
.grid .col-12.lg:col-6:first-child {
    border-right: 2px solid #000; /* Sağ tarafa siyah renkte 2px kalınlığında bir çizgi ekler */
}
</style>