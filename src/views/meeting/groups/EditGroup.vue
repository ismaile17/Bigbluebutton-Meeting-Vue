<script setup>
import { onMounted, ref, watch,onBeforeMount } from 'vue'
import { useLayout } from '@/layout/composables/layout'
import { useLayoutStore } from '@/stores/layout'
import { useMeetingStore } from '@/stores/meeting'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
const route = useRoute();
const toast = useToast();
const router = useRouter()
const layoutStore = useLayoutStore()
const emit = defineEmits(['checkbox:change', 'delete:task', 'open:edit:dialog'])
const { layoutConfig } = useLayout()
const meetingStore = useMeetingStore()


const productDialog = ref(false);
const moreInformation = ref(false);
const selectedProducts = ref([]);

// Function to toggle select all checkbox
const selectAllCheckboxBodyTemplate = `
  <Checkbox v-model="selectAllCheckbox" @change="selectAllRows"></Checkbox>
`;

const selectAllCheckbox = ref(false);

// Function to select all rows
const selectAllRows = () => {
  if (selectAllCheckbox.value) {
    selectedProducts.value = meetingStore.groups.value.map(item => item.id);
  } else {
    selectedProducts.value = [];
  }
};
const test = ref();
// onBeforeMount(() => {

//     test.value = route.params.id;
// });

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
const groupModel = ref({})
const selectUsers = ref();

onMounted(() => {{{
    meetingStore.getGroupById(route.params.id).then((x) => {
        if(x.success){
            selectUsers.value = x.value.appUsers;
     groupModel.value.id = route.params.id;
     groupModel.value.name= meetingStore.groups.value.name;
     groupModel.value.description=meetingStore.groups.value.description;
     groupModel.value.specialDescription=meetingStore.groups.value.specialDescription;
     groupModel.value.meetingGroupUserLists=[];
     //groupModel.value.meetingGroupUserLists=selectUsers.value.map(a => a.id);
        }
    })
 }}})



 
const addGroup = () => {
  layoutStore.setLoading(true);
  meetingStore
    .editGroup(groupModel.value)
    .then((response) => {
      layoutStore.setLoading(false);
      if (response.success) {
        toast.add({severity:'success', summary: 'Başarılı!', detail: 'Kayıt başarıyla tamamlandı.', life: 3000});
        // Başarılı bir şekilde kaydedildiğinde yönlendirme yap
        router.push('/meeting/group/list');
      } else {
        toast.add({severity:'error', summary: 'Hata!', detail: 'Kayıt işlemi sırasında bir hata oluştu.', life: 3000});
      }
    })
    .catch((error) => {
      layoutStore.setLoading(false);
      toast.add({severity:'error', summary: 'Hata!', detail: 'Kayıt işlemi sırasında bir hata oluştu.', life: 3000});
    });
}

const getAll = () => {
  meetingStore.getGroupByUserId()
}

const openNew = () => {
    productDialog.value = true;
};

const hideDialog = () => {
    productDialog.value = false;
    submitted.value = false;
};

const hideMoreInformation = () => {
  moreInformation.value = false;
};

const openmoreInformation = () => {
  moreInformation.value = true;
};

const saveSelectedProducts = () => {
  //moreInformation.value = true;
};


</script>
              <template>
            <div class="flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between py-2">
            <div class="mb-4 sm:mb-0">
              <!----<Button label="Meeting Start" icon="pi pi-play" class="mr-2" rounded severity="danger"></Button>-->
            </div>
            <div>
                <Button label="Save" icon="pi pi-save" rounded @click="addGroup"></Button>
            </div>
        </div>
        <div :style="{ height: '4px', background: 'linear-gradient(90deg, var(--primary-color) 0%, rgba(33, 150, 243, 0) 90%)' }"></div>
<h1></h1>

  <div class="card" v-if="meetingStore.groups.value">
    <div class="grid">
      <div class="col-12 lg:col-12">
        <div class="grid formgrid p-fluid">

          <div class="card col-12">

          <div class="field mb-12 col-12">
            <label for="nickname" class="font-medium text-900"> Group Name </label>
            <InputText id="name" required="true" autofocus v-model="groupModel.name" />
          <div class="grid formgrid">
                    <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                      <h5></h5>

                          <label for="description" class="font-medium text-900"> Description (group can see students) </label>
                          <Textarea id="description" :autoResize="true" rows="5" cols="5" class="mr-4" autofocus v-model="groupModel.description"/>

                    </div>
                    <div class="col-12 mb-2 lg:col-6 lg:mb-0">
                      <h5></h5>

                          <label for="specialDescription" class="font-medium text-900"> Special Note (only you can see) </label>
                          <Textarea id="specialDescription" :autoResize="true" rows="5" cols="5" class="mr-4" autofocus v-model="groupModel.specialDescription"/>

                    </div>
                </div>
              </div>
        </div>

        </div>
        <h5></h5>
                <Toolbar>
                    <template v-slot:start>
                        <Button label="Add Participant" icon="pi pi-user-plus" class="mr-1" severity="success" @click="openNew" rounded></Button>
                    </template>
                    <template v-slot:end>
                       <!---- <Button label="Save" @click="addGroup"></Button>-->
                    </template>
                </Toolbar>
        <DataTable :value="meetingStore.groups.value.appUsers"  v-model:selection="selectUsers">
          <h5></h5>
          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
          <Column field="nameSurname" header="Name" sortable></Column>
          <Column field="id" header="Id" sortable></Column>
        </DataTable>
      </div>
    </div>
    {{ meetingStore.groups.value }}
  </div>




      <!-- Dialog component -->
      <Dialog v-model:visible="productDialog" :style="{ width: '850px' }" header="My Participant List" :modal="true" class="p-fluid" >

        <DataTable
        v-if="meetingStore.groups.value"
          :value="meetingStore.groups.value"
          ref="dtt"
          dataKey="id"
          :paginator="true"
          :rows="10"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :rowsPerPageOptions="[5, 10, 25]"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
        > 
          <Column field="name" header="Name" sortable></Column>
          
        </DataTable>
        <template #footer>
          <Button label="Cancel" icon="pi pi-times" text="" @click="hideDialog" />
          <Button label="Save" icon="pi pi-check" text="" @click="saveSelectedProducts" />
        </template>
      </Dialog>

   

</template>