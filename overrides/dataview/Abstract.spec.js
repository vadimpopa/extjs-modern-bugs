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
});
