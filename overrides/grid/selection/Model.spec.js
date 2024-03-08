describe('Ext.grid.selection.Model', () => {
	describe('ExtJsBug-1(IntegratedFix): grid firing "selectionchange" event on row click even if the row is already selected', () => {
		let grid;

		beforeEach(() => {
			Ext.destroy(grid);

			grid = new Ext.grid.Grid({
				title: 'Grid',
				width: 500,
				height: 300,
				renderTo: document.body,
				selectable: {
					mode: 'multi',
				},
				store: [
					{
						id: 1,
						name: 'First',
					},
					{
						id: 2,
						name: 'Second',
					},
				],
				columns: [
					{
						text: 'Name',
						dataIndex: 'name',
						flex: 1,
					},
				],
			});
		});

		it('@override: should fire "selectionchange" event only on first row click, and not on repeated clicks', () => {
			grid.on('selectionchange', cy.spy().as('selectionChangeSpy'));

			cy.get(grid.element.dom).contains('First').click().click();

			cy.get('@selectionChangeSpy').should('have.been.calledOnce');
			cy.wrap(grid)
				.invoke('getSelections')
				.should((selections) => {
					expect(selections).to.deep.eq([
						grid.getStore().findRecord('name', 'First'),
					]);
				});
		});

		it('should deselect selected row on CTRL+click', () => {
			cy.get(grid.element.dom).contains('First').click();
			cy.wrap(grid).invoke('getSelectionCount').should('eq', 1);

			cy.get(grid.element.dom).contains('First').click({ ctrlKey: true });
			cy.wrap(grid).invoke('getSelectionCount').should('eq', 0);
		});
	});
});
