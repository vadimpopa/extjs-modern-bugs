describe('Ext.dataview.List', () => {
	describe('ExtJsBug-1: items not rendered correctly after remove filter when "scrollToTopOnRefresh" enabled', () => {
		beforeEach(() => {
			cy.intercept('/countries?*', {
				fixture: 'countries.json',
			});
		});

		const runScenario = function (assertion) {
			const grid = new Ext.grid.Grid({
				renderTo: Ext.getBody(),
				width: 400,
				height: 200,
				scrollToTopOnRefresh: true,
				store: {
					autoLoad: true,
					proxy: {
						type: 'ajax',
						url: '/countries',
					},
				},
				columns: [
					{
						dataIndex: 'code',
						text: 'Code',
					},
					{
						dataIndex: 'name',
						text: 'Name',
						flex: 1,
					},
				],
			});

			cy.get(`#${grid.getId()}`).within(($gridEl) => {
				cy.get('.x-gridrow').then(() => {
					const store = grid.getStore();

					store.addFilter({
						property: 'name',
						value: 'noname',
					});

					store.removeFilter(store.getFilters().getAt(0));
					cy.get($gridEl).should(assertion, 'AF');
				});
			});
		};

		it('first item should not be visible', () => {
			const ListPrototype = Ext.dataview.List.prototype;

			//Bypass the override
			cy.stub(
				ListPrototype,
				'doRefresh',
				ListPrototype.doRefresh.$previous
			);

			runScenario('not.contain');
		});

		it('@override: first item should be visible', () => {
			runScenario('contain');
		});
	});
});
