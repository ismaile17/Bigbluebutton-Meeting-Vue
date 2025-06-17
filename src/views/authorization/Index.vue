<script setup>
import { onMounted, ref, watch } from 'vue'
import { FilterMatchMode } from 'primevue/api'
import { useLayout } from '@/layout/composables/layout'
import { useModuleStore } from '@/stores/module'
import { useCompanyStore } from '@/stores/company'
import { useEmployeeStore } from '@/stores/employees'
import { useRoleStore } from '@/stores/roles'
import { useLayoutStore } from '@/stores/layout'
const layoutStore = useLayoutStore()
const emit = defineEmits(['checkbox:change', 'delete:task', 'open:edit:dialog'])
const { layoutConfig } = useLayout()
const knobValue = ref(90)
const moduleStore = useModuleStore()
const companyStore = useCompanyStore()
const employeeStore = useEmployeeStore()
const roleStore = useRoleStore()
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper'
const screenActionData = ref([])
const tempScreenAction = ref([])
const modules = ref([])
const selectedModules = ref(null)
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

const companies = ref([])
const selectedCompany = ref(null)
const roles = ref([])
const screens = ref([])
const identityEmployees = ref([])
const selectedRoles = ref(null)

const companyChange = (args) => {
  roleStore.getAllRoles(args.value.id).then((d) => {
    roles.value = d.value
  })
}
const selectedData = ref([])

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  'roles.name': { value: null, matchMode: FilterMatchMode.CONTAINS }
})
const filtersScreen = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

const dt = ref()
const rolesDialog = ref(false)
const screenDialog = ref(false)

const openEmployee = (args) => {
  layoutStore.setLoading(true)
  identityEmployees.value = []
  employeeStore
    .getIdentityEmployees(selectedCompany.value.id)
    .then((d) => {
      if (d.success) {
        identityEmployees.value = d.value
        selectedRoles.value = args
        identityEmployees.value.forEach((data) => {
          if (data.roles.find((a) => a.name == selectedRoles.value.name)) {
            data.checked = true
          }
        })
        layoutStore.setLoading(false)
      } else {
        layoutStore.setLoading(false)
      }
    })
    .catch(() => {
      layoutStore.setLoading(false)
    })
  rolesDialog.value = true
}
const role = ref(null)
const openScreenAuthorization = (args) => {
  selectedModules.value = null
  layoutStore.setLoading(true)
  moduleStore
    .getAllModules()
    .then((x) => {
      if (x.success) {
        modules.value = x.value
        layoutStore.setLoading(false)
      } else {
        layoutStore.setLoading(false)
      }
    })
    .catch(() => {
      layoutStore.setLoading(false)
    })
  role.value = args
  screenDialog.value = true
}
const hideDialog = () => {
  rolesDialog.value = false
  selectedRoles.value = null
  identityEmployees.value = []
}

const onCheckboxChange = (task, checked) => {
  if (!checked) {
    let index = task.roles.indexOf(selectedRoles.value)
    task.roles.splice(index, 1)
  } else {
    task.roles.push(selectedRoles.value)
  }
  let model = {
    companyId: selectedCompany.value.id,
    staffCode: task.staffCode,
    roleNames: task.roles == null ? [] : task.roles.map((d) => d.name),
    roleId: []
  }
  roleStore.addEmployeeRole(model)
  emit('checkbox:change', task)
}
const onCheckboxScreenChange = (task, checked) => {
  console.log(
    screens.value.filter(
      (d) => d.accessRoles.length > 0 && d.accessRoles.some((a) => a.name == role.value.name)
    )
  )
  if (!checked) {
    let index = task.accessRoles.indexOf(selectedRoles.value)
    task.accessRoles.splice(index, 1)
  } else {
    task.accessRoles.push(role.value)
  }
  let model = {
    moduleId: 0,
    RoleId: role.value.id,
    screenIds:
      screens.value.filter((d) => d.accessRoles.length > 0) == null
        ? []
        : screens.value
            .filter(
              (d) =>
                d.accessRoles.length > 0 && d.accessRoles.some((a) => a.name == role.value.name)
            )
            .map((d) => d.id)
  }
  roleStore.roleScreenAdd(model)
  emit('checkbox:change', task)
}

const moduleChange = (args) => {
  moduleStore.getAllScreen(selectedModules.value.id, role.value.id).then((d) => {
    if (d.success) {
      screens.value = d.value
      screens.value.forEach((data) => {
        if (data.accessRoles.find((a) => a.name == role.value.name)) {
          data.checked = true
        }
      })
    }
  })
  //     if(args.value){
  //         screens.value = args.value.screens;
  //         getActions().then((d) => {
  //             screenActions.value = d
  // });
  //     } else {
  //         screens.value = [];
  //         selectedScreens.value = null;
  //     }
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

            <DataTable
              ref="dt"
              v-model:expandedRows="expandedRows"
              v-model:filters="filters"
              :value="roles"
              dataKey="id"
              @rowExpand="onRowExpand"
              @rowCollapse="onRowCollapse"
              tableStyle="min-width: 60rem"
              showGridlines
              paginator
              :rows="10"
              :globalFilterFields="['name', 'id', 'staffCode']"
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

              <Column header="Name">
                <template #body="slotProps">
                  {{ slotProps.data.name }}
                </template>
              </Column>
              <Column header="Employees">
                <template #body="slotProps">
                  <Button
                    icon="pi pi-plus"
                    severity="success"
                    class="mr-2"
                    @click="openEmployee(slotProps.data)"
                  />
                </template>
              </Column>
              <Column header="Screen Authorization">
                <template #body="slotProps">
                  <Button
                    icon="pi pi-plus"
                    severity="success"
                    class="mr-2"
                    @click="openScreenAuthorization(slotProps.data)"
                  />
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
    :style="{ width: '75vw' }"
    header="Employees"
    maximizable
    :modal="true"
    class="p-fluid"
    @close="hideDialog"
  >
    <DataTable
      ref="dt"
      v-model:expandedRows="expandedRows"
      v-model:filters="filters"
      :value="identityEmployees"
      dataKey="id"
      @rowExpand="onRowExpand"
      @rowCollapse="onRowCollapse"
      scrollable
      scrollHeight="flex"
      tableStyle="min-width: 50rem"
      showGridlines
      paginator
      :rows="10"
      :globalFilterFields="['name', 'id', 'staffCode', 'roles.name']"
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

      <Column header="Name">
        <template #body="slotProps">
          {{ slotProps.data.name }}
        </template>
      </Column>
      <Column header="Staff Code">
        <template #body="slotProps">
          {{ slotProps.data.staffCode }}
        </template>
      </Column>
      <Column header="Current Role">
        <template #body="slotProps">
          <div v-for="role in slotProps.data.roles" :key="role.id">{{ role.name }}</div>
        </template>
      </Column>

      <Column header="Screen Authorization">
        <template #body="slotProps">
          <Checkbox
            binary
            @change="onCheckboxChange(slotProps.data, slotProps.data.checked)"
            v-model="slotProps.data.checked"
          ></Checkbox>
        </template>
      </Column>
    </DataTable>
  </Dialog>

  <Dialog
    v-model:visible="screenDialog"
    :style="{ width: '75vw' }"
    header="Screen"
    maximizable
    :modal="true"
    class="p-fluid"
    @close="hideDialog"
  >
    <div class="grid">
      <div class="col-12 lg:col-12">
        <div class="grid formgrid p-fluid">
          <div class="field col-6">
            <label for="nickname" class="font-medium text-900"> Module </label>
            <Dropdown
              v-model="selectedModules"
              :options="modules"
              optionLabel="name"
              :filter="true"
              placeholder="Select a Module"
              :showClear="true"
              @change="moduleChange($event)"
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
        </div>
      </div>
    </div>

    <DataTable
      ref="dtScreen"
      v-model:expandedRows="expandedRows"
      v-model:filters="filtersScreen"
      :value="screens"
      dataKey="id"
      scrollable
      scrollHeight="flex"
      tableStyle="min-width: 50rem"
      showGridlines
      paginator
      :rows="10"
      :globalFilterFields="['name', 'id', 'staffCode', 'roles.name']"
      v-if="selectedModules"
    >
      <template #header>
        <div class="flex justify-content-start" style="float: left">
          Selected Role : {{ role.name }}
        </div>
        <div class="flex justify-content-end" style="float: right">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText v-model="filtersScreen['global'].value" placeholder="Keyword Search" />
          </span>
        </div>
        <div></div>
      </template>
      <Column header="Screen">
        <template #body="slotProps">
          {{ slotProps.data.name }}
        </template>
      </Column>

      <Column header="Authorization">
        <template #body="slotProps">
          <Checkbox
            binary
            @change="onCheckboxScreenChange(slotProps.data, slotProps.data.checked)"
            v-model="slotProps.data.checked"
          ></Checkbox>
        </template>
      </Column>
    </DataTable>
  </Dialog>
</template>
