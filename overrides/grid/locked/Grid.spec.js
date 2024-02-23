describe('Ext.grid.locked.Grid', () => {
	describe('ExtJsBug-1(IntegratedFix): dynamically adding columns duplicates last column content', () => {
		const runScenario = function (phoneCellOccurrences) {
			const phone = '555-111-1224';
			const lockedGrid = new Ext.grid.LockedGrid({
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

		it('@override: last column content is not duplicated', () => {
			runScenario(1);
		});
	});
});
