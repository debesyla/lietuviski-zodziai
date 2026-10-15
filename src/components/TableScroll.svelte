<script lang="ts">
  import type { Snippet } from 'svelte';

  let { label, children }: { label: string; children: Snippet } = $props();
  let scrollable = $state(false);

  // Only a table that overflows becomes a focusable, labelled region, so
  // keyboard users can scroll it without extra tab stops everywhere else.
  function watchOverflow(node: HTMLElement) {
    const update = () => {
      scrollable = node.scrollWidth > node.clientWidth + 1;
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    return { destroy: () => observer.disconnect() };
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="table-scroll"
  role={scrollable ? 'region' : undefined}
  aria-label={scrollable ? label : undefined}
  tabindex={scrollable ? 0 : undefined}
  use:watchOverflow
>
  {@render children()}
</div>
