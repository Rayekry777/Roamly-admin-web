<template>
  <main class="admin-content">
    <slot />
  </main>
</template>

<style scoped>
.admin-content {
  width: min(1600px, 100%);
  padding: 26px 28px 44px;
  margin: 0 auto;
}

@media (max-width: 760px) {
  .admin-content {
    padding: 20px 14px 34px;
  }
}
</style>
