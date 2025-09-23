<template>
  <v-card class="pa-4">
    <v-card-title>مدیریت ترم‌ها</v-card-title>
    <v-card-text>
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-row>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="yearStart"
              label="سال شروع"
              type="number"
              :rules="[rules.required, validateMinYear]"
              required
            />
          </v-col>

          <v-col cols="12" sm="4">
            <v-text-field
              v-model="yearEnd"
              label="سال پایان"
              type="number"
              :rules="[rules.required, validateYearLogic]"
              required
            />
          </v-col>

          <v-col cols="12" sm="4">
            <v-select
              v-model="type"
              :items="types"
              item-title="label"
              item-value="value"
              label="نوع ترم"
              :rules="[rules.required]"
              required
            />
          </v-col>
        </v-row>

        <v-row class="mt-3">
          <v-col cols="12" sm="3">
            <v-btn color="primary" @click="addTerm" :disabled="submitting">افزودن ترم</v-btn>
          </v-col>
          <v-col cols="12" sm="9">
            <v-alert v-if="error" type="error" dense>{{ error }}</v-alert>
          </v-col>
        </v-row>
      </v-form>

      <v-divider class="my-4" />

      <v-list>
        <v-list-item v-for="term in terms" :key="term.id">
          <div>
            <div><strong>T{{ term.id }}</strong> — {{ term.yearStart }}/{{ term.yearEnd }}</div>
            <div class="text--secondary">{{ prettyType(term.type) }}</div>
          </div>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import axios from "axios";
import type { Term } from "../types";

const props = defineProps<{
  terms: Term[];
}>();

const emit = defineEmits<{
  (e: "term-added", term: Term): void;
}>();

const valid = ref(false);
const yearStart = ref<number | null>(null);
const yearEnd = ref<number | null>(null);
const type = ref<'first' | 'second' | 'summer' | null>(null);

const submitting = ref(false);
const error = ref<string | null>(null);

const rules = {
  required: (v: any) => !!v || "این فیلد الزامی است",
};

// حداقل سال شروع
const validateMinYear = (v: number) => (v >= 1395) || "سال شروع باید حداقل ۱۳۹۵ باشد";

// منطق مشابه بک‌اند
const validateYearLogic = (v: number) => {
  if (!yearStart.value || !type.value) return true; // هنوز انتخاب نشده
  if (type.value === "summer") {
    return yearStart.value === v || "برای تابستان سال پایان باید برابر سال شروع باشد";
  } else {
    return v - yearStart.value === 1 || "برای نیم‌سال‌ها، سال پایان باید برابر start + 1 باشد";
  }
};

const types = [
  { label: "نیم‌سال اول", value: "first" },
  { label: "نیم‌سال دوم", value: "second" },
  { label: "تابستان", value: "summer" },
];

function prettyType(t: string) {
  if (t === "first") return "نیم‌سال اول";
  if (t === "second") return "نیم‌سال دوم";
  if (t === "summer") return "تابستان";
  return t;
}

async function addTerm() {
  error.value = null;
  if (!yearStart.value || !yearEnd.value || !type.value) {
    error.value = "همه فیلدها الزامی هستند";
    return;
  }

  // بررسی منطق سال قبل از ارسال
  if (type.value === "summer") {
    if (yearStart.value !== yearEnd.value) {
      error.value = "برای تابستان سال پایان باید برابر سال شروع باشد";
      return;
    }
  } else {
    if (yearEnd.value - yearStart.value !== 1) {
      error.value = "برای نیم‌سال‌ها، سال پایان باید برابر start + 1 باشد";
      return;
    }
  }

  const payload = {
    yearStart: yearStart.value,
    yearEnd: yearEnd.value,
    type: type.value,
  };

  submitting.value = true;
  try {
    const res = await axios.post<Term>("http://localhost:3000/term", payload);
    const created: Term = res.data;

    emit("term-added", created);

    yearStart.value = null;
    yearEnd.value = null;
    type.value = null;
  } catch (e: any) {
    console.error("Error adding term:", e);
    error.value = e?.response?.data?.message || "خطا در افزودن ترم";
  } finally {
    submitting.value = false;
  }
}
</script>
