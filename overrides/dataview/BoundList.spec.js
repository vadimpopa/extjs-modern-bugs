describe('Ext.dataview.BoundList', () => {
	describe('ExtJsBug-1(IntegratedFix): remote combo clears value on first expand', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose Country',
			displayField: 'name',
			valueField: 'code',
			queryMode: 'remote',
			value: 'AU',
			store: {
				autoLoad: true,
				proxy: {
					type: 'ajax',
					url: '/countries',
				},
			},
		};

		beforeEach(() => {
			cy.intercept('/countries?*', {
				delay: 200,
				fixture: 'countries.json',
			});
		});

		it('@override: should not clear value on expand', () => {
			const combobox = new Ext.field.ComboBox(comboCfg);
			const initialValue = combobox.getValue();

			// wait for store to load and selection to update
			combobox.on('select', cy.spy().as('comboboxSelectSpy'));
			cy.get('@comboboxSelectSpy').should('have.been.called');

			combobox
				.getStore()
				.on('load', cy.spy().as('comboboxStoreRefreshSpy'));
			cy.get(`#${combobox.getId()} .x-expandtrigger`).click();

			cy.get('@comboboxStoreRefreshSpy').should('have.been.called');
			expect(combobox.getValue()).to.be.eq(initialValue);
		});
	});
});
