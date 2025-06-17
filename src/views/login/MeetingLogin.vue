<!-- src/views/login/MeetingLogin.vue -->
<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import useNotification from '@/components/useNotification'
import { useLayoutStore } from '@/stores/layout'
import { useAuthStore } from '@/stores/auth'
import {useI18n} from "vue-i18n";

const {t,te} = useI18n();

const notification = useNotification()
const layoutStore = useLayoutStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Active view state
const activeView = ref('user') // 'user' or 'guest'

const showTermsDialogKosul = ref(false)
// Onay Kutuları
const acceptTerms = ref(false)
const acceptRecording = ref(false)


// User Login Model
const model = ref({
  email: '',
  password: '',
})

// Guest Login Model
const guest = ref({
  fullName: '',
})

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

// Common Meeting ID
const meetingId = ref('') // Assume this is fetched or set elsewhere

// Guest Meeting State
const isMeetingStarted = ref(false)

// Refresh button state
const countdown = ref(0)
const isRefreshDisabled = ref(false)
let countdownInterval = null

// Check if user is logged in
const isUserLoggedIn = computed(() => !!authStore.user?.accessToken)

// Get user's full name
const userFullName = computed(() => {
  const fullName = authStore.user?.fullName || t('meetingLogin.default_user');
  return fullName.replace('_PARTICIPANT', '');
});

// Methods

// User Login
const userLogin = async () => {
  layoutStore.setLoading(true)
  try {
    const response = await authStore.loginParticipant(model.value.email, model.value.password)
    layoutStore.setLoading(false)
    if (response.success) {
      localStorage.setItem('activeLoginType', 'participant')
    } else {
      notification.showError(response.message || t('meetingLogin.login_failed'))
    }
  } catch (error) {
    layoutStore.setLoading(false)
    notification.showError(error.message || t('meetingLogin.login_error'))
  }
}

// Guest Login (Join Meeting)
// Misafir Girişi (Toplantıya Katıl)
const guestLogin = async () => {
  
  if (!isMeetingStarted.value) {
    notification.showInfo(t('meetingLogin.meeting_not_started'))
    return
  }

  if (guestPolicy.value === 'ALWAYS_DENY') {
    notification.showError(t('meetingLogin.guest_access_denied'))
    return
  }

  if (!guest.value.fullName) {
    notification.showError(t('meetingLogin.enter_name'))
    return
  }

  if (!acceptTerms.value || !acceptRecording.value) {
    notification.showError(t('meetingLogin.accept_terms_required'))
    return
  }

  layoutStore.setLoading(true)
  try {
    const response = await authStore.guestLogin(meetingId.value, guest.value.fullName)
    layoutStore.setLoading(false)
    if (response.success) {
      router.push({ name: 'meeting-room', params: { id: meetingId.value } })
    } else {
      notification.showError(response.message || t('meetingLogin.meeting_join_error'))
    }
  } catch (error) {
    layoutStore.setLoading(false)
    notification.showError(error.message || t('meetingLogin.meeting_join_error'))
  }
}

const guestPolicy = ref('')

// Toplantı Durumunu Yenile
const refreshMeetingStatus = async () => {
  if (isRefreshDisabled.value) return

  if (guestPolicy.value === 'ALWAYS_DENY' && !isUserLoggedIn.value) {
    notification.showError(t('meetingLogin.guest_access_denied'))
    return
  }

  isRefreshDisabled.value = true
  layoutStore.setLoading(true)

  try {
    const response = await authStore.getCompletedLoginMeeting(meetingId.value)
    layoutStore.setLoading(false)
    if (response.success) {
      const meetingData = response.value
      isMeetingStarted.value = meetingData.createStartOrFinish === 2
      guestPolicy.value = meetingData.guestPolicy

      if (isMeetingStarted.value) {
        notification.showSuccess(t('meetingLogin.meeting_started'))
      } else {
        notification.showInfo(t('meetingLogin.meeting_not_started'))
      }
    } else {
      notification.showError(response.message || t('meetingLogin.meeting_status_error'))
    }

    countdown.value = 9
    countdownInterval = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownInterval)
        isRefreshDisabled.value = false
      }
    }, 1000)
  } catch (error) {
    layoutStore.setLoading(false)
    notification.showError(error.message || t('meetingLogin.meeting_status_error'))
    isRefreshDisabled.value = false
  }
}

// Anasayfaya Git
const goToHomepage = () => {
  router.push({ name: 'homepage' })
}

// Çıkış Yap
const logout = () => {
  authStore.logout()
  router.push('/login')
}

// Check if the user is already authenticated and stay on the page
const checkAuthentication = () => {
  const token = authStore.user?.accessToken || localStorage.getItem('token')
  // Do not redirect; stay on the page
}

// Helper function to check if the token has expired
function isTokenExpired(token) {
  if (!token) return true

  const payload = JSON.parse(atob(token.split('.')[1]))
  const exp = payload.exp
  const now = Math.floor(Date.now() / 1000)

  return exp < now
}

// Watcher for route parameter ID changes
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      meetingId.value = newId
    }
  },
  { immediate: true }
)

// Clear interval on component unmount
onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})

// Bileşen yüklendiğinde toplantı bilgilerini çek
onMounted(async () => {
  checkAuthentication()
  if (route.params.id) {
    meetingId.value = route.params.id

    layoutStore.setLoading(true)
    try {
      const response = await authStore.getCompletedLoginMeeting(meetingId.value)
      layoutStore.setLoading(false)
      if (response.success) {
        const meetingData = response.value
        isMeetingStarted.value = meetingData.createStartOrFinish === 2
        guestPolicy.value = meetingData.guestPolicy

        if (guestPolicy.value === 'ALWAYS_DENY' && !isUserLoggedIn.value) {
          notification.showError(t('meetingLogin.guest_access_denied'))
        }
      } else {
        notification.showError(response.message || t('meetingLogin.meeting_fetch_error'))
      }
    } catch (error) {
      layoutStore.setLoading(false)
      notification.showError(error.message || t('meetingLogin.meeting_fetch_error'))
    }
  }
})

const arrowLeft = ref('10.3%');   
const messageLeft = ref('10.3%');
const showPermissionReminder = ref(true)


</script>

<template>

  <div class="permission-reminder" v-if="showPermissionReminder">
    <div
      class="arrow"
      :style="{ left: arrowLeft }"
    ></div>

    <div
      class="message"
      :style="{ left: messageLeft }"
    >
      <div class="text">
        {{ t('meetingLogin.permission_reminder') }}
      </div>
      <button class="close-button" @click="showPermissionReminder = false">&times;</button>
    </div>
  </div>

  <div class="login-page">

    <img src="/images/logo.png" alt="Logo" class="logo" />

    <div class="login-container">

      <div class="top-bar">
        <Button :label="t('dashboard.back')" icon="pi pi-arrow-left" @click="router.go(-1)" text rounded />

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

      <div class="top-nav" v-if="isUserLoggedIn">
        <span class="left-link">
          <a href="#" @click.prevent="goToHomepage">{{ t('meetingLogin.homepage') }}</a>
        </span>
        <span class="right-link">
          <a href="#" @click.prevent="logout">{{ t('meetingLogin.logout') }}</a>
        </span>
      </div>

      <!-- Common Title -->
      <h2 class="form-title">{{ t('meetingLogin.join_meeting') }}</h2>

      <!-- Meeting ID Displayed as Text -->
      <div class="meeting-id">
        <small>{{ meetingId }}</small>
      </div>

      <!-- User Logged In View -->
      <div v-if="isUserLoggedIn">
        <p>{{ t('meetingLogin.welcome_user') }}, {{ userFullName }}</p>
        <small>{{ t('meetingLogin.check_meeting_status') }}</small>
        <hr class="my-5">
        <div class="button-group">
          <div class="refresh-container">
            <Button
              v-if="!isRefreshDisabled"
              icon="pi pi-refresh"
              class="p-button-rounded p-button-text refresh-button"
              :aria-label="t('meetingLogin.refresh')"
              @click="refreshMeetingStatus"
            ></Button>
            <div v-else class="countdown">{{ countdown }}</div>
          </div>
          <Button
            :label="t('meetingLogin.join_meeting')"
            class="join-button"
            :disabled="!isMeetingStarted"
            @click="guestLogin"
          ></Button>
        </div>
        <div v-if="!isMeetingStarted && !isRefreshDisabled" class="mt-2"></div>
      </div>

      <!-- User Not Logged In View -->
      <div v-else>
        <!-- Switch Buttons -->
        <div class="switch-buttons">
          <button
            :class="['switch-button', { active: activeView === 'user' }]"
            @click="activeView = 'user'"
          >
            {{ t('meetingLogin.participant_login') }}
          </button>
          <button
            :class="['switch-button', { active: activeView === 'guest' }]"
            @click="activeView = 'guest'"
          >
            {{ t('meetingLogin.guest_login') }}
          </button>
        </div>

        <!-- User Login Form -->
        <div v-if="activeView === 'user'" class="login-form">
          <div class="form-fields">
            <span class="p-input-icon-left w-full mb-4">
              <i class="pi pi-envelope"></i>
              <InputText
                id="email"
                type="email"
                class="w-full"
                :placeholder="t('meetingLogin.email')"
                v-model="model.email"
              />
            </span>
            <span class="p-input-icon-left w-full mb-4">
              <i class="pi pi-lock"></i>
              <InputText
                id="password"
                type="password"
                class="w-full"
                v-model="model.password"
                :placeholder="t('meetingLogin.password')"
              />
            </span>
            <Button :label="t('meetingLogin.login_button')" class="w-full" @click="userLogin"></Button>
          </div>
        </div>

        <!-- Guest Login Form -->
        <div v-if="activeView === 'guest'" class="guest-form">
          <div v-if="guestPolicy === 'ALWAYS_DENY'">
              <p>{{ t('meetingLogin.guest_access_denied') }}</p>
          </div>
          <div class="form-fields" v-if="guestPolicy != 'ALWAYS_DENY'">
            <span class="p-input-icon-left w-full mb-4">
              <i class="pi pi-user"></i>
              <InputText
                id="fullName"
                type="text"
                class="w-full"
                :placeholder="t('meetingLogin.full_name')"
                v-model="guest.fullName"
                :disabled="!isMeetingStarted"
              />
            </span>
            <div class="button-group">
              <div class="refresh-container">
                <Button
                  v-if="!isRefreshDisabled"
                  icon="pi pi-refresh"
                  class="p-button-rounded p-button-text refresh-button"
                  :aria-label="t('meetingLogin.refresh')"
                  @click="refreshMeetingStatus"
                ></Button>
                <div v-else class="countdown">{{ countdown }}</div>
              </div>
              <Button
                :label="t('meetingLogin.join_meeting')"
                class="join-button"
                :disabled="!isMeetingStarted || !acceptTerms || !acceptRecording"
                @click="guestLogin"
              ></Button>
            </div>
            <div v-if="!isMeetingStarted && !isRefreshDisabled" class="mt-2"></div>
          </div>
        </div>

      </div>

      <!-- Onay Kutuları -->
      <div class="checkbox-group" v-if="(activeView === 'guest' && guestPolicy != 'ALWAYS_DENY') || isUserLoggedIn ">
        <hr class="my-5">
        <div class="checkbox-item">
          <Checkbox id="acceptTerms" name="acceptTerms" value="acceptTerms" v-model="acceptTerms" />
          <label id="acceptTerms" @click="showTermsDialogKosul = true">
            {{ t('meetingLogin.accept_terms') }}
          </label>
        </div>
        <div class="checkbox-item">
          <Checkbox id="acceptRecording" name="acceptRecording" value="acceptRecording" v-model="acceptRecording" />
          <label id="acceptRecording">
            {{ t('meetingLogin.accept_recording') }}
          </label>
        </div>
      </div>

      <!-- Moderator Login Link -->
      <div class="moderator-login" v-if="!isUserLoggedIn">
        <router-link to="/login">{{ t('meetingLogin.creator_login') }}</router-link>
      </div>
    </div>

    <!-- Kullanım Koşulları Dialog -->
    <Dialog :style="{ width: '650px' }"
      v-model:visible="showTermsDialogKosul" 
      :header="t('terms.header')" 
      :modal="true" 
      :closable="true"
    >
      <div v-html="t('terms.content')"></div>
    </Dialog>
  </div>
</template>

<style scoped>
/* Mevcut CSS aynen korunmuştur. */

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




.permission-reminder {
  position: fixed;
  text-align: center;
  top: 10px;
  width: 100%;
  pointer-events: none;
  z-index: 1000;
}

.permission-reminder .arrow {
  position: absolute;
  top: 0;
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-bottom: 20px solid #fff;
}

.permission-reminder .message {
  position: absolute;
  top: 25px;
  font-size: 0.9rem;
  color: #fff;
  background: rgba(0, 0, 0, 0.7);
  padding: 5px 10px;
  border-radius: 5px;
  max-width: 250px;
  word-wrap: break-word;
  pointer-events: auto;
}

.permission-reminder .message .text {
  flex: 1;
}

.permission-reminder .message .close-button {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  margin-left: 5px;
}

.permission-reminder .message .close-button:hover {
  color: #ccc;
}

.checkbox-item label {
  font-size: 0.875rem;
}
.checkbox-group {
  margin-top: 1rem;
  text-align: left;
}

.checkbox-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.checkbox-item label {
  margin-left: 0.5rem;
  color: #0a74da;
  cursor: pointer;
}

.checkbox-item label:hover {
  text-decoration: underline;
}

.login-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;    
  justify-content: center; 
  background: linear-gradient(135deg, #0a74da 0%, #a1c4fd 100%);
}

.login-container {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 10px;
  width: 100%;
  max-width: 450px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.logo {
  max-width: 150px;
  margin: 0 auto 1rem auto;
  display: block;
}

.form-title {
  margin-bottom: 1rem;
  color: #0a74da;
  font-size: 2rem;
  font-weight: bold;
}

.meeting-id {
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: #333;
}

.meeting-id strong {
  color: #0a74da;
}

.switch-buttons {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
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
  transition: color 0.3s;
}

.switch-button::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  width: 0;
  background-color: #0a74da;
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

.moderator-login {
  margin-top: 1.5rem;
  text-align: right;
}

.moderator-login a {
  color: #ffa500;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s;
}

.moderator-login a:hover {
  color: #0a74da;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.left-link a,
.right-link a {
  color: #0a74da;
  text-decoration: none;
  font-weight: bold;
}

.left-link a:hover,
.right-link a:hover {
  color: #ffa500;
}

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

.p-button:disabled {
  background-color: #a1c4e6 !important;
  border-color: #a1c4e6 !important;
}

.button-group {
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-container {
  width: 40px;
  height: 40px;
  background-color: #ffa500;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.5rem;
}

.refresh-button .pi {
  font-size: 1.5rem;
  color: #0a74da !important;
}

.countdown {
  font-size: 1.5rem;
  color: #0a74da;
}

.join-button {
  flex: 1;
}

.p-inputtext {
  border-color: #ccc;
}

.p-inputtext:focus {
  border-color: #0a74da;
  box-shadow: 0 0 5px rgba(10, 116, 218, 0.5);
}

.p-input-icon-left .pi {
  color: #0a74da;
}

.w-full {
  width: 100%;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}
</style>
