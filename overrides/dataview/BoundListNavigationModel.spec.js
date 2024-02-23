describe('Ext.dataview.BoundListNavigationModel', () => {
	const BoundListNavigationModelPrototype =
		Ext.dataview.BoundListNavigationModel.prototype;
	const comboCfg = {
		renderTo: Ext.getBody(),
		label: 'Choose Country',
		displayField: 'name',
		valueField: 'name',
		queryMode: 'local',
		store: {
			data: [
				{
					name: 'Country1',
				},
				{
					name: 'Country2',
				},
			],
		},
	};

	describe('ExtJsBug-1(IntegratedFix): combo throws error when pressing Enter from input and there are no items in boundlist', () => {
		beforeEach(() => {
			cy.get('html').click(0, 0);
			cy.intercept('/countries?*', {
				delay: 200,
				body: [],
			});
		});

		const runScenario = function () {
			const combobox = new Ext.field.ComboBox({
				...comboCfg,
				valueField: 'code',
				queryMode: 'remote',
				store: {
					proxy: {
						type: 'ajax',
						url: '/countries',
					},
				},
			});

			// Stub the method, as it is not relevat to this specific,
			// spec, and as it is called on different intervals
			// based on the available resources on the host machine,
			// making the scenario throw an error and we get a flaky test.
			// In this particular case it is responsible for disabling the "keyMap",
			// which makes the bellow "Enter" not trigger the spy
			cy.stub(combobox, 'realignFloatedPicker');

			cy.get(`#${combobox.getId()}`).within(() => {
				combobox
					.getPicker()
					.on('refresh', cy.spy().as('comboPickerRefreshSpy'));

				cy.get('input').type('none');
				cy.get('@comboPickerRefreshSpy').should('have.been.called');
				cy.get('input').type('{enter}');
			});
		};

		it('@override: should not throw error', () => {
			cy.spy(BoundListNavigationModelPrototype, 'onKeyEnter').as(
				'onKeyEnterSpy'
			);

			runScenario();

			cy.get('@onKeyEnterSpy')
				.should('have.been.called')
				.should('not.have.thrown');
		});
	});

	describe('ExtJsBug-2(IntegratedFix): combo input value is not updated when pressing Enter on current value selection item', () => {
		const runScenario = function (expectedValue) {
			const combobox = new Ext.field.ComboBox(comboCfg);

			cy.get(`#${combobox.getId()}`).within(() => {
				combobox
					.getPicker()
					.on('refresh', cy.spy().as('comboPickerRefreshSpy'));

				cy.get('input').type('Country1');
				cy.get('@comboPickerRefreshSpy').should('have.been.called');
				cy.get('input')
					.type('{enter}')
					.type('{backspace}{backspace}')
					.type('{enter}')
					.should('have.value', expectedValue);
			});
		};

		it('@override: should update input value', () => {
			runScenario('Country1');
		});
	});

	describe('ExtJsBug-3(IntegratedFix): Ctrl+A/Cmd+A key press resetting single combo value and not selecting the input text', () => {
		const runScenario = function (inputValue, selectionStartValue) {
			const combobox = new Ext.field.ComboBox({
				...comboCfg,
				value: 'Country2',
			});

			combobox
				.getPicker()
				.on('refresh', cy.spy().as('comboPickerRefreshSpy'));

			cy.get(`#${combobox.getId()}`).within(() => {
				cy.get('.x-expandtrigger').click();
				cy.get('@comboPickerRefreshSpy').should('have.been.called');
				cy.get('input')
					.type('{ctrl+a}')
					.should('have.value', inputValue)
					.then(() => {
						// When input text is not selected "selectionStart" equals to
						// input value's length. When all text is selected, it equals 0.
						const [selectionStart] = combobox.getTextSelection();
						expect(selectionStart).to.eq(selectionStartValue);
					})
					.then(() => {
						combobox.collapse();
					});
			});
		};

		it('@override: should not change value and select input text', () => {
			runScenario('Country2', 0);
		});
	});
});
