<script lang="ts">
	import { onMount } from 'svelte';

	type Category = { id: number; name: string };
	type Item = { id: number; name: string; price: string; categoryId: number };

	let categories = $state<Category[]>([]);
	let items = $state<Item[]>([]);
	let loaded = $state(false);
	let tab = $state<'item' | 'category'>('item');
	let error = $state('');
	let notice = $state('');
	let noticeTimer: ReturnType<typeof setTimeout>;

	let newCategory = $state('');
	let itemName = $state('');
	let itemPrice = $state<number | null>(null);
	let itemCategoryId = $state<number | null>(null);

	const grouped = $derived(
		categories.map((c) => ({ ...c, items: items.filter((i) => i.categoryId === c.id) }))
	);

	async function load() {
		const [c, i] = await Promise.all([fetch('/api/categories'), fetch('/api/items')]);
		if (!c.ok || !i.ok) {
			error = "Couldn't load the menu. Refresh the page to try again.";
			return;
		}
		categories = await c.json();
		items = await i.json();
		if (!categories.some((c) => c.id === itemCategoryId)) {
			itemCategoryId = categories[0]?.id ?? null;
		}
		loaded = true;
	}

	onMount(load);

	function flash(message: string) {
		notice = message;
		clearTimeout(noticeTimer);
		noticeTimer = setTimeout(() => (notice = ''), 2400);
	}

	async function post(url: string, body: unknown) {
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		return res.ok;
	}

	async function addCategory(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		if (!(await post('/api/categories', { name: newCategory.trim() }))) {
			error = "Couldn't add the category. Check the name and try again.";
			return;
		}
		newCategory = '';
		await load();
		flash('Category added');
		tab = 'item';
	}

	async function addItem(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		const ok = await post('/api/items', {
			name: itemName.trim(),
			price: itemPrice,
			categoryId: itemCategoryId
		});
		if (!ok) {
			error = "Couldn't add the item. Check the details and try again.";
			return;
		}
		itemName = '';
		itemPrice = null;
		await load();
		flash('Item added');
	}

	const formatPrice = (price: string) =>
		`${Number(price).toLocaleString('en-US', { maximumFractionDigits: 0 })} LBP`;

	// Delete takes two clicks: the first turns the button into "Confirm".
	let confirming = $state('');

	async function remove(kind: 'items' | 'categories', id: number) {
		error = '';
		const res = await fetch(`/api/${kind}/${id}`, { method: 'DELETE' });
		confirming = '';
		if (!res.ok) {
			error =
				kind === 'items'
					? "Couldn't delete the item. Try again."
					: "Couldn't delete the category. Remove its items first, then try again.";
			return;
		}
		await load();
		flash(kind === 'items' ? 'Item deleted' : 'Category deleted');
	}

	function askDelete(kind: 'items' | 'categories', id: number) {
		const key = `${kind}-${id}`;
		if (confirming === key) return remove(kind, id);
		confirming = key;
	}

	function deleteCategory(group: { id: number; name: string; items: Item[] }) {
		if (group.items.length > 0) {
			error = `Remove the items in ${group.name} before deleting it.`;
			return;
		}
		askDelete('categories', group.id);
	}
</script>

<svelte:head>
	<title>Menu dashboard</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Figtree:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="page">
	<header>
		<h1>Menu</h1>
		{#if loaded}
			<p class="summary">{categories.length} categories, {items.length} items</p>
		{/if}
	</header>

	<div class="layout">
		<section class="menu" aria-label="Current menu">
			{#if loaded}
				{#each grouped as group (group.id)}
					<div class="group">
						<div class="group-head">
							<h2>{group.name} <span class="count">{group.items.length}</span></h2>
							<button
								type="button"
								class="delete"
								class:confirm={confirming === `categories-${group.id}`}
								aria-label="Delete category {group.name}"
								onclick={() => deleteCategory(group)}
								onblur={() => (confirming = '')}
							>
								{confirming === `categories-${group.id}` ? 'Confirm delete' : 'Delete'}
							</button>
						</div>

						{#if group.items.length > 0}
							<ul>
								{#each group.items as item (item.id)}
									<li>
										<span class="name">{item.name}</span>
										<span class="leader" aria-hidden="true"></span>
										<span class="price">{formatPrice(item.price)}</span>
										<button
											type="button"
											class="delete"
											class:confirm={confirming === `items-${item.id}`}
											aria-label="Delete {item.name}"
											onclick={() => askDelete('items', item.id)}
											onblur={() => (confirming = '')}
										>
											{confirming === `items-${item.id}` ? 'Confirm' : 'Delete'}
										</button>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="empty">No items yet. Add one from the panel.</p>
						{/if}
					</div>
				{:else}
					<p class="empty big">
						Your menu is empty. Start by adding a category, like Starters or Drinks.
					</p>
				{/each}
			{/if}
		</section>

		<aside class="panel">
			<div class="tabs" role="group" aria-label="What do you want to add?">
				<button
					type="button"
					class:active={tab === 'item'}
					aria-pressed={tab === 'item'}
					onclick={() => (tab = 'item')}>Item</button
				>
				<button
					type="button"
					class:active={tab === 'category'}
					aria-pressed={tab === 'category'}
					onclick={() => (tab = 'category')}>Category</button
				>
			</div>

			{#if tab === 'item'}
				<form onsubmit={addItem}>
					{#if categories.length === 0}
						<p class="hint">Add a category first, then you can put items in it.</p>
						<button type="button" class="primary" onclick={() => (tab = 'category')}>
							Add a category
						</button>
					{:else}
						<label>
							Name
							<input bind:value={itemName} required maxlength="150" autocomplete="off" />
						</label>
						<label>
							Price (LBP)
							<input
								type="number"
								inputmode="numeric"
								step="1"
								min="0"
								bind:value={itemPrice}
								required
							/>
						</label>
						<label>
							Category
							<select bind:value={itemCategoryId} required>
								{#each categories as c (c.id)}
									<option value={c.id}>{c.name}</option>
								{/each}
							</select>
						</label>
						<button class="primary">Add item</button>
					{/if}
				</form>
			{:else}
				<form onsubmit={addCategory}>
					<label>
						Name
						<input bind:value={newCategory} required maxlength="100" autocomplete="off" />
					</label>
					<button class="primary">Add category</button>
				</form>
			{/if}

			{#if error}
				<p class="error" role="alert">{error}</p>
			{/if}
		</aside>
	</div>

	<div class="toast-region" aria-live="polite">
		{#if notice}
			<span class="toast">{notice}</span>
		{/if}
	</div>
</div>

<style>
	:global(:root) {
		--paper: #f6f8f5;
		--ink: #14302c;
		--muted: #5d7570;
		--leaf: #2f6b4f;
		--leaf-dark: #25573f;
		--mint: #e2eee2;
		--line: #cfdad1;
		--danger: #b3261e;
	}

	:global(body) {
		margin: 0;
		background: var(--paper);
		color: var(--ink);
		font-family: 'Figtree', system-ui, sans-serif;
		line-height: 1.5;
	}

	.page {
		max-width: 1040px;
		margin: 0 auto;
		padding: 2.5rem 1.25rem 5rem;
	}

	header {
		margin-bottom: 2.5rem;
	}

	h1,
	h2 {
		font-family: 'Bricolage Grotesque', 'Figtree', system-ui, sans-serif;
		line-height: 1.1;
		margin: 0;
	}

	h1 {
		font-size: clamp(2.25rem, 6vw, 3.25rem);
		letter-spacing: -0.02em;
	}

	.summary {
		margin: 0.5rem 0 0;
		color: var(--muted);
	}

	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 340px;
		gap: 3.5rem;
		align-items: start;
	}

	/* Menu preview */
	.group {
		margin-bottom: 2.5rem;
	}

	h2 {
		font-size: 1.6rem;
	}

	.group-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.count {
		display: inline-block;
		margin-left: 0.4rem;
		padding: 0.1rem 0.55rem;
		border-radius: 999px;
		background: var(--mint);
		color: var(--leaf-dark);
		font-family: 'Figtree', system-ui, sans-serif;
		font-size: 0.8rem;
		font-weight: 600;
		vertical-align: middle;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		padding: 0.4rem 0;
	}

	.name {
		font-weight: 500;
	}

	.leader {
		flex: 1;
		min-width: 1rem;
		border-bottom: 2px dotted var(--line);
		transform: translateY(-0.25rem);
	}

	.price {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.empty {
		margin: 0;
		color: var(--muted);
	}

	.empty.big {
		font-size: 1.1rem;
		padding: 2rem 0;
	}

	/* Add panel */
	.panel {
		position: sticky;
		top: 1.5rem;
		padding: 1.25rem;
		border-radius: 16px;
		background: var(--mint);
	}

	.tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4px;
		padding: 4px;
		margin-bottom: 1.25rem;
		border-radius: 10px;
		background: rgba(20, 48, 44, 0.08);
	}

	.tabs button {
		padding: 0.5rem;
		border: 0;
		border-radius: 7px;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-weight: 500;
		cursor: pointer;
	}

	.tabs button.active {
		background: #fff;
		color: var(--ink);
		font-weight: 600;
	}

	form {
		display: grid;
		gap: 1rem;
	}

	label {
		display: grid;
		gap: 0.3rem;
		font-size: 0.9rem;
		font-weight: 600;
	}

	input,
	select {
		width: 100%;
		box-sizing: border-box;
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: #fff;
		color: var(--ink);
		font: inherit;
		font-weight: 400;
	}

	.primary {
		padding: 0.75rem 1rem;
		border: 0;
		border-radius: 8px;
		background: var(--leaf);
		color: #fff;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.primary:hover {
		background: var(--leaf-dark);
	}

	.tabs button:focus-visible,
	.primary:focus-visible,
	input:focus-visible,
	select:focus-visible {
		outline: 2px solid var(--leaf);
		outline-offset: 2px;
	}

	.delete {
		flex-shrink: 0;
		padding: 0.15rem 0.5rem;
		border: 0;
		border-radius: 6px;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.delete:hover {
		color: var(--danger);
		text-decoration: underline;
	}

	.delete.confirm {
		background: var(--danger);
		color: #fff;
		text-decoration: none;
	}

	.delete:focus-visible {
		outline: 2px solid var(--danger);
		outline-offset: 2px;
	}

	.hint {
		margin: 0;
		color: var(--muted);
	}

	.error {
		margin: 1rem 0 0;
		color: var(--danger);
		font-weight: 500;
	}

	/* Confirmation after an add */
	.toast-region {
		position: fixed;
		bottom: 1.25rem;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		pointer-events: none;
	}

	.toast {
		padding: 0.6rem 1.1rem;
		border-radius: 999px;
		background: var(--ink);
		color: #fff;
		font-weight: 500;
		animation: pop 0.25s ease-out;
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.toast {
			animation: none;
		}
	}

	@media (max-width: 860px) {
		.layout {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.panel {
			position: static;
			order: -1;
		}
	}
</style>