<template>
  <v-card class="pa-4" style="position:relative;">
    <v-overlay :model-value="loading" absolute>
      <v-progress-circular indeterminate size="64" />
    </v-overlay>

    <v-row>
      <v-col cols="12" md="6">
        <v-text-field v-model="name" label="نام درس" maxlength="200" />

        <!-- ترم برای انتخاب instructorTerm -->
        <v-select
          :items="termSelectItems"
          :model-value="selectedTermForInstructor"
          @update:model-value="onTermSelected"
          item-title="label"
          item-value="value"
          label="ترم (برای انتخاب استاد-ترم)"
          :loading="loadingTerms"
          :disabled="loadingTerms"
        >
          <template #append-item>
            <v-list-item v-if="hasMoreTerms" @click.stop.prevent="loadMoreTerms">
              <v-list-item-content class="text-center">
                <v-list-item-title>بارگذاری موارد بعدی...</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-select>

        <!-- ترم نهایی (برای ارسال به API) -->
        <v-text-field
          v-model.number="forTerm"
          label="ترم نهایی (۱ تا ۱۲)"
          type="number"
          min="1"
          max="12"
        />
      </v-col>

      <v-col cols="12" md="6">
        <!-- instructorTerm -->
        <v-select
          :items="instructorTermSelectItems"
          :model-value="selectedInstructorTermId"
          @update:model-value="onInstructorSelect"
          item-title="label"
          item-value="value"
          label="استاد"
          :disabled="!selectedTermForInstructor || loadingInstructorTerms"
          :loading="loadingInstructorTerms"
        >
          <template #append-item>
            <v-list-item v-if="hasMoreInstructorTerms" @click.stop.prevent="loadMoreInstructorTerms">
              <v-list-item-content class="text-center">
                <v-list-item-title>بارگذاری موارد بعدی...</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-select>

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

    <!-- بخش فیلتر و سرچ -->
    <v-divider class="my-3" />
    <v-row>
      <v-col cols="12" md="4">
        <v-text-field v-model="filterName" label="نام درس (فیلتر)" />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          :items="termSelectItems"
          :model-value="filterTerm"
          @update:model-value="onFilterTermSelected"
          item-title="label"
          item-value="value"
          label="ترم (برای فیلتر استاد-ترم)"
          :loading="loadingTerms"
          :disabled="loadingTerms"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          :items="instructorTermSelectItemsFilter"
          :model-value="filterInstructorTermId"
          @update:model-value="val => filterInstructorTermId = val"
          item-title="label"
          item-value="value"
          label="استاد (فیلتر)"
          :disabled="!filterTerm || loadingInstructorTerms"
          :loading="loadingInstructorTerms"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-btn color="secondary" @click="() => searchCourses(1)">جستجو</v-btn>
      </v-col>
    </v-row>

    <v-divider class="my-3" />

    <!-- نمایش کارت‌ها: هر درس یک کارت زیبا -->
    <v-row class="g-4">
      <v-col
        v-for="course in coursesSearchResult"
        :key="course.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card elevation="3" class="pa-3">
          <v-row align="center" no-gutters>
            <v-col cols="9">
              <div class="d-flex flex-column">
                <div class="text-h6">{{ course.name }}</div>
                <div class="text-subtitle-2 text--secondary">ID: {{ course.id }}</div>
              </div>
            </v-col>
            <v-col cols="3" class="d-flex justify-end">
              <v-chip small>{{ prettyLevel(course.level) }}</v-chip>
            </v-col>
          </v-row>

          <v-divider class="my-2" />

          <div class="d-flex justify-space-between align-center">
            <div>
              <div><strong>استاد:</strong> {{ course.instructorName ?? '-' }}</div>
            </div>

            <div>
              <!-- فقط همین دکمه تغییر کرد: مشاهده -> حذف -->
              <v-btn color="red" text small @click="() => deleteCourse(course.id)">حذف</v-btn>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col v-if="!coursesSearchResult.length" cols="12">
        <v-alert type="info" dense>هیچ نتیجه‌ای یافت نشد.</v-alert>
      </v-col>
    </v-row>

    <v-row justify="center" class="mt-4">
      <v-btn @click="() => loadPrevPage()" :disabled="coursePage <= 1">قبلی</v-btn>
      <span class="mx-3">صفحه {{ coursePage }}</span>
      <v-btn @click="() => loadNextPage()" :disabled="!hasMoreCourses">بعدی</v-btn>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import type { Term } from '../types'

const props = defineProps<{
  instructorTerms: { label: string, id: number }[],
  terms: Term[],
  coursesLocal: any[]
}>()
const emit = defineEmits<{ (e: 'course-created', c: any): void }>()

/* form state */
const name = ref('')
const forTerm = ref<number | null>(null)
const selectedTermForInstructor = ref<number | null>(null)
const selectedInstructorTermId = ref<number | null>(null)
const sessionCount = ref<number>(1)
const duration = ref<number>(60)
const capacity = ref<number>(20)
const levels = ['phd','graduate','undergraduate']
const level = ref<string | null>(null)

/* terms paging limits (plain numbers, not refs) */
const termLimit = 10
const instructorTermLimit = 10
const termPage = ref(1)
const instructorTermPage = ref(1)
const loading = ref(false)

/* terms */
const termList = ref<{ label: string, value: number }[]>([])
const loadingTerms = ref(false)
const hasMoreTerms = ref(false)
const termSelectItems = computed(() => termList.value)

/* instructorTerms */
const instructorTermList = ref<{ label: string, value: number }[]>([])
const loadingInstructorTerms = ref(false)
const hasMoreInstructorTerms = ref(false)
const instructorTermSelectItems = computed(() => instructorTermList.value)

/* SEARCH state */
const filterName = ref('')
const filterTerm = ref<number | null>(null)
const filterInstructorTermId = ref<number | null>(null)
const instructorTermListFilter = ref<{ label: string, value: number }[]>([])
const instructorTermSelectItemsFilter = computed(() => instructorTermListFilter.value)
const coursesSearchResult = ref<any[]>([])
const coursePage = ref(1)
const courseLimit = 10
const hasMoreCourses = ref(false)

/* load terms */
async function loadTerms(page = 1) {
  loadingTerms.value = true
  loading.value = true
  try {
    const res = await axios.get(`http://localhost:3000/term?page=${page}&limit=${termLimit}`)
    const arr = res.data?.data ?? res.data
    const mapped = arr.map((t: any) => ({
      label: `ترم ${prettyType(t.type)} ${t.yearStart}-${t.yearEnd}`,
      value: t.id
    }))
    if (page === 1) termList.value = mapped
    else termList.value = [...termList.value, ...mapped]
    hasMoreTerms.value = !!(Array.isArray(arr) && arr.length === termLimit)
    termPage.value = page
  } catch (err) {
    console.error('loadTerms', err)
  } finally {
    loadingTerms.value = false
    loading.value = false
  }
}
function loadMoreTerms() {
  loadTerms(termPage.value + 1)
}

/* load instructorTerms */
async function loadInstructorTerms(termId: number, page = 1) {
  loadingInstructorTerms.value = true
  loading.value = true
  try {
    const res = await axios.get(`http://localhost:3000/instructor/term?page=${page}&limit=${instructorTermLimit}&termId=${termId}`)
    const arr = res.data?.data ?? res.data
    const mapped = arr.map((it: any) => ({ label: it.label ?? `${it.name}`, value: it.id }))
    if (page === 1) instructorTermList.value = mapped
    else instructorTermList.value = [...instructorTermList.value, ...mapped]
    hasMoreInstructorTerms.value = !!(Array.isArray(arr) && arr.length === instructorTermLimit)
    instructorTermPage.value = page
  } catch (err) {
    console.error('load instructor terms', err)
  } finally {
    loadingInstructorTerms.value = false
    loading.value = false
  }
}
function loadMoreInstructorTerms() {
  if (selectedTermForInstructor.value) loadInstructorTerms(selectedTermForInstructor.value, instructorTermPage.value + 1)
}

/* handlers */
function onTermSelected(termId: number | null) {
  selectedTermForInstructor.value = termId
  selectedInstructorTermId.value = null
  instructorTermList.value = []
  hasMoreInstructorTerms.value = false
  instructorTermPage.value = 1
  if (termId) loadInstructorTerms(termId, 1)
}
function onInstructorSelect(val: number | null) {
  selectedInstructorTermId.value = val
}

/* handlers filter */
function onFilterTermSelected(termId: number | null) {
  filterTerm.value = termId
  filterInstructorTermId.value = null
  instructorTermListFilter.value = []
  if (termId) loadInstructorTermsForFilter(termId, 1)
}
async function loadInstructorTermsForFilter(termId: number, page = 1) {
  loadingInstructorTerms.value = true
  try {
    const res = await axios.get(`http://localhost:3000/instructor/term?page=${page}&limit=${instructorTermLimit}&termId=${termId}`)
    instructorTermListFilter.value = (res.data?.data ?? res.data).map((it: any) => ({ label: it.label ?? it.name, value: it.id }))
  } finally {
    loadingInstructorTerms.value = false
  }
}

/* validation + create */
function validateCourseInputs() {
  if (!name.value || !name.value.trim()) { alert('نام درس نمی‌تواند خالی باشد.'); return false }
  if (name.value.length > 200) { alert('نام درس بیش از ۲۰۰ کاراکتر است.'); return false }
  if (!forTerm.value || forTerm.value < 1 || forTerm.value > 12) { alert('ترم نهایی باید بین ۱ تا ۱۲ باشد.'); return false }
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
    const res = await axios.post('http://localhost:3000/course', payload)
    const created = res.data
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
    if (err.response?.data?.name === 'DUPLICATE' && err.response?.data?.code === 104) {
      alert('این درس قبلاً اضافه شده است.')
    } else {
      alert('خطا در ایجاد درس')
    }
  }
}

/* search courses */
async function searchCourses(page = 1) {
  coursePage.value = page
  loading.value = true
  try {
    const params: any = { page, limit: courseLimit }
    if (filterName.value) params.name = filterName.value
    if (filterInstructorTermId.value) params.instructorTermId = filterInstructorTermId.value
    const res = await axios.get('http://localhost:3000/course', { params })
    const arr = res.data?.data ?? res.data
    if (page === 1) coursesSearchResult.value = arr
    else coursesSearchResult.value = [...coursesSearchResult.value, ...arr]
    hasMoreCourses.value = !!(Array.isArray(arr) && arr.length === courseLimit)
  } catch (err) {
    console.error('searchCourses', err)
  } finally {
    loading.value = false
  }
}
function loadNextPage() {
  if (hasMoreCourses.value) searchCourses(coursePage.value + 1)
}
function loadPrevPage() {
  if (coursePage.value > 1) searchCourses(coursePage.value - 1)
}

/* delete course */
async function deleteCourse(courseId: number) {
  if (!confirm('آیا مطمئن هستید که می‌خواهید این درس را حذف کنید؟')) return
  try {
    await axios.delete(`http://localhost:3000/course/${courseId}`)
    // remove from local results if present
    coursesSearchResult.value = coursesSearchResult.value.filter(c => c.id !== courseId)
    alert('درس با موفقیت حذف شد.')
  } catch (err: any) {
    if (err.response?.status === 404) {
      alert('درس مورد نظر پیدا نشد. احتمالا قبلا حذف شده است.')
      coursesSearchResult.value = coursesSearchResult.value.filter(c => c.id !== courseId)
    } else {
      console.error('deleteCourse', err)
      alert('خطا در حذف درس')
    }
  }
}

/* helper */
function prettyType(t: string) {
  if (t === 'first') return 'نیم‌سال اول'
  if (t === 'second') return 'نیم‌سال دوم'
  if (t === 'summer') return 'تابستان'
  return t
}
function prettyLevel(l: string) {
  if (!l) return '-'
  if (l.toLowerCase() === 'phd') return 'دکتری'
  if (l.toLowerCase() === 'graduate') return 'فوق‌لیسانس'
  if (l.toLowerCase() === 'undergraduate') return 'کارشناسی'
  return l
}
function onViewCourse(course: any) {
  // placeholder — الان فقط لاگ میکنیم، در صورت نیاز می‌تونیم emit یا modal باز کنیم
  console.log('view course', course)
}

onMounted(() => { loadTerms(1) })
</script>

<style scoped>
/* چند استایل کوچک برای کارت‌ها تا مرتب‌تر باشند */
.v-card .text-h6 {
  font-weight: 600;
}
</style>
