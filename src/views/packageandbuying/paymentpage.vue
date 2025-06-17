<template>
  <div class="col-12">
    <div class="card">
      <div class="grid">
        <div class="col-12 md:col-5 align-items-center justify-content-center">
          <p class="line-height-3 m-0">
            <strong>Paket Adı:</strong> {{ packageName }}
          </p>
          <Divider layout="horizontal" align="center"></Divider>
          <p class="line-height-3 m-0">
            <strong>Ödenecek Tutar:</strong> {{ packagePrice }} TL
          </p>
          <Divider layout="horizontal" align="center"></Divider>
          <p class="line-height-3 m-0">
            <label for="subscription" class="text-900 mb-2">Abonelik Süresi</label>
            <Dropdown :options="subscriptionOptions" v-model="selectedSubscription" placeholder="Seçiniz"/>
          </p>
          <Divider layout="horizontal" align="center"></Divider>
          <p class="line-height-3 m-0">
            <strong>Yapacağınız alışverişlerde kredi kartı bilgisi bizler tarafından tutulmamaktadır. </strong>
          </p>
          <Divider align="right">
            <Button label="Kupon Kodu Gir" icon="pi pi-tag" class="p-button-secondary w-full" @click="showCoupon = !showCoupon" text></Button>
          </Divider>
          <div v-if="showCoupon" class="field">
            <label for="couponCode" class="text-900 mb-2">Kupon Kodu</label>
            <InputText id="couponCode" type="text" v-model="couponCode" />
            <Divider align="center">
              <Button label="Uygula" icon="pi pi-search" @click="applyCoupon"></Button>
            </Divider>
          </div>
        </div>
        <div class="col-12 md:col-1 vertical-divider-container">
          <Divider layout="vertical" class="vertical-divider">
          </Divider>
        </div>
        <div class="col-12 md:col-5 flex align-items-center justify-content-center">
          <div class="p-fluid">
            <div class="field">
              <label for="namesurname" class="text-900 mb-2">Ad Soyad</label>
              <InputText id="namesurname" v-model="paymentModel.fullName" type="text" />
            </div>
            <div class="field">
              <label for="cardNumber" class="text-900 mb-2">Kart Numarası</label>
              <InputMask id="cardNumber" mask="9999-9999-9999-9999" v-model="paymentModel.cardNumber" unmask="true" required />
            </div>
            <div class="field">
              <label for="expiryDate" class="text-900 mb-2">Son Kullanma Tarihi</label>
              <InputMask id="expiryDate" mask="99/99" v-model="paymentModel.date" placeholder="MM/YY" required @blur="validateExpiryDate" />
            </div>
            <div class="field">
              <label for="cvv" class="text-900 mb-2">CVV</label>
              <InputMask id="cvv" mask="999" v-model="paymentModel.cvc" required />
            </div>
            <Button label="Öde" class="p-button p-component p-button-primary w-full mt-1 mb-4" @click="processPayment"></Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import InputText from 'primevue/inputtext';
import InputMask from 'primevue/inputmask';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import Dropdown from 'primevue/dropdown';
import Divider from 'primevue/divider';
import { usePaymentStore } from '@/stores/payment';
const paymentStore = usePaymentStore();
    const route = useRoute();
    const packageName = ref(route.query.packageName || '');
    const packagePrice = ref(route.query.packagePrice || '');
    const paymentModel = ref({
      fullName:null,
      cardNumber: null,
      date:null,
      cvc: null,
      packageId: route.query.packageId
    });
 
    const showCoupon = ref(false);
    const couponCode = ref('');
    const selectedSubscription = ref(null);
    const subscriptionOptions = ref([
      { label: '1 Ay', value: '1' },
      { label: '3 Ay', value: '3' },
      { label: '6 Ay', value: '6' },
      { label: '12 Ay', value: '12' }
    ]);

    const toast = useToast();

    const processPayment = () => {
      // if (!paymentModel.value.nameSurname || !paymentModel.value.cardNumber.value || !paymentModel.value.expiryDate.value || !paymentModel.value.cvv.value) {
      //   toast.add({ severity: 'error', summary: 'Hata', detail: 'Tüm alanları doldurun.', life: 3000 });
      //   return;
      // }
      // Ödeme işlemini gerçekleştirmek için API çağrısı yapın
      console.log('Ödeme işleniyor...');
      paymentStore.addPayment(paymentModel.value).then((x) => {
        console.log(x);
        if(x.success){
          window.location.href = x.value.threeDSecureUrl
        } 
      });
      //console.log({ packageName: packageName.value, packagePrice: packagePrice.value, nameSurname: nameSurname.value, cardNumber: cardNumber.value, expiryDate: expiryDate.value, cvv: cvv.value, couponCode: couponCode.value, selectedSubscription: selectedSubscription.value });
    };

    const applyCoupon = () => {
      if (!couponCode.value) {
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Kupon kodunu girin.', life: 3000 });
        return;
      }
      // Kupon kodunu uygulamak için API çağrısı yapın
      console.log('Kupon kodu uygulanıyor...', couponCode.value);
      toast.add({ severity: 'success', summary: 'Başarılı', detail: 'Kupon kodu uygulandı.', life: 3000 });
    };

    const validateExpiryDate = () => {
      const [month, year] = expiryDate.value.split('/');
      const currentDate = new Date();
      const expiryDateObj = new Date(`20${year}-${month}-01`);
      if (expiryDateObj < currentDate) {
        toast.add({ severity: 'error', summary: 'Hata', detail: 'Son kullanma tarihi geçmiş.', life: 3000 });
        expiryDate.value = '';
      }
    };

    
</script>

<style scoped>
.payment-page {
  text-align: center;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}

.payment-container {
  display: flex;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  max-width: 900px;
  width: 100%;
}

.product-info, .payment-info {
  flex: 1;
  padding: 2rem;
}

.product-info {
  background-color: #fafafa;
  border-right: 1px solid #ddd;
}

.product-details {
  margin-top: 1rem;
}

.field {
  margin-bottom: 1rem;
}

.coupon-section {
  margin-top: 1rem;
}

.vertical-divider-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.vertical-divider {
  display: block;
}

p {
  margin: 0;
  font-size: 1.1rem;
}

/* Mobil görünüm için düzenlemeler */
@media (max-width: 768px) {
  .vertical-divider-container {
    display: none;
  }

  .col-12.md\:col-5 {
    flex: 0 0 100%;
    max-width: 100%;
  }
}
</style>
