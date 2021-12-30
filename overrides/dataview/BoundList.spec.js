describe('Ext.dataview.BoundList', () => {
	describe('ExtJsBug-1: remote combo clears value on first expand', () => {
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

		it('should clear value on expand', () => {
			//Bypass the override
			const boundListPrototype = Ext.dataview.BoundList.prototype;

			cy.stub(
				boundListPrototype,
				'beforeSelectionRefresh',
				boundListPrototype.beforeSelectionRefresh.$previous
			);

			const combobox = new Ext.field.ComboBox(comboCfg);

			// wait for store to load and selection to update
			combobox.on('select', cy.spy().as('comboboxSelectSpy'));
			cy.get('@comboboxSelectSpy').should('have.been.called');

			cy.get(`#${combobox.getId()} .x-expandtrigger`).click();

			combobox.on('change', cy.spy().as('comboboxChangeSpy'));

			// called with "null" argument on change, meaning it was cleared
			cy.get('@comboboxChangeSpy').should(
				'have.been.calledWith',
				combobox,
				null
			);
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
