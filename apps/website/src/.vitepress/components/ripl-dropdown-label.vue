<template>
    <div class="ripl-dropdown-label">
        <slot></slot>
    </div>
</template>

<style scoped>
.ripl-dropdown-label {
    padding: 0.375rem 0.625rem 0.25rem;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--vp-c-text-3);
    user-select: none;
}
</style>
