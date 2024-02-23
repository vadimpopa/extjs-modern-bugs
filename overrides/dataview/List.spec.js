describe('Ext.dataview.List', () => {
	describe('ExtJsBug-1(IntegratedFix): items not rendered correctly after remove filter when "scrollToTopOnRefresh" enabled', () => {
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
				infinite: true,
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

		it('@override: first item should be visible', () => {
			runScenario('contain');
		});
	});

	describe('ExtJsBug-2(IntegratedFix): rows not clickable after refresh in infinite grid when "scrollToTopOnRefresh" enabled', () => {
		beforeEach(() => {
			cy.intercept('/countries?*', {
				fixture: 'countries.json',
			});
		});

		const runScenario = function (assertion) {
			const grid = new Ext.grid.Grid({
				renderTo: Ext.getBody(),
				width: 400,
				height: 500,
				infinite: true,
				scrollToTopOnRefresh: true,
				store: {
					autoLoad: true,
					proxy: {
						type: 'ajax',
						url: '/countries',
						reader: {
							transform(data) {
								// Mimic pagination
								return data.slice(0, 50);
							},
						},
					},
				},
				columns: [
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

					// Scroll to last record
					grid.scrollToRecord(store.last());

					// Reload the store and wait for the grid to refresh its elements
					grid.on('refresh', cy.spy().as('gridRefreshSpy'));
					store.load();
					cy.get('@gridRefreshSpy').should('have.been.called');

					// Scroll to the region that might have frozen rows
					grid.scrollToRecord(store.getAt(20));

					// Click on a potentially frozen row
					grid.on('childtap', cy.spy().as('gridChildTapSpy'));
					cy.get($gridEl)
						.contains('.x-gridrow', 'Argentina')
						.as('ArgentinaGridRow')
						.click({ scrollBehavior: false, force: true });
					cy.get('@gridChildTapSpy').should('have.been.called');

					// Assert whether the row is frozen or not
					cy.get('@ArgentinaGridRow').should(assertion, 'x-selected');
				});
			});
		};

		it('@override: all rows should be clickable', () => {
			runScenario('have.class');
		});
	});
});
