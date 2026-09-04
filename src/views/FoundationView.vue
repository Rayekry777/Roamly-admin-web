<script setup lang="ts">
import { Compass } from "@element-plus/icons-vue";
</script>

<template>
  <main class="foundation">
    <header class="foundation__header">
      <span class="foundation__mark" aria-hidden="true"><Compass /></span>
      <strong>Roamly</strong>
      <span class="foundation__context">平台管理</span>
    </header>

    <section class="foundation__content" aria-labelledby="foundation-title">
      <p class="foundation__eyebrow">ROAMLY OPERATIONS</p>
      <h1 id="foundation-title">运营工作台</h1>
      <p class="foundation__subtitle">城市生活，从这里有序发生。</p>
      <div class="foundation__rule" aria-hidden="true">
        <span />
        <span />
      </div>
    </section>
  </main>
</template>

<style scoped>
.foundation {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
  padding: 0 48px 48px;
}

.foundation__header {
  display: flex;
  align-items: center;
  min-height: 72px;
  border-bottom: 1px solid var(--roamly-border);
  gap: 12px;
}

.foundation__header strong {
  font-size: 20px;
}

.foundation__mark {
  display: grid;
  width: 34px;
  height: 34px;
  color: #fff;
  background: var(--roamly-primary);
  border-radius: var(--roamly-control-radius);
  place-items: center;
}

.foundation__mark svg {
  width: 20px;
}

.foundation__context {
  padding-left: 12px;
  color: var(--roamly-muted);
  border-left: 1px solid var(--roamly-border);
  font-size: 14px;
}

.foundation__content {
  align-self: center;
  width: min(680px, 100%);
  padding: 72px 0;
}

.foundation__eyebrow {
  margin: 0 0 16px;
  color: var(--roamly-accent);
  font-size: 13px;
  font-weight: 700;
}

.foundation h1 {
  margin: 0;
  font-size: 64px;
  font-weight: 750;
  line-height: 1.08;
}

.foundation__subtitle {
  margin: 20px 0 0;
  color: var(--roamly-muted);
  font-size: 18px;
  line-height: 1.7;
}

.foundation__rule {
  display: grid;
  grid-template-columns: minmax(80px, 180px) minmax(48px, 96px);
  gap: 10px;
  margin-top: 40px;
}

.foundation__rule span {
  height: 4px;
  background: var(--roamly-primary);
  border-radius: 2px;
}

.foundation__rule span:last-child {
  background: var(--roamly-accent);
}

@media (max-width: 640px) {
  .foundation {
    padding: 0 20px 28px;
  }

  .foundation__header {
    min-height: 62px;
  }

  .foundation__content {
    padding: 52px 0;
  }

  .foundation h1 {
    font-size: 44px;
  }
}
</style>
