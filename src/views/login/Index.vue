<!-- src/views/login/LoginPage.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'
import { useAuthStore } from '@/stores/auth'
import useNotification from '@/components/useNotification'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import OverlayPanel from 'primevue/overlaypanel'
import {useI18n} from "vue-i18n";

const { t } = useI18n()

const router = useRouter()
const layoutStore = useLayoutStore()
const authStore = useAuthStore()
const notification = useNotification()

// Active login type
const activeLogin = ref('creator') // 'creator' veya 'participant'

// Sayfa yüklendiğinde localStorage'dan login tipini ve dili okuyun
onMounted(() => {
  const savedLoginType = localStorage.getItem('activeLoginType')
  if (savedLoginType === 'creator' || savedLoginType === 'participant') {
    activeLogin.value = savedLoginType
    console.log(`Saved login type found: ${savedLoginType}`)
  } else {
    console.log('No saved login type found, defaulting to "creator"')
  }

  // localStorage'dan dil bilgisini oku
  const savedLanguage = localStorage.getItem('language')
  if (savedLanguage) {
    selectedLanguage.value = savedLanguage
    // Artık locale.value kullanılmıyor, dil ayarı i18n config tarafında yapılmalı.
  }
})

// Logo URL
const logoUrl = '/assets/logo.png'

// Login Model
const model = ref({
  email: '',
  password: '',
})

// Forgot Password Dialog
const showForgotPassword = ref(false)
const forgotPasswordEmail = ref('')

// Language Options
const languages = [
  { label: 'Türkçe', value: 'tr-TR' },
  { label: 'English', value: 'en-US' }
]
const selectedLanguage = ref(localStorage.getItem('language') || 'tr-TR') // Varsayılan dil Türkçe

// Dil değiştirme fonksiyonu
const changeLanguage = (lang) => {
  selectedLanguage.value = lang
  localStorage.setItem("language", lang)
  // Sayfayı yeniden yükle ki i18n konfigürasyonu main.js de localStorage'a göre yeniden yüklensin.
  window.location.reload()
}

// Login Method
const login = async () => {
  layoutStore.setLoading(true)
  try {
    let response
    if (activeLogin.value === 'creator') {
      response = await authStore.login(model.value.email, model.value.password)
      console.log('Attempting creator login with email:', model.value.email)
    } else {
      response = await authStore.loginParticipant(model.value.email, model.value.password)
      console.log('Attempting participant login with email:', model.value.email)
    }

    layoutStore.setLoading(false)

    if (response.success) {
      console.log('Login successful as:', activeLogin.value)
      localStorage.setItem('activeLoginType', activeLogin.value)
      console.log(`activeLoginType saved to localStorage: ${activeLogin.value}`)
      router.push({ name: 'homepage' })
    } else {
      console.log('Login failed:', response.message)
      notification.showError(response.message)
    }
  } catch (error) {
    layoutStore.setLoading(false)
    console.log('Login error:', error.message || 'Yanlış erişim reddedildi.')
    notification.showError(error.message || 'Yanlış erişim reddedildi.')
  }
}

// Forgot Password Method
const forgotPassword = async () => {
  layoutStore.setLoading(true)
  try {
    let response
    if (activeLogin.value === 'creator') {
      response = await authStore.creatorForgotPassword(forgotPasswordEmail.value)
      console.log('Attempting creator forgot password for email:', forgotPasswordEmail.value)
    } else {
      response = await authStore.participantForgotPassword(forgotPasswordEmail.value)
      console.log('Attempting participant forgot password for email:', forgotPasswordEmail.value)
    }
    layoutStore.setLoading(false)
    if (response.success) {
      console.log('Forgot password successful.')
      notification.showSuccess(t('loginIndex.password_reset_sent'))
      showForgotPassword.value = false
      forgotPasswordEmail.value = ''
    } else {
      console.log('Forgot password failed:', response.message)
      notification.showError(response.message)
    }
  } catch (error) {
    layoutStore.setLoading(false)
    console.log('Forgot password error:', error.message || 'Could not process your request.')
    notification.showError(error.message || 'Could not process your request.')
  }
}

// Kayıt ol butonuna tıklanınca yapılacaklar
const register = () => {
  const lang = selectedLanguage.value.split('-')[0]; // Örneğin: 'tr-TR' -> 'tr'
  const targetUrl = `https://toplantisaati.com/${lang}/signup`; // Hedef URL
  window.location.href = targetUrl; // Yönlendirme işlemi
};


</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Üst Kısım: Dil Seçimi -->
      <div class="top-bar">
        <Button :label="t('dashboard.back')" icon="pi pi-arrow-left" @click="router.go(-1)" />

        <div class="language-selector">
          <button class="language-button" @click="$refs.langMenu.toggle($event)">
            {{ selectedLanguage.toUpperCase() }}
          </button>
          <OverlayPanel ref="langMenu">
            <div class="language-menu">
              <button
                v-for="lang in languages"
                :key="lang.value"
                class="language-option"
                @click="changeLanguage(lang.value); $refs.langMenu.hide()"
              >
                {{ lang.label }}
              </button>
            </div>
          </OverlayPanel>
        </div>
        <!-- Diğer butonlarınızı burada ekleyebilirsiniz -->
      </div>

      <!-- Logo -->
      <img src="/images/logo.png" alt="Logo" class="logo" />

      <!-- Switch Buttons -->
      <div class="switch-buttons">
        <button
          :class="[
            'switch-button',
            activeLogin === 'creator' ? 'active-button' : 'inactive-button'
          ]"
          @click="activeLogin = 'creator'"
        >
          {{ t('loginIndex.creator_login') }}
        </button>
        <button
          :class="[
            'switch-button',
            activeLogin === 'participant' ? 'active-button' : 'inactive-button'
          ]"
          @click="activeLogin = 'participant'"
        >
          {{ t('loginIndex.participant_login') }}
        </button>
      </div>

      <!-- Login Form -->
      <div :class="['login-form', activeLogin]">
        <div class="form-title">
          {{ activeLogin === 'creator' ? t('loginIndex.creator_login') : t('loginIndex.participant_login') }}
        </div>
        <div class="form-fields">
          <span class="p-input-icon-left w-full mb-3">
            <i class="pi pi-envelope"></i>
            <InputText
              type="email"
              :placeholder="t('loginIndex.email')"
              v-model="model.email"
              class="w-full"
            />
          </span>
          <span class="p-input-icon-left w-full mb-3">
            <i class="pi pi-lock"></i>
            <InputText
              type="password"
              :placeholder="t('loginIndex.password')"
              v-model="model.password"
              class="w-full"
            />
          </span>

          <!-- Forgot password ve register aynı hizada -->
          <div class="actions-line">
            <a href="#" class="forgot-password-link" @click.prevent="showForgotPassword = true">
              {{ t('loginIndex.forgot_password') }}
            </a>
            <span class="divider">|</span>
            <a href="#" class="register-link" @click.prevent="register">
              {{ t('loginIndex.register') }}
            </a>
          </div>

          <Button :label="t('loginIndex.login_button')" class="w-full mt-3" @click="login" />
        </div>
      </div>
    </div>

    <!-- Forgot Password Dialog -->
    <Dialog
      v-model:visible="showForgotPassword"
      :header="activeLogin === 'creator' ? t('loginIndex.creator_forgot_password') : t('loginIndex.participant_forgot_password')"
      modal
      class="forgot-password-dialog"
    >
      <div class="p-fluid">
        <div class="field">
          <label for="forgotEmail">{{ t('loginIndex.email') }}</label>
          <InputText id="forgotEmail" v-model="forgotPasswordEmail" type="email" />
        </div>
        <div class="flex justify-content-end mt-4">
          <Button :label="t('loginIndex.cancel')" rounded text class="p-button-text" @click="showForgotPassword = false" />
          <Button :label="t('loginIndex.submit')" rounded text @click="forgotPassword" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
/* Mevcut stilleriniz */
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #4e97db;
  overflow: hidden;
}

.login-page::before {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(255, 217, 0, 0.616) 100%, rgba(255, 165, 0, 0) 40%);
  border-radius: 50%;
  bottom: -150px;
  right: -150px;
  filter: blur(100px);
  z-index: 0;
}

.login-container {
  background: #fff;
  padding: 2rem;
  border-radius: 10px;
  width: 100%;
  max-width: 460px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

/* Top Bar */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.language-selector {
  position: relative;
}

.language-button {
  background: none;
  border: none;
  color: #0a74da;
  font-weight: bold;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
  text-decoration: underline;
}

.language-menu {
  display: flex;
  flex-direction: column;
  background: #fff;
}

.language-option {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  text-align: left;
  cursor: pointer;
  color: #333;
  width: 100%;
}
.language-option:hover {
  background: #efefef;
}

.register-button {
  background: none;
  border: none;
  color: #0a74da;
  font-weight: bold;
  cursor: pointer;
  font-size: 0.9rem;
  transition: color 0.3s;
}

.register-button:hover {
  color: #ffa500;
}

/* Logo */
.logo {
  max-width: 150px;
  margin-bottom: 1.5rem;
}

/* Switch Buttons */
.switch-buttons {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.switch-button {
  background: none;
  border: none;
  margin: 0 1rem;
  padding-bottom: 0.5rem;
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  cursor: pointer;
  position: relative;
  transition: color 0.3s, transform 0.3s, opacity 0.3s;
}

.switch-button::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -5px;
  transform: translateX(-50%);
  height: 3px;
  width: 0;
  background-color: #0a74da;
  border-radius: 2px;
  transition: width 0.3s;
}

.switch-button.active::after,
.switch-button:hover::after {
  width: 100%;
}

.switch-button.active {
  color: #0a74da;
}

.switch-button:hover {
  color: #ffa500;
}

.inactive-button {
  transform: scale(0.6);
  opacity: 0.7;
}

.active-button {
  transform: scale(1);
  opacity: 1;
}

/* Login Form */
.login-form {
  padding: 1.5rem;
  border-radius: 8px;
}

.login-form.creator {
  background-color: rgba(10, 116, 218, 0.05);
}

.login-form.participant {
  background-color: rgba(255, 165, 0, 0.05);
}

.form-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #0a74da;
  margin-bottom: 1rem;
}

.form-fields {
  text-align: left;
}

.p-input-icon-left .pi {
  color: #0a74da;
}

/* Forgot Password & Register aynı hizaya alınması */
.actions-line {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 0.5rem;
  margin-top: 0.5rem;
}

.forgot-password-link, .register-link {
  font-size: 0.9rem;
  color: #0a74da;
  text-decoration: none;
  margin-left: 0.5rem;
}

.forgot-password-link:hover,
.register-link:hover {
  text-decoration: underline;
  color: #ffa500;
}

.divider {
  margin: 0 0.5rem;
  color: #999;
}

/* Buttons */
.p-button {
  background-color: #0a74da !important;
  border-color: #0a74da !important;
  color: #fff !important;
  transition: background-color 0.3s, border-color 0.3s;
}

.p-button:hover {
  background-color: #ffa500 !important;
  border-color: #ffa500 !important;
}

/* Forgot Password Dialog */
.forgot-password-dialog .p-dialog-header {
  background-color: #0a74da;
  color: #fff;
}

.forgot-password-dialog .p-button {
  background-color: #0a74da !important;
  border-color: #0a74da !important;
}

.w-full {
  width: 100%;
}

.mb-3 {
  margin-bottom: 1rem;
}

.mt-3 {
  margin-top: 1rem;
}

.mt-4 {
  margin-top: 1.5rem;
}
</style>
