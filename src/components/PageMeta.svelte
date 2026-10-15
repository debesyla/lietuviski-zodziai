<script lang="ts">
  import { site } from '$lib/site';

  let { title, description = site.description, url }: { title: string; description?: string; url: string } = $props();
  const imageAlt = 'Lietuviški žodžiai – viešų lietuvių kalbos dažnumo sąrašų tyrinėjimas';
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={url} />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="lt_LT" />
  <meta property="og:site_name" content={site.name} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  <meta property="og:image" content={site.socialImageUrl} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={imageAlt} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={site.socialImageUrl} />
  <meta name="twitter:image:alt" content={imageAlt} />
</svelte:head>
