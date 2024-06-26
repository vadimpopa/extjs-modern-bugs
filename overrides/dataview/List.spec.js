describe('Ext.dataview.List', () => {
	let grid;

	afterEach(() => {
		Ext.destroy(grid);
	});

	describe('ExtJsBug-1(IntegratedFix): items not rendered correctly after remove filter when "scrollToTopOnRefresh" enabled', () => {
		beforeEach(() => {
			cy.intercept('/countries?*', {
				fixture: 'countries.json',
			});
		});

		const runScenario = function (assertion) {
			grid = new Ext.grid.Grid({
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
			grid = new Ext.grid.Grid({
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

	describe(
		'ExtJsBug-4(IntegratedFix): not being able to scroll to last' +
			' row in an infinite grid after a vertically docked item is collapsed/expanded',
		() => {
			it('@override: should be able to scroll to the last row', () => {
				grid = new Ext.grid.Grid({
					renderTo: document.body,
					width: 500,
					height: 300,
					border: true,
					infinite: true,
					title: 'Infinite grid with bottom docked panel',
					store: {
						type: 'array',
						fields: ['index'],
						data: Array(10)
							.fill()
							.map((_, index) => [index]),
					},
					columns: [
						{
							dataIndex: 'index',
							text: 'Index',
							flex: 1,
						},
					],
					items: {
						xtype: 'panel',
						docked: 'bottom',
						title: 'Bottom docked panel',
						html: 'docked panel content',
						collapsed: true,
						height: 150,
						collapsible: {
							direction: 'bottom',
						},
					},
				});

				cy.get(grid.element.dom)
					.should('be.visible')
					.within(() => {
						cy.contains('.x-gridrow', '1')
							.as('firstRow')
							.should('be.visible');

						// expanding the docked panel
						cy.get('.x-docked-bottom .x-tool-type-up').click();

						cy.contains('docked panel content').should(
							'be.visible'
						);

						cy.should(() => {
							// scrolling horizontally to the last row
							// untill it becomes visible or it times out
							grid.getScrollable().scrollTo(null, Infinity);

							const lastRowEl = grid.mapToItem(
								grid.getStore().last(),
								'dom'
							);

							expect(lastRowEl).to.be.visible;
						});
					});
			});
		}
	);

	describe(
		'ExtJsBug-5(IntegratedFix): last row not becoming visible on scroll' +
			' when the corresponding record was added while the grid was fully scrolled to the bottom',
		() => {
			it('@override: should be able to scroll to the last row', () => {
				grid = new Ext.grid.Grid({
					renderTo: document.body,
					width: 400,
					height: 300,
					border: true,
					infinite: true,
					title: 'Infinite grid',
					store: {
						type: 'array',
						fields: ['index'],
						data: Array(50)
							.fill()
							.map((_, index) => [index]),
					},
					columns: [
						{
							dataIndex: 'index',
							text: 'Index',
							flex: 1,
						},
					],
				});

				cy.get(grid.element.dom).should(() => {
					const scrollable = grid.getScrollable();

					// we need to incrementally scroll (as the user does),
					// because programatically scrolling to the last record
					// is not so reliable for infinite grids
					scrollable.scrollBy(0, 300);
					expect(scrollable.getPosition()).to.eql(
						scrollable.getMaxPosition()
					);
				});

				// we have scrolled to the last row
				cy.contains('.x-gridrow', '49')
					.should('be.visible')
					.then(() => {
						grid.getStore().add({ index: 123 });
						grid.getScrollable().scrollBy(0, 100);
					});

				cy.contains('.x-gridrow', '123').should('be.visible');
			});
		}
	);
});
