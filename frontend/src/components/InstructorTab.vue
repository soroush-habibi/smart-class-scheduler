<template>
  <v-card class="pa-4">
    <v-row>
      <!-- تعریف استاد -->
      <v-col cols="12" md="6">
        <h3>1) تعریف استاد</h3>
        <v-text-field v-model="name" label="نام استاد" maxlength="200" hint="حداکثر ۲۰۰ کاراکتر" />
        <v-btn color="primary" class="mt-2" @click="createInstructor" :loading="creating">افزودن استاد</v-btn>
      </v-col>

      <!-- زمان‌بندی استاد -->
      <v-col cols="12" md="6">
        <h3>2) زمان‌بندی استاد</h3>

        <v-select
          v-model="selectedInstructorId"
          :items="instructorSelectItems"
          item-title="label"
          item-value="value"
          label="انتخاب استاد"
          :loading="loadingInstructors"
          :disabled="loadingInstructors"
        />

        <v-select
          v-model="selectedTermId"
          :items="termSelectItems"
          item-title="label"
          item-value="value"
          label="انتخاب ترم"
          :loading="loadingTerms"
          :disabled="loadingTerms"
        />

        <v-text-field v-model.number="maxDaily" label="حداکثر دقیقه روزانه" type="number" />
        <v-text-field v-model.number="maxWeekly" label="حداکثر دقیقه هفتگی" type="number" />

        <div class="mt-2">
          <label>روزهای در دسترس</label>
          <div>
            <v-checkbox v-for="d in days" :key="d" :label="d" :value="d" v-model="availableDays" dense />
          </div>
        </div>

        <v-btn color="primary" class="mt-2" @click="schedule" :loading="scheduling">زمان‌بندی کن</v-btn>
      </v-col>
    </v-row>

    <v-divider class="my-4" />

    <v-list>
      <v-list-item v-for="ins in instructorsLocal" :key="ins.serverId">
        <div>
          <div>{{ ins.label }}</div>
          <div class="text--secondary">ID سرور: {{ ins.serverId ?? '-' }}</div>
        </div>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'

/* emits */
const emit = defineEmits(['instructor-created', 'instructor-scheduled'])

/* create instructor form */
const name = ref('')
const creating = ref(false)

/* scheduling form */
const selectedInstructorId = ref<number | null>(null)
const selectedTermId = ref<number | null>(null)
const maxDaily = ref<number | null>(null)
const maxWeekly = ref<number | null>(null)
const availableDays = ref<string[]>([])
const days = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed']
const scheduling = ref(false)

/* local display list */
const instructorsLocal = ref<{ label: string; serverId: number }[]>([])

/* paging instructors */
const instructorPage = ref(1)
const instructorLimit = 10
const instructorSelectList = ref<{ label: string; value: number }[]>([])
const loadingInstructors = ref(false)
const hasMoreInstructors = ref(false)

const instructorSelectItems = computed(() => {
  const list = [...instructorSelectList.value]
  if (hasMoreInstructors.value) list.push({ label: 'بارگذاری موارد بعدی...', value: -1 })
  return list
})

/* paging terms */
const termPage = ref(1)
const termLimit = 10
const termSelectList = ref<{ label: string; value: number }[]>([])
const loadingTerms = ref(false)
const hasMoreTerms = ref(false)

const termSelectItems = computed(() => {
  const list = [...termSelectList.value]
  if (hasMoreTerms.value) list.push({ label: 'بارگذاری موارد بعدی...', value: -1 })
  return list
})

/* ====== LOADERS ====== */
async function loadInstructorPage(page = 1) {
  loadingInstructors.value = true
  try {
    const res = await axios.get(`http://localhost:3000/instructor?page=${page}&limit=${instructorLimit}`)
    const arr = res.data.data
    const mapped = arr.map((a: any) => ({ label: a.name ?? `I${a.id}`, value: a.id }))
    if (page === 1) instructorSelectList.value = mapped
    else instructorSelectList.value = [...instructorSelectList.value, ...mapped]
    hasMoreInstructors.value = Array.isArray(arr) && arr.length === instructorLimit
    instructorPage.value = page
  } catch (err) {
    console.error('loadInstructorPage', err)
  } finally {
    loadingInstructors.value = false
  }
}

async function loadTermPage(page = 1) {
  loadingTerms.value = true
  try {
    const res = await axios.get(`http://localhost:3000/term?page=${page}&limit=${termLimit}`)
    const arr = res.data.data
    const mapped = arr.map((t: any) => ({
      label: `ترم ${prettyType(t.type)} ${t.yearStart}-${t.yearEnd}`,
      value: t.id
    }))
    if (page === 1) termSelectList.value = mapped
    else termSelectList.value = [...termSelectList.value, ...mapped]
    hasMoreTerms.value = Array.isArray(arr) && arr.length === termLimit
    termPage.value = page
  } catch (err) {
    console.error('loadTermPage', err)
  } finally {
    loadingTerms.value = false
  }
}

/* ====== WATCHERS ====== */
watch(selectedInstructorId, (val) => {
  if (val === -1) {
    loadInstructorPage(instructorPage.value + 1).then(() => {
      selectedInstructorId.value = null
    })
  }
})
watch(selectedTermId, (val) => {
  if (val === -1) {
    loadTermPage(termPage.value + 1).then(() => {
      selectedTermId.value = null
    })
  }
})

/* ====== CREATE INSTRUCTOR ====== */
async function createInstructor() {
  if (!name.value || !name.value.trim()) { alert('نام استاد لازم است'); return }
  if (name.value.length > 200) { alert('نام استاد بیش از ۲۰۰ کاراکتر است'); return }

  creating.value = true
  try {
    const res = await axios.post('http://localhost:3000/instructor', { name: name.value })
    const data = res.data
    emit('instructor-created', { label: name.value, serverId: data.id })
    instructorsLocal.value.unshift({ label: name.value, serverId: data.id })
    instructorSelectList.value.unshift({ label: name.value, value: data.id })
    name.value = ''
  } catch (err) {
    console.error(err)
    alert('خطا در ایجاد استاد')
  } finally {
    creating.value = false
  }
}

/* ====== SCHEDULE ====== */
async function schedule() {
  if (!selectedInstructorId.value || !selectedTermId.value || !maxDaily.value || !maxWeekly.value) {
    alert('لطفاً همه فیلدهای زمان‌بندی را تکمیل کنید.')
    return
  }
  scheduling.value = true
  try {
    const res = await axios.put(`http://localhost:3000/instructor/schedule/${selectedInstructorId.value}`, {
      maxDailyMinutes: maxDaily.value,
      maxWeeklyMinutes: maxWeekly.value,
      termId: selectedTermId.value,
      availableDays: availableDays.value
    })
    const data = res.data
    emit('instructor-scheduled', data)
    alert('زمان‌بندی با موفقیت ذخیره شد.')
  } catch (err) {
    console.error(err)
    alert('خطا در زمان‌بندی استاد')
  } finally {
    scheduling.value = false
  }
}

function prettyType(t: string) {
  if (t === 'first') return 'نیم‌سال اول'
  if (t === 'second') return 'نیم‌سال دوم'
  if (t === 'summer') return 'تابستان'
  return t
}

/* ====== INITIAL LOAD ====== */
onMounted(() => {
  loadInstructorPage(1)
  loadTermPage(1)
})
</script>
