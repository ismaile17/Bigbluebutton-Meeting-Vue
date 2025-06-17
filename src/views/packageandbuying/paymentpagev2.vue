<template>
  <div class="card col-12" v-if="loadingRef == true">
    <div class="p-fluid formgrid grid">
      <div class="field col-12 md:col-6">
        <div class="col-12">
          <a
            class="text-teal-700 hover:underline cursor-pointer font-medium"
            @click="goToPackageList"
          >
            <i class="pi pi-arrow-left mr-2"></i>{{ t('paymentPageV2.viewPackages') }}
          </a>
        </div>
        <div
          :style="{
            height: '4px',
            background: 'linear-gradient(90deg, var(--primary-color) 0%, rgba(33, 150, 243, 0) 90%)'
          }"
          class="my-4"
        ></div>

        <div class="col-12 mb-2 lg:col-4 lg:mb-0 text-800 font-semibold flex align-items-center">
          <label class="ml-2">{{ t('paymentPageV2.packageName') }}</label>
          <label class="ml-2 text-500">{{ packageData.name }}</label>
        </div>

        <hr class="my-6" />
        <div class="col-12 mb-2 lg:col-4 lg:mb-0 text-800 font-semibold flex align-items-center">
          <label class="ml-2">{{ t('paymentPageV2.packageContent') }}</label>
        </div>
        <div class="col-12 lg:mb-0 text-800 font-semibold flex align-items-center">
          <label class="ml-2 text-500"
            >{{ t('paymentPageV2.participantCount') }}: {{ packageData.sessionHours }}</label
          >
        </div>
        <div class="col-12 lg:mb-0 text-800 font-semibold flex align-items-center">
          <label class="ml-2 text-500"
            >{{ t('paymentPageV2.groupCount') }}: {{ packageData.sessionHours }}</label
          >
        </div>
        <div class="col-12 lg:mb-0 text-800 font-semibold flex align-items-center">
          <label class="ml-2 text-500"
            >{{ t('paymentPageV2.recordable') }}:
            {{ packageData.cloudRecording ? t('paymentPageV2.yes') : t('paymentPageV2.no') }}</label
          >
        </div>
        <div class="col-12 lg:mb-0 text-800 font-semibold flex align-items-center">
          <label class="ml-2 text-500"
            >{{ t('paymentPageV2.studyRooms') }}:
            {{ packageData.sutdyRooms ? t('paymentPageV2.yes') : t('paymentPageV2.no') }}</label
          >
        </div>
        <hr class="my-6" />
        <div
          class="col-12 mb-2 lg:col-12 lg:mb-0 text-800 font-semibold text-align-center flex-container price-container"
        >
          <label class="ml-2">{{ t('paymentPageV2.amount') }}:</label>
          <label v-if="packageData.packageDiscountPrice" class="ml-2 text-500">
            <s>{{ packageData.price }} {{ packageData.priceCurrency }}</s>
            <span class="new-price"
              >{{ packageData.packageDiscountPrice }} {{ packageData.priceCurrency }}</span
            >
          </label>
          <label v-if="cuponAnswerDiscount" class="ml-2 text-500">
            <s>{{ packageData.price }} {{ packageData.priceCurrency }}</s>
            <span class="new-price"
              >{{ cuponAnswer.discountedPrice }} {{ packageData.priceCurrency }}</span
            >
          </label>
          <label
            v-if="!packageData.packageDiscountPrice && !cuponAnswerDiscount"
            class="ml-2 text-500"
          >
            {{ packageData.price }} {{ packageData.priceCurrency }}
          </label>
        </div>
        <br />
        <div
          v-if="packageData.packageDiscountPrice"
          class="col-12 lg:mb-0 text-800 font-semibold flex align-items-center"
        >
          <label class="ml-2 text-500">{{
            t('paymentPageV2.discountInfoText', {
              discountPrice: packageData.packageDiscountPrice,
              currency: packageData.priceCurrency
            })
          }}</label>
        </div>
        <div
          v-if="!packageData.packageDiscountPrice"
          class="col-12 lg:mb-0 text-800 font-semibold flex align-items-center"
        >
          <label class="ml-2 text-500">{{ t('paymentPageV2.samePackageInfoText') }}</label>
        </div>
        <Divider align="right" class="my-3">
          <Button
            v-if="!packageData.packageDiscountPrice"
            :label="t('paymentPageV2.enterCouponCodeBtn')"
            icon="pi pi-gift"
            class="p-button-secondary w-full"
            @click="showCoupon = !showCoupon"
            text
          ></Button>
        </Divider>

        <div v-if="showCoupon" class="field">
          <span class="p-input-icon-right">
            <InputText
              type="text"
              v-model="cuponData.code"
              :placeholder="t('paymentPageV2.couponCodePlaceholder')"
            />
            <i class="pi pi-tag" />
          </span>
          <Divider align="center">
            <Button
              :label="t('paymentPageV2.apply')"
              icon="pi pi-search"
              @click="checkCupon"
            ></Button>
          </Divider>
        </div>
      </div>
      <div class="field col-12 md:col-6">
        <div>
          <div class="card-form">
            <div class="card-list">
              <div class="card-item" :class="{ '-active': isCardFlipped }">
                <div class="card-item__side -front">
                  <div
                    class="card-item__focus"
                    :class="{ '-active': focusElementStyle }"
                    :style="focusElementStyle"
                    ref="focusElement"
                  ></div>
                  <div class="card-item__cover">
                    <img
                      :src="`https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/${currentCardBackground}.jpeg`"
                      class="card-item__bg"
                    />
                  </div>
                  <div class="card-item__wrapper">
                    <div class="card-item__top">
                      <img
                        src="https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/chip.png"
                        class="card-item__chip"
                      />
                      <div class="card-item__type">
                        <transition name="slide-fade-up">
                          <img
                            :src="`https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/${getCardType}.png`"
                            v-if="getCardType"
                            :key="getCardType"
                            alt=""
                            class="card-item__typeImg"
                          />
                        </transition>
                      </div>
                    </div>
                    <label for="cardNumber" class="card-item__number" ref="cardNumberLabel">
                      <template v-if="getCardType === 'amex'">
                        <span v-for="(n, $index) in amexCardMask" :key="$index">
                          <transition name="slide-fade-up">
                            <div
                              class="card-item__numberItem"
                              v-if="
                                $index > 4 &&
                                $index < 14 &&
                                cardNumber.length > $index &&
                                n.trim() !== ''
                              "
                            >
                              *
                            </div>
                            <div
                              class="card-item__numberItem"
                              :class="{ '-active': n.trim() === '' }"
                              v-else-if="cardNumber.length > $index"
                            >
                              {{ cardNumber[$index] }}
                            </div>
                            <div
                              class="card-item__numberItem"
                              :class="{ '-active': n.trim() === '' }"
                              v-else
                            >
                              {{ n }}
                            </div>
                          </transition>
                        </span>
                      </template>
                      <template v-else>
                        <span v-for="(n, $index) in otherCardMask" :key="$index">
                          <transition name="slide-fade-up">
                            <div
                              class="card-item__numberItem"
                              v-if="
                                $index > 4 &&
                                $index < 15 &&
                                cardNumber.length > $index &&
                                n.trim() !== ''
                              "
                            >
                              *
                            </div>
                            <div
                              class="card-item__numberItem"
                              :class="{ '-active': n.trim() === '' }"
                              v-else-if="cardNumber.length > $index"
                            >
                              {{ cardNumber[$index] }}
                            </div>
                            <div
                              class="card-item__numberItem"
                              :class="{ '-active': n.trim() === '' }"
                              v-else
                            >
                              {{ n }}
                            </div>
                          </transition>
                        </span>
                      </template>
                    </label>
                    <div class="card-item__content">
                      <label for="cardName" class="card-item__info" ref="cardNameLabel">
                        <div class="card-item__holder">{{ t('paymentPageV2.personName') }}</div>
                        <transition name="slide-fade-up">
                          <div class="card-item__name" v-if="cardName.length" key="1">
                            <transition-group name="slide-fade-right">
                              <span
                                class="card-item__nameItem"
                                v-for="(n, $index) in cardName.replace(/\s\s+/g, ' ')"
                                :key="$index + 1"
                                >{{ n }}</span
                              >
                            </transition-group>
                          </div>
                          <div class="card-item__name" v-else key="2">
                            {{ t('paymentPageV2.defaultName') }}
                          </div>
                        </transition>
                      </label>
                      <div class="card-item__date" ref="cardDate">
                        <label for="cardMonth" class="card-item__dateTitle">{{
                          t('paymentPageV2.expiryShort')
                        }}</label>
                        <label for="cardMonth" class="card-item__dateItem">
                          <transition name="slide-fade-up">
                            <span v-if="cardMonth" :key="cardMonth">{{ cardMonth }}</span>
                            <span v-else key="2">{{ t('paymentPageV2.monthShort') }}</span>
                          </transition>
                        </label>
                        /
                        <label for="cardYear" class="card-item__dateItem">
                          <transition name="slide-fade-up">
                            <span v-if="cardYear" :key="cardYear">{{
                              String(cardYear).slice(2, 4)
                            }}</span>
                            <span v-else key="2">{{ t('paymentPageV2.yearShort') }}</span>
                          </transition>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="card-item__side -back">
                  <div class="card-item__cover">
                    <img
                      :src="`https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/${currentCardBackground}.jpeg`"
                      class="card-item__bg"
                    />
                  </div>
                  <div class="card-item__band"></div>
                  <div class="card-item__cvv">
                    <div class="card-item__cvvTitle">{{ t('paymentPageV2.cvv') }}</div>
                    <div class="card-item__cvvBand">
                      <span v-for="(n, $index) in cardCvv" :key="$index">*</span>
                    </div>
                    <div class="card-item__type">
                      <img
                        :src="`https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/${getCardType}.png`"
                        v-if="getCardType"
                        class="card-item__typeImg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-form__inner">
              <div class="card-input">
                <label for="cardNumber" class="card-input__label">{{
                  t('paymentPageV2.cardNumber')
                }}</label>
                <input
                  type="text"
                  id="cardNumber"
                  class="card-input__input"
                  v-mask="generateCardNumberMask"
                  v-model="cardNumber"
                  @focus="focusInput"
                  @blur="blurInput"
                  data-ref="cardNumberLabel"
                  autocomplete="off"
                />
              </div>
              <div class="card-input">
                <label for="cardName" class="card-input__label">{{
                  t('paymentPageV2.personName')
                }}</label>
                <input
                  type="text"
                  id="cardName"
                  class="card-input__input"
                  v-model="cardName"
                  @focus="focusInput"
                  @blur="blurInput"
                  data-ref="cardNameLabel"
                  autocomplete="off"
                />
              </div>
              <div class="card-form__row">
                <div class="card-form__col">
                  <div class="card-form__group">
                    <label for="cardMonth" class="card-input__label">{{
                      t('paymentPageV2.expirationDate')
                    }}</label>
                    <select
                      class="card-input__input -select"
                      id="cardMonth"
                      v-model="cardMonth"
                      @focus="focusInput"
                      @blur="blurInput"
                      data-ref="cardDate"
                    >
                      <option value="" disabled selected>{{ t('paymentPageV2.month') }}</option>
                      <option
                        :value="n < 10 ? '0' + n : n"
                        v-for="n in 12"
                        :disabled="n < minCardMonth"
                        :key="n"
                      >
                        {{ n < 10 ? '0' + n : n }}
                      </option>
                    </select>
                    <select
                      class="card-input__input -select"
                      id="cardYear"
                      v-model="cardYear"
                      @focus="focusInput"
                      @blur="blurInput"
                      data-ref="cardDate"
                    >
                      <option value="" disabled selected>{{ t('paymentPageV2.year') }}</option>
                      <option :value="$index + minCardYear" v-for="(n, $index) in 12" :key="n">
                        {{ $index + minCardYear }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="card-form__col -cvv">
                  <div class="card-input">
                    <label for="cardCvv" class="card-input__label">{{
                      t('paymentPageV2.cvv')
                    }}</label>
                    <input
                      type="text"
                      class="card-input__input"
                      id="cardCvv"
                      maxlength="3"
                      v-model="cardCvv"
                      @focus="flipCard(true)"
                      @blur="flipCard(false)"
                      autocomplete="off"
                    />
                  </div>
                </div>
              </div>
              <button class="card-form__button" @click="processPayment">
                {{ t('paymentPageV2.submit') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useLayoutStore } from '@/stores/layout'
import { usePaymentStore } from '@/stores/payment'
import { useBuyingStore } from '@/stores/buying'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const buyingStore = useBuyingStore()

const paymentStore = usePaymentStore()

const layoutStore = useLayoutStore()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const showCoupon = ref(false)

const currentCardBackground = ref(Math.floor(Math.random() * 25 + 1))
const cardName = ref('')
const cardNumber = ref('')
const cardMonth = ref('')
const cardYear = ref('')
const cardCvv = ref('')
const minCardYear = new Date().getFullYear()
const amexCardMask = '#### ###### #####'
const otherCardMask = '#### #### #### ####'
const isCardFlipped = ref(false)
const focusElementStyle = ref(null)
const isInputFocused = ref(false)

const goToPackageList = () => {
  router.push('/buy/packagelist')
}

const paymentModel = ref({
  fullName: null,
  cardNumber: null,
  date: null,
  cvc: null,
  packageId: null,
  code: null
})

const processPayment = () => {
  layoutStore.setLoading(true)
  // Kart bilgilerini paymentModel'e yerleştir
  paymentModel.value.fullName = cardName.value
  paymentModel.value.cardNumber = cardNumber.value.replace(/\s+/g, '') // Boşlukları kaldır
  paymentModel.value.date = `${cardMonth.value}/${String(cardYear.value).slice(-2)}` // Yılın son iki basamağını al
  paymentModel.value.cvc = cardCvv.value
  paymentModel.value.coupon = cuponData.value.code
  paymentModel.value.packageId = route.params.id

  if (
    !paymentModel.value.fullName ||
    !paymentModel.value.cardNumber ||
    !paymentModel.value.date ||
    !paymentModel.value.cvc
  ) {
    toast.add({ severity: 'error', summary: 'Hata', detail: 'Tüm alanları doldurun.', life: 3000 })
    layoutStore.setLoading(false)
    return
  }

  if (paymentModel.value.cardNumber.length < 16) {
    toast.add({ severity: 'error', summary: 'Hata', detail: 'Geçersiz kart numarası.', life: 3000 })
    return
  }

  paymentStore
    .addPayment(paymentModel.value)
    .then((x) => {
      if (x.success && x.value?.status == 'İşlem Başarılı') {
        layoutStore.setLoading(false)
        window.location.href = x.value.threeDSecureUrl
      } else {
        layoutStore.setLoading(false)
      }
    })
    .catch((x) => {
      layoutStore.setLoading(false)
    })
}

onMounted(() => {
  fetchPackageData().then(() => {
    nextTick(() => {
      const cardNumberElement = document.getElementById('cardNumber')
      if (cardNumberElement) {
        cardNumberElement.focus()
      }
    })
  })
})

const loadingRef = ref(false)

const packageData = ref({
  id: null,
  name: '',
  description: '',
  detail: '',
  price: null,
  priceCurrency: '',
  smsCountGift: '',
  validityTotalDay: null,
  cloudRecording: false,
  cloudRecordingGbSize: null,
  sessionHours: null,
  sutdyRooms: false,
  logo: '',
  packageParentType: '',
  packageDiscountPrice: null
})

const cuponData = ref({
  code: '',
  packageId: null
})

const cuponAnswer = ref({
  trueFalse: '',
  discountedPrice: null,
  message: ''
})

const cuponAnswerDiscount = ref(false)

const checkCupon = async () => {
  cuponData.value.packageId = packageData.value.id // Atama operatörü kullanıldı

  layoutStore.setLoading(true)

  if (!cuponData.value.code) {
    cuponAnswer.value = {
      trueFalse: false,
      discountedPrice: null,
      message: 'Kupon alanı boş veya iptal edildi.'
    }
    cuponAnswerDiscount.value = false
    toast.add({
      severity: 'error',
      life: 3000,
      summary: 'Error',
      detail: cuponAnswer.value.message
    })
    layoutStore.setLoading(false)
    return
  }
  const response = await paymentStore.checkCupon(cuponData.value.code, cuponData.value.packageId)
  console.log('response:', response) // Debugging için response'un içeriğini loglayın

  // Gelen response'u kontrol ediyoruz ve uygun şekilde işliyoruz.
  if (response.success) {
    cuponAnswer.value = {
      trueFalse: response.trueFalse,
      discountedPrice: response.value.discountedPrice,
      message: response.message
    }

    if (response.value.trueFalse) {
      cuponAnswerDiscount.value = true
      toast.add({
        severity: 'success',
        life: 3000,
        summary: 'Başarılı',
        detail: response.message
      })
      layoutStore.setLoading(false)
    } else {
      toast.add({
        severity: 'error',
        life: 3000,
        summary: 'Error',
        detail: response.message
      })
      layoutStore.setLoading(false)
    }
  } else {
    toast.add({
      severity: 'error',
      life: 3000,
      summary: 'Error',
      detail: response.message
    })
    layoutStore.setLoading(false)
  }
}

const packageDataMessage = ref('')

const fetchPackageData = async () => {
  try {
    layoutStore.setLoading(true)
    const response = await paymentStore.getPAckageById(route.params.id)
    const userdata = await buyingStore.getUserPackage()
    if (response.success) {
      packageData.value = response.value
      packageDataMessage.value = response.message
      // if (userdata.success && userdata.value.id > packageData.value.packageParentType) {
      //   toast.add({ severity: 'error', life: 3000, summary: 'Error', detail: 'Paket düşürülemez.' })
      //   loadingRef.value = false
      //   layoutStore.setLoading(false)
      //   return
      // }
      loadingRef.value = true
      layoutStore.setLoading(false)
    } else {
      toast.add({ severity: 'error', life: 3000, summary: 'Error', detail: response.message })
      loadingRef.value = false
      layoutStore.setLoading(false)
    }
  } catch (error) {
    toast.add({ severity: 'error', life: 3000, summary: 'Error', detail: error.message })
    loadingRef.value = false
    layoutStore.setLoading(false)
  }
}

const getCardType = computed(() => {
  const number = cardNumber.value ? cardNumber.value.toString() : ''
  if (!number) return 'visa' // default type
  let re = new RegExp('^4')
  if (number.match(re)) return 'visa'

  re = new RegExp('^(34|37)')
  if (number.match(re)) return 'amex'

  re = new RegExp('^5[1-5]')
  if (number.match(re)) return 'mastercard'

  re = new RegExp('^6011')
  if (number.match(re)) return 'discover'

  re = new RegExp('^9792')
  if (number.match(re)) return 'troy'

  return 'visa' // default type
})

const generateCardNumberMask = computed(() => {
  return getCardType.value === 'amex' ? amexCardMask : otherCardMask
})

const minCardMonth = computed(() => {
  if (cardYear.value == minCardYear) return new Date().getMonth() + 1
  return 1
})

watch(cardYear, () => {
  if (cardMonth.value < minCardMonth.value) {
    cardMonth.value = ''
  }
})

const flipCard = (status) => {
  isCardFlipped.value = status
}

const focusInput = (e) => {
  isInputFocused.value = true
  const target = e.target
  focusElementStyle.value = {
    width: `${target.offsetWidth}px`,
    height: `${target.offsetHeight}px`,
    transform: `translateX(${target.offsetLeft}px) translateY(${target.offsetTop}px)`
  }
}

const blurInput = () => {
  setTimeout(() => {
    if (!isInputFocused.value) {
      focusElementStyle.value = null
    }
  }, 300)
  isInputFocused.value = false
}
</script>

<style scoped>
.flex-container {
  display: flex;
  justify-content: center; /* Yatayda ortalama */
  align-items: center; /* Dikeyde ortalama */
}

.price-container {
  border: 2px solid rgb(47, 0, 255); /* Kırmızı sınır */
  padding: 10px 20px; /* İçerik ile sınır arasına boşluk ekler */
  border-radius: 10px; /* Köşeleri yuvarlatır */
  background-color: #fff; /* Arka plan rengi */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Kutu gölgesi */
  transition: transform 0.3s ease; /* Hover efekti için geçiş süresi */
  font-size: 1.2em; /* Metin boyutunu artırır */
}

.price-container:hover {
  transform: scale(1.03); /* Hover efekti */
}

.price-container label {
  margin: 0 5px; /* Etiketler arasında boşluk */
}

.price-container .price-value {
  color: #ff0000; /* Fiyat rengini kırmızı yapar */
  font-weight: bold; /* Fiyatı kalın yapar */
}

.s {
  text-decoration: line-through;
}

.new-price {
  color: red;
  font-weight: bold;
  margin-left: 10px;
}
</style>
