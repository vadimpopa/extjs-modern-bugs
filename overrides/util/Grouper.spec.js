describe('Ext.util.Grouper', () => {
	describe('ExtJsBug-1: repeated sorting on grouped grid column throwing error', () => {
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

		it('should throw error on multiple sort', (done) => {
			const GrouperPrototype = Ext.util.Grouper.prototype;

			//Bypass the override
			cy.stub(
				GrouperPrototype,
				'notify',
				GrouperPrototype.notify.$previous
			);

			cy.on('uncaught:exception', (err) => {
				expect(err.message).to.include(
					'Cannot read properties of undefined'
				);

				// using mocha's async done callback to finish this test
				// so we prove that an uncaught exception was thrown
				done();

				// return false to prevent the error from failing this test
				return false;
			});

			runScenario();
		});

		it('@override: should not throw error on multiple sort', () => {
			runScenario();
		});
	});
});
