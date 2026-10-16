<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import '../app.css';
	import { t } from '$lib/translations';
	import { researchTools } from '$lib/research-tools';

	let { children } = $props();
	const homeUrl = `${base}/`;
	// Research pages belong to the "Žodžiai" section of the menu.
	const navigation = [
		{ href: homeUrl, routes: ['/', ...researchTools.map((tool) => tool.path)], label: 'Žodžiai' },
		{ href: `${homeUrl}duomenu-katalogas`, routes: ['/duomenu-katalogas'], label: 'Duomenys' },
		{ href: `${homeUrl}apie`, routes: ['/apie'], label: 'Apie' }
	];

	function current(routes: string[]) {
		if (page.route.id === routes[0]) return 'page';
		return routes.includes(page.route.id ?? '') ? 'true' : undefined;
	}
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="https://dago.lt/assets/img/dago-icon.png" />
	<link rel="apple-touch-icon" href="https://dago.lt/assets/img/dago-icon.png" />
	<meta name="fediverse:creator" content="@dago@river.group.lt" />
	<link rel="stylesheet" href="https://dago.lt/assets/styles/reset.css?v=20260808" />
	<link rel="stylesheet" href="https://dago.lt/assets/styles/dago.css?v=20260901" />
</svelte:head>

<a class="skip-link" href="#main-content">Pereiti prie turinio</a>

<div class="page">
	<header class="site-header">
		<!-- Plain text, as on the dago.lt tools; "Žodžiai" in the menu is the way home. -->
		<h1>dažniausi lietuviški žodžiai <a href="https://dago.lt" class="dago-link print-a-no-link">// dago</a></h1>
		<nav class="site-navigation" aria-label={t('siteNavigation')}>
			{#each navigation as item, index}
				{#if index > 0}<span class="inline-separator" aria-hidden="true">//</span>{/if}
				<a href={item.href} aria-current={current(item.routes)}>{item.label}</a>
			{/each}
		</nav>
	</header>

	<div id="main-content">
		{@render children?.()}
	</div>

	<footer class="site-footer">
		<p>Svetainė yra atvirojo kodo (GPL-3.0-or-later): <a href="https://github.com/debesyla/lietuviski-zodziai" target="_blank" rel="noopener">github.com/debesyla/lietuviski-zodziai</a>. Duomenims galioja kiekvieno rinkinio licencija.</p>
		<p>Reikia pagalbos su duomenų integracija? Galiu padėti. <strong>labas (sraigė) dago.lt</strong></p>
		<div class="ai-badge"><a href="https://weblog.dago.lt/mano-ai-di-politika" target="_blank" rel="noopener" class="print-a-no-link"><img src="https://dago.lt/assets/img/byai.png" srcset="https://dago.lt/assets/img/byai.png 1x, https://dago.lt/assets/img/byai@2x.png 2x" alt="Sukūrė DI, ne žmogus" width="132" height="43" /></a></div>
	</footer>
</div>
