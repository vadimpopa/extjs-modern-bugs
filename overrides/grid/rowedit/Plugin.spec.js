describe('Ext.grid.rowedit.Plugin', () => {
	const RowEditorPluginPrototype = Ext.grid.rowedit.Plugin.prototype;

	describe('ExtJsBug-1: row editor throws when there are changes to discard', () => {
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

		it('should throw when editing second instance', (done) => {
			//Bypass the override
			cy.stub(
				RowEditorPluginPrototype,
				'updateAutoConfirm',
				RowEditorPluginPrototype.updateAutoConfirm.$previous
			);

			cy.on('uncaught:exception', (err) => {
				expect(err.message).to.include(
					"Cannot read properties of undefined (reading 'updated')"
				);

				// using mocha's async done callback to finish this test
				// so we prove that an uncaught exception was thrown
				done();

				// return false to prevent the error from failing this test
				return false;
			});

			runScenario('not.have.class');
		});

		it('@override: should not throw', () => {
			runScenario('have.class', true);
		});
	});
});
