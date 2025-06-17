<script setup>
import { onMounted, ref, watch } from 'vue'
import { FilterMatchMode } from 'primevue/api'
import { useLayout } from '@/layout/composables/layout'
import { useModuleStore } from '@/stores/module'
import { useCompanyStore } from '@/stores/company'
import { useRoleStore } from '@/stores/roles'
import { useLayoutStore } from '@/stores/layout'
const layoutStore = useLayoutStore()
const { layoutConfig } = useLayout()
const knobValue = ref(90)
const moduleStore = useModuleStore()
const companyStore = useCompanyStore()
const roleStore = useRoleStore()
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper'
const screenActionData = ref([])
const tempScreenAction = ref([])
onMounted(() => {
  companyStore.getAllCompanies().then((x) => {
    if (x.success) {
      companies.value = x.value
    }
  })
})
watch(layoutConfig.colorScheme, () => {
  //  setChartData();
})
// const  getRoles = async () => {
//     //return await fetchWrapper.get(`https://$identity.${selectedCompany.value.domainName}/apiroles`);
//     return await fetchWrapper.get(`http://${'localhost:9000'}/api/roles`);
// };
const getActions = async () => {
  //return await fetchWrapper.get(`https://${selectedModules.value.apiUrl}-${selectedCompany.value.domainName}/screen/action`);
  return await fetchWrapper.get(`http://${'localhost:5022'}/api/screen/controller/action`)
}
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

const roleName = ref(null)
const companies = ref([])
const selectedCompany = ref(null)
const screens = ref([])
const roles = ref([])
const selectedRoles = ref(null)

const companyChange = (args) => {
  roleStore.getAllRoles(args.value.id).then((d) => {
    roles.value = d.value
  })
}
const selectedData = ref([])

const save = () => {
  layoutStore.setLoading(true)
  const model = {
    companyId: selectedCompany.value.id,
    name: roleName.value
  }
  roleStore
    .addRole(model)
    .then((d) => {
      if (d.success) {
        rolesDialog.value = false
        roleStore.getAllRoles(selectedCompany.value.id).then((d) => {
          roles.value = d.value
        })
        layoutStore.setLoading(false)
      } else {
        layoutStore.setLoading(false)
      }
    })
    .catch(() => {
      layoutStore.setLoading(false)
    })
}
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})
const dt = ref()
const rolesDialog = ref(false)
const exportCSV = () => {
  dt.value.exportCSV()
}
const openNew = () => {
  rolesDialog.value = true
}
const hideDialog = () => {
  rolesDialog.value = false
}
</script>
<template>
  <div class="card">
    <span class="text-900 text-xl font-bold mb-4 block">Roles</span>
    <div class="grid">
      <div class="col-12 lg:col-12">
        <div class="grid formgrid p-fluid">
          <div class="field mb-4 col-12">
            <label for="nickname" class="font-medium text-900"> Company </label>
            <Dropdown
              v-model="selectedCompany"
              :options="companies"
              optionLabel="name"
              :filter="true"
              placeholder="Select a Company"
              :showClear="true"
              @change="companyChange($event)"
            >
              <template #value="slotProps">
                <div class="flex align-items-center" v-if="slotProps.value">
                  <div>{{ slotProps.value.name }}</div>
                </div>
                <span v-else>
                  {{ slotProps.placeholder }}
                </span>
              </template>
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <div>{{ slotProps.option.name }}</div>
                </div>
              </template>
            </Dropdown>
          </div>

          <div class="field mb-4 col-12">
            <label for="Roles" class="font-medium text-900"> Roles </label>
            <Toolbar class="mb-4">
              <template #start>
                <Button
                  label="New"
                  icon="pi pi-plus"
                  severity="success"
                  class="mr-2"
                  @click="openNew"
                  :disabled="!selectedCompany"
                />
              </template>
              <template #end v-if="roles.length > 0">
                <Button
                  label="Export"
                  icon="pi pi-upload"
                  severity="help"
                  @click="exportCSV($event)"
                />
              </template>
            </Toolbar>
            <DataTable
              ref="dt"
              v-model:expandedRows="expandedRows"
              v-model:filters="filters"
              :value="roles"
              dataKey="id"
              @rowExpand="onRowExpand"
              @rowCollapse="onRowCollapse"
              tableStyle="min-width: 60rem"
              paginator
              :rows="10"
              :globalFilterFields="['name', 'id']"
              v-if="roles.length > 0"
            >
              <template #header>
                <div class="flex justify-content-end">
                  <span class="p-input-icon-left">
                    <i class="pi pi-search" />
                    <InputText v-model="filters['global'].value" placeholder="Keyword Search" />
                  </span>
                </div>
              </template>
              <Column header="#">
                <template #body="slotProps">
                  {{ slotProps.data.id }}
                </template>
              </Column>
              <Column header="Name">
                <template #body="slotProps">
                  {{ slotProps.data.name }}
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Dialog
    v-model:visible="rolesDialog"
    :style="{ width: '450px' }"
    header="Roles"
    :modal="true"
    class="p-fluid"
  >
    <div class="field">
      <label for="name">Name</label>
      <InputText id="name" required="true" autofocus v-model="roleName" />
    </div>

    <template #footer>
      <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
      <Button label="Save" icon="pi pi-check" text @click="save" />
    </template>
  </Dialog>
</template>
