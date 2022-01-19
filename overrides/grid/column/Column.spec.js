describe('Ext.grid.column.Column', () => {
	describe('ExtJsBug-4: hiding showInGroups menu item when canGroup is false', () => {
		const runScenario = function (showInGroupsElAssertion) {
			const grid = new Ext.grid.Grid({
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
								.contains('Show in groups')
								.should(showInGroupsElAssertion)
								.then(() => menu.hide());
						});
				});
		};

		it('showInGroups menu item should be visible', () => {
			// Bypass the override
			const columnPrototype = Ext.grid.column.Column.prototype;

			cy.stub(
				columnPrototype,
				'beforeShowMenu',
				columnPrototype.beforeShowMenu.$previous
			);

			runScenario('be.visible');
		});

		it('@override: showInGroups menu item should not be visible', () => {
			runScenario('not.be.visible');
		});
	});
});
