describe('Ext.field.ComboBox', () => {
	const ComboBoxPrototype = Ext.field.ComboBox.prototype;

	beforeEach(() => {
		cy.fixture('countries.json').then((countries) => {
			// Interceptor with basic support for paging and filtering
			cy.intercept('/countries?*', (req) => {
				let result = countries;
				let { start, limit, query } = Ext.Object.fromQueryString(
					req.url
				);

				if (query) {
					result = countries.filter((item) =>
						item.name.includes(query)
					);
				}

				start = parseInt(start, 10);
				limit = parseInt(limit, 10);

				req.reply(result.slice(start, limit));
			});
		});
	});

	describe('ExtJsBug-1: local combo loads store on each expand', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose States',
			queryMode: 'local',
			displayField: 'name',
			valueField: 'abbr',
			store: {
				proxy: {
					type: 'ajax',
					url: 'api/states',
				},
			},
			listeners: {
				beforeload: () => false,
			},
		};

		it('should load store on each trigger click/expand', () => {
			//Bypass the override
			cy.stub(
				ComboBoxPrototype,
				'doFilter',
				ComboBoxPrototype.doFilter.$previous
			);

			const combobox = new Ext.field.ComboBox(comboCfg);
			combobox
				.getStore()
				.on('beforeload', cy.spy().as('storeBeforeLoadSpy'));

			cy.get(`#${combobox.getId()} .x-expandtrigger`).click();
			cy.get('@storeBeforeLoadSpy').should('have.been.called');
		});

		it('@override: should not load store', () => {
			const combobox = new Ext.field.ComboBox(comboCfg);
			combobox
				.getStore()
				.on('beforeload', cy.spy().as('storeBeforeLoadSpy'));

			cy.get(`#${combobox.getId()} .x-expandtrigger`).click();
			cy.get('@storeBeforeLoadSpy').should('not.have.been.called');
		});
	});

	describe('ExtJsBug-2(Regression-7.5.0): remote combo on store change loads the old store', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose States',
			queryMode: 'remote',
			displayField: 'name',
			valueField: 'abbr',
			store: {
				proxy: {
					type: 'ajax',
					url: 'api/states',
				},
			},
			listeners: {
				beforeload: () => false,
			},
		};

		it('should not trigger store load, fixed in 7.5.0', () => {
			const combobox = new Ext.field.ComboBox(comboCfg);
			combobox
				.getStore()
				.on('load', cy.spy().as('oldStoreBeforeLoadSpy'));

			combobox.setStore({
				fields: ['id', 'name'],
			});

			cy.get('@oldStoreBeforeLoadSpy').should('not.have.been.called');
		});
	});

	describe('ExtJsBug-3: remote combo triggers store load while destroying', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose States',
			queryMode: 'remote',
			displayField: 'name',
			valueField: 'abbr',
			store: {
				proxy: {
					type: 'ajax',
					url: 'api/states',
				},
			},
		};
		const runScenario = function (testMethod) {
			const combobox = new Ext.field.ComboBox(comboCfg);
			const storeLoadSpy = cy.spy(combobox.getStore(), 'load');

			combobox.destroy();

			expect(storeLoadSpy)[testMethod].have.been.called;
		};

		it('should trigger store load on destroy', () => {
			//Bypass the override
			cy.stub(
				ComboBoxPrototype,
				'applyPrimaryFilter',
				ComboBoxPrototype.applyPrimaryFilter.$previous
			);
			runScenario('to');
		});

		it('@override: should not trigger store load on destroy', () => {
			runScenario('not');
		});
	});

	describe('ExtJsBug-4(Regression-7.5.0): local combo with forceSelection sets non existing values through setValue', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose Country',
			displayField: 'name',
			valueField: 'abbr',
			queryMode: 'local',
			forceSelection: true,
			store: {
				data: [
					{
						name: 'Country 1',
						abbr: 'c1',
					},
					{
						name: 'Country 2',
						abbr: 'c2',
					},
				],
			},
		};
		const nonExistingValue = 'none';

		it('should not set the non existing value, fixed in 7.5.0', () => {
			const combobox = new Ext.field.ComboBox(comboCfg);

			combobox.setValue(nonExistingValue);
			expect(combobox.getValue()).to.be.eq(null);
		});
	});

	describe('ExtJsBug-5: remote combo loads store on each expand', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose Country',
			displayField: 'name',
			valueField: 'code',
			queryMode: 'remote',
			store: {
				proxy: {
					type: 'ajax',
					url: '/countries',
				},
			},
		};

		it('should load store on each expand', () => {
			//Bypass the override
			cy.stub(
				ComboBoxPrototype,
				'doFilter',
				ComboBoxPrototype.doFilter.$previous
			);

			const combobox = new Ext.field.ComboBox(comboCfg);

			combobox.on('collapse', cy.spy().as('comboCollapseSpy'));
			combobox
				.getStore()
				.on('beforeload', cy.spy().as('storeBeforeLoadSpy'));

			cy.get(`#${combobox.getId()} .x-expandtrigger`).as('comboTrigger');

			cy.get('@comboTrigger').click(); //expanding the first time
			cy.get('@storeBeforeLoadSpy').should('have.been.calledOnce');
			cy.get('@comboTrigger').click();
			cy.get('@comboCollapseSpy').should('have.been.called');
			cy.get('@comboTrigger').click(); //expanding the second time
			cy.get('@storeBeforeLoadSpy').should('have.been.calledTwice');
			cy.get('@comboTrigger').click();
			cy.get('@comboCollapseSpy').should('have.been.calledTwice');
		});

		it('@override: should load store only on first expand', () => {
			const combobox = new Ext.field.ComboBox(comboCfg);

			combobox.on('collapse', cy.spy().as('comboCollapseSpy'));
			combobox
				.getStore()
				.on('beforeload', cy.spy().as('storeBeforeLoadSpy'));

			cy.get(`#${combobox.getId()} .x-expandtrigger`).as('comboTrigger');

			cy.get('@comboTrigger').click(); //expanding the second time
			cy.get('@storeBeforeLoadSpy').should('have.been.calledOnce');
			cy.get('@comboTrigger').click();
			cy.get('@comboCollapseSpy').should('have.been.called');
			cy.get('@comboTrigger').click(); //expanding the second time
			cy.get('@storeBeforeLoadSpy').should('have.been.calledOnce');
			cy.get('@comboTrigger').click();
			cy.get('@comboCollapseSpy').should('have.been.calledTwice');
		});
	});

	describe('ExtJsBug-6: remote combo clears original value on store load if it is not in resultset', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose Country',
			displayField: 'name',
			valueField: 'code',
			queryMode: 'remote',
			value: 'c100',
			store: {
				data: [{ code: 'c100', name: 'Country 100' }],
				proxy: {
					type: 'ajax',
					url: '/countries',
				},
			},
		};

		const expandCombo = function (comboCfg, testMethod) {
			const combobox = new Ext.field.ComboBox(comboCfg);

			cy.get(`#${combobox.getId()}`).within(() => {
				cy.get('input').should('not.have.value', '');

				combobox
					.getPicker()
					.on('refresh', cy.spy().as('comboPickerRefreshSpy'));

				cy.get('.x-expandtrigger').click();
				cy.get('@comboPickerRefreshSpy').should('have.been.called');
				cy.get('input')
					.should(testMethod, '')
					.then(() => {
						combobox.collapse();
					});
			});
		};

		it('should clear original value on expand', () => {
			//Bypass the override
			cy.stub(
				ComboBoxPrototype,
				'syncValue',
				Ext.field.Select.prototype.syncValue
			);
			expandCombo(comboCfg, 'have.value');
		});

		it('@override: should keep original value on expand', () => {
			expandCombo(comboCfg, 'not.have.value');
			expandCombo(
				{
					renderTo: Ext.getBody(),
					label: 'Choose Country',
					displayField: 'name',
					valueField: 'name',
					queryMode: 'remote',
					value: 'c100',
					autoLoadOnValue: true,
					keepOriginalValue: true,
					store: {
						proxy: {
							type: 'ajax',
							url: '/countries',
						},
					},
				},
				'not.have.value'
			);
		});
	});

	describe('ExtJsBug-7: remote combo with force selection clears input value on filtering and expand', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose Country',
			displayField: 'name',
			valueField: 'name',
			queryMode: 'remote',
			autoLoadOnValue: true,
			store: {
				proxy: {
					type: 'ajax',
					url: '/countries',
				},
			},
		};

		describe('On filtering', () => {
			const comboValue = 'Australia';

			const runScenario = function (endValue) {
				const combobox = new Ext.field.ComboBox({
					value: comboValue,
					...comboCfg,
				});

				cy.get(`#${combobox.getId()}`).within(() => {
					cy.get('input').should('have.value', comboValue);

					combobox
						.getPicker()
						.on('refresh', cy.spy().as('comboPickerRefreshSpy'));

					cy.get('input').type('{backspace}');
					cy.get('@comboPickerRefreshSpy').should('have.been.called');
					cy.get('input')
						.should('have.value', endValue)
						.then(() => {
							combobox.collapse();
						});
				});
			};

			it('should clear value', () => {
				//Bypass the override
				cy.stub(
					ComboBoxPrototype,
					'syncValue',
					Ext.field.Select.prototype.syncValue
				);

				runScenario('');
			});

			it('@override: should keep value', () => {
				const comboValueWithoutLastChar = comboValue.slice(0, -1);
				runScenario(comboValueWithoutLastChar);
			});
		});

		describe('On expand', () => {
			const comboValue = 'Uruguay';
			const runScenario = function (inputValue, actualValue) {
				const combobox = new Ext.field.ComboBox(comboCfg);

				cy.get(`#${combobox.getId()}`).within(() => {
					combobox
						.getPicker()
						.on('refresh', cy.spy().as('comboPickerRefreshSpy'));
					cy.get('.x-expandtrigger').as('comboTrigger');

					cy.get('input').type(inputValue);
					cy.get('@comboPickerRefreshSpy').should('have.been.called');

					// Type a value of next pages
					cy.get('input')
						.should('have.value', inputValue)
						.then(() => {
							cy.get('@comboTrigger').click();
							cy.get('@comboPickerRefreshSpy').should(
								'have.been.calledTwice'
							);
							cy.get('input').should('have.value', actualValue);
							expect(combobox.getValue()).to.be.eq(inputValue);
							combobox.collapse();
						});
				});
			};

			it('should clear value', () => {
				//Bypass the override
				cy.stub(
					ComboBoxPrototype,
					'syncValue',
					Ext.field.Select.prototype.syncValue
				);

				runScenario(comboValue, '');
			});

			it('@override: should keep value', () => {
				runScenario(comboValue, comboValue);
			});
		});
	});

	describe('ExtJsBug-8(Regression-7.5.0): multiselect combo with force selection does not clear input on blur', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose States',
			queryMode: 'local',
			displayField: 'name',
			valueField: 'code',
			value: ['AD', 'AG'],
			multiSelect: true,
			forceSelection: true,
			store: {
				autoLoad: true,
				proxy: {
					type: 'ajax',
					url: '/countries',
				},
			},
		};
		const nonExistingValue = 'none';

		const runScenario = function (endValue) {
			const combobox = new Ext.field.ComboBox(comboCfg);

			cy.get(`#${combobox.getId()}`).within(() => {
				cy.get('.x-body-el')
					.find('.x-chipview-item')
					.its('length')
					.should('eq', 2);
				cy.get('input')
					.type(nonExistingValue)
					.blur()
					.should('have.value', endValue);
			});
		};

		it('should clear input on blur, fixed in 7.5.0', () => {
			runScenario('');
		});
	});

	describe('ExtJsBug-9(Regression-7.5.0): remote multiselect combo without force selection resets selection when filtered', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose Countries',
			queryMode: 'remote',
			displayField: 'name',
			valueField: 'code',
			multiSelect: true,
			forceSelection: false,
			value: ['AF', 'AX'],
			store: {
				autoLoad: true,
				proxy: {
					type: 'ajax',
					url: '/countries',
				},
			},
		};
		const inputQuery = 'dova';

		const runScenario = function (endInputValue, endChipsCount) {
			const combobox = new Ext.field.ComboBox(comboCfg);

			cy.get(`#${combobox.getId()}`).within(() => {
				cy.get('.x-body-el')
					.find('.x-chip')
					.its('length')
					.should('eq', 2);

				combobox
					.getPicker()
					.on('refresh', cy.spy().as('comboPickerRefreshSpy'));

				cy.get('input').type(inputQuery);
				cy.get('@comboPickerRefreshSpy').should('have.been.called');

				cy.get('input').should('have.value', endInputValue);

				cy.get('.x-body-el')
					.find('.x-chip')
					.its('length')
					.should('eq', endChipsCount)
					.then(() => {
						combobox.collapse();
					});
			});
		};

		it('should clear input on blur, fixed in 7.5.0', () => {
			runScenario(inputQuery, 2);
		});
	});

	describe('ExtJsBug-10: "onEnterKey" method not being called when boundlist is expanded', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose Countries',
			queryMode: 'remote',
			displayField: 'name',
			valueField: 'code',
			multiSelect: true,
			selectOnTab: false,
			forceSelection: false,
			value: ['AF', 'AX'],
			store: {
				autoLoad: true,
				proxy: {
					type: 'ajax',
					url: '/countries',
				},
			},
		};

		const runScenario = function (onEnterKeySpyExpectation) {
			const combobox = new Ext.field.ComboBox(comboCfg);

			cy.spy(ComboBoxPrototype, 'onEnterKey').as('onEnterKeySpy');
			combobox.on('specialkey', cy.spy().as('comboSpecialKeySpy'));
			combobox
				.getPicker()
				.on('refresh', cy.spy().as('comboPickerRefreshSpy'));

			cy.get(`#${combobox.getId()} input`).as('comboInput').type('none');
			cy.get('@comboPickerRefreshSpy').should('have.been.called');

			cy.get('@comboInput').type('{enter}');
			cy.get('@comboSpecialKeySpy').should('have.been.called');

			cy.get('@onEnterKeySpy')
				.should(onEnterKeySpyExpectation)
				.then(() => {
					combobox.collapse();
				});
		};

		it('should not call "onEnterKey" method', () => {
			// Bypass the override
			cy.stub(ComboBoxPrototype, 'onSpecialKey', Ext.emptyFn);

			runScenario('not.have.been.called');
		});

		it('should call "onEnterKey" method', () => {
			runScenario('have.been.called');
		});
	});

	describe('ExtJsBug-12: user is able to remove chip items in a readonly combo', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose Country',
			displayField: 'name',
			valueField: 'abbr',
			queryMode: 'local',
			readOnly: true,
			multiSelect: true,
			value: ['c1', 'c2'],
			store: {
				data: [
					{
						name: 'Country 1',
						abbr: 'c1',
					},
					{
						name: 'Country 2',
						abbr: 'c2',
					},
				],
			},
		};
		const bypassOverrides = () => {
			cy.stub(
				ComboBoxPrototype,
				'updateReadOnly',
				Ext.field.Text.prototype.updateReadOnly
			);
			cy.stub(
				ComboBoxPrototype,
				'updateChipView',
				Ext.field.Select.prototype.updateChipView
			);
		};

		describe("chip item's close element visibility", () => {
			const runScenario = function (chipCloseElExpectation) {
				const combobox = new Ext.field.ComboBox(comboCfg);
				cy.get(`#${combobox.getId()}`).as('comboEl');

				cy.get('@comboEl')
					.find('.x-chip')
					.should('have.length', 2)
					.find('.x-close-el')
					.should(chipCloseElExpectation);
			};

			it('should be visible', () => {
				bypassOverrides();
				runScenario('be.visible');
			});

			it('should not be visible', () => {
				runScenario('not.be.visible');
			});
		});

		describe('removing selected chip elements', () => {
			const runScenario = function (chipElsLength) {
				const combobox = new Ext.field.ComboBox(comboCfg);
				cy.get(`#${combobox.getId()}`).as('comboEl');

				cy.get('@comboEl')
					.find('.x-chip')
					.as('chipEls')
					.click({ multiple: true })
					.last()
					.type('{backspace}');
				cy.get('@chipEls').should('have.length', chipElsLength);
			};

			it('should be able to remove elements', () => {
				bypassOverrides();
				runScenario(1);
			});

			it('should not be able to remove elements', () => {
				runScenario(2);
			});
		});
	});

	describe('ExtJsBug-13: input value not updated when there is an empty store with memory proxy', () => {
		const commonComboCfg = {
			renderTo: Ext.getBody(),
			label: 'Memory Proxy Combo',
			queryMode: 'local',
			displayField: 'name',
			valueField: 'id',
			forceSelection: false,
		};

		const memoryProxyCfg = {
			field: ['id', 'name'],
			type: 'memory',
		};

		const runScenario = (comboCfg, valueExpectation) => {
			const combobox = new Ext.field.ComboBox(comboCfg);

			const newValue = 'first';
			combobox.on('change', cy.spy().as('comboOnChangeSpy'));

			combobox.setValue(newValue);
			cy.get('@comboOnChangeSpy').should('have.been.called');

			expect(combobox.getValue()).to.equal(newValue);

			cy.get(`#${combobox.getId()} input`).should(
				valueExpectation,
				newValue
			);
		};

		describe('memory store without data', () => {
			const comboCfg = {
				...commonComboCfg,
				store: {
					proxy: memoryProxyCfg,
				},
			};

			it('should not update input value without override', () => {
				// Bypass the override
				cy.stub(
					ComboBoxPrototype,
					'updateStore',
					Ext.field.Select.prototype.updateStore
				);

				runScenario(comboCfg, 'not.have.value');
			});

			it('should update input value', () => {
				runScenario(comboCfg, 'have.value');
			});
		});

		describe('memory store with initial data', () => {
			it('should update input value', () => {
				const comboCfg = {
					...commonComboCfg,
					store: {
						proxy: memoryProxyCfg,
						data: [
							{
								id: 1,
								name: 'first',
							},
						],
					},
				};

				runScenario(comboCfg, 'have.value');
			});
		});

		describe('memory store with data updated via "setData"', () => {
			it('should update input value', () => {
				const comboCfg = {
					...commonComboCfg,
					store: {
						proxy: memoryProxyCfg,
					},
					listeners: {
						initialize() {
							this.getStore().setData([
								{
									id: 1,
									name: 'first',
								},
							]);
						},
					},
				};

				runScenario(comboCfg, 'have.value');
			});
		});

		describe('memory store with data updated via "loadRawData"', () => {
			it('should update input value', () => {
				const comboCfg = {
					...commonComboCfg,
					store: {
						proxy: memoryProxyCfg,
					},
					listeners: {
						initialize() {
							this.getStore().loadRawData([
								{
									id: 1,
									name: 'first',
								},
							]);
						},
					},
				};

				runScenario(comboCfg, 'have.value');
			});
		});
	});

	describe(
		'ExtJsBug-14: remote multiselect combo with force selection ' +
			'resets selection when filtered with input query that matches "valueField" value',
		() => {
			const comboCfg = {
				renderTo: Ext.getBody(),
				label: 'Choose Countries',
				queryMode: 'remote',
				displayField: 'name',
				valueField: 'name',
				multiSelect: true,
				forceSelection: true,
				value: ['Albania', 'Algeria'],
				store: {
					autoLoad: true,
					proxy: {
						type: 'ajax',
						url: '/countries',
					},
				},
			};
			const inputQuery = 'Monaco';

			const runScenario = (endChipsCount) => {
				const combobox = new Ext.field.ComboBox(comboCfg);

				cy.get(`#${combobox.getId()}`).within(() => {
					cy.get('.x-body-el')
						.find('.x-chip')
						.its('length')
						.should('eq', 2);

					combobox
						.getPicker()
						.on('refresh', cy.spy().as('comboPickerRefreshSpy'));

					cy.get('input').type(inputQuery);
					cy.get('@comboPickerRefreshSpy').should('have.been.called');

					cy.get('.x-body-el')
						.find('.x-chip')
						.its('length')
						.should('eq', endChipsCount)
						.then(() => {
							combobox.collapse();
						});
				});
			};

			it('should reset selection on remote filter', () => {
				// Bypass the override
				cy.stub(
					ComboBoxPrototype,
					'syncValue',
					Ext.field.Select.prototype.syncValue
				);

				runScenario(1);
			});

			it('@override: should not reset selection on remote filter', () => {
				runScenario(2);
			});
		}
	);

	describe('Ext.dataview.selection.Model@ExtJsBug-2: remote multi combo with unordered values throws error when filtered and then removing chip elements', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose Country',
			displayField: 'name',
			valueField: 'code',
			queryMode: 'remote',
			multiSelect: true,
			autoLoadOnValue: true,
			value: ['BE', 'AL'],
			store: {
				proxy: {
					type: 'ajax',
					url: '/countries',
				},
			},
		};
		const runScenario = (endChipsCount) => {
			const combobox = new Ext.field.ComboBox(comboCfg);
			combobox.on('pickercreate', cy.spy().as('pickerCreateSpy'));

			cy.get(`#${combobox.getId()}`).as('comboEl');

			cy.get('@comboEl').within(() => {
				cy.get('.x-body-el')
					.find('.x-chip')
					.its('length')
					.should('eq', 2);

				cy.get('input').type('ala');
			});

			cy.get('@pickerCreateSpy')
				.should('have.been.called')
				.then(() => {
					cy.get(`#${combobox.getPicker().getId()}`)
						.find('.x-boundlistitem')
						.eq(1)
						.click()
						.then(() => {
							combobox.collapse();
						});
				});

			cy.get('@comboEl').within(() => {
				cy.get('.x-chip .x-close-el').first().click();
				cy.get('.x-chip .x-close-el').first().click();

				cy.get('.x-body-el')
					.find('.x-chip')
					.its('length')
					.should('eq', endChipsCount);
			});
		};

		it('should throw when removing chips', (done) => {
			const SelectionModelPrototype =
				Ext.dataview.selection.Model.prototype;

			// Bypass the override
			cy.stub(
				SelectionModelPrototype,
				'applySelected',
				SelectionModelPrototype.applySelected.$previous
			);

			cy.once('uncaught:exception', (err) => {
				expect(err.message).to.include(
					'Cannot read properties of null'
				);

				// using mocha's async done callback to finish this test
				// so we prove that an uncaught exception was thrown
				done();

				// return false to prevent the error from failing this test
				return false;
			});

			runScenario(2);
		});

		it('@override: should not throw when removing chips', () => {
			runScenario(1);
		});
	});
});
