<template>
  <div>
    hydrate-when-fetch:
    <LazyDelayedFetchComponent
      data-testid="hydrate-when-fetch"
      :hydrate-when="true"
    />
    <div style="height:3000px">
      This is a very tall div
    </div>
    hydrate-on-visible-fetch:
    <LazyDelayedFetchComponent
      data-testid="hydrate-on-visible-fetch"
      hydrate-on-visible
    />
  </div>
</template>
