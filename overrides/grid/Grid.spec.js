describe('Ext.grid.Grid', () => {
	describe('ExtJsBug-2: initial store sorting not visually reflected in columns', () => {
		const runScenario = function (colSortIconElAssertion) {
			const store = Ext.create('Ext.data.Store', {
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

			const grid = Ext.create('Ext.grid.Grid', {
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

		it('sort icon is not visible in column header', () => {
			// Bypass the override
			const gridPrototype = Ext.grid.Grid.prototype;

			cy.stub(
				gridPrototype,
				'updateStore',
				Ext.dataview.Abstract.prototype.updateStore
			);

			runScenario('not.be.visible');
		});

		it('@override: sort icon is visible in column header', () => {
			runScenario('be.visible');
		});
	});
});
