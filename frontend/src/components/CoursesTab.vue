<template>
  <v-card class="pa-4">
    <v-row>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="name"
          label="نام درس"
          maxlength="200"
          hint="حداکثر ۲۰۰ کاراکتر"
        />
        <v-select
          v-model="selectedInstructorTermId"
          :items="instructorTermItems"
          label="InstructorTerm (انتخاب کنید)"
        />
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model.number="sessionCount"
          label="تعداد سشن (1 یا 2)"
          type="number"
          min="1"
          max="2"
        />
        <v-text-field
          v-model.number="duration"
          label="مدت (دقیقه)"
          type="number"
          :min="15"
          step="15"
          hint="مضرب ۱۵ و حداقل ۱۵"
        />
        <v-text-field v-model.number="capacity" label="ظرفیت" type="number" />
        <v-select v-model="level" :items="levels" label="سطح" />
        <v-select
          v-model="forTerm"
          :items="termItems"
          item-title="label"
          item-value="value"
          label="برای کدام ترم"
        />
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

    <!-- optional inline error -->
    <v-alert v-if="lastError" type="error" class="mt-4" dense>
      {{ lastError }}
    </v-alert>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import * as api from '../api'
import type { Term } from '../types'

/* Props */
const props = defineProps<{
  instructorTerms: { label: string, id: number }[],
  terms: Term[],
  coursesLocal: any[]
}>()

/* Emits */
const emit = defineEmits<{
  (e: 'course-created', c: any): void
}>()

/* Reactive state */
const name = ref('')
const selectedInstructorTermId = ref<number | null>(null)
const sessionCount = ref<number>(1)
const duration = ref<number>(60)
const capacity = ref<number>(20)
const levels = ['phd', 'graduate', 'undergraduate']
const level = ref<string | null>(null)
const forTerm = ref<number | null>(null)
const lastError = ref<string | null>(null)

/* Computed helpers */
const instructorTermItems = computed(() => props.instructorTerms.map(it => ({ label: it.label, value: it.id })))
const termItems = computed(() => props.terms.map(t => ({ label: `T${t.id} — ${t.yearStart}/${t.yearEnd}`, value: t.id })))

/* Validation (robust) */
function validateCourseInputs(): boolean {
  lastError.value = null

  // name
  if (!name.value || name.value.trim().length === 0) {
    lastError.value = 'نام درس نمی‌تواند خالی باشد.'
    return false
  }
  if (name.value.length > 200) {
    lastError.value = 'نام درس بیش از ۲۰۰ کاراکتر است.'
    return false
  }

  // instructorTerm
  if (selectedInstructorTermId.value === null || selectedInstructorTermId.value === undefined) {
    lastError.value = 'یک InstructorTerm انتخاب کنید.'
    return false
  }

  // sessionCount
  const sess = Number(sessionCount.value)
  if (!Number.isInteger(sess) || !(sess === 1 || sess === 2)) {
    lastError.value = 'تعداد سشن باید عدد صحیح 1 یا 2 باشد.'
    return false
  }

  // duration: ensure numeric integer, >=15 and multiple of 15
  const dur = Number(duration.value)
  if (!Number.isFinite(dur) || !Number.isInteger(dur)) {
    lastError.value = 'مدت باید یک عدد صحیح باشد.'
    return false
  }
  if (dur < 15) {
    lastError.value = 'مدت درس باید حداقل ۱۵ دقیقه باشد.'
    return false
  }
  if (dur % 15 !== 0) {
    lastError.value = 'مدت درس باید مضربی از ۱۵ باشد (مثلاً 15, 30, 45...).'
    return false
  }

  // capacity
  const cap = Number(capacity.value)
  if (!Number.isFinite(cap) || cap <= 0) {
    lastError.value = 'ظرفیت باید عددی بزرگتر از صفر باشد.'
    return false
  }

  // level
  if (!level.value) {
    lastError.value = 'سطح درس را انتخاب کنید.'
    return false
  }

  // forTerm
  if (forTerm.value === null || forTerm.value === undefined) {
    lastError.value = 'ترم مقصد را انتخاب کنید.'
    return false
  }

  // all good
  lastError.value = null
  return true
}

/* Create course: ensure non-nullable values when building payload */
async function createCourse() {
  if (!validateCourseInputs()) return

  try {
    const payload = {
      name: name.value.trim(),
      instructorTermId: selectedInstructorTermId.value!, // safe after validation
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
  } catch (err: any) {
    console.error(err)
    lastError.value = err?.message || 'خطا در ایجاد درس'
  }
}
</script>
