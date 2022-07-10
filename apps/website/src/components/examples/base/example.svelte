<div class="example" layout="row stretch-justify">
    <div self="size-x1">
        <canvas class="example__canvas"></canvas>
    </div>
    {#if $$slots.sidebar}
        <div class="example__sidebar">
            <slot name="sidebar"></slot>
        </div>
    {/if}
</div>

<style lang="scss">

    .example {
        width: 100%;
        height: 100%;
        overflow: hidden;
    }
    
    .example__canvas {
        width: 100%;
        height: 100%;
    }

    .example__sidebar {
        padding: 1rem;
        border-left: 1px solid var(--border__colour);
        overflow-y: auto;
    }

</style>