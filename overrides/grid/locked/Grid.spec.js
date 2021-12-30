describe('Ext.grid.locked.Grid', () => {
	describe('ExtJsBug-1: dynamically adding columns duplicates last column content', () => {
		const runScenario = function (phoneCellOccurrences) {
			const phone = '555-111-1224';
			const lockedGrid = Ext.create('Ext.grid.LockedGrid', {
				title: 'People',
				renderTo: Ext.getBody(),
				width: 500,
				height: 100,
				store: {
					fields: ['name', 'email', 'phone'],
					data: [
						{
							name: 'Lisa',
							email: 'lisa@simpsons.com',
							phone,
						},
					],
				},
			});

			lockedGrid.setColumns([
				{
					text: 'Name',
					dataIndex: 'name',
					locked: true,
				},
				{
					text: 'Email',
					dataIndex: 'email',
				},
				{
					text: 'Phone',
					dataIndex: 'phone',
				},
			]);

			cy.get(`#${lockedGrid.getId()}`)
				.find(`.x-gridcell-body-el:contains("${phone}")`)
				.its('length')
				.should('eq', phoneCellOccurrences);
		};

		it('last column content is duplicated', () => {
			// Bypass the override
			const lockedGridPrototype = Ext.grid.locked.Grid.prototype;

			cy.stub(
				lockedGridPrototype,
				'onColumnAdd',
				lockedGridPrototype.onColumnAdd.$previous
			);

			runScenario(2);
		});

		it('@override: last column content is not duplicated', () => {
			runScenario(1);
		});
	});
});
