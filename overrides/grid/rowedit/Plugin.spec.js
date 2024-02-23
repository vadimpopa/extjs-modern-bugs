describe('Ext.grid.rowedit.Plugin', () => {
	const RowEditorPluginPrototype = Ext.grid.rowedit.Plugin.prototype;
	const rowEditingGridCfg = {
		height: 150,
		border: true,
		renderTo: Ext.getBody(),
		plugins: [{ type: 'rowedit', id: 'rowedit' }],
		columns: [
			{ text: 'Id', dataIndex: 'id', editor: { xtype: 'textfield' } },
			{
				text: 'Name',
				dataIndex: 'name',
				editor: { xtype: 'textfield' },
			},
		],
		store: [
			{ id: 1, name: 'First' },
			{ id: 2, name: 'Second' },
		],
	};

	describe('ExtJsBug-1(IntegratedFix): row editor throws when there are changes to discard', () => {
		const runScenario = (
			secondRowSelectedClassAssertion,
			toRecallUpdateMethod
		) => {
			new Ext.grid.Grid(rowEditingGridCfg);
			const grid2 = new Ext.grid.Grid(rowEditingGridCfg);

			// "autoConfirm" being a "cachedConfig" we need to manually call it on the
			// second scenario, as it was stubbed the first and the overriden method
			// did not get called
			if (toRecallUpdateMethod) {
				grid2.getPlugin('rowedit').updateAutoConfirm('discard');
			}

			cy.get(`#${grid2.getId()}`).within(() => {
				cy.get('.x-gridrow').as('gridRows');
				cy.get('@gridRows')
					.eq(0)
					.find('.x-gridcell')
					.first()
					.dblclick();
				cy.get('input')
					.first()
					.as('firstRowEditorInput')
					.type('{selectall}{backspace}');
				cy.get('@gridRows').eq(1).as('secondRow');
				cy.get('@secondRow').find('.x-gridcell').first().dblclick();
				cy.get('@secondRow').should(
					secondRowSelectedClassAssertion,
					'x-selected'
				);
			});
		};

		it('@override: should not throw', () => {
			runScenario('have.class', true);
		});
	});

	describe('ExtJsBug-2(IntegratedFix): double encoded value displayed in roweditorcell', () => {
		const xssValue = "<a href='#' onmouseover=alert('XSS!')>a.txt</a>";

		const runScenario = (rowEditorCellValue) => {
			const grid = new Ext.grid.Grid({
				...rowEditingGridCfg,
				columns: [
					{
						text: 'Id',
						dataIndex: 'id',
						editor: { xtype: 'textfield' },
					},
					{
						text: 'Name',
						dataIndex: 'name',
						cell: {
							encodeHtml: true,
						},
					},
				],
				store: [{ id: 1, name: xssValue }],
			});

			// We need to reset the drivers, since "drivers" is a "cachedConfig"
			const plugin = grid.getPlugin('rowedit');
			const initialDrivers =
				RowEditorPluginPrototype.getInitialConfig('drivers');
			plugin.setDrivers(initialDrivers);

			cy.get(`#${grid.getId()}`).within(() => {
				cy.get('.x-gridrow .x-gridcell').first().dblclick();
				cy.get('.x-roweditorcell').contains(rowEditorCellValue);
			});
		};

		it('@override: it should have single encoded value', () => {
			runScenario(xssValue);
		});
	});
});
