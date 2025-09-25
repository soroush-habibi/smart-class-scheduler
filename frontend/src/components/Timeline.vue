<template>
  <v-card class="pa-4">
    <v-row align="center" class="mb-4">
      <v-col cols="12" md="6">
        <v-select
          v-model="selectedTermId"
          :items="termSelectItems"
          item-title="label"
          item-value="value"
          label="انتخاب ترم"
          :loading="loadingTerms"
          :disabled="loadingTerms"
          dense
        />
      </v-col>

      <v-col cols="12" md="3">
        <v-btn color="primary" :loading="generating" :disabled="!selectedTermId" @click="generate">
          Generate
        </v-btn>
      </v-col>

      <v-col cols="12" md="3" class="text-right">
        <small class="text--secondary">روزها: Sat → Wed</small>
      </v-col>
    </v-row>

    <v-divider />

    <div class="timeline-wrapper" v-if="layoutSessions.length">
      <div class="time-scale mb-2">
        <div v-for="tick in timeScaleTicks" :key="tick" class="tick">
          {{ tick }}
        </div>
      </div>

      <div v-for="(day, idx) in daysOrder" :key="day" class="day-row">
        <div class="day-label">{{ day }}</div>
        <div class="day-timeline" :style="{ height: dayHeights[day] + 'px' }">
          <div
            v-for="(gridline, gidx) in gridlines"
            :key="gidx"
            class="gridline"
            :style="{ left: gridline.left + '%', opacity: gridline.opacity }"
          ></div>
          <v-tooltip
            v-for="s in sessionsByDay[day] || []"
            :key="s._uid"
            location="top"
            :text="tooltipText(s)"
          >
            <template v-slot:activator="{ props }">
              <div
                v-bind="props"
                class="course-block"
                :class="['color-' + colorIndex(s.courseId), { small: tileWidth(s) < 6 }]"
                :style="blockStyle(s)"
              >
                {{ s.courseName }} · R{{ s.roomId }}
              </div>
            </template>
          </v-tooltip>
        </div>
      </div>
    </div>

    <div v-else class="py-6">
      <v-alert type="info" dense>
        هنوز برنامه‌ای تولید نشده. یک ترم انتخاب کن و دکمهٔ Generate را بزن.
      </v-alert>
    </div>

    <v-divider class="my-4" />

    <!-- <div>
      <h4 class="mb-2">Raw output (debug)</h4>
      <pre class="raw-output">{{ prettyRaw }}</pre>
    </div> -->
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'

type Day = 'Sat' | 'Sun' | 'Mon' | 'Tue' | 'Wed'

/* global UID so each session always unique */
let GLOBAL_UID = 1

/* state */
const selectedTermId = ref<number | null>(null)

/* term paging for select (10 at a time + "more" sentinel) */
const termList = ref<{ label: string; value: number }[]>([])
const termPage = ref(1)
const termLimit = 10
const loadingTerms = ref(false)
const hasMoreTerms = ref(false)
const termSelectItems = computed(() => {
  const arr = [...termList.value]
  if (hasMoreTerms.value) arr.push({ label: 'بارگذاری موارد بعدی...', value: -1 })
  return arr
})

/* when user chooses sentinel -1 load more and reset selection */
watch(selectedTermId, (v) => {
  if (v === -1) {
    loadTerms(termPage.value + 1).then(() => {
      // reset selection, keep it empty so user re-select
      selectedTermId.value = null
    })
  }
})

const generating = ref(false)
const scheduleRaw = ref<any | null>(null) // response.data

// days order we render (y-axis)
const daysOrder: Day[] = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed']

/* layout constants */
const TL_START = 8
const TL_END = 18
const TOTAL_MINUTES = (TL_END - TL_START) * 60
const LANE_HEIGHT = 48
const LANE_GAP = 6
const TICK_INTERVAL_MINUTES = 30

/* helpers: parse time HH:MM -> minutes since midnight */
function parseTimeToMinutes(t: string) {
  const [hh, mm] = t.split(':').map((x) => parseInt(x, 10))
  return hh * 60 + mm
}

/* minutes from TL_START */
function minutesFromStart(t: string) {
  const mins = parseTimeToMinutes(t)
  return mins - TL_START * 60
}

/* flatten schedule into sessions with minute fields */
const scheduleFlatten = computed(() => {
  const out: any[] = []
  const arr = scheduleRaw.value?.data?.schedule ?? []
  for (const course of arr) {
    const cid = course.courseId
    const cname = course.courseName
    for (const s of course.sessions || []) {
      out.push({
        _uid: GLOBAL_UID++,
        courseId: cid,
        courseName: cname,
        day: s.day as Day,
        start: s.start,
        end: s.end,
        startMin: minutesFromStart(s.start),
        endMin: minutesFromStart(s.end),
        roomId: s.roomId
      })
    }
  }
  return out
})

/* LAYOUT: assign lanes per day to avoid overlaps */
const layoutSessions = computed(() => {
  const all = scheduleFlatten.value
  const byDay: Record<string, any[]> = {}
  for (const d of daysOrder) byDay[d] = []
  for (const s of all) {
    if (!byDay[s.day]) byDay[s.day] = []
    let sStart = Math.max(0, s.startMin)
    let sEnd = Math.min(TOTAL_MINUTES, s.endMin)
    byDay[s.day].push({ ...s, startMin: sStart, endMin: sEnd })
  }

  // for each day compute lanes
  for (const d of daysOrder) {
    const arr = byDay[d]
    // sort by start then by duration
    arr.sort((a, b) => a.startMin - b.startMin || (a.endMin - a.startMin) - (b.endMin - b.startMin))
    const lanes: { lastEnd: number }[] = []
    for (const s of arr) {
      // find first lane that is free
      let found = -1
      for (let i = 0; i < lanes.length; i++) {
        if (s.startMin >= lanes[i].lastEnd) { found = i; break }
      }
      if (found === -1) {
        lanes.push({ lastEnd: s.endMin })
        s._lane = lanes.length - 1
      } else {
        s._lane = found
        lanes[found].lastEnd = s.endMin
      }
    }
    byDay[d] = arr
    dayLaneCounts.value[d] = lanes.length || 1
  }

  // flatten back preserving day order
  const flattened: any[] = []
  for (const d of daysOrder) {
    for (const s of byDay[d] || []) {
      flattened.push(s)
    }
  }

  return flattened
})

/* reactive holder for lane counts per day */
const dayLaneCounts = ref<Record<Day, number>>({
  Sat: 1, Sun: 1, Mon: 1, Tue: 1, Wed: 1
})

/* computed heights per day */
const dayHeights = computed(() => {
  const heights: Record<string, number> = {}
  for (const d of daysOrder) {
    const lanes = dayLaneCounts.value[d]
    heights[d] = lanes * LANE_HEIGHT + (lanes - 1) * LANE_GAP + 8
  }
  return heights
})

/* group by day for rendering */
const sessionsByDay = computed(() => {
  const m: Record<string, any[]> = {}
  for (const d of daysOrder) m[d] = []
  for (const s of layoutSessions.value) {
    if (!m[s.day]) m[s.day] = []
    m[s.day].push(s)
  }
  return m
})

/* time scale ticks */
const timeScaleTicks = computed(() => {
  const ticks: string[] = []
  for (let i = 0; i <= TL_END - TL_START; i++) {
    const hour = TL_START + i
    ticks.push((hour < 10 ? '0' + hour : hour) + ':00')
  }
  return ticks
})

/* gridlines */
const gridlines = computed(() => {
  const ticksCount = Math.ceil(TOTAL_MINUTES / TICK_INTERVAL_MINUTES)
  const lines: { left: number; opacity: number }[] = []
  for (let t = 0; t <= ticksCount; t++) {
    const mm = t * TICK_INTERVAL_MINUTES
    const left = (mm / TOTAL_MINUTES) * 100
    const opacity = (mm % 60 === 0) ? 0.25 : 0.08
    lines.push({ left, opacity })
  }
  return lines
})

/* block style: left%, width%, top by lane */
function blockStyle(s: any) {
  const leftPct = (s.startMin / TOTAL_MINUTES) * 100
  const widthPct = ((s.endMin - s.startMin) / TOTAL_MINUTES) * 100
  const top = (s._lane * (LANE_HEIGHT + LANE_GAP) + 5) + 'px'
  return {
    left: leftPct + '%',
    width: widthPct + '%',
    top
  }
}

/* tile width for small class */
function tileWidth(s: any) {
  return ((s.endMin - s.startMin) / TOTAL_MINUTES) * 100
}

/* color index */
function colorIndex(courseId: string) {
  let s = 0
  for (let i = 0; i < courseId.length; i++) s += courseId.charCodeAt(i)
  return s % 8
}

/* tooltip text */
function tooltipText(s: any) {
  return `${s.courseName} — R${s.roomId}\n${s.start} - ${s.end}`
}

/* pretty raw for debugging */
const prettyRaw = computed(() => {
  try {
    return JSON.stringify(scheduleRaw.value, null, 2)
  } catch {
    return String(scheduleRaw.value)
  }
})

/* API: load terms (paged) */
async function loadTerms(page = 1) {
  loadingTerms.value = true
  try {
    const res = await axios.get('http://localhost:3000/term?page=' + page + '&limit=' + termLimit)
    const arr = res.data?.data ?? res.data
    const mapped = (arr || []).map((t: any) => ({
      label: `${prettyType(t.type)} ${t.yearStart}-${t.yearEnd}`,
      value: t.id
    }))
    if (page === 1) termList.value = mapped
    else termList.value = [...termList.value, ...mapped]
    hasMoreTerms.value = !!(Array.isArray(arr) && arr.length === termLimit)
    termPage.value = page
  } catch (err: any) {
    console.error('loadTerms', err)
  } finally {
    loadingTerms.value = false
  }
}

/* generate schedule */
async function generate() {
  if (!selectedTermId.value) return
  generating.value = true
  scheduleRaw.value = null
  try {
    const res = await axios.post('http://localhost:3000/generate', { termId: selectedTermId.value })
    scheduleRaw.value = res.data
  } catch (err: any) {
    console.error('generate', err)
    const msg = (err as any)?.response?.data?.message ?? 'خطا در تولید برنامه'
    alert(msg)
  } finally {
    generating.value = false
  }
}

/* pretty type */
function prettyType(t: string) {
  if (t === 'first') return 'نیم‌سال اول'
  if (t === 'second') return 'نیم‌سال دوم'
  if (t === 'summer') return 'تابستان'
  return t
}

/* mount */
onMounted(() => {
  loadTerms(1)
})
</script>

<style scoped>
.timeline-wrapper {
  position: relative;
  margin-top: 16px;
}

.time-scale {
  display: flex;
  gap: 0;
  margin-bottom: 8px;
  background: transparent;
  user-select: none;
  margin-left: 80px; /* align with day-label width + gap */
}

.time-scale .tick {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: #333;
  border-left: 1px solid rgba(0, 0, 0, 0.06);
  padding: 6px 0;
  background: #fff;
}

.time-scale .tick:first-child {
  border-left: none;
}

.day-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  align-items: flex-start;
}

.day-label {
  width: 72px;
  min-width: 72px;
  text-align: right;
  padding-right: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #222;
}

.day-timeline {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
  width: 100%;
  overflow: visible;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.02) inset;
  min-height: calc(48px + 6px);
}

.day-timeline .gridline {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(0, 0, 0, 0.03);
  pointer-events: none;
}

.course-block {
  position: absolute;
  height: 48px;
  border-radius: 6px;
  color: #fff;
  padding: 6px 8px;
  font-size: 13px;
  line-height: 36px;
  box-sizing: border-box;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  cursor: default;
}

.course-block.small {
  font-size: 11px;
  padding: 4px 6px;
}

.color-0 {
  background: #4CAF50;
}

.color-1 {
  background: #2196F3;
}

.color-2 {
  background: #FF9800;
}

.color-3 {
  background: #9C27B0;
}

.color-4 {
  background: #F44336;
}

.color-5 {
  background: #3F51B5;
}

.color-6 {
  background: #00BCD4;
}

.color-7 {
  background: #8BC34A;
}

/* raw output */
.raw-output {
  max-height: 240px;
  overflow: auto;
  background: #111;
  color: #fff;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
}

@media (max-width: 600px) {
  .day-label {
    width: 58px;
    min-width: 58px;
    font-size: 13px;
  }

  .course-block {
    height: 42px;
    line-height: 34px;
  }
}
</style>