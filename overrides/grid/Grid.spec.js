describe('Ext.grid.Grid', () => {
	describe('ExtJsBug-2(IntegratedFix): initial store sorting not visually reflected in columns', () => {
		const runScenario = function (colSortIconElAssertion) {
			const store = new Ext.data.Store({
				fields: ['name', 'email', 'phone'],
				sorters: [
					{
						property: 'name',
						direction: 'DESC',
					},
				],
				data: [
					{
						name: 'Lisa',
						email: 'lisa@simpsons.com',
						phone: '555-111-1224',
					},
					{
						name: 'Bart',
						email: 'bart@simpsons.com',
						phone: '555-222-1234',
					},
					{
						name: 'Homer',
						email: 'home@simpsons.com',
						phone: '555-222-1244',
					},
					{
						name: 'Marge',
						email: 'marge@simpsons.com',
						phone: '555-222-1254',
					},
				],
			});

			const grid = new Ext.grid.Grid({
				title: 'People',
				store,
				width: 500,
				height: 150,
				renderTo: Ext.getBody(),
				columns: [
					{
						text: 'Name',
						dataIndex: 'name',
						flex: 1,
					},
					{
						text: 'Email',
						dataIndex: 'email',
						flex: 1,
					},
					{
						text: 'Phone',
						dataIndex: 'phone',
						flex: 1,
					},
				],
			});

			cy.get(`#${grid.getId()}`)
				.find('.x-headercontainer')
				.should('be.visible')
				.find('.x-sort-icon-el')
				.should(colSortIconElAssertion);
		};

		it('@override: sort icon is visible in column header', () => {
			runScenario('be.visible');
		});
	});

	describe('ExtJsBug-4(IntegratedFix): cell elements having wrong size after filtering and column resize', () => {
		const runScenario = function (cellWidth) {
			const store = new Ext.data.Store({
				fields: ['name', 'email'],
				data: [
					{
						name: 'Lisa',
						email: 'lisa@simpsons.com',
						phone: '555-111-1224',
					},
					{
						name: 'Bart',
						email: 'bart@simpsons.com',
						phone: '555-222-1234',
					},
				],
			});

			const grid = new Ext.grid.Grid({
				title: 'People',
				store,
				width: 500,
				height: 150,
				renderTo: Ext.getBody(),
				infinite: true,
				columns: [
					{
						text: 'Name',
						dataIndex: 'name',
						width: 200,
					},
					{
						text: 'Email',
						dataIndex: 'email',
						flex: 1,
					},
				],
			});

			cy.get(`#${grid.getId()}`).within(() => {
				cy.get('.x-list-inner-ct')
					.should('be.visible')
					.then(() => {
						// Add filter so that all rows are hidden
						grid.getStore().filter('name', 'something');

						// Change column size
						grid.getColumnForField('name').setWidth(100);
						grid.on(
							'columnresize',
							cy.spy().as('gridColumnResizeSpy')
						);

						cy.get('@gridColumnResizeSpy')
							.should('have.been.called')
							.then(() => {
								// Clear filter so that column reappear
								grid.getStore().clearFilter();
								cy.contains('.x-gridcell', 'Lisa')
									.invoke('width')
									.should('eq', cellWidth);
							});
					});
			});
		};

		it('@override: cell elements should be properly aligned', () => {
			runScenario(100);
		});
	});

	describe('ExtJsBug-7(IntegratedFix): "Columns" menu item not available in header after "setColumns"', () => {
		it('@override: "Columns" menu item should be visible after "setColumns"', () => {
			const grid = new Ext.grid.Grid({
				title: 'People',
				store: {},
				width: 500,
				height: 150,
				renderTo: Ext.getBody(),
				columns: [
					{
						text: 'Name',
						dataIndex: 'name',
					},
				],
			});

			const shouldHaveColumnsItemInColumnMenu = () => {
				cy.get('.x-gridcolumn .x-trigger-el').click();

				cy.then(() => {
					const [column] = grid.getColumns();
					const columnMenu = column.getMenu();

					cy.get(columnMenu.element.dom)
						.should('be.visible')
						.within(() => {
							cy.contains('.x-menuitem', 'Columns');
						});
				});
			};

			cy.get(grid.element.dom).within(() => {
				shouldHaveColumnsItemInColumnMenu();

				cy.then(() => {
					grid.setColumns([
						{
							text: 'Code',
							dataIndex: 'code',
						},
					]);
					shouldHaveColumnsItemInColumnMenu();
				});
			});
		});
	});
});
