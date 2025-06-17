<script setup>
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import { useBuyingStore } from '@/stores/buying';
import { useLayoutStore } from '@/stores/layout';

// Initialize Vue utilities and stores
const { t } = useI18n();
const router = useRouter();
const layoutStore = useLayoutStore();
const buyingStore = useBuyingStore();

// Reactive variables
const features = ref([]);
const packages = ref([]);
const filteredPackages = ref([]);
const userpackage = ref(null);
const selectedDuration = ref(t('packagelist.durationYearly'));
const durationOptions = ref([
  t('packagelist.durationMonthly'),
  t('packagelist.durationHalfYearly'),
  t('packagelist.durationYearly'),
]);

// Package features mapped by package type (1: Temel, 2: Standart, 3: Profesyonel, 4: Kurumsal)
const packageFeaturesByType = {
  1: {
    maxParticipants: 10,
    meetingLimit: 10,
    cloudStorage: '25 GB',
    multiMeeting: false,
    recording: true,
    downloadableRecording: false,
    membershipLimit: 50,
    groupLimit: 25,
    sessionHours: '120 Dk',
    calendar: true,
    assignments: true,
    assignmentScoring: true,
    whiteboard: true,
    workGroups: true,
    analytics: true,
    extraFeatures: false,
    support: 'E-posta ve sohbet desteği',
  },
  2: {
    maxParticipants: 50,
    meetingLimit: 100,
    cloudStorage: '75 GB',
    multiMeeting: false,
    recording: true,
    downloadableRecording: true,
    membershipLimit: 150,
    groupLimit: 75,
    sessionHours: '600 Dk',
    calendar: true,
    assignments: true,
    assignmentScoring: true,
    whiteboard: true,
    workGroups: true,
    analytics: true,
    extraFeatures: false,
    support: 'E-posta ve sohbet desteği',
  },
  3: {
    maxParticipants: 150,
    meetingLimit: 500,
    cloudStorage: '150 GB',
    multiMeeting: false,
    recording: true,
    downloadableRecording: true,
    membershipLimit: 500,
    groupLimit: 250,
    sessionHours: 'Sınırsız',
    calendar: true,
    assignments: true,
    assignmentScoring: true,
    whiteboard: true,
    workGroups: true,
    analytics: true,
    extraFeatures: false,
    support: '7/24 telefon ve canlı sohbet desteği',
  },
  4: {
    maxParticipants: '1000+',
    meetingLimit: 'Sınırsız',
    cloudStorage: '1000 GB+',
    multiMeeting: true,
    recording: '4K Kayıt',
    downloadableRecording: true,
    membershipLimit: 'Sınırsız',
    groupLimit: 'Sınırsız',
    sessionHours: 'Sınırsız',
    calendar: true,
    assignments: true,
    assignmentScoring: true,
    whiteboard: true,
    workGroups: true,
    analytics: true,
    extraFeatures: 'Api Erişimi',
    support: 'Kişiye özel hesap yöneticisi, VIP destek, 7/24 premium teknik destek',
  },
};

// Fetch package data on component mount
const fetchData = async () => {
  layoutStore.setLoading(true);
  try {
    const userpackagedata = await buyingStore.getUserPackage();
    userpackage.value = userpackagedata;
    const allPackages = await buyingStore.getAllPackage();
    packages.value = allPackages;
    filterPlans();
  } catch (error) {
    console.error('Paketler alınırken hata oluştu:', error);
  } finally {
    layoutStore.setLoading(false);
  }
};

// Filter packages based on selected duration
const filterPlans = () => {
  let durationDays;
  if (selectedDuration.value === t('packagelist.durationMonthly')) durationDays = 30;
  else if (selectedDuration.value === t('packagelist.durationHalfYearly')) durationDays = 180;
  else durationDays = 365;

  filteredPackages.value = packages.value
    .filter((p) => p.validityTotalDay === durationDays)
    .sort((a, b) => a.packageParentType - b.packageParentType);
  transformFeatures();
};

// Transform features for display
const transformFeatures = () => {
  features.value = [
    { feature: t('packagelist.maxParticipants'), featureKey: 'maxParticipants' },
    { feature: t('packagelist.meetingLimit'), featureKey: 'meetingLimit' },
    { feature: t('packagelist.cloudStorage'), featureKey: 'cloudStorage' },
    { feature: t('packagelist.multiMeeting'), featureKey: 'multiMeeting' },
    { feature: t('packagelist.recording'), featureKey: 'recording' },
    { feature: t('packagelist.downloadableRecording'), featureKey: 'downloadableRecording' },
    { feature: t('packagelist.membershipLimit'), featureKey: 'membershipLimit' },
    { feature: t('packagelist.groupLimit'), featureKey: 'groupLimit' },
    { feature: t('packagelist.sessionHours'), featureKey: 'sessionHours' },
    { feature: t('packagelist.calendar'), featureKey: 'calendar' },
    { feature: t('packagelist.assignments'), featureKey: 'assignments' },
    { feature: t('packagelist.assignmentScoring'), featureKey: 'assignmentScoring' },
    { feature: t('packagelist.whiteboard'), featureKey: 'whiteboard' },
    { feature: t('packagelist.workGroups'), featureKey: 'workGroups' },
    { feature: t('packagelist.analytics'), featureKey: 'analytics' },
    { feature: t('packagelist.extraFeatures'), featureKey: 'extraFeatures' },
    { feature: t('packagelist.support'), featureKey: 'support' },
  ];
};

// Get feature value for a package
const getFeatureValue = (pkg, featureKey) => {
  const features = packageFeaturesByType[pkg.packageParentType];
  if (!features) return '✗';

  const value = features[featureKey];
  if (typeof value === 'boolean') return value;
  if (value === 'Sınırsız') return 'Sınırsız';
  if (value === '4K Kayıt') return '4K Kayıt';
  if (value === 'Api Erişimi') return 'Api Erişimi';
  return value || '✗';
};

// Get price suffix based on duration
const getPriceSuffix = (pkg) => {
  return pkg.validityTotalDay === 30
    ? t('packagelist.priceMonthlySuffix')
    : pkg.validityTotalDay === 180
    ? t('packagelist.priceHalfYearlySuffix')
    : t('packagelist.priceYearlySuffix');
};

// Determine button label based on user package and package type
const getButtonLabel = (pkg) => {
  if (!userpackage.value) return t('packagelist.buyNow'); // Varsayılan etiket
  if (pkg.packageParentType === 4) return t('packagelist.contactUs');
  if (userpackage.value.packageParentType === pkg.packageParentType)
    return t('packagelist.buyUsageTime');
  if (userpackage.value.packageParentType < pkg.packageParentType)
    return t('packagelist.upgradePackage');
  if (userpackage.value.packageParentType > pkg.packageParentType)
    return t('packagelist.cannotDowngradePackage');
  return t('packagelist.buyNow');
};

// Disable button if downgrade is attempted
const isButtonDisabled = (pkg) => {
  if (!userpackage.value) return false; // Kullanıcı paketi yoksa butonu devre dışı bırakma
  return (
    userpackage.value.packageParentType > pkg.packageParentType &&
    pkg.packageParentType !== 4
  );
};

// Handle buy/upgrade action
const buyNow = (pkg) => {
  if (pkg.packageParentType === 4) {
    router.push('/tickets');
  } else if (!isButtonDisabled(pkg)) {
    router.push(`/buy/paymentpagev2/${pkg.id}`);
  }
};

// Lifecycle and watch
onMounted(fetchData);
watch(selectedDuration, filterPlans);

</script>


<template>
  <div class="surface-ground px-4 py-1 md:px-6 lg:px-8">
    <!-- Title 
    <div class="text-900 font-bold text-6xl mb-4 text-center">
      {{ t('packagelist.pricingPlans') }}
    </div> -->

    <!-- Duration Selection -->
    <div class="text-700 text-xl mb-6 text-center line-height-3">
      <SelectButton
        v-model="selectedDuration"
        :options="durationOptions"
        aria-labelledby="basic"
        @change="filterPlans"
      />
    </div>
    <!-- Responsive Table with Equal Column Widths -->
    <div class="overflow-x-auto">
      <table class="w-full border-collapse border border-gray-300" style="table-layout: fixed;">
        <colgroup>
          <col style="width: 20%;">
          <col v-for="pkg in filteredPackages" :key="pkg.id" style="width: 20%;">
        </colgroup>
        <thead>
          <tr>
            <th class="p-2 bg-gray-100 text-left text-sm font-bold">
              {{ t('packagelist.feature') }}
            </th>
            <th
              v-for="pkg in filteredPackages"
              :key="pkg.id"
              class="p-2 bg-gray-100 text-center text-lg font-bold text-primary"
            >
              {{ pkg.name }} <br />
              <span v-if="pkg.packageParentType !== 4" class="text-sm font-semibold">
                {{ pkg.price }} {{ pkg.priceCurrency }} {{ getPriceSuffix(pkg) }}
              </span>
              <span v-else class="text-sm font-semibold">
                {{ t('packagelist.customPrice') }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="feature in features" :key="feature.feature">
            <td class="p-2 text-left font-semibold bg-gray-50 text-sm">
              {{ feature.feature }}
            </td>
            <td
              v-for="pkg in filteredPackages"
              :key="pkg.id"
              class="p-2 text-center"
            >
              <span
                v-if="getFeatureValue(pkg, feature.featureKey) === true"
                class="text-green-500 text-lg"
                >✔</span
              >
              <span
                v-else-if="getFeatureValue(pkg, feature.featureKey) === false"
                class="text-red-500 text-lg"
                >✗</span
              >
              <span
                v-else-if="getFeatureValue(pkg, feature.featureKey) === 'Sınırsız'"
                class="text-blue-500 font-bold text-sm"
              >
                {{ t('packagelist.unlimited') }}
              </span>
              <span v-else class="text-sm">
                {{ getFeatureValue(pkg, feature.featureKey) }}
              </span>
            </td>
          </tr>
          <!-- Action Buttons -->
          <tr>
            <td class="p-4 bg-gray-100 font-bold text-center text-sm">
              {{ t('packagelist.choosePlan') }}
            </td>
            <td
              v-for="pkg in filteredPackages"
              :key="pkg.id"
              class="p-4 text-center"
            >
              <Button
                :label="getButtonLabel(pkg)"
                class="p-button-rounded p-button-sm p-button-primary w-full"
                :class="{
                  'p-button-outlined':
                    userpackage.value &&
                    userpackage.value.packageParentType === pkg.packageParentType,
                }"
                :disabled="isButtonDisabled(pkg)"
                @click="buyNow(pkg)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>


<style scoped>
table {
  font-size: 0.9rem;
  table-layout: fixed;
  width: 100%;
}

th,
td {
  padding: 0.5rem;
  word-wrap: break-word;
}

th {
  background-color: #f8f9fa;
  font-weight: bold;
}

td {
  background-color: #ffffff;
}

.text-green-500 {
  color: #2ecc71;
}
.text-red-500 {
  color: #e74c3c;
}
.text-blue-500 {
  color: #3498db;
  font-weight: bold;
}

.p-button-sm {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.p-button-primary {
  background-color: #007bff;
  border-color: #007bff;
}

.p-button-primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}
</style>