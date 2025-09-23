<template>
  <v-card class="pa-4">
    <v-row>
      <!-- تعریف استاد -->
      <v-col cols="12" md="6">
        <h3>1) تعریف استاد</h3>
        <v-text-field
          v-model="name"
          label="نام استاد"
          maxlength="200"
          hint="حداکثر ۲۰۰ کاراکتر"
        />
        <v-btn color="primary" class="mt-2" @click="createInstructor">افزودن استاد</v-btn>
      </v-col>

      <!-- زمان‌بندی استاد -->
      <v-col cols="12" md="6">
        <h3>2) زمان‌بندی استاد</h3>
        <v-select
          v-model="selectedInstructorId"
          :items="instructorItems"
          item-title="label"
          item-value="value"
          label="انتخاب استاد"
        />
        <v-select
          v-model="selectedTermId"
          :items="termItems"
          item-title="label"
          item-value="value"
          label="انتخاب ترم"
        />
        <v-text-field v-model.number="maxDaily" label="حداکثر دقیقه روزانه" type="number" />
        <v-text-field v-model.number="maxWeekly" label="حداکثر دقیقه هفتگی" type="number" />
        <div class="mt-2">
          <label>روزهای در دسترس</label>
          <div>
            <v-checkbox v-for="d in days" :key="d" :label="d" :value="d" v-model="availableDays" dense />
          </div>
        </div>
        <v-btn color="primary" class="mt-2" @click="schedule">زمان‌بندی کن</v-btn>
      </v-col>
    </v-row>

    <v-divider class="my-4" />

    <v-list>
      <v-list-item v-for="ins in instructors" :key="ins.serverId">
        <div>
          <div>{{ ins.label }}</div>
          <div class="text--secondary">ID سرور: {{ ins.serverId ?? '-' }}</div>
        </div>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ instructors: any[]; terms: any[] }>()
const emit = defineEmits(['instructor-created', 'instructor-scheduled'])

const name = ref('')
const selectedInstructorId = ref<number | null>(null)
const selectedTermId = ref<number | null>(null)
const maxDaily = ref<number | null>(null)
const maxWeekly = ref<number | null>(null)
const availableDays = ref<string[]>([])
const days = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed']

const instructorItems = computed(() =>
  props.instructors.map((i) => ({ label: i.label, value: i.serverId }))
)
const termItems = computed(() =>
  props.terms.map((t) => ({ label: `${t.yearStart}/${t.yearEnd} - ${t.type}`, value: t.id }))
)

function validateInstructorName() {
  if (!name.value || name.value.trim().length === 0) {
    alert('نام استاد نمی‌تواند خالی باشد.')
    return false
  }
  if (name.value.length > 200) {
    alert('نام استاد بیش از ۲۰۰ کاراکتر است.')
    return false
  }
  return true
}

async function createInstructor() {
  if (!validateInstructorName()) return
  try {
    const res = await fetch(`http://localhost:3000/instructor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.value }),
    })
    const data = await res.json()
    emit('instructor-created', { label: name.value, serverId: data.id })
    name.value = ''
  } catch (err) {
    console.error(err)
    alert('خطا در ایجاد استاد')
  }
}

async function schedule() {
  if (!selectedInstructorId.value || !selectedTermId.value || !maxDaily.value || !maxWeekly.value) {
    alert('لطفاً همه فیلدهای زمان‌بندی را تکمیل کنید.')
    return
  }
  try {
    const res = await fetch(`http://localhost:3000/instructor/schedule/${selectedInstructorId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        maxDailyMinutes: maxDaily.value,
        maxWeeklyMinutes: maxWeekly.value,
        termId: selectedTermId.value,
        availableDays: availableDays.value,
      }),
    })
    const data = await res.json()
    emit('instructor-scheduled', data)
  } catch (err) {
    console.error(err)
    alert('خطا در زمان‌بندی استاد')
  }
}
</script>
