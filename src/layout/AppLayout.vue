<script setup>
import { computed, watch, ref, onBeforeUnmount } from 'vue'
import { usePrimeVue } from 'primevue/config'
import AppTopbar from './AppTopbar.vue'
import AppSidebar from './AppSidebar.vue'
import AppConfig from './AppConfig.vue'
import AppProfileSidebar from './AppProfileSidebar.vue'
import AppBreadCrumb from './AppBreadcrumb.vue'
import { useLayout } from '@/layout/composables/layout'
import { useLayoutStore } from '@/stores/layout'
const layout = useLayoutStore()
const $primevue = usePrimeVue()
const { layoutConfig, layoutState, isSidebarActive } = useLayout()
const outsideClickListener = ref(null)
const sidebarRef = ref(null)
const topbarRef = ref(null)

watch(isSidebarActive, (newVal) => {
  if (newVal) {
    bindOutsideClickListener()
  } else {
    unbindOutsideClickListener()
  }
})

onBeforeUnmount(() => {
  unbindOutsideClickListener()
})

const containerClass = computed(() => {
  return {
    'layout-light': layoutConfig.colorScheme.value === 'light',
    'layout-dim': layoutConfig.colorScheme.value === 'dim',
    'layout-dark': layoutConfig.colorScheme.value === 'dark',
    'layout-colorscheme-menu': layoutConfig.menuTheme.value === 'colorScheme',
    'layout-primarycolor-menu': layoutConfig.menuTheme.value === 'primaryColor',
    'layout-transparent-menu': layoutConfig.menuTheme.value === 'transparent',
    'layout-overlay': layoutConfig.menuMode.value === 'overlay',
    'layout-static': layoutConfig.menuMode.value === 'static',
    'layout-slim': layoutConfig.menuMode.value === 'slim',
    'layout-slim-plus': layoutConfig.menuMode.value === 'slim-plus',
    'layout-horizontal': layoutConfig.menuMode.value === 'horizontal',
    'layout-reveal': layoutConfig.menuMode.value === 'reveal',
    'layout-drawer': layoutConfig.menuMode.value === 'drawer',
    'layout-static-inactive':
      layoutState.staticMenuDesktopInactive.value && layoutConfig.menuMode.value === 'static',
    'layout-overlay-active': layoutState.overlayMenuActive.value,
    'layout-mobile-active': layoutState.staticMenuMobileActive.value,
    'p-input-filled': $primevue.config.inputStyle === 'filled',
    'p-ripple-disabled': $primevue.config.ripple === false,
    'layout-sidebar-active': layoutState.sidebarActive.value,
    'layout-sidebar-anchored': layoutState.anchored.value
  }
})

const bindOutsideClickListener = () => {
  if (!outsideClickListener.value) {
    outsideClickListener.value = (event) => {
      if (isOutsideClicked(event)) {
        layoutState.overlayMenuActive.value = false
        layoutState.overlaySubmenuActive.value = false
        layoutState.staticMenuMobileActive.value = false
        layoutState.menuHoverActive.value = false
      }
    }
    document.addEventListener('click', outsideClickListener.value)
  }
}
const unbindOutsideClickListener = () => {
  if (outsideClickListener.value) {
    document.removeEventListener('click', outsideClickListener)
    outsideClickListener.value = null
  }
}
const isOutsideClicked = (event) => {
  const sidebarEl = sidebarRef?.value.$el
  const topbarEl = topbarRef?.value.$el.querySelector('.topbar-menubutton')

  return !(
    sidebarEl.isSameNode(event.target) ||
    sidebarEl.contains(event.target) ||
    topbarEl.isSameNode(event.target) ||
    topbarEl.contains(event.target)
  )
}
</script>

<template>
  <div
    class="overlay"
    v-if="layout.loading"
    :style="layout.loading ? 'display:block' : 'display:none'"
  >
    <img
      src="./../assets/images/logo-animated.gif"
      style="position: absolute; margin: auto; top: 0; left: 0; right: 0; bottom: 0; width: 300px"
    />
  </div>
  <div :class="['layout-container', { ...containerClass }]">
    <AppSidebar ref="sidebarRef" />

    <div class="layout-content-wrapper">
      <AppTopbar ref="topbarRef" />
      <AppBreadCrumb class="content-breadcrumb"></AppBreadCrumb>
      <div class="layout-content">
        <router-view></router-view>
      </div>
    </div>

    <AppProfileSidebar />
    <AppConfig />

    <Toast></Toast>
    <div class="layout-mask"></div>
  </div>
</template>

<style lang="scss">
/* whatsapp butonu css*/
.float {
  position: fixed;
  width: 60px;
  height: 60px;
  bottom: 10px;
  right: 40px;
  background-color: #25d366;
  color: #fff;
  border-radius: 50px;
  text-align: center;
  font-size: 30px;
  box-shadow: 2px 2px 3px #999;
  z-index: 100;
}

.my-float {
  margin-top: 16px;
}
/* whatsapp butonu css*/

.overlay {
  position: fixed; /* Sit on top of the page content */
  width: 100%; /* Full width (cover the whole page) */
  height: 100%; /* Full height (cover the whole page) */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5); /* Black background with opacity */
  z-index: 9999999; /* Specify a stack order in case you're using a different order for other elements */
}
.loading {
  width: 160px;
  height: 160px;
  border-radius: 150px;
  border: 15px solid #fff;
  border-top-color: rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -80px;
  margin-left: -80px;
  animation: loading 1.2s linear infinite;
  -webkit-animation: loading 1.2s linear infinite;
  z-index: 9999;
}
@keyframes loading {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
@-webkit-keyframes loading {
  0% {
    -webkit-transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
  }
}

.overlay > img {
  position: relative;
  margin: 75px auto;
  display: block;
  animation: pulse 1.5s infinite ease-in-out;
  animation-fill-mode: both;
  &:before {
    content: '';
    position: absolute;
    border-style: solid;
    border-width: 0 40px 60px 40px;
    top: -40px;
    left: 10px;
  }
}

.overlay img {
  animation-delay: 0.25s;
}

@keyframes pulse {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
