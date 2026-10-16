<script>
  import { t } from '$lib/translations';
  let { value = $bindable(''), inputId = 'word-search' } = $props();
</script>

<div class="search-bar">
  <label class="sr-only" for={inputId}>{t('searchWords')}</label>
  <input id={inputId} bind:value type="text" placeholder="Žodis arba jo dalis" autocomplete="off" spellcheck="false" />
  {#if value}
    <button type="button" class="text-button" onclick={() => value = ''} aria-label={t('clearSearch')}>✕</button>
  {/if}
</div>

<style>
  .search-bar { min-width: 0; position: relative; }
  .search-bar input { padding-right: 3rem; }
  button { bottom: 0; min-width: 2.75rem; position: absolute; right: 0; text-decoration: none; top: 0; }
</style>
