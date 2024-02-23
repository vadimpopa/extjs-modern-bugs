describe('Ext.dataview.selection.Rows', () => {
	describe('ExtJsBug-1(IntegratedFix): non-infinite multi select grid throws error on mouse multiselect', () => {
		const runScenario = function () {
			const grid = new Ext.grid.Grid({
				renderTo: Ext.getBody(),
				width: 400,
				height: 200,
				infinite: false,
				selectable: {
					mode: 'MULTI',
				},
				store: {
					fields: ['name'],
					data: [
						{
							name: 'Lisa',
						},
						{
							name: 'Bart',
						},
					],
				},
				columns: [
					{
						dataIndex: 'name',
						text: 'Name',
						flex: 1,
					},
				],
			});

			cy.get(`#${grid.getId()}`).within(() => {
				cy.contains('Lisa').click();
				cy.contains('Bart').click({ shiftKey: true });
			});
		};

		it('@override: does not throws error on multiselect', () => {
			runScenario();
		});
	});
});
