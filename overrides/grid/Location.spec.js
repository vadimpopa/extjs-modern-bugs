describe('Ext.grid.Location', () => {
	describe('ExtJsBug-1: Fix trying to set location on an invisible column', () => {
		const runScenario = function () {
			const grid = Ext.create('Ext.grid.Grid', {
				title: 'People',
				store: {
					fields: ['name', 'email'],
					data: [
						{
							name: 'Lisa',
							email: 'lisa@simpsons.com',
						},
					],
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
					{
						text: 'Email',
						dataIndex: 'email',
						flex: 1,
					},
				],
			});

			cy.get(`#${grid.getId()}`)
				.as('gridEl')
				.within(() => {
					//1. Focus second row column
					cy.contains('lisa@simpsons.com').click();
					grid.on(
						'columnmenucreated',
						cy.spy().as('columnMenuCreatedSpy')
					);

					cy.get('.x-header-el .x-trigger-el').first().click();
				});

			cy.get('@columnMenuCreatedSpy')
				.should('have.been.called')
				.then((spy) => {
					const [spyArgs] = spy.args;
					const [, , menuCmp] = spyArgs;
					cy.get(`#${menuCmp.getId()}`).contains('Columns').click();
					//2. Hide second column
					cy.contains('.x-menucheckitem:visible', 'Email').click();
					cy.get('@gridEl')
						.contains('.x-header-el', 'Email')
						.should('not.be.visible');
					//3. Click/focus grid body
					cy.get('@gridEl').find('.x-grid-body-el').click('left');
				});
		};

		it('should throw when when hiding a column that had focus', (done) => {
			// Bypass the override
			const locationPrototype = Ext.grid.Location.prototype;

			cy.stub(
				locationPrototype,
				'refresh',
				locationPrototype.refresh.$previous
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

		it('@override: should not throw when when hiding a column that had focus', () => {
			runScenario();
		});
	});
});
