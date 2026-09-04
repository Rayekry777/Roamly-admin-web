<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage,ElTable,ElTableColumn,ElTag } from "element-plus";
import { listLedger,type LedgerPage } from "@/api/finance";
const loading=ref(false);const data=ref<LedgerPage>({items:[],page:1,size:20,total:0});
async function load(){loading.value=true;try{data.value=await listLedger();}catch(e){ElMessage.error(e instanceof Error?e.message:"加载账本失败");}finally{loading.value=false;}}onMounted(load);
</script>
<template><section class="governance-page"><header class="governance-heading"><div><p>资金与佣金</p><h1>账本分录</h1></div><span class="governance-heading__meta">共 {{data.total}} 条</span></header><section class="governance-table"><ElTable v-loading="loading" :data="data.items" row-key="id" empty-text="暂无账本分录"><ElTableColumn prop="id" label="分录 ID" min-width="180"/><ElTableColumn prop="shopId" label="门店 ID" width="150"/><ElTableColumn prop="entryType" label="业务事件" width="190"/><ElTableColumn prop="accountSide" label="方向" width="100"><template #default="s"><ElTag>{{s.row.accountSide === 'CREDIT' ? '贷方' : '借方'}}</ElTag></template></ElTableColumn><ElTableColumn prop="amount" label="金额（分）" width="130"/><ElTableColumn prop="occurredTime" label="发生时间" min-width="180"/></ElTable></section></section></template>
