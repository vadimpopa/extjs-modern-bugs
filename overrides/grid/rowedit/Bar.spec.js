describe('Ext.grid.rowedit.Bar', () => {
	const gridCfg = {
		store: {},
		width: 500,
		height: 250,
		border: true,
		renderTo: Ext.getBody(),
		plugins: {
			rowedit: {
				id: 'rowedit',
			},
		},
		items: [
			{
				xtype: 'toolbar',
				docked: 'top',
				items: [
					{
						text: 'Add',
						handler() {
							const grid = this.up('grid');
							const [record] = grid.getStore().add({});
							grid.getPlugin('rowedit').startEdit(record);
						},
					},
					{
						text: 'Edit',
						handler() {
							const grid = this.up('grid');
							const selectedRecord = grid.getSelection();
							grid.getPlugin('rowedit').startEdit(selectedRecord);
						},
					},
				],
			},
		],
	};

	// Skip the spec if it is run from CI, as it becomes flaky there.
	// In local environment the test passes consistently.
	if (!Cypress.env('IS_CI_RUN')) {
		describe('ExtJsBug-2(IntegratedFix): Fix multi select combo chipview not updated on start edit', () => {
			let grid;

			before(() => {
				grid = new Ext.grid.Grid({
					...gridCfg,
					columns: [
						{
							text: 'Name',
							dataIndex: 'name',
							flex: 1,
							editor: {
								xtype: 'combobox',
								queryMode: 'remote',
								displayField: 'name',
								valueField: 'name',
								multiSelect: true,
								store: {
									proxy: {
										type: 'ajax',
										url: '/countries',
										reader: {
											rootProperty: 'data',
										},
									},
								},
							},
						},
					],
				});
			});

			it('@override: chip item should match cell value', () => {
				cy.interceptCountriesRequest();

				cy.get(`#${grid.getId()}`).as('gridEl');

				const addRecordViaRowEditor = (countryName) => {
					cy.get('@gridEl').within(() => {
						cy.contains('.x-button', 'Add').click();
						cy.get('.x-combobox')
							.as('comboEl')
							.find('.x-expandtrigger')
							.as('expandTriggerEl')
							.click();
					});

					cy.get('@comboEl').then(([$comboEl]) => {
						const combo = Ext.Component.from($comboEl);

						cy.wrap(combo.getStore())
							.invoke('isLoaded')
							.should('be.true');

						cy.get(`#${combo.getPicker().getId()}`)
							.contains('.x-boundlistitem', countryName)
							.click();

						cy.get('@expandTriggerEl').click();
						cy.get('@comboEl').find('input').type('{ENTER}');
						cy.get('@gridEl').contains('.x-gridrow', countryName);
					});
				};

				addRecordViaRowEditor('Afghanistan');
				addRecordViaRowEditor('Albania');

				cy.get('@gridEl').contains('.x-gridrow', 'Afghanistan').click();
				cy.get('@gridEl').contains('.x-button', 'Edit').click();

				cy.get('@comboEl').contains('.x-chip', 'Afghanistan');
			});

			after(() => {
				grid.destroy();
			});
		});
	}

	describe('ExtJsBug-3(IntegratedFix): Fix editor cell values being reset on column resize', () => {
		let grid;

		before(() => {
			grid = new Ext.grid.Grid({
				...gridCfg,
				store: {
					fields: ['code', 'name'],
					data: [
						{
							code: 'en',
							name: 'English',
						},
						{
							code: 'fr',
							name: 'French',
						},
					],
				},
				columns: [
					{
						text: 'Code',
						dataIndex: 'code',
						editor: {
							xtype: 'textfield',
						},
					},
					{
						text: 'Name',
						dataIndex: 'name',
						flex: 1,
						editor: {
							xtype: 'textfield',
						},
					},
				],
			});
		});

		it('@override: editor field value should not change on column resize', () => {
			cy.get(`#${grid.getId()}`).as('gridEl');

			cy.get('@gridEl').find('.x-gridrow').eq(0).click();
			cy.get('@gridEl').contains('.x-button', 'Edit').click();

			const onBarDoSyncColumns = cy
				.spy(Ext.grid.rowedit.Bar.prototype, 'doSyncColumns')
				.as('onBarDoSyncColumns');

			cy.get('@gridEl')
				.should('be.visible')
				.within(() => {
					cy.get('input')
						.eq(0)
						.as('codeEditor')
						.should('have.value', 'en');

					cy.get('input')
						.eq(1)
						.as('nameEditor')
						.should('have.value', 'English')
						.type(' US')
						.then(() => {
							onBarDoSyncColumns.resetHistory();
							grid.getColumnForField('code').setWidth(150);
						});

					cy.get('@onBarDoSyncColumns').should(
						'have.been.calledOnce'
					);
					cy.get('@nameEditor').should('have.value', 'English US');

					cy.contains('.x-button', 'Cancel').click();
					cy.get('.x-roweditor').should('not.be.visible');

					cy.get('@gridEl').get('.x-gridrow').eq(1).click();
					cy.get('@gridEl').contains('.x-button', 'Edit').click();

					cy.get('@codeEditor').should('have.value', 'fr');
					cy.get('@nameEditor').should('have.value', 'French');
					cy.contains('.x-button', 'Cancel').click();

					cy.contains('.x-button', 'Add').click();
					cy.get('@codeEditor').should('have.value', '');
					cy.get('@nameEditor')
						.should('have.value', '')
						.type('Spanish')
						.then(() => {
							onBarDoSyncColumns.resetHistory();
							grid.getColumnForField('code').setWidth(170);
						});

					cy.get('@onBarDoSyncColumns').should(
						'have.been.calledOnce'
					);

					cy.get('@nameEditor').should('have.value', 'Spanish');

					cy.contains('.x-button', 'Cancel').click();
				});
		});

		after(() => {
			grid.destroy();
		});
	});
});
