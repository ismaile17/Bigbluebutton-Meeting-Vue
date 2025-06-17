<script setup>
import { ref, onMounted, computed } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import { useLayout } from '@/layout/composables/layout';
import { useBuyingStore } from '@/stores/buying';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from "primevue/useconfirm";
import { useLayoutStore } from '@/stores/layout';

const layoutStore = useLayoutStore();
const confirm = useConfirm();

const toast = useToast();

const buyingStore = useBuyingStore();

const { layoutConfig } = useLayout();

const totalUsers = ref(1200);
const activeUsers = ref(450);
const newTickets = ref(56);
const resolvedTickets = ref(320);

const isExtendDays = ref(false); // Checkbox kontrolü için


const salesTableRef = ref(null);
const filterSalesTable = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const filterInvoiceTable = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const addPurchaseDialog = ref(false);
const selectedMoneyTransfer = ref(null); // Seçilen havale transferi

// productPurchaseData içerisine tüm form verilerini aldık
const productPurchaseData = ref({
  selectedPackage: null,
  name: '',
  surname: '',
  phone: '',
  price: null,
  specialNote: '',
  sendEndDay: '',
  selectedPurchaseType: null,
  moneyTransferFormId: null,
  adminNote: '' // Admin notu için alan
});

const products = ref([]);
const invoiceList = ref([]);


const purchaseTypes = [
  { label: 'Transfer', value: 2 },
  { label: 'Demo', value: 3 },
  { label: 'Gift', value: 4 }
];

const packageOptions = computed(() => {
  return productPurchaseData.value.packages?.map(p => ({
    ...p,
    label: `ID:${p.parentID} - ${p.name} - ${p.price} TL - ${p.duration} GÜN `  // parentID ve name birleştirilmiş hali
  }));
});

// Paketleri alma ve diyaloğu açma fonksiyonu
const openAddPurchaseDialog = async () => {
  productPurchaseData.value = {
    selectedPackage: null,
    name: '',
    surname: '',
    phone: '',
    specialNote: '',
    price: null,
    selectedPurchaseType: null,
    moneyTransferFormId: null,
    adminNote: '' // Admin notu temizleniyor
  };
  await buyingStore.getAllPackage();
  productPurchaseData.value.packages = buyingStore.packagelist;
  
  // Butona basılarak açıldığında, havaleID boş olacak
  productPurchaseData.value.moneyTransferFormId = null;
  addPurchaseDialog.value = true; 
};

// Satırdaki verileri Dialog'a aktarma ve açma fonksiyonu
const openDialogWithData = async (selectedData) => {
  productPurchaseData.value.name = selectedData.name;
  productPurchaseData.value.surname = selectedData.surname; 
  productPurchaseData.value.phone = selectedData.phone;
  productPurchaseData.value.moneyTransferFormId = selectedData.moneyTransferFormId || null; // Bu kısmı kontrol edin
  productPurchaseData.value.selectedPurchaseType = purchaseTypes.find(type => type.value === 2);
  productPurchaseData.value.definedAppUserId = selectedData.appUserId;
  selectedMoneyTransfer.value = selectedData; // Seçilen money transfer verisi kaydediliyor

  // Paketleri yükleme işlemi
  await buyingStore.getAllPackage();
  productPurchaseData.value.packages = buyingStore.packagelist;

  // Gelen packageID'yi seçmek için doğru paketi buluyoruz ve selectedPackage'a atıyoruz
  const selectedPackage = productPurchaseData.value.packages.find(
    (p) => p.id === selectedData.packageId
  );
  
  if (selectedPackage) {
    productPurchaseData.value.selectedPackage = selectedPackage.id;
  }

  addPurchaseDialog.value = true;
};




// Satın alma işlemini tamamla fonksiyonu
const submitPurchase = async () => {
  try {
    layoutStore.setLoading(true)
    // Transfer seçildiyse moneyTransferFormId'nin dolu olup olmadığını kontrol et
    if (productPurchaseData.value.selectedPurchaseType?.value === 2 && !productPurchaseData.value.moneyTransferFormId) {
      toast.add({ severity: 'error', summary: 'Hata', detail: 'Havale ID gereklidir.', life: 3000 });
      layoutStore.setLoading(false)
      return;
    }

    // Eğer Transfer seçilmediyse moneyTransferFormId null olmalı
    if (productPurchaseData.value.selectedPurchaseType?.value !== 2) {
      productPurchaseData.value.moneyTransferFormId = null;
    }

    const dataToSend = {
      appUserId: 1, 
      definedAppUserId: productPurchaseData.value.definedAppUserId, 
      name: productPurchaseData.value.name,
      surname: productPurchaseData.value.surname,
      phoneNumber: productPurchaseData.value.phone,
      adminNote: productPurchaseData.value.adminNote, 
      price: productPurchaseData.value.price || productPurchaseData.value.selectedPackage?.price || 0,
      packageId: productPurchaseData.value.selectedPackage || 0,
      sendEndDay: isExtendDays.value ? productPurchaseData.value.sendEndDay || null : null, // Eğer gün uzatma yapılmadıysa null gönder
      purchaseType: productPurchaseData.value.selectedPurchaseType?.value || 0,
      moneyTransferFormId: productPurchaseData.value.moneyTransferFormId 
    };

    // API çağrısı yapıyoruz
    const response = await buyingStore.addPackageMoneyTransferOrGift(dataToSend);

    // API yanıtını kontrol et
    if (response.success) {
      toast.add({ severity: 'success', summary: 'Başarılı', detail: response.message || 'İşlem başarıyla tamamlandı.', life: 30000 });
      layoutStore.setLoading(false)
      await buyingStore.getAllMoneyTransferList();
      products.value = buyingStore.moneytransferlist; // Transfer listesi tabloya yerleşiyor
      addPurchaseDialog.value = false;
    } else {
      toast.add({ severity: 'error', summary: 'Hata', detail: response.message || 'İşlem gerçekleştirilemedi.', life: 30000 });
      layoutStore.setLoading(false)
    }

    addPurchaseDialog.value = false; 
    selectedMoneyTransfer.value = null;
  } catch (error) {
    console.error("Hata:", error);
    toast.add({ severity: 'error', summary: 'Hata', detail: 'İşlem sırasında bir hata oluştu.', life: 30000 });
    layoutStore.setLoading(false)
  }
};




// Tüm money transfer listeleri tabloya getiriliyor
onMounted(async () => {
  await buyingStore.getAllMoneyTransferList();
  products.value = buyingStore.moneytransferlist; // Transfer listesi tabloya yerleşiyor

  await buyingStore.getAllInvoiceList();
  invoiceList.value = buyingStore.invoicelist;

  productPurchaseData.value.sendEndDate = new Date(); // Varsayılan olarak bugünün tarihi

});

const refreshTable = async () => {
  await buyingStore.getAllMoneyTransferList();
  products.value = buyingStore.moneytransferlist;
  toast.add({ severity: 'info', summary: 'Tablo Yenilendi', detail: 'Satış tablosu güncellendi.', life: 3000 });
};

const refreshTableInvoice = async () => {
  await buyingStore.getAllInvoiceList();
  invoiceList.value = buyingStore.invoicelist;
  toast.add({ severity: 'info', summary: 'Tablo Yenilendi', detail: 'Satış tablosu güncellendi.', life: 3000 });
};

const formatTurkishDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
};


const invoiceTrue = (data) => {
  confirm.require({
    message: 'Fatura kesildi mi emin misiniz?',
    header: 'Doğrulama',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Evet',
    rejectLabel: 'Hayır',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        layoutStore.setLoading(true);

                // Payload oluşturuyoruz
        const payload = {
          appUserId: 0, // appUserId'yi buyingStore'dan alıyoruz
          purchaseId: data.id // purchaseId'yi data'dan alıyoruz
        };
        // buyingStore.addInvoiceTrue fonksiyonunu çağırıyoruz
        const response = await buyingStore.addInvoceTrue(payload);
        
        if (response.success) {
          toast.add({ severity: 'success', summary: 'Başarılı', detail: response.message || 'İşlem başarıyla tamamlandı.', life: 3000 });
          // Gerekirse tabloyu yenileyebilirsiniz
          await buyingStore.getAllInvoiceList();
          invoiceList.value = buyingStore.invoicelist;
        } else {
          toast.add({ severity: 'error', summary: 'Hata', detail: response.message || 'İşlem gerçekleştirilemedi.', life: 3000 });
        }
      } catch (error) {
        console.error("Fatura işleme hatası:", error);
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Fatura işleme sırasında bir hata oluştu.', life: 3000 });
      } finally {
        layoutStore.setLoading(false);
      }
    },
    reject: () => {
      // Kullanıcı işlemi reddederse yapılacaklar
      toast.add({ severity: 'info', summary: 'Bilgi', detail: 'İşlem iptal edildi.', life: 3000 });
    }
  });
};

</script>

<template>

<ConfirmDialog />

  <!-- Dashboard -->
  <div class="col-12 md:col-12">
    <!-- Kutuların sıralı hali -->
    <div class="grid">
      <div class="col-12 md:col-6 lg:col-3">
        <div class="card text-center">
          <span class="font-semibold text-lg">Toplam Kullanıcılar</span>
          <div class="text-4xl font-bold">{{ totalUsers }}</div>
        </div>
      </div>
      <div class="col-12 md:col-6 lg:col-3">
        <div class="card text-center">
          <span class="font-semibold text-lg">Aktif Kullanıcılar</span>
          <div class="text-4xl font-bold">{{ activeUsers }}</div>
        </div>
      </div>
      <div class="col-12 md:col-6 lg:col-3">
        <div class="card text-center">
          <span class="font-semibold text-lg">Yeni Biletler</span>
          <div class="text-4xl font-bold">{{ newTickets }}</div>
        </div>
      </div>
      <div class="col-12 md:col-6 lg:col-3">
        <div class="card text-center">
          <span class="font-semibold text-lg">Çözülen Biletler</span>
          <div class="text-4xl font-bold">{{ resolvedTickets }}</div>
        </div>
      </div>
    </div>

    <!-- Butonlar -->
    <div class="grid mt-4">
      <div class="col-12 md:col-4">
        <div class="card">
          <Button label="Kullanıcıya Paket Tanımlama" icon="pi pi-ticket" class="w-full mb-3" @click="openAddPurchaseDialog"></Button>
          <Button label="Kullanıcılar ve Şifre İşlemleri" icon="pi pi-user-plus" class="w-full mb-3"></Button>
        </div>
      </div>

      <!-- Satış Tablosu -->
      <div class="col-12 md:col-8">
        <div class="card">
          <div class="flex justify-content-between align-items-center">
            <Button 
              icon="pi pi-refresh"
              @click="refreshTable"
              label="Yenile"
            />

            <h3 class="text-900 text-xl font-semibold mb-3">Para Transfer Talep Tablosu</h3>

          </div>
          <DataTable ref="salesTableRef" :value="products" dataKey="id" paginator :rows="5" responsiveLayout="scroll" v-model:filters="filterSalesTable">
            <template #empty>No products found.</template>

            <Column header="Action" :headerStyle="{ minWidth: '10rem' }">
              <template #body="{ data }">
                <Button label="Select" icon="pi pi-pencil" class="p-button-sm" @click="openDialogWithData(data)" />
              </template>
            </Column>

            <Column field="moneyTransferFormId" header="ID" sortable>
              <template #body="{ data }">{{ data.moneyTransferFormId }}</template>
            </Column>

            <Column field="name" header="Name" sortable>
              <template #body="{ data }">{{ data.name }}</template>
            </Column>

            <Column field="surname" header="Surname" sortable>
              <template #body="{ data }">{{ data.surname }}</template>
            </Column>

            <Column field="phoneNumber" header="phoneNumber" sortable>
              <template #body="{ data }">{{ data.phoneNumber }}</template>
            </Column>

            <!-- Butonun bulunduğu sütun -->

          </DataTable>
        </div>
      </div>
    </div>



    <div class="grid mt-4">
      <div class="col-12 md:col-4">

      </div>
              <!-- Fatura Tablosu -->
      <div class="col-12 md:col-12">
        <div class="card">
          <div class="flex justify-content-between align-items-center">
            <h3 class="text-900 text-xl font-semibold mb-3">Fatura Tablosu</h3>
            <Button 
              icon="pi pi-refresh" 
              @click="refreshTableInvoice"
              label="Yenile"
            />
          </div>
          <DataTable ref="salesTableRef" :value="invoiceList" dataKey="id" paginator :rows="5" responsiveLayout="scroll" v-model:filters="filterInvoiceTable">
            <template #empty>No products found.</template>

            <Column field="id" header="ID" sortable>
              <template #body="{ data }">{{ data.id }}</template>
            </Column>

            <Column field="name" header="name" sortable>
              <template #body="{ data }">{{ data.name }}</template>
            </Column>

            <Column field="email" header="email" sortable>
              <template #body="{ data }">{{ data.email }}</template>
            </Column>

            <Column field="phoneNumber" header="phoneNumber" sortable>
              <template #body="{ data }">{{ data.phoneNumber }}</template>
            </Column>

            <Column field="invoiceType" header="invoiceType" sortable>
              <template #body="{ data }">{{ data.invoiceType }}</template>
            </Column>

            <Column field="invoiceNameSurname" header="invoiceNameSurname" sortable>
              <template #body="{ data }">{{ data.invoiceNameSurname }}</template>
            </Column>

            <Column field="invoiceAddress" header="invoiceAddress" sortable>
              <template #body="{ data }">{{ data.invoiceAddress }}</template>
            </Column>

            <Column field="invoiceNumber" header="invoiceNumber" sortable>
              <template #body="{ data }">{{ data.invoiceNumber }}</template>
            </Column>

            <Column field="invoiceCountry" header="invoiceCountry" sortable>
              <template #body="{ data }">{{ data.invoiceCountry }}</template>
            </Column>

            <Column field="invoiceVD" header="invoiceVD" sortable>
              <template #body="{ data }">{{ data.invoiceVD }}</template>
            </Column>

            <Column field="createdTime" header="Oluşturulma Zamanı" sortable>
              <template #body="{ data }">
                {{ formatTurkishDate(data.createdTime) }}
              </template>
            </Column>

            <!-- Butonun bulunduğu sütun -->
            <Column header="Action" :headerStyle="{ minWidth: '10rem' }">
              <template #body="{ data }">
                <Button label="Fatura Kesildi" icon="pi pi-pencil" class="p-button-sm" @click="invoiceTrue(data)" />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>



  </div>

  <!-- Dialog component -->
  <Dialog v-model:visible="addPurchaseDialog" :modal="true" class="p-fluid" header="PAKET ATAMA" :style="{ width: '50vw' }">

    <div class="grid formgrid">
        <div class="col-12 mb-2 lg:col-4 lg:mb-0">
          <label for="name">Ad</label>
          <InputText id="name" v-model="productPurchaseData.name" />
        </div>
        <div class="col-12 mb-2 lg:col-4 lg:mb-0">
          <label for="surname">Soyad</label>
          <InputText id="surname" v-model="productPurchaseData.surname" />
        </div>
        <div class="col-12 mb-2 lg:col-4 lg:mb-0">
          <label for="phone">Telefon Numarası</label>
          <InputText id="phone" v-model="productPurchaseData.phone" />
        </div>
    </div>

    <hr class="my-5">


    <div class="grid formgrid">
        <div class="col-12 mb-2 lg:col-4 lg:mb-0">
          <label for="phone">User Id</label>
          <InputText id="phone" v-model="productPurchaseData.definedAppUserId" />
        </div>
        <div class="col-12 mb-2 lg:col-4 lg:mb-0">
          <label for="phone">Price</label>
          <InputText id="phone" v-model="productPurchaseData.price" />
        </div>
        <div class="col-12 mb-2 lg:col-4 lg:mb-0">
          <label for="package">Satınalma Türü</label>
          <Dropdown id="purchaseType" v-model="productPurchaseData.selectedPurchaseType" :options="purchaseTypes" optionLabel="label" placeholder="Satınalma Türü Seçiniz"></Dropdown>
        </div>
    </div>

    <hr class="my-5">

    <div class="grid formgrid">

        <div class="col-12 mb-2 lg:col-4 lg:mb-0 my-4">
          <Checkbox v-model="isExtendDays" binary />
          <label for="extendDaysCheckbox"> Gün uzatma işlemi mi?</label>
        </div>

        <div class="col-12 mb-2 lg:col-4 lg:mb-0" v-if="isExtendDays">
          <label for="sendEndDay">Kaç Gün Uzatılacak</label>
          <InputNumber
            v-model="productPurchaseData.sendEndDay" 
            :max="365"
          />
        </div>

        <div class="col-12 mb-2 lg:col-4 lg:mb-0" v-if="productPurchaseData.moneyTransferFormId">
          <label for="moneyTransferFormId">Money Transfer Form ID</label>
          <InputText id="moneyTransferFormId" v-model="productPurchaseData.moneyTransferFormId" readonly />
        </div>

    </div>

    <hr class="my-5">

    <div class="grid formgrid">
        <div class="col-12 mb-2 lg:col-6 lg:mb-0">
          <label for="package">Paket Bilgisi</label>
          <Dropdown id="package" v-model="productPurchaseData.selectedPackage" :options="packageOptions" optionLabel="label" optionValue="id" placeholder="Paket Seçiniz"></Dropdown>
        </div>
        <div class="col-12 mb-2 lg:col-6 lg:mb-0">
          <label for="adminNote">Admin Notu</label>
          <InputText id="adminNote" v-model="productPurchaseData.adminNote" />
        </div>
    </div>

    <div class="field">

    </div>

    <div class="flex justify-content-end mt-4">
      <Button label="Kaydet" @click="submitPurchase"></Button>
    </div>
  </Dialog>
</template>
