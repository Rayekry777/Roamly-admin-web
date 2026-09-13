<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElCascader, ElMessage } from "element-plus";
import { http, errorMessage } from "@/api/client";
defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
interface Category {
  id: string;
  name: string;
  children?: Category[];
}
const options = ref<Category[]>([]);
onMounted(async () => {
  try {
    options.value = await http.get("/v1/shop-types/tree");
  } catch (error) {
    ElMessage.error(errorMessage(error));
  }
});
</script>
<template>
  <ElCascader
    :model-value="modelValue || undefined"
    :options="options"
    clearable
    placeholder="全部经营类目"
    :props="{
      value: 'id',
      label: 'name',
      emitPath: false,
      checkStrictly: true,
    }"
    @update:model-value="emit('update:modelValue', String($event || ''))"
  />
</template>
