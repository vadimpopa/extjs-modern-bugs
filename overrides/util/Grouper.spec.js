describe('Ext.util.Grouper', () => {
	describe('ExtJsBug-1(IntegratedFix): repeated sorting on grouped grid column throwing error', () => {
		const runScenario = function () {
			const grid = new Ext.grid.Grid({
				renderTo: Ext.getBody(),
				width: 400,
				height: 200,
				store: {
					fields: ['name', 'email'],
					data: [
						{
							name: 'Lisa',
							email: 'lisa@simpsons.com',
						},
						{
							name: 'Bart',
							email: 'bart@simpsons.com',
						},
					],
				},
				columns: [
					{
						dataIndex: 'name',
						text: 'Name',
						flex: 1,
					},
					{
						dataIndex: 'email',
						text: 'Email',
						flex: 1,
					},
				],
			});

			cy.get(`#${grid.getId()} .x-header-el`).first().as('firstHeaderEl');
			cy.get('@firstHeaderEl')
				.find('.x-trigger-el')
				.click()
				.then(() => {
					const columnMenuEl = grid.getColumns()[0].getMenu()
						.element.dom;
					cy.get(columnMenuEl)
						.find(
							'[data-componentid^=ext-gridgroupbythismenuitem] a'
						)
						.click();

					// Double sorting
					cy.get('@firstHeaderEl').click().click();
				});
		};

		it('@override: should not throw error on multiple sort', () => {
			runScenario();
		});
	});
});
