<template>
    <RiplPlayground />
</template>

<script lang="ts" setup>
// The VitePress default layout (VPLayout) already renders the site nav bar for
// this custom `layout: playground` page, so we must NOT render our own <VPNav>
// here — doing so produced two stacked nav bars (visible below 960px, where the
// nav is `position: relative`; overlapping and hidden on desktop, where it is
// `position: fixed`). RiplPlayground already offsets itself by --vp-nav-height.
import RiplPlayground from './ripl-playground.vue';
</script>
