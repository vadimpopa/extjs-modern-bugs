describe('Ext.list.AbstractTreeItem', () => {
	describe('ExtJsBug-1: Fix unhandled error when adding nodes and the store is filtered', () => {
		const runScenario = () => {
			const treeList = Ext.create({
				xtype: 'treelist',
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

		it('should throw an error', (done) => {
			// Rethrow the error. This seems to be some sort of edge case,
			// sice it does not just simply work as in other cases.
			// Without rethrowing the error the below "uncaught:exception"
			// listener is not fired
			cy.on('fail', (error) => {
				throw error;
			});

			cy.once('uncaught:exception', (err) => {
				expect(err.message).to.include(
					'Cannot read properties of null'
				);

				// using mocha's async done callback to finish this test
				// so we prove that an uncaught exception was thrown
				done();

				// return false to prevent the error from failing this test
				return false;
			});

			// Bypass the override
			const classPrototype = Ext.list.AbstractTreeItem.prototype;
			cy.stub(
				classPrototype,
				'nodeInsert',
				classPrototype.nodeInsert.$previous
			);

			runScenario();
		});

		it('@override: should not throw an erorr', () => {
			runScenario();
		});
	});
});
