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
    font-size: 1.05rem;
    padding: var(--sm) 3.25rem var(--sm) 0.75rem;
    width: 100%;
  }

  button {
    background: transparent;
    min-width: 44px;
    padding: 0;
    position: absolute;
    right: 0;
    top: 0;
  }

</style>
