describe('Ext.grid.plugin.filterbar.FilterBar', () => {
	describe('ExtJsBug-2(IntegratedFix): Fix wrong bar fields size when plugin added dynamically and grid has flexed columns', () => {
		const runScenario = function (widthsSizeAssertion) {
			const grid = new Ext.grid.Grid({
				store: {},
				width: 500,
				height: 150,
				renderTo: Ext.getBody(),
				columns: [
					{
						text: 'Name',
						dataIndex: 'name',
						flex: 1,
						filterType: 'string',
					},
					{
						text: 'Email',
						dataIndex: 'email',
						width: 150,
						filterType: 'string',
					},
				],
			});

			grid.addPlugin({
				type: 'gridfilterbar',
			});

			cy.get(`#${grid.getId()}`).within(() => {
				cy.get('.x-gridcolumn')
					.should('be.visible')
					.eq(0)
					.then(($firstColumn) => {
						cy.get('.x-grid-filterbar .x-textfield')
							.eq(0)
							.then(($firstFilterBarField) => {
								const columnWidth = $firstColumn.outerWidth();
								const fieldWidth =
									$firstFilterBarField.outerWidth();

								assert[widthsSizeAssertion](
									columnWidth,
									fieldWidth
								);
							});
					});
			});
		};

		it('@override: grid and bar field widths should be equal', () => {
			runScenario('equal');
		});
	});
});
