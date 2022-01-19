describe('Ext.dataview.selection.Rows', () => {
	describe('ExtJsBug-1: non-infinite multi select grid throws error on mouse multiselect', () => {
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

		it('throws error on multiselect', (done) => {
			const RowsSelectionPrototype =
				Ext.dataview.selection.Rows.prototype;

			//Bypass the override
			cy.stub(
				RowsSelectionPrototype,
				'setRangeEnd',
				RowsSelectionPrototype.setRangeEnd.$previous
			);

			cy.on('uncaught:exception', (err) => {
				expect(err.message).to.include(
					'Cannot read properties of null'
				);

				// using mocha's async done callback to finish this test
				// so we prove that an uncaught exception was thrown
				done();

				// return false to prevent the error from failing this test
				return false;
			});

			runScenario();
		});

		it('@override: does not throws error on multiselect', () => {
			runScenario();
		});
	});
});
