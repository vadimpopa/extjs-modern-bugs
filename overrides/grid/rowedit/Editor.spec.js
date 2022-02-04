describe('Ext.grid.rowedit.Editor', () => {
	const RowEditorEditorPrototype = Ext.grid.rowedit.Editor.prototype;

	describe('ExtJsBug-2: top position calculation not implemented for non-infinite grids', () => {
		const rowEditingGridCfg = {
			height: 150,
			renderTo: Ext.getBody(),
			plugins: ['rowedit'],
			infinite: false,
			columns: [
				{
					text: 'Name',
					dataIndex: 'name',
					flex: 1,
					editor: { xtype: 'textfield' },
				},
			],
			store: [{ name: 'First' }, { name: 'Second' }],
		};

		const runScenario = (editorTopAssertion) => {
			const grid = new Ext.grid.Grid(rowEditingGridCfg);

			cy.get(`#${grid.getId()}`).within(() => {
				cy.get('.x-gridrow').eq(1).dblclick();
				cy.get('.x-roweditor')
					.invoke('css', 'top')
					.should(editorTopAssertion, '0px');
			});
		};

		it('editor should show at the top regardless of edited row', () => {
			//Bypass the override
			cy.stub(
				RowEditorEditorPrototype,
				'syncTop',
				RowEditorEditorPrototype.syncTop.$previous
			);

			runScenario('eq');
		});

		it('@override: editor should show over the edited row', () => {
			runScenario('not.eq');
		});
	});

	describe('ExtJsBug-3: thrown error when edited record is moved as a result of sorting', () => {
		const rowEditingGridCfg = {
			height: 150,
			renderTo: Ext.getBody(),
			plugins: ['rowedit'],
			store: {
				sorters: 'name',
				data: [{ name: 'Aa' }, { name: 'Bb' }],
			},
			columns: [
				{
					text: 'Name',
					dataIndex: 'name',
					editor: { xtype: 'textfield' },
				},
			],
		};

		const runScenario = () => {
			const grid = new Ext.grid.Grid(rowEditingGridCfg);

			cy.get(`#${grid.getId()}`).within(() => {
				cy.get('.x-gridrow').first().dblclick();
				// Change the field value so that as a result it would be sorted
				// at a different position
				cy.get('input').first().type('{selectall}{backspace}Zz{enter}');
				cy.get('.x-gridrow').last().contains('Zz');
			});
		};

		it('should throw error on edit', (done) => {
			//Bypass the override
			cy.stub(
				RowEditorEditorPrototype,
				'saveChanges',
				RowEditorEditorPrototype.saveChanges.$previous
			);

			cy.on('uncaught:exception', (err) => {
				expect(err.message).to.include('Cannot set properties of null');

				// using mocha's async done callback to finish this test
				// so we prove that an uncaught exception was thrown
				done();

				// return false to prevent the error from failing this test
				return false;
			});

			runScenario();
		});

		it('@override: should not throw error on edit', () => {
			runScenario();
		});
	});
});
