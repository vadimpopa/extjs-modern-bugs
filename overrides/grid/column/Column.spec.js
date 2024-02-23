describe('Ext.grid.column.Column', () => {
	const gridConfig = {
		title: 'People',
		store: {
			fields: ['name'],
			data: [{ name: 'Lisa' }, { name: 'Bart' }],
		},
		width: 500,
		height: 150,
		renderTo: Ext.getBody(),
		columns: [
			{
				text: 'Name',
				dataIndex: 'name',
				flex: 1,
			},
		],
	};

	describe('ExtJsBug-3(IntegratedFix): sorter not updated on first column header tap', () => {
		it('@override: store to be sorted on first column header tap', () => {
			const grid = new Ext.grid.Grid({
				...gridConfig,
				store: {
					fields: ['name'],
					data: [{ name: 'Lisa' }, { name: 'Bart' }],
					sorters: {
						property: 'name',
						direction: 'ASC',
					},
				},
			});

			cy.get(`#${grid.getId()}`)
				.find('.x-gridcolumn')
				.as('gridColumnEl')
				.click();

			cy.get('@gridColumnEl')
				.should('have.class', 'x-sorted-desc')
				.then(() => {
					const storeSorter = grid
						.getStore()
						.getSorters()
						.getByKey('name');
					expect(storeSorter.getDirection()).to.eq('DESC');
				});
		});
	});

	describe('ExtJsBug-4(IntegratedFix): hiding showInGroups menu item when canGroup is false', () => {
		const runScenario = function (showInGroupsElAssertion) {
			const grid = new Ext.grid.Grid({
				...gridConfig,
				columns: [
					{
						text: 'Name',
						dataIndex: 'name',
						groupable: false,
						flex: 1,
					},
				],
			});

			cy.get(`#${grid.getId()}`)
				.find('.x-gridcolumn')
				.as('gridColumnEl')
				.should('be.visible')
				.find('.x-trigger-el')
				.click()
				.then(() => {
					cy.get('@gridColumnEl')
						.should('have.class', 'x-menu-open')
						.then(($gridColumnEl) => {
							const column = Ext.Component.from($gridColumnEl[0]);
							const menu = column.getMenu();
							const menuEl = menu.element.dom;

							cy.get(menuEl)
								.contains('Show in Groups')
								.should(showInGroupsElAssertion)
								.then(() => menu.hide());
						});
				});
		};

		it('@override: showInGroups menu item should not be visible', () => {
			runScenario('not.be.visible');
		});
	});
});
