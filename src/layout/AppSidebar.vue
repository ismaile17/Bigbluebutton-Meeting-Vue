<script setup>
import AppMenu from './AppMenu.vue'
import { computed } from 'vue'
import { useLayout } from '@/layout/composables/layout'

const { layoutState } = useLayout()

let timeout = null

const onMouseEnter = () => {
  if (!layoutState.anchored.value) {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    layoutState.sidebarActive.value = true
  }
}

const onMouseLeave = () => {
  if (!layoutState.anchored.value) {
    if (!timeout) {
      timeout = setTimeout(() => (layoutState.sidebarActive.value = false), 300)
    }
  }
}

const anchor = () => {
  layoutState.anchored.value = !layoutState.anchored.value
}

// Kullanıcı bilgilerini yerel depolamadan al
const user = JSON.parse(localStorage.getItem('user'));
const userRoles = user?.roles?.map(role => role.name) || [];

// Rol kontrol fonksiyonu (çoklu rol desteği)
const hasRole = (...roleNames) => {
    return roleNames.some(roleName => userRoles.includes(roleName));
};

// Computed property ile kullanıcının "Participant" olup olmadığını kontrol et
const isParticipant = computed(() => hasRole('Participant'));

// Kullanıcının rolüne göre rota belirleme
const userRoute = computed(() => {
  if (hasRole('Admin', 'Manager')) {
    return { name: 'homepage' }; // Admin veya Manager için rota
  } else if (hasRole('Participant')) {
    return { name: 'participant-homepage' }; // Participant için rota
  } else {
    return { name: 'errors' }; // Diğer kullanıcılar için varsayılan rota
  }
});
</script>



<template>
  <div v-if="!isParticipant" class="layout-sidebar" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
    <div class="sidebar-header">
      <router-link :to="userRoute" class="app-logo">
        <img src="/images/logo.png" alt="meeting2.me" style="width: 100%" />
      </router-link>
      <button
        class="layout-sidebar-anchor p-link z-2 mb-2"
        type="button"
        @click="anchor()"
      ></button>
    </div>
    <div class="layout-menu-container">
      <AppMenu />
    </div>
  </div>
</template>


<style lang="scss" scoped></style>
