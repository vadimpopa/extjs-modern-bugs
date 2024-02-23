describe('Ext.grid.Tree', () => {
	describe('"hideHeaders" changes on columns update', () => {
		const columns = [{ text: 'Name' }];

		describe('should be "false"', () => {
			it('when there are initial columns', () => {
				const treeGrid = new Ext.grid.Tree({
					columns,
				});
				expect(treeGrid.getHideHeaders()).to.eq(false);
			});

			it('when there are initial columns and "hideHeaders" is set to "false"', () => {
				const treeGrid = new Ext.grid.Tree({
					hideHeaders: false,
					columns,
				});
				expect(treeGrid.getHideHeaders()).to.eq(false);
			});

			it('after dynamic columns update', () => {
				const treeGrid = new Ext.grid.Tree();
				expect(treeGrid.getHideHeaders()).to.eq(true);
				treeGrid.setColumns(columns);
				expect(treeGrid.getHideHeaders()).to.eq(false);
			});

			it('after dynamic columns update and "hideHeaders" is set to "false"', () => {
				const treeGrid = new Ext.grid.Tree({ hideHeaders: false });
				expect(treeGrid.getHideHeaders()).to.eq(true);
				treeGrid.setColumns(columns);
				expect(treeGrid.getHideHeaders()).to.eq(false);
			});
		});

		describe('should be "true"', () => {
			it('when there are initial columns and "hideHeaders" is set to "true"', () => {
				const treeGrid = new Ext.grid.Tree({
					hideHeaders: true,
					columns,
				});
				expect(treeGrid.getHideHeaders()).to.eq(true);
			});

			it('after dynamic columns update and "hideHeaders" is set to "true', () => {
				const treeGrid = new Ext.grid.Tree({ hideHeaders: true });
				expect(treeGrid.getHideHeaders()).to.eq(true);
				treeGrid.setColumns(columns);
				expect(treeGrid.getHideHeaders()).to.eq(true);
			});
		});
	});

	describe('ExtJsBug-1(IntegratedFix): last child item not visible after expand in infinite tree', () => {
		it('last item children should be visible after expand', () => {
			const rootChildren = Array(100)
				.fill({})
				.map(() => ({
					text: 'Root Child',
				}));

			Object.assign(rootChildren.at(-1), {
				text: 'Last Root Child',
				children: [{ text: 'Inner Child' }],
			});

			const treeGrid = new Ext.grid.Tree({
				width: 200,
				height: 200,
				border: true,
				infinite: true,
				renderTo: Ext.getBody(),
				store: new Ext.data.TreeStore({
					root: {
						text: 'Root',
						expanded: true,
						children: rootChildren,
					},
				}),
				listeners: {
					painted() {
						scrollTreeToBottom();
					},
				},
			});

			const scrollTreeToBottom = () => {
				treeGrid.getScrollable().scrollTo(null, Infinity);
			};

			cy.get(treeGrid.element.dom).as('treeGridEl');

			cy.get('@treeGridEl')
				.contains('.x-treecell', 'Last Root Child')
				.find('.x-expander-el')
				.click()
				.then(() => {
					scrollTreeToBottom();
				});

			cy.get('@treeGridEl')
				.contains('.x-treecell', 'Inner Child')
				.should('be.visible');
		});
	});
});
