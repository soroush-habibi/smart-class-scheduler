<template>
  <v-card class="pa-4">
    <v-card-title>مدیریت اتاق‌ها</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" sm="4">
          <v-text-field v-model.number="newCapacity" label="ظرفیت" type="number" />
        </v-col>
        <v-col cols="12" sm="3">
          <v-btn color="primary" @click="addRoom" :loading="submitting">افزودن اتاق</v-btn>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <v-row>
        <v-col cols="12" md="4">
          <v-select
            v-model="limit"
            :items="perPageOptions"
            item-title="label"
            item-value="value"
            dense
            hide-details
            label="تعداد در صفحه"
          />
        </v-col>

        <v-col cols="12" md="8" class="d-flex align-center justify-end">
          <v-btn class="me-2" :disabled="page === 1" @click="prevPage">صفحه قبل</v-btn>
          <v-btn :disabled="!hasMore" @click="nextPage">صفحه بعد</v-btn>
          <div class="me-4">صفحه {{ page }}</div>
        </v-col>
      </v-row>

      <v-list two-line>
        <v-list-item v-for="room in rooms" :key="room.id">
          <div>
            <div>ظرفیت: {{ room.capacity }}</div>
            <div class="text--secondary">ID: {{ room.id }}</div>
          </div>
        </v-list-item>
      </v-list>

      <v-alert v-if="loading" type="info" dense>در حال بارگذاری...</v-alert>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'

const rooms = ref<{id:number, capacity:number}[]>([])
const newCapacity = ref<number | null>(null)
const submitting = ref(false)
const page = ref(1)
const limit = ref(10)
const loading = ref(false)
const hasMore = ref(false)

const perPageOptions = [
  { label: '10 / صفحه', value: 10 },
  { label: '20 / صفحه', value: 20 },
  { label: '50 / صفحه', value: 50 },
]

async function fetchRooms() {
  loading.value = true
  try {
    const res = await axios.get(`http://localhost:3000/room?page=${page.value}&limit=${limit.value}`)
    const arr = res.data.data
    rooms.value = arr
    hasMore.value = Array.isArray(arr) && arr.length === limit.value
  } catch (err) {
    console.error('fetchRooms', err)
  } finally {
    loading.value = false
  }
}

function prevPage() {
  if (page.value > 1) {
    page.value--
    fetchRooms()
  }
}

function nextPage() {
  if (!hasMore.value) return
  page.value++
  fetchRooms()
}

watch(limit, () => {
  page.value = 1
  fetchRooms()
})

onMounted(() => {
  fetchRooms()
})

async function addRoom() {
  if (!newCapacity.value) return
  submitting.value = true
  try {
    await axios.post('http://localhost:3000/room', { capacity: newCapacity.value })
    newCapacity.value = null
    fetchRooms()
  } catch (err) {
    console.error('addRoom', err)
  } finally {
    submitting.value = false
  }
}
</script>
