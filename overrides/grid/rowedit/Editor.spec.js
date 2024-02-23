describe('Ext.grid.rowedit.Editor', () => {
	describe('ExtJsBug-2(IntegratedFix): top position calculation not implemented for non-infinite grids', () => {
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

		it('@override: editor should show over the edited row', () => {
			runScenario('not.eq');
		});
	});

	describe('ExtJsBug-3(IntegratedFix): thrown error when edited record is moved as a result of sorting', () => {
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

		it('@override: should not throw error on edit', () => {
			runScenario();
		});
	});

	describe('ExtJsBug-5(IntegratedFix): roweditor buttons cut out when they are top aligned and not enough space', () => {
		const rowEditingGridCfg = {
			height: 120,
			renderTo: Ext.getBody(),
			plugins: ['rowedit'],
			store: {
				data: [{ name: 'First' }, { name: 'Second' }],
			},
			columns: [
				{
					text: 'Name',
					dataIndex: 'name',
					editor: { xtype: 'textareafield' },
				},
			],
		};

		const runScenario = (rowEditButtonAssertion) => {
			const grid = new Ext.grid.Grid(rowEditingGridCfg);

			cy.get(`#${grid.getId()}`).within(() => {
				cy.get('.x-gridrow').first().dblclick();
				cy.get('.x-panel-roweditor-buttons .x-button').should(
					rowEditButtonAssertion
				);
			});
		};

		it('@override: buttons should be visible', () => {
			runScenario('be.visible');
		});
	});

	describe('ExtJsBug-7(IntegratedFix): editor not adjusting height when there are multiline fields', () => {
		const rowEditingGridCfg = {
			renderTo: Ext.getBody(),
			height: 500,
			plugins: [{ type: 'rowedit', id: 'rowedit' }],
			store: {
				data: [
					{ name: 'First line' },
					{ name: 'Second line' },
					{ name: 'Multiline\nvalue' },
					{ name: 'Another\nmultiline\nvalue' },
				],
			},
			columns: [
				{
					text: 'Name',
					dataIndex: 'name',
					width: 400,
					editor: { xtype: 'textareafield' },
				},
			],
		};

		it('@override: should restore row element height when jumping directly to editing another row', () => {
			const grid = new Ext.grid.Grid(rowEditingGridCfg);

			cy.get(grid.element.dom).within(() => {
				let initialLastRowHeight;

				// triggering edit on the last row, which has multiline text,
				// and as a result will adjust the row element height
				cy.get('.x-gridrow')
					.last()
					.as('lastRow')
					.should('be.visible')
					.then((lastRowEl) => {
						initialLastRowHeight = lastRowEl.height();
					})
					.dblclick();

				cy.get('.x-roweditor').should('be.visible');

				// triggering rowedit on another row while still editing the previous one
				cy.get('.x-gridrow').first().dblclick();

				cy.get('@lastRow').should(($lastRowEl) => {
					expect($lastRowEl.height()).to.eq(initialLastRowHeight);
				});
			});
		});

		it('@override: should update button position when jumping directly to editing another row', () => {
			const grid = new Ext.grid.Grid(rowEditingGridCfg);

			cy.get(grid.element.dom).within(() => {
				cy.get('.x-gridrow').last().should('be.visible').dblclick();

				cy.get('.x-gridrow').first().dblclick();

				cy.get('.x-panel-roweditor-buttons').should(
					([rowEditorButtonsEl]) => {
						const rowEditorButtonsBottom =
							rowEditorButtonsEl.getBoundingClientRect()[
								'bottom'
							];
						const rowEditorBottom = grid
							.getPlugin('rowedit')
							.getEditor()
							.element.dom.getBoundingClientRect()['bottom'];

						// as the buttons wrapper is absolutely positioned,
						// we compare its page coordinates with the editor
						// element ones to assert visibility
						expect(rowEditorButtonsBottom).to.be.gt(
							rowEditorBottom
						);
					}
				);
			});
		});
	});
});
