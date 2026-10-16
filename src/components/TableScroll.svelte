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

  // Safari does not scroll a focused overflow region with the arrow keys.
  function scrollWithKeys(event: KeyboardEvent) {
    const region = event.currentTarget as HTMLElement;
    if (event.target !== region) return;
    if (event.key === 'ArrowRight') region.scrollLeft += 160;
    else if (event.key === 'ArrowLeft') region.scrollLeft -= 160;
    else if (event.key === 'Home') region.scrollLeft = 0;
    else if (event.key === 'End') region.scrollLeft = region.scrollWidth;
    else return;
    event.preventDefault();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  class="table-scroll"
  role={scrollable ? 'region' : undefined}
  aria-label={scrollable ? label : undefined}
  tabindex={scrollable ? 0 : undefined}
  onkeydown={scrollable ? scrollWithKeys : undefined}
  use:watchOverflow
>
  {@render children()}
</div>
