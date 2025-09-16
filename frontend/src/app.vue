<script setup lang="ts">
import { ref, reactive } from "vue";
import type { Day, Instructor, Course, Room } from "./types";

const tab = ref<"instructors" | "courses" | "rooms">("instructors");

const days: Day[] = ["Sat", "Sun", "Mon", "Tue", "Wed"];

// ---------------- Instructors ----------------
const instructors = reactive<Instructor[]>([]);
const newInstructor = reactive<Omit<Instructor, "id">>({
  name: "",
  maxDailyMinutes: 0,
  maxWeeklyMinutes: 0,
  availableDays: [],
});

const addInstructor = () => {
  const id = `I${instructors.length + 1}`;
  instructors.push({ id, ...newInstructor });
  newInstructor.name = "";
  newInstructor.maxDailyMinutes = 0;
  newInstructor.maxWeeklyMinutes = 0;
  newInstructor.availableDays = [];
};

// ---------------- Courses ----------------
const courses = reactive<Course[]>([]);
const newCourse = reactive<Omit<Course, "id">>({
  instructorId: "",
  name: "",
  sessionCount: 1,
  duration: 60,
  capacity: 0,
  level: "Undergraduate",
  term: 1,
});

const addCourse = () => {
  const id = `C${courses.length + 1}`;
  courses.push({ id, ...newCourse });
  newCourse.instructorId = "";
  newCourse.name = "";
  newCourse.sessionCount = 1;
  newCourse.duration = 60;
  newCourse.capacity = 0;
  newCourse.level = "Undergraduate";
  newCourse.term = 1;
};

// ---------------- Rooms ----------------
const rooms = reactive<Room[]>([]);
const newRoom = reactive<Omit<Room, "id">>({
  capacity: 0,
});

const addRoom = () => {
  const id = `R${rooms.length + 1}`;
  rooms.push({ id, ...newRoom });
  newRoom.capacity = 0;
};

// ---------------- Output ----------------
const output = ref<any>(null);

const generateSchedule = async () => {
  const payload = {
    instructors,
    courses,
    rooms,
  };

  // اینجا به بک‌اند POST می‌زنیم
  const res = await fetch("http://localhost:3000/schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  output.value = await res.json();
};
</script>

<template>
  <div class="container mt-3">
    <!-- Tabs -->
    <ul class="nav nav-tabs">
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: tab === 'instructors' }"
          @click="tab = 'instructors'"
        >
          Instructors
        </button>
      </li>
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: tab === 'courses' }"
          @click="tab = 'courses'"
        >
          Courses
        </button>
      </li>
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: tab === 'rooms' }"
          @click="tab = 'rooms'"
        >
          Rooms
        </button>
      </li>
    </ul>

    <!-- Instructor Tab -->
    <div v-if="tab === 'instructors'" class="mt-3">
      <h5>Add Instructor</h5>
      <input v-model="newInstructor.name" placeholder="Name" class="form-control mb-2" />
      <input
        v-model.number="newInstructor.maxDailyMinutes"
        type="number"
        placeholder="Max Daily Minutes"
        class="form-control mb-2"
      />
      <input
        v-model.number="newInstructor.maxWeeklyMinutes"
        type="number"
        placeholder="Max Weekly Minutes"
        class="form-control mb-2"
      />
      <div class="mb-2">
        <label>Available Days:</label>
        <div v-for="day in days" :key="day" class="form-check form-check-inline">
          <input
            class="form-check-input"
            type="checkbox"
            :value="day"
            v-model="newInstructor.availableDays"
          />
          <label class="form-check-label">{{ day }}</label>
        </div>
      </div>
      <button @click="addInstructor" class="btn btn-primary">Add Instructor</button>

      <ul class="mt-3 list-group">
        <li v-for="i in instructors" :key="i.id" class="list-group-item">
          {{ i.id }} - {{ i.name }} (Daily: {{ i.maxDailyMinutes }}, Weekly: {{ i.maxWeeklyMinutes
          }}, Days: {{ i.availableDays.join(', ') }})
        </li>
      </ul>
    </div>

    <!-- Course Tab -->
    <div v-if="tab === 'courses'" class="mt-3">
      <h5>Add Course</h5>
      <select v-model="newCourse.instructorId" class="form-select mb-2">
        <option disabled value="">Select Instructor</option>
        <option v-for="i in instructors" :key="i.id" :value="i.id">{{ i.id }} - {{ i.name }}</option>
      </select>
      <input v-model="newCourse.name" placeholder="Course Name" class="form-control mb-2" />
      <input
        v-model.number="newCourse.sessionCount"
        type="number"
        min="1"
        max="2"
        placeholder="sessionCount (1 or 2)"
        class="form-control mb-2"
      />
      <input
        v-model.number="newCourse.duration"
        type="number"
        placeholder="Duration (minutes)"
        class="form-control mb-2"
      />
      <input
        v-model.number="newCourse.capacity"
        type="number"
        placeholder="Capacity"
        class="form-control mb-2"
      />
      <select v-model="newCourse.level" class="form-select mb-2">
        <option>Undergraduate</option>
        <option>Graduate</option>
        <option>PhD</option>
      </select>
      <input
        v-model.number="newCourse.term"
        type="number"
        placeholder="Term (1, 2, 3, ...)"
        class="form-control mb-2"
      />
      <button @click="addCourse" class="btn btn-primary">Add Course</button>

      <ul class="mt-3 list-group">
        <li v-for="c in courses" :key="c.id" class="list-group-item">
          {{ c.id }} - {{ c.name }} (Instructor: {{ c.instructorId }}, sessionCount: {{ c.sessionCount }},
          Duration: {{ c.duration }}min, Cap: {{ c.capacity }}, Level: {{ c.level }}, Term: {{ c.term
          }})
        </li>
      </ul>
    </div>

    <!-- Room Tab -->
    <div v-if="tab === 'rooms'" class="mt-3">
      <h5>Add Room</h5>
      <input v-model.number="newRoom.capacity" type="number" placeholder="Capacity" class="form-control mb-2" />
      <button @click="addRoom" class="btn btn-primary">Add Room</button>

      <ul class="mt-3 list-group">
        <li v-for="r in rooms" :key="r.id" class="list-group-item">
          {{ r.id }} - Capacity: {{ r.capacity }}
        </li>
      </ul>
    </div>

    <!-- Generate Schedule -->
    <div class="mt-3">
      <button @click="generateSchedule" class="btn btn-success">Generate</button>
    </div>

    <!-- Output -->
    <div class="mt-3">
      <h5>Output Timeline:</h5>
      <pre>{{ JSON.stringify(output, null, 2) }}</pre>
    </div>
  </div>
</template>
