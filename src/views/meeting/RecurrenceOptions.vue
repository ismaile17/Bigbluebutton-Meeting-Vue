<template>
  <div class="card">
              <div class="grid formgrid">
                  <div class="col-12 field mb-4">

                    <!-- #region 1. sıra -->
                    <div class="p-fluid grid formgrid">
                      <div class="field col-12 md:col-4">
                        <label for="startTime" class="text-900 text-1xl block font-medium mb-2">Başlangıç Saati *</label>
                        <input id="startTime" type="time" class="p-inputtext w-full mb-4" v-model="startTime" />
                      </div>
                      <div class="field col-12 md:col-4">
                        <label for="endTime" class="text-900 text-1xl block font-medium mb-2">Bitiş Saati *</label>
                        <input id="endTime" type="time" class="p-inputtext w-full mb-4" v-model="endTime" />
                      </div>
                      <div class="field col-12 md:col-4">
                        <label for="duration" class="text-900 text-1xl block font-medium mb-2">Süre</label>
                        <input id="duration" type="text" class="p-inputtext w-full mb-4" v-model="duration" readonly />
                      </div>
                    </div>
                    <!-- #endregion -->

                    <!-- #region 2. sıra -->
                    <div class="p-fluid grid formgrid">
                      <div class="field col-12 md:col-4">
                        <label for="startTime" class="text-900 text-1xl block font-medium mb-2">Başlangıç Tarihi *</label>
                        <input id="startDate" type="date" class="p-inputtext w-full mb-4" v-model="startDate"/>
                      </div>
                      <div class="field col-12 md:col-4">
                        <label for="endTime" class="text-900 text-1xl block font-medium mb-2">Bitiş Tarihi *</label>
                        <input id="endDate" type="date" class="p-inputtext w-full mb-4" v-model="endDate"/>
                      </div>
                      <div class="field col-12 md:col-4">
                        <label for="occurrenceCount" class="text-900 text-1xl block font-medium mb-2"> Max Oturum Sayısı</label>
                        <input id="occurrenceCount" type="number" class="p-inputtext w-full mb-4" v-model="occurrenceCount" min="0" @input="onOccurrenceCountInput" />
                      </div>
                    </div>
                    <!-- #endregion -->
                    <div class="field md:col-15">

                    <div :style="{ height: '4px', background: 'linear-gradient(90deg, var(--primary-color) 0%, rgba(33, 150, 243, 0) 90%)' }"></div>

                    </div>
                    <!-- #region 3. sıra -->
                    <div class="p-fluid grid formgrid align-items-center">
                        <div class="field col-12 md:col-4">
                          <label for="recurrenceType" class="text-900 text-1xl block font-medium mb-2">Oturum Sıklığı</label>
                          <select id="recurrenceType" class="p-inputtext w-full mb-4" v-model="recurrenceType">
                            <option value="daily">Günlük</option>
                            <option value="weekly">Haftalık</option>
                            <option value="monthly">Aylık</option>
                            <option value="yearly">Yıllık</option>
                          </select>
                        </div>
                        <div class="field col-12 md:col-4">
                          <div class="field-checkbox mb-0 large-input">
                            <input type="checkbox" id="excludeWeekends" v-model="excludeWeekends" class="align-middle" />
                            <label for="excludeWeekends" class="large-label bold-label align-middle ml-2">Hafta Sonlarını Çıkart</label>
                          </div>
                        </div>
                        <div class="field col-12 md:col-4">
                          <div class="field-checkbox mb-0 large-input">
                            <input type="checkbox" id="isInfinite" v-model="isInfinite" class="align-middle" />
                            <label for="isInfinite" class="large-label bold-label align-middle ml-2">Sonsuz</label>
                          </div>
                        </div>
                      </div>
                      <!-- #endregion -->


                      <!-- #region 4. sıra -->
                      <div class="p-fluid grid formgrid align-items-center">
                        <div class="field col-12 md:col-8">
                          <div v-if="recurrenceType === 'daily'" class="flex align-items-center">
                            <label for="dailyInterval" class="text-900 text-2xl block font-medium mb-2">Her</label>
                            <input id="dailyInterval" type="number" class="p-inputtext small-input ml-2 mr-2" v-model="dailyInterval" min="1"/>
                            <span class="text-900 text-2xl block font-medium mb-2">günde bir</span>
                          </div>

                          <div v-if="recurrenceType === 'weekly'" class="flex align-items-center">
                            <label for="weeklyInterval" class="text-900 text-2xl block font-medium mb-2">Her</label>
                            <input id="weeklyInterval" type="number" class="p-inputtext small-input ml-2 mr-2" v-model="weeklyInterval" min="1"/>
                            <span class="text-900 text-2xl block font-medium mb-2">haftada bir aşağıdaki günler</span>
                          </div>
                          
                        </div>
                      </div>
                      <!-- #endregion -->


                      <!-- #region 5. sıra -->
                      <div v-if="recurrenceType === 'weekly'">
                        <div class="p-fluid grid formgrid align-items-center">
                          <div class="field col-12 md:col-12">
                            <div class="week-days-container week-large-input">
                              <div class="week-day-item">
                                <input type="checkbox" id="monday" value="Monday" v-model="weekDays" />
                                <label for="monday" class="large-label bold-label">Pazartesi</label>
                              </div>
                              <div class="week-day-item">
                                <input type="checkbox" id="tuesday" value="Tuesday" v-model="weekDays" />
                                <label for="tuesday" class="large-label bold-label">Salı</label>
                              </div>
                              <div class="week-day-item">
                                <input type="checkbox" id="wednesday" value="Wednesday" v-model="weekDays" />
                                <label for="wednesday" class="large-label bold-label">Çarşamba</label>
                              </div>
                              <div class="week-day-item">
                                <input type="checkbox" id="thursday" value="Thursday" v-model="weekDays" />
                                <label for="thursday" class="large-label bold-label">Perşembe</label>
                              </div>
                              <div class="week-day-item">
                                <input type="checkbox" id="friday" value="Friday" v-model="weekDays" />
                                <label for="friday" class="large-label bold-label">Cuma</label>
                              </div>
                              <div class="week-day-item">
                                <input type="checkbox" id="saturday" value="Saturday" v-model="weekDays" />
                                <label for="saturday" class="large-label bold-label">Cumartesi</label>
                              </div>
                              <div class="week-day-item">
                                <input type="checkbox" id="sunday" value="Sunday" v-model="weekDays" />
                                <label for="sunday" class="large-label bold-label">Pazar</label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <!-- #endregion -->

                      <!-- #region 6. sıra -->
                      <div v-if="recurrenceType === 'monthly'">
                        <div class="p-fluid">
                            <div class="formgrid grid">
                                <div class="field col">
                                  <label for="monthlyType" class="text-900 text-2x1 block font-medium mb-2">Yinelenme Türü</label>
                                <select id="monthlyType" class="p-inputtext w-full mb-4" v-model="monthlyType">
                                  <option value="day">Ayın belirli bir tarihi</option>
                                  <option value="week">Belirli bir haftanın belirli bir günü</option>
                                </select>
                                </div>
                            </div>
                        </div>
                      </div>
                      <!-- #endregion -->


                      <!-- #region 7. sıra -->
                      <div v-if="recurrenceType === 'monthly'">
                        <div class="p-fluid">
                            <div class="formgrid grid">
                                <div class="field col">
                                  <div v-if="monthlyType === 'day'" class="flex align-items-center">
                                    <label for="monthlyDay" class="text-900 text-2xl block font-medium mb-2">Her ayın</label>
                                    <input id="monthlyDay" type="number" class="p-inputtext small-input ml-2 mr-2" v-model="monthlyDay" min="1"/>
                                    <span class="text-900 text-2xl block font-medium mb-2">'inde</span>
                                  </div>

                                  <div v-if="monthlyType === 'week'">
                                      <label for="monthlyWeek" class="text-900 text-2xl block font-medium mb-2">Her ayın</label>
                                      <select id="monthlyWeek" class="p-inputtext w-full mb-4" v-model="monthlyWeek">
                                          <option value="1">Birinci</option>
                                          <option value="2">İkinci</option>
                                          <option value="3">Üçüncü</option>
                                          <option value="4">Dördüncü</option>
                                      </select>
                                  </div>
                                </div>
                                <div class="field col">
                                  <div v-if="monthlyType === 'week'">
                                  <label for="monthlyWeek" class="text-900 text-2xl block font-medium mb-2">Bu günü</label>

                                  <select id="monthlyWeekday" class="p-inputtext w-full mb-4" v-model="monthlyWeekday">
                                          <option value="Monday">Pazartesi</option>
                                          <option value="Tuesday">Salı</option>
                                          <option value="Wednesday">Çarşamba</option>
                                          <option value="Thursday">Perşembe</option>
                                          <option value="Friday">Cuma</option>
                                          <option value="Saturday">Cumartesi</option>
                                          <option value="Sunday">Pazar</option>
                                      </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                      </div>
                      <!-- #endregion -->

                      <!-- #region 8. sıra -->
                      <div v-if="recurrenceType === 'yearly'">
                        <div class="p-fluid">
                            <div class="formgrid grid">
                                <div class="field col">
                                  <label for="yearlyMonthDay" class="text-900 text-2xl block font-medium mb-2">Veya her yılın bu aynın</label>

                                      <select id="yearlyMonth" class="p-inputtext w-full mb-4" v-model="yearlyMonth">
                                          <option value="0">Ocak</option>
                                          <option value="1">Şubat</option>
                                          <option value="2">Mart</option>
                                          <option value="3">Nisan</option>
                                          <option value="4">Mayıs</option>
                                          <option value="5">Haziran</option>
                                          <option value="6">Temmuz</option>
                                          <option value="7">Ağustos</option>
                                          <option value="8">Eylül</option>
                                          <option value="9">Ekim</option>
                                          <option value="10">Kasım</option>
                                          <option value="11">Aralık</option>
                                      </select>
                                </div>
                                <div class="field col">
                                  <label for="yearlyMonthDay" class="text-900 text-2xl block font-medium mb-2">Bu tarihi</label>
                                      <input id="yearlyMonthDay" type="number" class="p-inputtext w-full mb-4" v-model="yearlyMonthDay" min="1" max="31"/>
                                </div>
                            </div>
                        </div>
                      </div>


                      <!-- #endregion -->


                      <button @click="calculateDates" class="p-button p-component p-button-primary p-button-text-icon-left">
                          <i class="pi pi-check p-button-icon-left"></i><span class="p-button-label">Hesapla</span>
                      </button>
                  </div>

                  <div class="col-12">
                      <div v-if="calculatedDates.length > 0">
                          <h4>Hesaplanan Tarihler:</h4>
                          <div class="p-3 flex flex-wrap gap-1">
                            <Chip v-for="(tag, i) in calculatedDates" :key="i" :label="tag" class="mr-2 py-2 px-3 text-900 font-bold surface-card border-1 surface-border" style="border-radius: 20px">
                                <span class="mr-3">{{ tag }}</span>
                                <span class="flex align-items-center justify-content-center border-1 surface-border bg-gray-100 border-circle cursor-pointer" :style="{ width: '1.5rem', height: '1.5rem' }" @click="onRemoveTags(tag)">
                                    <i class="pi pi-fw pi-times text-black-alpha-60" :style="{ fontSize: '9px' }"></i> </span
                            ></Chip>
                        </div>
                      </div>
                  </div>

              </div>
  </div>
</template>




<script setup>
import { ref } from 'vue';
import { format, addDays, addWeeks, addMonths, addYears, isWeekend, parseISO, getDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

// Başlangıç ve Bitiş saatleri için değişkenler
const startTime = ref('');
const endTime = ref('');

// Süre bilgisi için değişken
const duration = ref('');

// Yinelenme dönemi için değişken
const recurrenceType = ref('daily');

// Günlük yinelenme için interval
const dailyInterval = ref(1);

// occurrenceCount giriş olayını işleme fonksiyonu
const onOccurrenceCountInput = (event) => {
  const value = event.target.value;
  occurrenceCount.value = value === '0' ? null : Number(value);
};

// Haftalık yinelenme için interval ve günler
const weeklyInterval = ref(1);
const weekDays = ref([]);

const onRemoveTags = (tag) => {
  calculatedDates.value = calculatedDates.value.filter(t => t !== tag);
};

// Aylık yinelenme için tür ve gün
const monthlyType = ref('day');
const monthlyDay = ref(1);
const monthlyWeek = ref(1);
const monthlyWeekday = ref('Monday');

// Yıllık yinelenme için tarih ve ay günü
const yearlyDate = ref('');
const yearlyMonthDay = ref(1);
const yearlyMonth = ref(0);

// Yinelenme aralığı için başlangıç ve bitiş tarihleri
const startDate = ref('');
const endDate = ref('');

// Oluşum sayısı ve sonsuzluk için değişkenler
const occurrenceCount = ref(0);
const isInfinite = ref(false);

// Hafta sonlarını çıkartma seçeneği
const excludeWeekends = ref(false);

// Hesaplanan tarihler
const calculatedDates = ref([]);
const today = new Date();

// Tarihleri hesaplamak için fonksiyon
const calculateDates = () => {
  calculatedDates.value = []; // Hesaplanan tarihler burada belirlenecek

  let currentDate = parseISO(startDate.value);
  let end = isInfinite.value ? null : parseISO(endDate.value);
  let count = 0;
  const maxOccurrences = 365; // Maksimum oluşum sayısı

  // Oluşumları belirlemek için döngü
  while ((isInfinite.value || (end && currentDate <= end)) && count < (occurrenceCount.value || maxOccurrences)) {
    if (recurrenceType.value === 'daily') {
      // Günlük yinelenme
      if (!excludeWeekends.value || !isWeekend(currentDate)) {
        calculatedDates.value.push(format(currentDate, 'yyyy-MM-dd'));
        count++;
      }
      currentDate = addDays(currentDate, dailyInterval.value);
    }

    if (recurrenceType.value === 'weekly') {
      // Haftalık yinelenme
      for (let day of weekDays.value) {
        let nextDate = new Date(currentDate);
        while (format(nextDate, 'EEEE') !== day) {
          nextDate = addDays(nextDate, 1);
        }
        if (nextDate >= parseISO(startDate.value) && (!end || nextDate <= end)) {
          if (!excludeWeekends.value || !isWeekend(nextDate)) {
            calculatedDates.value.push(format(nextDate, 'yyyy-MM-dd'));
            count++;
          }
        }
      }
      currentDate = addWeeks(currentDate, weeklyInterval.value);
    }

    if (recurrenceType.value === 'monthly') {
      // Aylık yinelenme
      if (monthlyType.value === 'day') {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), monthlyDay.value);
      } else if (monthlyType.value === 'week') {
        let monthStart = startOfMonth(currentDate);
        let monthEnd = endOfMonth(currentDate);
        let days = eachDayOfInterval({ start: monthStart, end: monthEnd });
        let targetDays = days.filter(day => format(day, 'EEEE') === monthlyWeekday.value);
        currentDate = targetDays[monthlyWeek.value - 1] || targetDays[targetDays.length - 1];
      }

      if (currentDate >= parseISO(startDate.value) && (!end || currentDate <= end)) {
        if (!excludeWeekends.value || !isWeekend(currentDate)) {
          calculatedDates.value.push(format(currentDate, 'yyyy-MM-dd'));
          count++;
        }
      }
      currentDate = addMonths(currentDate, 1);
    }

    if (recurrenceType.value === 'yearly') {
      // Yıllık yinelenme
      currentDate = new Date(currentDate.getFullYear(), yearlyMonth.value, yearlyMonthDay.value);
      if (currentDate >= parseISO(startDate.value) && (!end || currentDate <= end)) {
        if (!excludeWeekends.value || !isWeekend(currentDate)) {
          calculatedDates.value.push(format(currentDate, 'yyyy-MM-dd'));
          count++;
        }
      }
      currentDate = addYears(currentDate, 1);
    }
  }
};

// Toplantı detaylarını kaydetmek için fonksiyon
const saveMeetings = () => {
  console.log('Toplantı detayları kaydedildi:', calculatedDates.value);
  // Kaydetme işlemleri burada yapılır
};
</script>

<style scoped>
.p-fluid .field label {
  display: block;
  margin-bottom: 0.5rem;
}

.p-inputtext {
  font-size: 1.2em; /* Metin boyutunu ayarlayın */
}

.formgrid {
  align-items: start; /* Etiketlerin ve giriş alanlarının hizalanmasını sağlar */
}


/* Form elemanlarının boyutlarını ve yazı tiplerini ayarlamak için CSS sınıfları */
.large-input input {
  width: 20px; /* Checkbox boyutunu ayarlayın */
  height: 20px;
  vertical-align: middle; /* Checkbox'ın ortalanmasını sağlar */

}

.large-label {
  font-size: 1.2rem; /* Yazı tipini büyütün */
  margin-left: 10px; /* Checkbox ile yazı arasında boşluk bırakın */
    vertical-align: middle; /* Etiketin ortalanmasını sağlar */
}

.field-checkbox {
  display: flex;
  align-items: center; /* Checkbox ve etiketi aynı hizaya getirin */
  
}

.bold-label {
  font-weight: 700; /* Yazıyı ekstra kalın yapın */
}

/* Form elemanlarının boyutlarını ve yazı tiplerini ayarlamak için CSS sınıfları */
.large-input input {
  width: 28px; /* Checkbox boyutunu ayarlayın */
  height: 28px;
}

.week-large-input input {
  width: 20px; /* Checkbox boyutunu ayarlayın */
  height: 20px;
}

.field-checkbox {
  display: flex;
  align-items: center; /* Checkbox ve etiketi aynı hizaya getirin */
}

.ml-2 {
  margin-left: 0.5rem; /* Checkbox ile yazı arasında boşluk bırakın */
}

.formgrid {
  align-items: start; /* Etiketlerin ve giriş alanlarının hizalanmasını sağlar */
}

.flex {
  display: flex;
  align-items: center;
}

.small-input {
  width: 60px; /* Input alanını küçültün */
  font-size: 1.2em; /* Metin boyutunu ayarlayın */
  padding: 0.25rem; /* İç boşlukları ayarlayın */
}

.mr-2 {
  margin-right: 0.5rem; /* Sağ boşluk ekleyin */
}

.week-days-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem; /* Checkbox'lar arasındaki mesafeyi ayarlar */
  align-items: center;
}

.week-day-item {
  display: flex;
  align-items: center;
  margin-right: 1.5rem; /* Bir sonraki checkbox ile arasındaki mesafeyi ayarlar */
  margin-bottom: 0.5rem; /* Mobil görünümde satırlar arasında boşluk bırakır */
}

.week-day-item input[type="checkbox"] {
  margin-right: 0.1rem; /* Checkbox ile yazısı arasındaki mesafeyi ayarlar */
}

.week-day-item label {
  font-size: 1.1rem; /* Yazı tipini büyütün */
  font-weight: 600; /* Yazıyı kalın yapın */
}

select.p-inputtext {
  appearance: none; /* Varsayılan stil kaldırılır */
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns%3D%22http://www.w3.org/2000/svg%22 width%3D%2216%22 height%3D%2216%22 fill%3D%22currentColor%22 class%3D%22bi bi-chevron-down%22 viewBox%3D%220 0 16 16%22%3E%3Cpath fill-rule%3D%22evenodd%22 d%3D%22M1.646 5.646a.5.5 0 0 1 .708 0L8 11.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z%22/%3E%3C/svg%3E');
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2rem; /* Sağda boşluk bırakılır */
}
</style>