<script setup>
import { ref, watch, computed } from 'vue'
import { usePrimeVue } from 'primevue/config'
import RadioButton from 'primevue/radiobutton'
import Button from 'primevue/button'
import InputSwitch from 'primevue/inputswitch'
import Sidebar from 'primevue/sidebar'
import { useLayout } from '@/layout/composables/layout'

defineProps({
  simple: {
    type: Boolean,
    default: false
  }
})

const $primevue = usePrimeVue()
const rippleActive = computed(() => $primevue.config.ripple)
const inputStyle = computed(() => $primevue.config.inputStyle)

const { setScale, layoutConfig, layoutState, onConfigSidebarToggle } = useLayout()
const colorScheme = ref(layoutConfig.colorScheme.value)
const componentThemes = ref([
  { name: 'indigo', color: '#6366F1' },
  { name: 'blue', color: '#3B82F6' },
  { name: 'purple', color: '#8B5CF6' },
  { name: 'teal', color: '#14B8A6' },
  { name: 'cyan', color: '#06b6d4' },
  { name: 'green', color: '#10b981' },
  { name: 'orange', color: '#f59e0b' },
  { name: 'pink', color: '#d946ef' }
])
const scales = ref([12, 13, 14, 15, 16])

watch(layoutConfig.menuMode, (newVal) => {
  if (newVal === 'static') {
    layoutState.staticMenuDesktopInactive.value = false
  }
})

const onConfigButtonClick = () => {
  onConfigSidebarToggle()
}
const changeColorScheme = (colorScheme) => {
  const themeLink = document.getElementById('theme-link')
  const themeLinkHref = themeLink.getAttribute('href')
  const currentColorScheme = 'theme-' + layoutConfig.colorScheme.value.toString()
  const newColorScheme = 'theme-' + colorScheme
  const newHref = themeLinkHref.replace(currentColorScheme, newColorScheme)

  replaceLink(themeLink, newHref, () => {
    layoutConfig.colorScheme.value = colorScheme
  })
}
const changeTheme = (theme) => {
  const themeLink = document.getElementById('theme-link')
  const themeHref = themeLink.getAttribute('href')
  const newHref = themeHref.replace(layoutConfig.theme.value, theme)

  replaceLink(themeLink, newHref, () => {
    layoutConfig.theme.value = theme
  })
}
const replaceLink = (linkElement, href, onComplete) => {
  if (!linkElement || !href) {
    return
  }

  const id = linkElement.getAttribute('id')
  const cloneLinkElement = linkElement.cloneNode(true)

  cloneLinkElement.setAttribute('href', href)
  cloneLinkElement.setAttribute('id', id + '-clone')

  linkElement.parentNode.insertBefore(cloneLinkElement, linkElement.nextSibling)

  cloneLinkElement.addEventListener('load', () => {
    linkElement.remove()

    const element = document.getElementById(id) // re-check
    element && element.remove()

    cloneLinkElement.setAttribute('id', id)
    onComplete && onComplete()
  })
}
const decrementScale = () => {
  setScale(layoutConfig.scale.value - 1)
  applyScale()
}
const incrementScale = () => {
  setScale(layoutConfig.scale.value + 1)
  applyScale()
}
const applyScale = () => {
  document.documentElement.style.fontSize = layoutConfig.scale.value + 'px'
}
const onInputStyleChange = (value) => {
  $primevue.config.inputStyle = value
}
const onRippleChange = (value) => {
  $primevue.config.ripple = value
}
</script>

<template></template>

<style lang="scss" scoped></style>
