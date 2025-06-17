<script setup>
import { ref, onMounted } from 'vue';
import AppSubMenu from './AppSubMenu.vue';
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// Kullanıcı bilgilerini yerel depolamadan al
const user = JSON.parse(localStorage.getItem('user'));
const userRoles = user?.roles?.map(role => role.name) || [];

// Rol kontrol fonksiyonu
const hasRole = (roleName) => {
    return userRoles.includes(roleName);
};

// Menü modeli
const model = ref([]); // Başlangıçta boş bir menü

onMounted(() => {
    // Ortak menü öğeleri (Admin veya Manager için)
    const baseMenu = [
        {
            label: t("Menu.homePage"),
            icon: 'pi pi-fw pi-home',
            code: '3',
            to: '/'
        },
        {
            label: t("Menu.participants"),
            icon: 'pi pi-fw pi-user',
            code: '3',
            to: '/participant/list',
            requiredRoles: ['Participant']
        },
        {
            label: t("Menu.groups"),
            icon: 'pi pi-fw pi-book',
            code: '7',
            to: '/meeting/group/list'
        },
        {
            label: t("Menu.meetings"),
            icon: 'pi pi-fw pi-calendar-plus',
            code: '5',
            to: '/meeting/meetinglist'
        },
        {
            label: t("Menu.managerCompleted"),
            icon: 'pi pi-fw pi-table',
            code: '7',
            to: '/completedmeeting/managercomp'
        },
        {
            label: t("Menu.tickets"),
            icon: 'pi pi-fw pi-ticket',
            code: '9',
            to: '/tickets'
        },
        {
            label: 'Billings',
            icon: 'pi pi-wallet',
            items: [
                {
                    label: t("Menu.package"),
                    icon: 'pi pi-credit-card',
                    to: '/buy/packagelist',
                    code: '1'
                },
                {
                    label: 'Billings',
                    icon: 'pi pi-fw pi-list',
                    to: '/billings',
                    code: '2'
                }
            ]
        }
    ];

    // Admin'e özel menü öğeleri
    const adminMenu = {
        label: 'Admin',
        icon: 'pi pi-book',
        items: [
            {
                label: t("Admin Ticket"),
                icon: 'pi pi-fw pi-ticket',
                code: '10',
                to: '/ticketsforadmin',
                requiredRoles: ['Admin']
            },
            {
                label: t("Admin Payment"),
                icon: 'pi pi-money-bill',
                code: '11',
                to: '/paymentsforadmin',
                requiredRoles: ['Admin']
            }
        ]
    };

    // Participant rolüne özel menü
    const participantMenu = [
        {
            label: t("Menu.homePage"),
            icon: 'pi pi-fw pi-home',
            code: '3',
            to: '/home'
        }
    ];

    // Menü modelini oluştur
    if (hasRole('Participant') && !hasRole('Admin') && !hasRole('Manager')) {
        // Sadece Participant rolüne sahipse, yalnızca Participant menüsü gösterilir
        model.value = [
            {
                label: 'Menu',
                icon: 'pi pi-th-large',
                items: participantMenu
            }
        ];
    } else {
        // Admin veya Manager ise, ortak menüye Admin menüsü eklenir
        model.value = [
            {
                label: 'Menu',
                icon: 'pi pi-th-large',
                items: [...baseMenu]
            }
        ];

        if (hasRole('Admin')) {
            model.value[0].items.push(adminMenu);
        }
    }
});
</script>

<template>
  <!-- Menü sadece tanımlıysa gösterilir -->
  <div v-if="model.length > 0">
    <AppSubMenu :model="model" />
  </div>
</template>
