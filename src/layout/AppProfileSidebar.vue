<script setup>

import { useLayout } from '@/layout/composables/layout'

const { layoutState } = useLayout()

import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth'
import { ref, watch, computed } from 'vue';
import { usePrimeVue } from 'primevue/config';
import RadioButton from 'primevue/radiobutton';
import Button from 'primevue/button';
import Sidebar from 'primevue/sidebar';
import {useI18n} from "vue-i18n";
const {t,te} = useI18n();

const { setScale } = useLayout();

const decrementScale = () => {
    setScale(layoutConfig.scale.value - 1);
    applyScale();
};
const incrementScale = () => {
    setScale(layoutConfig.scale.value + 1);
    applyScale();
};
const applyScale = () => {
    document.documentElement.style.fontSize = layoutConfig.scale.value + 'px';
};

const authStore = useAuthStore()

const router = useRouter();

const navigateToDetailSetting = () => {
      router.push('/authorization/detailsetting');
    };

defineProps({
    simple: {
        type: Boolean,
        default: false
    }
});

const $primevue = usePrimeVue();

const { layoutConfig } = useLayout();
const colorScheme = ref(layoutConfig.colorScheme.value);
const componentThemes = ref([
    { name: 'indigo', color: '#6366F1' },
    { name: 'blue', color: '#3B82F6' },
    { name: 'purple', color: '#8B5CF6' },
    { name: 'teal', color: '#14B8A6' },
    { name: 'cyan', color: '#06b6d4' },
    { name: 'green', color: '#10b981' },
    { name: 'orange', color: '#f59e0b' },
    { name: 'pink', color: '#d946ef' }
]);
const scales = ref([12, 13, 14, 15, 16]);

watch(layoutConfig.menuMode, (newVal) => {
    if (newVal === 'static') {
        layoutState.staticMenuDesktopInactive.value = false;
    }
});



const changeColorScheme = (colorScheme) => {
    const themeLink = document.getElementById('theme-link');
    const themeLinkHref = themeLink.getAttribute('href');
    const currentColorScheme = 'theme-' + layoutConfig.colorScheme.value.toString();
    const newColorScheme = 'theme-' + colorScheme;
    const newHref = themeLinkHref.replace(currentColorScheme, newColorScheme);

    replaceLink(themeLink, newHref, () => {
        layoutConfig.colorScheme.value = colorScheme;
    });
};
const changeTheme = (theme) => {
    const themeLink = document.getElementById('theme-link');
    const themeHref = themeLink.getAttribute('href');
    const newHref = themeHref.replace(layoutConfig.theme.value, theme);

    replaceLink(themeLink, newHref, () => {
        layoutConfig.theme.value = theme;
    });
};
const replaceLink = (linkElement, href, onComplete) => {
    if (!linkElement || !href) {
        return;
    }

    const id = linkElement.getAttribute('id');
    const cloneLinkElement = linkElement.cloneNode(true);

    cloneLinkElement.setAttribute('href', href);
    cloneLinkElement.setAttribute('id', id + '-clone');

    linkElement.parentNode.insertBefore(cloneLinkElement, linkElement.nextSibling);

    cloneLinkElement.addEventListener('load', () => {
        linkElement.remove();

        const element = document.getElementById(id); // re-check
        element && element.remove();

        cloneLinkElement.setAttribute('id', id);
        onComplete && onComplete();
    });
};

// Kullanıcı bilgilerini yerel depolamadan al
const user = JSON.parse(localStorage.getItem('user'));
const userRoles = user?.roles?.map(role => role.name) || [];

// Rol kontrol fonksiyonu
const hasRole = (roleName) => {
    return userRoles.includes(roleName);
};


</script>

<template>
  <Sidebar
    v-model:visible="layoutState.profileSidebarVisible.value"
    position="right"
    class="layout-profile-sidebar w-full sm:w-25rem"
  >
    <div class="flex flex-column mx-auto md:mx-0">
      <span class="mb-2 font-semibold">{{ $t('sidebar.welcome') }}</span>
      <span class="text-color-secondary font-medium mb-5">{{ authStore.user.fullName }}</span>

      <ul class="list-none m-0 p-0">
        <li @click="navigateToDetailSetting" v-if="hasRole('Admin') || hasRole('Manager')">
          <a
            class="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150"
          >
            <span>
              <i class="pi pi-user text-xl text-primary"></i>
            </span>
            <div class="ml-3">
              <span class="mb-2 font-semibold">{{ $t('sidebar.profileSettings') }}</span>
            </div>
          </a>
        </li>

        <li  @click="authStore.logout(null)">
          <a
            class="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150"
          >
            <span>
              <i class="pi pi-power-off text-xl text-primary"></i>
            </span>
            <div class="ml-3">
              <span class="mb-2 font-semibold">{{ $t('sidebar.signOut') }}</span>
            </div>
          </a>
        </li>
      </ul>

      <hr class="my-5">

      <h5>{{ $t('sidebar.scale') }}</h5>
        <div class="flex align-items-center">
            <Button icon="pi pi-minus" type="button" @click="decrementScale()" class="w-2rem h-2rem mr-2" text rounded :disabled="layoutConfig.scale.value === scales[0]"></Button>
            <div class="flex gap-2 align-items-center">
                <i class="pi pi-circle-fill text-300" v-for="s in scales" :key="s" :class="{ 'text-primary-500': s === layoutConfig.scale.value }"></i>
            </div>
            <Button icon="pi pi-plus" type="button" @click="incrementScale()" class="w-2rem h-2rem ml-2" text rounded :disabled="layoutConfig.scale.value === scales[scales.length - 1]"></Button>
        </div>

        <h5>{{ $t('sidebar.mode') }}</h5>
        <div class="field-radiobutton flex-1">
            <RadioButton v-model="colorScheme" name="colorScheme" value="light" @change="() => changeColorScheme('light')" inputId="outlined_input"></RadioButton>
            <label for="outlined_input">{{ $t('sidebar.light') }}</label>
        </div>
        <div class="field-radiobutton flex-1">
            <RadioButton v-model="colorScheme" name="colorScheme" value="dim" @change="() => changeColorScheme('dim')" inputId="filled_input"></RadioButton>
            <label for="filled_input">{{ $t('sidebar.dim') }}</label>
        </div>
        <div class="field-radiobutton flex-1">
            <RadioButton v-model="colorScheme" name="colorScheme" value="dark" @change="() => changeColorScheme('dark')" inputId="filled_input"></RadioButton>
            <label for="filled_input">{{ $t('sidebar.dark') }}</label>
        </div>
    </div>

    <!-- <h5>Themes</h5>
        <div class="flex flex-wrap row-gap-3">
            <div v-for="(theme, i) in componentThemes" :key="i" class="w-3">
                <Button
                    :autoFocus="layoutConfig.theme === theme.name"
                    class="cursor-pointer p-link w-2rem h-2rem border-circle flex-shrink-0 flex align-items-center justify-content-center"
                    @click="() => changeTheme(theme.name)"
                    :style="{ 'background-color': theme.color }"
                >
                    <i v-if="theme.name === layoutConfig.theme.value" class="pi pi-check text-white"></i>
                </Button>
            </div>
        </div> -->
        

  </Sidebar>
</template>
