describe('Ext.dataview.Location', () => {
	const LocationPrototype = Ext.dataview.Location.prototype;

	describe('ExtJsBug-1: infinite combo selecting wrong list item when filtered', () => {
		beforeEach(() => {
			cy.intercept('/countries?*', {
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

			combobox
				.getPicker()
				.on('refresh', cy.spy().as('comboPickerRefreshSpy'));

			cy.get(`#${combobox.getId()}`).within(() => {
				cy.get('input')
					.type('Russia')
					.then(($input) => {
						cy.get('@comboPickerRefreshSpy')
							.should('have.been.called')
							.then(() => $input);
					})
					.type('{enter}')
					.should(assertion, 'Russian Federation');
			});
		};

		it('should select previously filtered item', () => {
			//Bypass the override
			cy.stub(
				LocationPrototype,
				'equals',
				LocationPrototype.equals.$previous
			);

			runScenario('not.have.value');
		});

		it('@override: should select current filtered item', () => {
			runScenario('have.value');
		});
	});
});
