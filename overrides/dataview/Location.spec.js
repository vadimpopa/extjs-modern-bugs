describe('Ext.dataview.Location', () => {
	describe('ExtJsBug-1(IntegratedFix): infinite combo selecting wrong list item when filtered', () => {
		beforeEach(() => {
			cy.intercept('/countries?*', {
				delay: 100,
				fixture: 'countries.json',
			});
		});

		const runScenario = function (assertion) {
			const combobox = new Ext.field.ComboBox({
				renderTo: Ext.getBody(),
				label: 'Choose Country',
				displayField: 'name',
				valueField: 'code',
				queryMode: 'local',
				floatedPicker: {
					infinite: true,
				},
				store: {
					autoLoad: true,
					proxy: {
						type: 'ajax',
						url: '/countries',
					},
				},
			});

			const picker = combobox.getPicker();

			combobox.getStore().on('load', cy.spy().as('comboStoreLoadSpy'));
			picker.on('refresh', cy.spy().as('comboPickerRefreshSpy'));

			cy.get('@comboStoreLoadSpy').should('have.been.called');
			cy.get(`#${combobox.getId()} input`).as('comboInput');
			cy.get('@comboInput').type('Rus');
			// Wait for the picker list items to be filtered
			// then continue typing in order to test location reusability
			cy.get(picker.element.dom)
				.contains('.x-boundlistitem', 'Belarus')
				.should('be.visible');
			cy.get('@comboInput').type('sia');
			cy.get('@comboPickerRefreshSpy').should('have.been.called');
			cy.get('@comboInput').type('{enter}');
			cy.get('@comboInput').should(assertion, 'Russian Federation');
		};

		it('@override: should select current filtered item', () => {
			runScenario('have.value');
		});
	});
});
