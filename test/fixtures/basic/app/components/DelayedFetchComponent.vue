<template>
  <div>
    fetch-data: {{ data }}
  </div>
</template>

<script setup lang="ts">
const { data } = await useAsyncData('delayed-fetch', () => $fetch('/api/hey'))
</script>
