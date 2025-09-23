<template>
  <v-card class="pa-4">
    <h3>Schedule Output</h3>
    <pre style="max-height:400px; overflow:auto; background:#111; color:#fff; padding:12px; border-radius:6px;">
{{ pretty(output) }}
    </pre>
  </v-card>
</template>

<script setup lang="ts">
import { toRaw } from 'vue'
const props = defineProps<{ output:any }>()
function pretty(o:any) {
  try { return JSON.stringify(o, null, 2) }
  catch { return String(o) }
}
</script>
