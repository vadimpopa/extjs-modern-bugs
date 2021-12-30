describe('Ext.scroll.VirtualScroller', () => {
	describe("ExtJsBug-1: combobox's infinite picker collapsing on bar indicator scroller click", () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Combo with infinite picker',
			queryMode: 'local',
			displayField: 'name',
			valueField: 'id',
			floatedPicker: {
				xtype: 'boundlist',
				infinite: true,
				scrollable: {
					indicators: {
						type: 'bar',
					},
				},
			},
			store: {
				data: Array(1000)
					.fill(null)
					.map((item, index) => ({
						id: index,
						name: `item ${index}`,
					})),
			},
		};

		const runScenario = function (pickerVisibilityExpectation) {
			const combobox = new Ext.field.ComboBox(comboCfg);

			cy.spy(Ext.field.ComboBox.prototype, 'collapseIf').as(
				'comboCollapseIfSpy'
			);

			// Stub in order to enforce creation of visible bar indicator
			cy.stub(Ext.scrollbar, 'width', () => 15);
			cy.stub(Ext.scrollbar, 'size', () => ({ width: 15, height: 15 }));

			combobox
				.getPicker()
				.on('refresh', cy.spy().as('comboPickerRefreshSpy'));

			cy.get(`#${combobox.getId()} .x-expandtrigger`).click();
			cy.get('@comboPickerRefreshSpy').should('have.been.called');

			const picker = combobox.getPicker();
			const scrollable = picker.getScrollable();

			expect(scrollable.$className).to.be.eq(
				'Ext.scroll.VirtualScroller'
			);

			cy.get(`#${combobox.getPicker().getId()}`)
				.as('comboPickerEl')
				.find('.x-scrollbar.x-vertical')
				.click();

			cy.get('@comboCollapseIfSpy').should('have.been.called');
			cy.get('@comboPickerEl')
				.should(pickerVisibilityExpectation)
				.then(() => {
					combobox.collapse();
				});
		};

		it('combo should collapse on scroller click', () => {
			const VirtualScrollerPrototype =
				Ext.scroll.VirtualScroller.prototype;

			cy.stub(
				VirtualScrollerPrototype,
				'createYIndicator',
				VirtualScrollerPrototype.createYIndicator.$previous
			);

			runScenario('not.be.visible');
		});

		it('@override: combo should not collapse on scroller click', () => {
			runScenario('be.visible');
		});
	});
});
