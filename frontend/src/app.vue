<script setup lang="ts">
import { ref } from "vue";
import type { Term, Instructor, Course, Room, Day, TermSeason, Level } from "./types";

// تب فعال
const tab = ref<"terms" | "instructors" | "courses" | "rooms">("terms");

// داده‌ها
const terms = ref<Term[]>([]);
const instructors = ref<Instructor[]>([]);
const courses = ref<Course[]>([]);
const rooms = ref<Room[]>([]);

// شمارنده‌ها برای ساخت ID
let termCounter = 1;
let instructorCounter = 1;
let courseCounter = 1;
let roomCounter = 1;

// ✅ فرم ترم
const newTerm = ref<{ yearStart: number; yearEnd: number; season: TermSeason | "" }>({
  yearStart: 0,
  yearEnd: 0,
  season: "",
});

const addTerm = () => {
  if (!newTerm.value.yearStart || !newTerm.value.yearEnd || !newTerm.value.season) {
    alert("همه فیلدهای ترم الزامی هستند.");
    return;
  }
  if (newTerm.value.yearEnd !== newTerm.value.yearStart + 1) {
    alert("سال پایان باید یک واحد بیشتر از سال شروع باشد.");
    return;
  }
  const duplicate = terms.value.find(
    (t) =>
      t.yearStart === newTerm.value.yearStart &&
      t.season === newTerm.value.season
  );
  if (duplicate) {
    alert("این ترم برای این سال و نیم‌سال قبلاً ثبت شده است.");
    return;
  }
  terms.value.push({
    id: `T${termCounter++}`,
    yearStart: newTerm.value.yearStart,
    yearEnd: newTerm.value.yearEnd,
    season: newTerm.value.season as TermSeason,
  });
  newTerm.value = { yearStart: 0, yearEnd: 0, season: "" };
};

// ✅ فرم استاد
const days: Day[] = ["Sat", "Sun", "Mon", "Tue", "Wed"];
const newInstructor = ref<{ name: string; maxDailyMinutes: number; maxWeeklyMinutes: number; availableDays: Day[] }>({
  name: "",
  maxDailyMinutes: 0,
  maxWeeklyMinutes: 0,
  availableDays: [],
});

const addInstructor = () => {
  if (!newInstructor.value.name || !newInstructor.value.maxDailyMinutes || !newInstructor.value.maxWeeklyMinutes || newInstructor.value.availableDays.length === 0) {
    alert("همه فیلدهای استاد الزامی هستند.");
    return;
  }
  instructors.value.push({
    id: `I${instructorCounter++}`,
    name: newInstructor.value.name,
    maxDailyMinutes: newInstructor.value.maxDailyMinutes,
    maxWeeklyMinutes: newInstructor.value.maxWeeklyMinutes,
    availableDays: [...newInstructor.value.availableDays],
  });
  newInstructor.value = { name: "", maxDailyMinutes: 0, maxWeeklyMinutes: 0, availableDays: [] };
};

// ✅ فرم درس
const newCourse = ref<{ name: string; instructorId: string; sessions: number; duration: number; capacity: number; level: Level | ""; termId: string }>({
  name: "",
  instructorId: "",
  sessions: 1,
  duration: 0,
  capacity: 0,
  level: "",
  termId: "",
});

const addCourse = () => {
  if (!newCourse.value.name || !newCourse.value.instructorId || !newCourse.value.sessions || !newCourse.value.duration || !newCourse.value.capacity || !newCourse.value.level || !newCourse.value.termId) {
    alert("همه فیلدهای درس الزامی هستند.");
    return;
  }
  courses.value.push({
    id: `C${courseCounter++}`,
    name: newCourse.value.name,
    instructorId: newCourse.value.instructorId,
    sessions: newCourse.value.sessions,
    duration: newCourse.value.duration,
    capacity: newCourse.value.capacity,
    level: newCourse.value.level as Level,
    termId: newCourse.value.termId,
  });
  newCourse.value = { name: "", instructorId: "", sessions: 1, duration: 0, capacity: 0, level: "", termId: "" };
};

// ✅ فرم اتاق
const newRoom = ref<{ capacity: number }>({ capacity: 0 });

const addRoom = () => {
  if (!newRoom.value.capacity) {
    alert("ظرفیت اتاق الزامی است.");
    return;
  }
  rooms.value.push({
    id: `R${roomCounter++}`,
    capacity: newRoom.value.capacity,
  });
  newRoom.value.capacity = 0;
};

// ✅ خروجی
const output = ref("");
const generate = () => {
  output.value = JSON.stringify(
    {
      terms: terms.value,
      instructors: instructors.value,
      courses: courses.value,
      rooms: rooms.value,
    },
    null,
    2
  );
};
</script>

<template>
  <div class="container mt-4">
    <ul class="nav nav-tabs">
      <li class="nav-item" @click="tab = 'terms'">
        <a class="nav-link" :class="{ active: tab === 'terms' }">ترم‌ها</a>
      </li>
      <li class="nav-item" @click="tab = 'instructors'">
        <a class="nav-link" :class="{ active: tab === 'instructors' }">اساتید</a>
      </li>
      <li class="nav-item" @click="tab = 'courses'">
        <a class="nav-link" :class="{ active: tab === 'courses' }">دروس</a>
      </li>
      <li class="nav-item" @click="tab = 'rooms'">
        <a class="nav-link" :class="{ active: tab === 'rooms' }">اتاق‌ها</a>
      </li>
    </ul>

    <!-- ترم -->
    <div v-if="tab === 'terms'" class="mt-3">
      <h4>افزودن ترم</h4>
      <form @submit.prevent="addTerm" class="row g-3">
        <div class="col-md-4">
          <label class="form-label">سال شروع</label>
          <input type="number" class="form-control" v-model="newTerm.yearStart" required />
        </div>
        <div class="col-md-4">
          <label class="form-label">سال پایان</label>
          <input type="number" class="form-control" v-model="newTerm.yearEnd" required />
        </div>
        <div class="col-md-4">
          <label class="form-label">نیم‌سال</label>
          <select class="form-select" v-model="newTerm.season" required>
            <option disabled value="">انتخاب کنید...</option>
            <option value="First">اول</option>
            <option value="Second">دوم</option>
            <option value="Summer">تابستان</option>
          </select>
        </div>
        <div class="col-12">
          <button type="submit" class="btn btn-primary w-100">افزودن ترم</button>
        </div>
      </form>
      <ul class="list-group mt-3">
        <li v-for="t in terms" :key="t.id" class="list-group-item">
          {{ t.id }} - {{ t.yearStart }}/{{ t.yearEnd }} - {{ t.season }}
        </li>
      </ul>
    </div>

    <!-- استاد -->
    <div v-if="tab === 'instructors'" class="mt-3">
      <h4>افزودن استاد</h4>
      <form @submit.prevent="addInstructor" class="row g-3">
        <div class="col-md-4">
          <label class="form-label">نام</label>
          <input type="text" class="form-control" v-model="newInstructor.name" required />
        </div>
        <div class="col-md-4">
          <label class="form-label">حداکثر دقیقه روزانه</label>
          <input type="number" class="form-control" v-model="newInstructor.maxDailyMinutes" required />
        </div>
        <div class="col-md-4">
          <label class="form-label">حداکثر دقیقه هفتگی</label>
          <input type="number" class="form-control" v-model="newInstructor.maxWeeklyMinutes" required />
        </div>
        <div class="col-12">
          <label class="form-label">روزهای در دسترس</label>
          <div class="form-check form-check-inline" v-for="d in days" :key="d">
            <input class="form-check-input" type="checkbox" :value="d" v-model="newInstructor.availableDays" />
            <label class="form-check-label">{{ d }}</label>
          </div>
        </div>
        <div class="col-12">
          <button type="submit" class="btn btn-primary w-100">افزودن استاد</button>
        </div>
      </form>
      <ul class="list-group mt-3">
        <li v-for="i in instructors" :key="i.id" class="list-group-item">
          {{ i.id }} - {{ i.name }} - {{ i.maxDailyMinutes }}/{{ i.maxWeeklyMinutes }} دقیقه - روزها: {{ i.availableDays.join(", ") }}
        </li>
      </ul>
    </div>

    <!-- درس -->
    <div v-if="tab === 'courses'" class="mt-3">
      <h4>افزودن درس</h4>
      <form @submit.prevent="addCourse" class="row g-3">
        <div class="col-md-3">
          <label class="form-label">نام</label>
          <input type="text" class="form-control" v-model="newCourse.name" required />
        </div>
        <div class="col-md-3">
          <label class="form-label">استاد</label>
          <select class="form-select" v-model="newCourse.instructorId" required>
            <option disabled value="">انتخاب کنید...</option>
            <option v-for="i in instructors" :key="i.id" :value="i.id">{{ i.name }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label">تعداد سشن</label>
          <input type="number" min="1" max="2" class="form-control" v-model="newCourse.sessions" required />
        </div>
        <div class="col-md-2">
          <label class="form-label">مدت (دقیقه)</label>
          <input type="number" class="form-control" v-model="newCourse.duration" required />
        </div>
        <div class="col-md-2">
          <label class="form-label">ظرفیت</label>
          <input type="number" class="form-control" v-model="newCourse.capacity" required />
        </div>
        <div class="col-md-3">
          <label class="form-label">سطح</label>
          <select class="form-select" v-model="newCourse.level" required>
            <option disabled value="">انتخاب کنید...</option>
            <option value="Undergraduate">Undergraduate</option>
            <option value="Graduate">Graduate</option>
            <option value="PhD">PhD</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">ترم</label>
          <select class="form-select" v-model="newCourse.termId" required>
            <option disabled value="">انتخاب کنید...</option>
            <option v-for="t in terms" :key="t.id" :value="t.id">{{ t.yearStart }}/{{ t.yearEnd }} - {{ t.season }}</option>
          </select>
        </div>
        <div class="col-12">
          <button type="submit" class="btn btn-primary w-100">افزودن درس</button>
        </div>
      </form>
      <ul class="list-group mt-3">
        <li v-for="c in courses" :key="c.id" class="list-group-item">
          {{ c.id }} - {{ c.name }} - استاد: {{ c.instructorId }} - ظرفیت: {{ c.capacity }} - سطح: {{ c.level }} - ترم: {{ c.termId }}
        </li>
      </ul>
    </div>

    <!-- اتاق -->
    <div v-if="tab === 'rooms'" class="mt-3">
      <h4>افزودن اتاق</h4>
      <form @submit.prevent="addRoom" class="row g-3">
        <div class="col-md-6">
          <label class="form-label">ظرفیت</label>
          <input type="number" class="form-control" v-model="newRoom.capacity" required />
        </div>
        <div class="col-12">
          <button type="submit" class="btn btn-primary w-100">افزودن اتاق</button>
        </div>
      </form>
      <ul class="list-group mt-3">
        <li v-for="r in rooms" :key="r.id" class="list-group-item">
          {{ r.id }} - ظرفیت: {{ r.capacity }}
        </li>
      </ul>
    </div>

    <!-- خروجی -->
    <div class="mt-4">
      <button class="btn btn-success w-100" @click="generate">Generate</button>
      <pre class="mt-3 bg-dark text-light p-3 rounded">{{ output }}</pre>
    </div>
  </div>
</template>
