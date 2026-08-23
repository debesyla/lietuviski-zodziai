<script>
  import { t } from '$lib/translations';
  let { value = $bindable(''), inputId = 'word-search' } = $props();
</script>

<div class="search-bar">
  <label class="sr-only" for={inputId}>{t('searchWords')}</label>
  <input id={inputId} bind:value type="text" placeholder={t('searchPlaceholder')} />
  {#if value}
  <button type="button" onclick={() => value = ''} aria-label={t('clearSearch')}>✕</button>
  {/if}
</div>

<style>
  .search-bar {
    min-width: 0;
    position: relative;
    width: 100%;
  }

  input {
    background: var(--bg-color);
    border: 1px solid var(--border-strong);
    color: var(--text-color);
    font-size: 1.05rem;
    padding: var(--sm) 3.25rem var(--sm) 0.75rem;
    width: 100%;
  }

  button {
    background: transparent;
    border: 0;
    color: var(--text-color);
    cursor: pointer;
    min-width: 44px;
    padding: 0;
    position: absolute;
    right: 0;
    top: 0;
  }

  .sr-only {
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0;
    position: absolute;
    width: 1px;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }
</style>
