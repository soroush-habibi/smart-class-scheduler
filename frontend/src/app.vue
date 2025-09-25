<template>
  <v-app>
    <v-container>
      <v-tabs v-model="tab" grow>
        <v-tab value="terms">ترم‌ها</v-tab>
        <v-tab value="instructors">اساتید</v-tab>
        <v-tab value="courses">دروس</v-tab>
        <v-tab value="rooms">اتاق‌ها</v-tab>
        <v-tab value="generate">تولید</v-tab>
      </v-tabs>

      <div v-if="tab === 'terms'">
        <TermsTab :terms="terms" @term-added="handleTermAdded" />
      </div>

      <div v-if="tab === 'instructors'">
        <InstructorTab
          :instructors="instructors"
          :terms="terms"
          @instructor-created="handleInstructorCreated"
        />
      </div>

      <div v-if="tab === 'courses'">
        <CoursesTab
          :instructorTerms="instructorTerms"
          :terms="terms"
          :coursesLocal="courses"
          @course-created="handleCourseCreated"
        />
      </div>

      <div v-if="tab === 'rooms'">
        <RoomsTab :rooms="rooms" @room-created="handleRoomCreated" />
      </div>

      <!-- NEW: Generate / Timeline tab -->
      <div v-if="tab === 'generate'">
        <!-- Timeline component handles term selection and generate POST -->
        <Timeline />
      </div>
    </v-container>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from "vue";
import TermsTab from "./components/TermsTab.vue";
import InstructorTab from "./components/InstructorTab.vue";
import CoursesTab from "./components/CoursesTab.vue";
import RoomsTab from "./components/RoomsTab.vue";
import Timeline from "./components/Timeline.vue";
import type { Term } from "./types";

const tab = ref<'terms' | 'instructors' | 'courses' | 'rooms' | 'generate'>('terms');

const terms = ref<Term[]>([]);
const instructors = ref<any[]>([]);
const courses = ref<any[]>([]);
const rooms = ref<any[]>([]);
const instructorTerms = ref<any[]>([]);

function handleTermAdded(term: Term) {
  // push new term into local list so other tabs see it
  terms.value.push(term);
}

function handleInstructorCreated(instructor: any) {
  instructors.value.push(instructor);
}

function handleCourseCreated(course: any) {
  courses.value.push(course);
}

function handleRoomCreated(room: any) {
  rooms.value.push(room);
}
</script>

<style scoped>
/* اگر نیاز به استایل خاص داشتی اینجا اضافه کن */
</style>
