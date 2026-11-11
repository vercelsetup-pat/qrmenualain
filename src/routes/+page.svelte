<script lang="ts">
	import { tick } from 'svelte';
	import type { Category, Item } from '#lib/types.ts';

	let { data }: { data: { categories: Category[]; items: Item[] } } = $props();

	let selectedId = $state<number | null>(null);
	let tabEls = $state<HTMLButtonElement[]>([]);
	let heroEl = $state<HTMLElement>();

	// Only show categories that have at least one item.
	const categories = $derived(
		data.categories.filter((c) => data.items.some((i) => i.categoryId === c.id))
	);
	const active = $derived(categories.find((c) => c.id === selectedId) ?? categories[0]);
	const activeItems = $derived(active ? data.items.filter((i) => i.categoryId === active.id) : []);

	const formatAmount = (price: string) =>
		Number(price).toLocaleString('en-US', { maximumFractionDigits: 0 });

	async function select(id: number) {
		selectedId = id;

		// If the visitor scrolled down the list, jump back to the top of the new tab.
		if (heroEl && window.scrollY > heroEl.offsetHeight) {
			window.scrollTo({ top: heroEl.offsetHeight, behavior: 'instant' });
		}

		await tick();
		const index = categories.findIndex((c) => c.id === id);
		tabEls[index]?.scrollIntoView({ inline: 'center', block: 'nearest' });
	}

	function onTabKey(e: KeyboardEvent, index: number) {
		let next = index;
		if (e.key === 'ArrowRight') next = (index + 1) % categories.length;
		else if (e.key === 'ArrowLeft') next = (index - 1 + categories.length) % categories.length;
		else if (e.key === 'Home') next = 0;
		else if (e.key === 'End') next = categories.length - 1;
		else return;

		e.preventDefault();
		select(categories[next].id);
		tabEls[next]?.focus();
	}
</script>

<svelte:head>
	<title>Alain Market | AUL University Cafe and Market</title>
	<meta
		name="description"
		content="Menu and prices for Alain Market, the AUL University cafe and market."
	/>
	<meta name="theme-color" content="#181818" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="page">
	<header class="hero" bind:this={heroEl}>
		<h1>
			Alain Market
			<span class="accent">AUL University Cafe and Market</span>
		</h1>
		<p>Browse the menu by category.</p>
	</header>

	{#if active}
		<div class="tabbar">
			<div class="tabs" role="tablist" aria-label="Menu categories">
				{#each categories as c, i (c.id)}
					<button
						type="button"
						role="tab"
						id="tab-{c.id}"
						class="tab"
						aria-selected={c.id === active.id}
						aria-controls="menu-panel"
						tabindex={c.id === active.id ? 0 : -1}
						bind:this={tabEls[i]}
						onclick={() => select(c.id)}
						onkeydown={(e) => onTabKey(e, i)}
					>
						{c.name}
					</button>
				{/each}
			</div>
		</div>

		<main class="content">
			<div id="menu-panel" role="tabpanel" aria-labelledby="tab-{active.id}">
				{#key active.id}
					<div class="panel-body">
						<h2>{active.name}</h2>
						<p class="count">
							{activeItems.length}
							{activeItems.length === 1 ? 'item' : 'items'}
						</p>

						<ul class="timeline">
							{#each activeItems as item (item.id)}
								<li>
									<div class="card">
										<span class="name">{item.name}</span>
										<span class="price">
											<span class="amount">{formatAmount(item.price)}</span>
											<span class="cur">LBP</span>
										</span>
									</div>
								</li>
							{/each}
						</ul>
					</div>
				{/key}
			</div>

			<p class="note">Prices are in Lebanese pounds (LBP).</p>
		</main>
	{:else}
		<main class="content">
			<p class="empty">The menu is being updated. Please check back soon.</p>
		</main>
	{/if}
</div>

<style>
	.page {
		--bg: #181818;
		--card: #272727;
		--line: #363636;
		--coral: #0d6fc5;
		--text: #f4f1ee;
		--muted: #a0a0a0;

		min-height: 100dvh;
		padding-bottom: env(safe-area-inset-bottom, 0px);
		background: var(--bg);
		color: var(--text);
		font-family: 'Manrope', system-ui, sans-serif;
		line-height: 1.5;
	}

	/* Hero */
	.hero {
		padding: calc(3rem + env(safe-area-inset-top, 0px)) 1.25rem 2rem;
		text-align: center;
	}

	h1,
	h2 {
		margin: 0;
		font-family: 'Syne', 'Manrope', system-ui, sans-serif;
	}

	h1 {
		font-size: clamp(2.5rem, 11vw, 4rem);
		font-weight: 800;
		line-height: 1.05;
		letter-spacing: -0.01em;
	}

	.accent {
		display: block;
		margin-top: 0.5rem;
		color: var(--coral);
		font-size: 0.48em;
		font-weight: 700;
		letter-spacing: 0;
	}

	.hero p {
		margin: 1rem 0 0;
		color: var(--muted);
		font-size: 0.95rem;
	}

	/* Category tabs */
	.tabbar {
		position: sticky;
		top: 0;
		z-index: 10;
		padding: 0.75rem 0;
		background: var(--bg);
		border-bottom: 1px solid var(--line);
	}

	.tabs {
		box-sizing: border-box;
		display: flex;
		gap: 0.5rem;
		width: max-content;
		max-width: 100%;
		margin-inline: auto;
		padding-inline: 1.25rem;
		overflow-x: auto;
		scrollbar-width: none;
		scroll-behavior: smooth;
	}

	.tabs::-webkit-scrollbar {
		display: none;
	}

	.tab {
		flex: none;
		padding: 0.55rem 1.15rem;
		border: 0;
		border-radius: 999px;
		background: var(--card);
		color: var(--muted);
		font: inherit;
		font-size: 0.95rem;
		font-weight: 600;
		white-space: nowrap;
		cursor: pointer;
	}

	.tab:hover {
		color: var(--text);
	}

	.tab[aria-selected='true'] {
		background: var(--coral);
		color: #1a1a1a;
	}

	.tab:focus-visible {
		outline: 2px solid var(--coral);
		outline-offset: 2px;
	}

	/* Items */
	.content {
		max-width: 680px;
		margin-inline: auto;
		padding: 0 1.25rem 3rem;
	}

	.panel-body {
		animation: rise 0.25s ease-out;
	}

	h2 {
		margin-top: 2rem;
		font-size: clamp(1.7rem, 6vw, 2.1rem);
		font-weight: 700;
		line-height: 1.15;
		text-align: center;
	}

	.count {
		margin: 0.3rem 0 0;
		color: var(--muted);
		font-size: 0.9rem;
		text-align: center;
	}

	.timeline {
		list-style: none;
		margin: 1.75rem 0 0;
		padding: 0;
	}

	.timeline li {
		margin-bottom: 0.75rem;
	}

	.card {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.1rem 1rem 1.6rem;
		border-radius: 14px;
		background: var(--card);
	}

	/* short coral bar before the item name */
	.card::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0.7rem;
		width: 4px;
		height: 1.4rem;
		margin-top: -0.7rem;
		border-radius: 999px;
		background: var(--coral);
	}

	.name {
		min-width: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.price {
		flex: none;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.amount {
		color: var(--coral);
		font-weight: 700;
	}

	.cur {
		margin-left: 0.2rem;
		color: var(--muted);
		font-size: 0.72rem;
		font-weight: 600;
	}

	.note {
		margin: 2rem 0 0;
		color: var(--muted);
		font-size: 0.85rem;
		text-align: center;
	}

	.empty {
		margin: 0;
		padding: 4rem 0;
		color: var(--muted);
		font-size: 1.1rem;
		text-align: center;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.panel-body {
			animation: none;
		}

		.tabs {
			scroll-behavior: auto;
		}
	}
</style>