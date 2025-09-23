<template>
  <v-card class="pa-4">
    <v-row>
      <v-col cols="12" md="4">
        <v-text-field v-model.number="capacity" label="ظرفیت" type="number" />
      </v-col>
      <v-col cols="12" md="8" class="d-flex align-center">
        <v-btn color="primary" @click="createRoom">افزودن اتاق</v-btn>
      </v-col>
    </v-row>

    <v-divider class="my-3" />

    <v-list>
      <v-list-item v-for="r in rooms" :key="r.id">
        <v-list-item-content>
          <v-list-item-title>R{{r.id}} — ظرفیت: {{ r.capacity }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as api from '../api'

const props = defineProps<{ rooms: { id:number; capacity:number }[] }>()
const emit = defineEmits<{ (e:'room-created', r:any):void }>()

const capacity = ref<number | null>(null)
async function createRoom() {
  if (!capacity.value) { alert('ظرفیت وارد کنید'); return }
  try {
    const created = await api.addRoom({ capacity: capacity.value })
    emit('room-created', created)
    capacity.value = null
  } catch (err) {
    console.error(err)
    alert('خطا در ایجاد اتاق')
  }
}
</script>
