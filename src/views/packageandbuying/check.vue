<template>
    <div class="col-12">
      <div class="card">
        <div class="grid">
          <div class="col-12 md:col-12 align-items-center justify-content-center">
            <Message severity="success" v-if="paymentStore.check.success && paymentStore.check.success != null">{{ paymentStore.check.message  }} <br/> Dekont Numarası : {{ route.query.order }}</Message>

<Message severity="error" v-if="!paymentStore.check.success && paymentStore.check.success != null">{{paymentStore.check.message 
 }} </Message>

<Message severity="warn" v-if="paymentStore.check.success == null">Lütfen bekleyiniz...</Message>

         
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref ,onMounted,computed} from 'vue';
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
        cvc: null
      });
      
onMounted(async () => {
    await checkPayment();
});
const getCheck = computed(()=> {
    return paymentStore.check
})
   
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
  
      const checkPayment = () => {
        // if (!paymentModel.value.nameSurname || !paymentModel.value.cardNumber.value || !paymentModel.value.expiryDate.value || !paymentModel.value.cvv.value) {
        //   toast.add({ severity: 'error', summary: 'Hata', detail: 'Tüm alanları doldurun.', life: 3000 });
        //   return;
        // }
        // Ödeme işlemini gerçekleştirmek için API çağrısı yapın
        console.log('Ödeme işleniyor...');
        paymentStore.checkPayment(route.query.order).then((x) => {
          console.log(x);
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
  