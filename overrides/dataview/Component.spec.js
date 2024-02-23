describe('Ext.dataview.Component', () => {
	describe('ExtJsBug-1(IntegratedFix): non-infinite grid scrolls to left, on column sort, when "scrollToTopOnRefresh" enabled', () => {
		const runScenario = function (scrollXAssertion) {
			const grid = new Ext.grid.Grid({
				renderTo: Ext.getBody(),
				width: 200,
				height: 200,
				infinite: false,
				scrollToTopOnRefresh: true,
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
					},
					{
						dataIndex: 'email',
						text: 'Email',
						width: 150,
					},
				],
			});

			cy.get(`#${grid.getId()}`).within(() => {
				const scrollable = grid.getScrollable();
				scrollable.scrollTo(Infinity, null);
				cy.contains('bart@simpsons.com').click();
				cy.contains('.x-header-el', 'Email').click();
				cy.wrap(scrollable.getPosition())
					.its('x')
					.should(scrollXAssertion, 0);
			});
		};

		it('@override: does not scroll to left on sort', () => {
			runScenario('not.eq');
		});
	});
});
