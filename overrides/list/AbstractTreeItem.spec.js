describe('Ext.list.AbstractTreeItem', () => {
	describe('ExtJsBug-1(IntegratedFix): Fix unhandled error when adding nodes and the store is filtered', () => {
		const runScenario = () => {
			const treeList = new Ext.list.Tree({
				store: {
					root: {
						expanded: true,
					},
				},
				renderTo: Ext.getBody(),
			});

			const treeStore = treeList.getStore();

			cy.get(`#${treeList.getId()}`).within(() => {
				treeStore.addFilter({
					property: 'text',
					value: 'first',
				});

				treeStore.getRoot().appendChild([
					{
						text: 'first',
						leaf: true,
					},
					{
						text: 'second',
						leaf: true,
					},
				]);

				cy.get('.x-treelist-item').should('have.length', 1);
			});
		};

		it('@override: should not throw an erorr', () => {
			runScenario();
		});
	});
});
