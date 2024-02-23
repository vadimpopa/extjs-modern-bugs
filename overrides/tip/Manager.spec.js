describe('Ext.tip.Manager', () => {
	let grid, tipManager;

	before(() => {
		tipManager = new Ext.tip['Manager']();
	});
	after(() => {
		tipManager.destroy();
		tipManager = null;
	});

	beforeEach(() => {
		tipManager.tip.hide();
	});

	describe('ExtJsBug-1(IntegratedFix): "data-qoverflow" tip not showing on hover if previous didn\'t have text overflow', () => {
		const gridConfig = {
			xtype: 'grid',
			border: true,
			width: 500,
			height: 100,
			renderTo: Ext.getBody(),
			store: {
				fields: ['code', 'content'],
				data: [
					{
						code: 'code',
						content: 'this is content that will overflow',
					},
				],
			},
			columns: [
				{
					text: 'Code',
					dataIndex: 'code',
					width: 400,
				},
				{
					text: 'Content',
					dataIndex: 'content',
					flex: 1,
				},
			],
		};

		const hoverFieldCell = (modelFieldName) => {
			const record = grid.getStore().getAt(0);

			cy.get(`#${grid.getId()}`)
				.should('be.visible')
				.within(() => {
					cy.contains(
						'[data-qoverflow]',
						record.get(modelFieldName)
					).as('cellEl');
				});

			cy.get('@cellEl').then(([$cellEl]) => {
				const [xPos, yPos] = Ext.fly($cellEl).getXY();
				cy.get('body').trigger('pointerover', xPos, yPos);
			});
		};

		const runFirstThenSecondCellHover = (delayBetweenHovers) => {
			grid = new Ext.grid.Grid(gridConfig);
			const { tip } = tipManager;

			cy.get(tip.element.dom).should('not.be.visible');

			hoverFieldCell('code');

			if (delayBetweenHovers) {
				cy.wait(delayBetweenHovers);
			}

			hoverFieldCell('content');

			cy.get(tip.element.dom).should('be.visible');
		};

		it('should show overflow tooltip when on mouseover directly over overflown cell', () => {
			grid = new Ext.grid.Grid(gridConfig);

			hoverFieldCell('content');
			cy.get(tipManager.tip.element.dom).should('be.visible');
		});

		it(
			'@override: should show overflow tooltip when mouse if first moved ' +
				'to an non-overflow cell and then to overflown one (durring show delay)',
			() => {
				runFirstThenSecondCellHover();
			}
		);

		it(
			'@override: should show overflow tooltip when mouse if first moved ' +
				'to an non-overflow cell and then to overflown one (after show delay)',
			() => {
				const { tip } = tipManager;

				runFirstThenSecondCellHover(tip.getShowDelay() + 100);
			}
		);
	});
});
