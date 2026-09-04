<script setup lang="ts">
import type { BusinessDayHours } from "@/types/governance";
import { dayLabel } from "@/utils/governance";

defineProps<{ hours: BusinessDayHours[] }>();
</script>

<template>
  <div class="business-hours">
    <div v-for="day in hours" :key="day.dayOfWeek" class="business-hours__row">
      <strong>{{ dayLabel(day.dayOfWeek) }}</strong>
      <span v-if="day.closed" class="business-hours__closed">休息</span>
      <span v-else>
        {{
          day.periods
            .map((period) => `${period.open}-${period.close}`)
            .join("、")
        }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.business-hours {
  display: grid;
  border-top: 1px solid var(--roamly-border);
}

.business-hours__row {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  min-height: 34px;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--roamly-border);
  gap: 12px;
  font-size: 13px;
}

.business-hours__row strong {
  font-size: 12px;
}

.business-hours__row span {
  color: #5f5d69;
  overflow-wrap: anywhere;
}

.business-hours__closed {
  color: var(--roamly-muted) !important;
}
</style>
