describe('Ext.dataview.Abstract', () => {
	describe('ExtJsBug-1(IntegratedFix): minHeight from "loadingHeight" not being reset after unmask', () => {
		beforeEach(() => {
			cy.intercept('/country?*', {
				delay: 200,
				body: [{ code: 'AU', name: 'Austria' }],
			});
		});

		const runScenario = (pickerMinHeight) => {
			const combobox = new Ext.field.ComboBox({
				renderTo: Ext.getBody(),
				label: 'Choose Country',
				displayField: 'name',
				valueField: 'code',
				queryMode: 'remote',
				store: {
					proxy: {
						type: 'ajax',
						url: '/country',
					},
				},
			});

			cy.get(`#${combobox.getId()}`)
				.within(() => {
					cy.get('.x-expandtrigger').click();
					combobox
						.getPicker()
						.on('refresh', cy.spy().as('comboPickerRefreshSpy'));
					cy.get('@comboPickerRefreshSpy').should('have.been.called');
				})
				.then(() => {
					cy.get(`#${combobox.getPicker().getId()}`)
						.should(
							'have.css',
							'min-height',
							`${pickerMinHeight}px`
						)
						.then(() => {
							combobox.collapse();
						});
				});
		};

		it('@override: minHeight is being restored', () => {
			runScenario(0);
		});
	});

	describe('ExtJsBug-2(IntegratedFix): grid firing "selectionchange" event on row click even if the row is already selected', () => {
		it('@override: should fire "selectionchange" event only on first row click, and not on repeated clicks', () => {
			const grid = new Ext.grid.Grid({
				title: 'Grid',
				width: 500,
				height: 300,
				renderTo: document.body,
				store: [
					{
						id: 1,
						name: 'First',
					},
					{
						id: 2,
						name: 'Second',
					},
				],
				columns: [
					{
						text: 'Name',
						dataIndex: 'name',
						flex: 1,
					},
				],
			});

			grid.on('selectionchange', cy.spy().as('selectionChangeSpy'));

			cy.get(grid.element.dom).contains('First').click().click();

			cy.get('@selectionChangeSpy').should('have.been.calledOnce');
			cy.wrap(grid)
				.invoke('getSelections')
				.should((selections) => {
					expect(selections).to.deep.eq([
						grid.getStore().findRecord('name', 'First'),
					]);
				});
		});
	});
});
