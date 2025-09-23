<template>
  <v-card class="pa-4" style="position:relative;">
    <v-overlay :model-value="loading" absolute>
      <v-progress-circular indeterminate size="64" />
    </v-overlay>

    <v-row>
      <v-col cols="12" md="6">
        <v-text-field v-model="name" label="نام درس" maxlength="200" />
        <v-select
          v-model="forTerm"
          :items="termItems"
          item-title="label"
          item-value="value"
          label="برای کدام ترم"
          @update:model-value="onTermSelected"
        />
      </v-col>

      <v-col cols="12" md="6">
        <v-select
          v-model="selectedInstructorTermId"
          :items="instructorTermSelectItems"
          item-title="label"
          item-value="value"
          label="InstructorTerm (انتخاب کنید)"
          :disabled="!forTerm || loadingInstructorTerms"
        />
        <v-text-field v-model.number="sessionCount" label="تعداد سشن (1 یا 2)" type="number" min="1" max="2" />
        <v-text-field v-model.number="duration" label="مدت (دقیقه)" type="number" :min="15" step="15" />
        <v-text-field v-model.number="capacity" label="ظرفیت" type="number" />
        <v-select v-model="level" :items="levels" label="سطح" />
      </v-col>

      <v-col cols="12">
        <v-btn color="primary" @click="createCourse">افزودن درس</v-btn>
      </v-col>
    </v-row>

    <v-divider class="my-3" />

    <v-list>
      <v-list-item v-for="c in coursesLocal" :key="c.id">
        <v-list-item-content>
          <v-list-item-title>{{ c.name }}</v-list-item-title>
          <v-list-item-subtitle>id: {{ c.id }}</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import * as api from '../api'
import type { Term } from '../types'

/* props/emits same as before */
const props = defineProps<{
  instructorTerms: { label: string, id: number }[],
  terms: Term[],
  coursesLocal: any[]
}>()
const emit = defineEmits<{
  (e: 'course-created', c: any): void
}>()

/* form state */
const name = ref('')
const forTerm = ref<number | null>(null)
const selectedInstructorTermId = ref<number | null>(null)
const sessionCount = ref<number>(1)
const duration = ref<number>(60)
const capacity = ref<number>(20)
const levels = ['phd','graduate','undergraduate']
const level = ref<string | null>(null)

/* terms paging (for term select) */
const termPage = ref(1)
const termLimit = ref(10)
const termItems = ref<{ label: string, value: number }[]>([])
const loading = ref(false)

/* instructorTerm list and paging (for selected term) */
const instructorTermPage = ref(1)
const instructorTermLimit = 10
const instructorTermList = ref<{ label: string, value: number }[]>([])
const loadingInstructorTerms = ref(false)
const hasMoreInstructorTerms = ref(false)

const instructorTermSelectItems = computed(() => {
  const list = [...instructorTermList.value]
  if (hasMoreInstructorTerms.value) list.push({ label: 'بارگذاری موارد بعدی...', value: -1 })
  return list
})

/* load terms page */
async function loadTerms(page = 1) {
  loading.value = true
  try {
    const res = await axios.get<any[]>(`http://localhost:3000/term?page=${page}&limit=${termLimit}`)
    const arr = res.data
    termItems.value = arr.map((t: any) => ({ label: `T${t.id} — ${t.yearStart}/${t.yearEnd}`, value: t.id }))
  } catch (err) {
    console.error('loadTerms', err)
  } finally {
    loading.value = false
  }
}

/* when user selects a term: fetch instructor-terms for that term and freeze UI */
async function onTermSelected(termId: number | null) {
  selectedInstructorTermId.value = null
  instructorTermList.value = []
  hasMoreInstructorTerms.value = false
  instructorTermPage.value = 1

  if (!termId) return

  loadingInstructorTerms.value = true
  loading.value = true
  try {
    const res = await axios.get<any[]>(`http://localhost:3000/instructor/term?page=1&limit=${instructorTermLimit}&termId=${termId}`)
    const arr = res.data
    instructorTermList.value = arr.map((it: any) => ({ label: it.label ?? `IT${it.id}`, value: it.id }))
    hasMoreInstructorTerms.value = Array.isArray(arr) && arr.length === instructorTermLimit
    instructorTermPage.value = 1
  } catch (err) {
    console.error('load instructor terms', err)
  } finally {
    loadingInstructorTerms.value = false
    loading.value = false
  }
}

/* handle selecting "More..." in instructorTerm select */
watch(selectedInstructorTermId, async (val) => {
  if (val === -1 && forTerm.value) {
    const next = instructorTermPage.value + 1
    loadingInstructorTerms.value = true
    loading.value = true
    try {
      const res = await axios.get<any[]>(`http://localhost:3000/instructor/term?page=${next}&limit=${instructorTermLimit}&termId=${forTerm.value}`)
      const arr = res.data
      instructorTermList.value = [...instructorTermList.value, ...arr.map((it: any) => ({ label: it.label ?? `IT${it.id}`, value: it.id }))]
      hasMoreInstructorTerms.value = Array.isArray(arr) && arr.length === instructorTermLimit
      instructorTermPage.value = next
    } catch (err) {
      console.error('load more instructor terms', err)
    } finally {
      loadingInstructorTerms.value = false
      loading.value = false
      selectedInstructorTermId.value = null
    }
  }
})

/* initial load terms */
onMounted(() => {
  loadTerms(1)
})

/* create course: keep validation and api call */
function validateCourseInputs() {
  if (!name.value || !name.value.trim()) { alert('نام درس نمی‌تواند خالی باشد.'); return false }
  if (name.value.length > 200) { alert('نام درس بیش از ۲۰۰ کاراکتر است.'); return false }
  if (!forTerm.value) { alert('یک ترم انتخاب کنید.'); return false }
  if (!selectedInstructorTermId.value) { alert('لطفاً instructorTerm را انتخاب کنید.'); return false }
  const dur = Number(duration.value)
  if (!Number.isInteger(dur) || dur < 15 || dur % 15 !== 0) { alert('مدت باید عدد صحیح، حداقل ۱۵ و مضرب ۱۵ باشد.'); return false }
  return true
}

async function createCourse() {
  if (!validateCourseInputs()) return
  try {
    const payload = {
      name: name.value.trim(),
      instructorTermId: selectedInstructorTermId.value!,
      sessionCount: Number(sessionCount.value),
      capacity: Number(capacity.value),
      duration: Number(duration.value),
      level: level.value!,
      forTerm: forTerm.value!
    }
    const created = await api.addCourse(payload)
    emit('course-created', created)
    // reset
    name.value = ''
    selectedInstructorTermId.value = null
    sessionCount.value = 1
    duration.value = 60
    capacity.value = 20
    level.value = null
    forTerm.value = null
  } catch (err) {
    console.error(err)
    alert('خطا در ایجاد درس')
  }
}
</script>
