<script setup>
import { onMounted, ref, computed } from 'vue';
import { useBuyingStore } from '@/stores/buying';
import { useLayoutStore } from '@/stores/layout';
import { useI18n } from 'vue-i18n'; // useI18n eklenmeli
import { useToast } from 'primevue/usetoast'
const toast = useToast()

const { t } = useI18n(); // i18n çeviri fonksiyonunu tanımlıyoruz

const layoutStore = useLayoutStore();
const buyingStore = useBuyingStore();


const packageOptions = computed(() => {
  return productPurchaseData.value.packages?.map(p => {
    const months = Math.round(p.duration / 30); // Gün sayısını aya çevirip en yakın tam sayıya yuvarlama
    return {
      ...p,
      label: `${p.name} - ${p.price} TL - ${months} AY`  // Gün sayısını ay cinsine çevirip yazma
    };
  });
});

onMounted(async () => {
  layoutStore.setLoading(true);
  const packages = await buyingStore.getPurchasesListByUserId();
  
  purchases.value = packages.value;
  layoutStore.setLoading(false);
});

const purchases = ref([]);  


const addPurchaseDialog = ref(false);


const openAddPurchaseDialog = async () => {
  productPurchaseData.value = {
    selectedPackage: null,
    name: '',
    surname: '',
    phone: ''
  };
  await buyingStore.getAllPackage();
  productPurchaseData.value.packages = buyingStore.packagelist;
  
  addPurchaseDialog.value = true; 
};



const getPurchaseTypeText = (purchaseType) => {
  switch (purchaseType) {
    case 1:
      return t('purchase.websitePayment');
    case 2:
      return t('purchase.transferPayment');
    case 3:
      return t('purchase.demoGiven');
    case 4:
      return t('purchase.giftGiven');
    default:
      return t('purchase.unknownPayment');
  }
};

const showIbanListDialog = ref(false);

// IBAN Listesi
const ibanList = ref([
  'TR00 0000 0000 0000 0000 0000',
  'TR11 1111 1111 1111 1111 1111',
  'TR22 2222 2222 2222 2222 2222'
]);


const productPurchaseData = ref({
  selectedPackage: null,
  name: '',
  surname: '',
  phone: ''
});

const getMonthsFromDuration = (duration) => {
  const months = duration / 30; // Her ayı 30 gün olarak kabul ediyoruz
  return Math.round(months); // Yuvarlama işlemi
};

const submitMoneyTransferNotification = async () => {
  try {
    layoutStore.setLoading(true);

    const dataToSend = {
      name: productPurchaseData.value.name,
      surname: productPurchaseData.value.surname,
      phoneNumber: productPurchaseData.value.phone,
      packageId: productPurchaseData.value.selectedPackage?.id || null
    };

    // API çağrısı
    const response = await buyingStore.addMoneyTransferTicket(dataToSend);

    if (response.success) {
      toast.add({ severity: 'success', summary: t('success'), detail: response.message || t('purchase.successfulOperation'), life: 3000 });
      addPurchaseDialog.value = false;
    } else {
      toast.add({ severity: 'error', summary: t('error'), detail: response.message || t('purchase.errorOccurred'), life: 3000 });
    }

    layoutStore.setLoading(false);
  } catch (error) {
    toast.add({ severity: 'error', summary: t('error'), detail: t('purchase.errorOccurred'), life: 3000 });
    layoutStore.setLoading(false);
  }
};

</script>

<template>
  <div>
      <div class="flex justify-content-between mb-3">
        <Button :label="$t('purchase.back')" icon="pi pi-arrow-left" @click="router.go(-1)" rounded />
        <Button :label="$t('purchase.notification')" icon="pi pi-save" class="p-button-save" @click="openAddPurchaseDialog" rounded />
    </div>

    <div
        :style="{
        height: '4px',
        background: 'linear-gradient(90deg, #ffa500 0%, rgba(33, 150, 243, 0) 90%)'
        }" class="mb-4"
    ></div>
    <div class="card">
      <div class="text-900 font-bold text-xl" v-if="purchases.length === 0">{{ t('purchase.info') }}</div>

      <!-- Gelen verilere göre tekrar eden ürünler -->
      <ul class="list-none p-0 m-0" v-if="purchases && purchases.length > 0">
        <li v-for="purchase in purchases" :key="purchase.packageId" class="flex flex-column md:flex-row py-5 md:align-items-center"
            :style="{
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            backgroundImage: 'linear-gradient(to right, rgba(173, 216, 230, 0.1) 50%, rgba(255, 165, 0, 0.2) 100%)',
            backgroundClip: 'padding-box, border-box',
            backgroundOrigin: 'border-box',
            padding: '15px',
            borderRadius: '8px'
            }"
        >
          <div class="flex-auto py-2 md:pl-5">
            <div class="flex flex-wrap align-items-start sm:align-items-center sm:flex-row sm:justify-content-between surface-border pb-3">
              <div class="w-full sm:w-6 flex flex-column">
                <span class="inline-flex align-items-center mb-3">
                  <i class="pi pi-box mr-2" :style="{ color: '#A993D3', fontSize: '24px' }"></i>
                  <span class="text-700 mr-2">{{ purchase.packageName }}</span>
                </span>
                
                <span class="inline-flex align-items-center mb-3">
                  <i class="pi pi-info-circle mr-2" :style="{ color: '#88C893', fontSize: '24px' }"></i>
                  <span class="text-700 mr-2">{{ purchase.packageDescription }}</span>
                </span>
                <div
                    :style="{
                    height: '2px',
                    background: 'linear-gradient(90deg, #0a74da 0%, rgba(33, 150, 243, 0) 50%)'
                    }"
                ></div>
              </div>
  
              <div class="w-full sm:w-6 flex align-items-start justify-content-between mt-3 sm:mt-0">
                <div>
                    <div v-if="purchase.code">
                        <span class="text-900 text-xl font-medium mb-3">{{ $t('purchase.couponWithCode') }}</span><br>
                        <span class="text-900 text-xl font-medium mb-3">
                            <span :style="{ color: '#0a74da', fontSize: '1.2em', fontWeight: 'bold' }"> %{{ purchase.discountValue }}</span>
                            {{ $t('purchase.discountReceived') }}
                        </span>
                    </div>
                </div>
                <div class="flex flex-column sm:align-items-end">
                  <span class="text-900 text-xl font-medium mb-2 sm:mb-3">{{ purchase.price }} TL</span>
                  <a class="cursor-pointer text-green-500 font-medium text-sm hover:text-pink-600 transition-colors transition-duration-300" tabindex="0">{{ $t('purchase.successfulPayment') }}</a>
                </div>
              </div>
            </div>
            <div class="flex flex-column">
              <span class="inline-flex align-items-center mb-3">
                <i class="pi pi-shopping-cart mr-2" :style="{ color: '#6CA0DC', fontSize: '24px' }"></i>
                <span class="text-700 mr-2">{{ getPurchaseTypeText(purchase.purchaseType) }}</span>
              </span>
              <span class="inline-flex align-items-center mb-3">
                <i class="pi pi-calendar-plus mr-2" :style="{ color: '#FF6F61', fontSize: '24px' }"></i>
                <span class="text-700 mr-2">{{ $t('purchase.duration') }} <span class="font-bold">{{ getMonthsFromDuration(purchase.duration) }} {{ $t('purchase.months') }}</span></span>
              </span>
              <span class="flex align-items-center">
                <i class="pi pi-check mr-2" :style="{ color: '#F2A65A', fontSize: '24px' }"></i>
                <span class="text-700 mr-2">{{ $t('purchase.transactionDate') }}                             
                  <span class="font-bold"> {{ new Date(purchase.createdTime).toLocaleString('tr-TR', { 
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) }}
                  </span>
                </span>
              </span>
            </div>
          </div>
        </li>
      </ul>
    </div>
  
    <!-- Dialog component -->
    <Dialog v-model:visible="addPurchaseDialog" :modal="true" class="p-fluid" :header="$t('purchase.notification')" :style="{ width: '35vw' }">


    <!-- Bilgilendirme Mesajı ve IBAN Listesi Butonu -->
    <Message severity="info" class="mb-4" :closable="false">
      {{ $t('purchase.infoMessage') }}
    </Message>
    
    <!-- IBAN Listesi Butonu - Mesajın Altında ve En Sağda -->
    <div class="flex justify-content-end mb-4">
      <Button :label="$t('purchase.ibanListTitle')" icon="pi pi-list" class="w-auto" severity="warning" @click="showIbanListDialog = true" />
    </div>


      <div class="field">
        <label for="name">{{ $t('purchase.name') }}</label>
        <InputText id="name" v-model="productPurchaseData.name" />
      </div>
  
      <div class="field">
        <label for="surname">{{ $t('purchase.surname') }}</label>
        <InputText id="surname" v-model="productPurchaseData.surname" />
      </div>
  
      <div class="field">
        <label for="phone">{{ $t('purchase.phoneNumber') }}</label>
        <InputText id="phone" v-model="productPurchaseData.phone" />
      </div>
  
      <div class="field">
        <label for="package">{{ $t('purchase.packageInfo') }}</label>
        <Dropdown id="state" v-model="productPurchaseData.selectedPackage" :options="packageOptions" optionLabel="label" :placeholder="$t('purchase.selectPackage')"></Dropdown>
      </div>

      <div class="flex justify-content-end mt-4 mt-8">
        <Button :label="$t('purchase.save')" class="w-auto" @click="submitMoneyTransferNotification" />
      </div>
      
      
    </Dialog>

      <!-- IBAN Listesi Dialog -->
    <Dialog v-model:visible="showIbanListDialog" :modal="true" :header="$t('purchase.ibanListTitle')" :style="{ width: '20vw' }">
        <ul class="list-none">
          <li v-for="iban in ibanList" :key="iban" class="mb-2">
            <i class="pi pi-credit-card mr-2"></i> {{ iban }}
          </li>
        </ul>
    </Dialog>

  </div>
  </template>