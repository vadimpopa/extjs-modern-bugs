describe('Ext.field.ComboBox', () => {
	const ComboBoxPrototype = Ext.field.ComboBox.prototype;
	const countriesProxy = {
		type: 'ajax',
		url: '/countries',
		reader: {
			rootProperty: 'data',
		},
	};

	beforeEach(() => {
		cy.interceptCountriesRequest();
	});

	describe('ExtJsBug-1(IntegratedFix): local combo loads store on each expand', () => {
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

		it('@override: should not load store', () => {
			const combobox = new Ext.field.ComboBox(comboCfg);
			combobox
				.getStore()
				.on('beforeload', cy.spy().as('storeBeforeLoadSpy'));

			cy.get(`#${combobox.getId()} .x-expandtrigger`).click();
			cy.get('@storeBeforeLoadSpy').should('not.have.been.called');
		});
	});

	describe('ExtJsBug(Regression-7.5.0): remote multiselect combo without forceSelection does not clear input value on ENTER when store not loaded', () => {
		// Previous override for "onCollectionAdd" method was removed.
		// Aside from the main spec, there are specs for local and remote combos with
		// and without "forceSelection".
		const commonComboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose Countries',
			displayField: 'name',
			valueField: 'code',
			multiSelect: true,
			store: {
				proxy: countriesProxy,
			},
		};

		const unexistingStoreValue = 'Atlantida';
		const duringStoreLoadSpecFn = (title, comboCfg, expectedInputValue) => {
			it(title, () => {
				const combobox = new Ext.field.ComboBox(comboCfg);

				cy.get(`#${combobox.getId()}`).within(() => {
					cy.get('input')
						.type(`${unexistingStoreValue}{ENTER}`)
						.should('have.value', expectedInputValue)
						.then(() => {
							combobox.collapse();
						});
				});
			});
		};
		const afterStoreLoadSpecFn = (title, comboCfg, expectedInputValue) => {
			it(title, () => {
				const combobox = new Ext.field.ComboBox(comboCfg);

				cy.get(`#${combobox.getId()}`).within(() => {
					const store = combobox.getStore();

					store.on('load', cy.spy().as('comboStoreLoadSpy'));
					store.load();
					cy.get('@comboStoreLoadSpy')
						.should('have.been.called')
						.then(() => {
							cy.get('input')
								.type(`${unexistingStoreValue}{ENTER}`)
								.should('have.value', expectedInputValue)
								.then(() => {
									combobox.collapse();
								});
						});
				});
			});
		};

		describe('remote combo with forceSelection', () => {
			const comboCfg = {
				...commonComboCfg,
				queryMode: 'remote',
				forceSelection: false,
			};
			const title = 'should not clear input value on ENTER';

			duringStoreLoadSpecFn(title, comboCfg, '');
			afterStoreLoadSpecFn(title, comboCfg, '');
		});

		describe('remote combo without forceSelection', () => {
			const title = 'should clear input value on ENTER';
			const comboCfg = {
				...commonComboCfg,
				queryMode: 'remote',
				forceSelection: true,
			};

			duringStoreLoadSpecFn(title, comboCfg, unexistingStoreValue);
			afterStoreLoadSpecFn(title, comboCfg, unexistingStoreValue);
		});

		describe('local combo with forceSelection', () => {
			const title = 'should not clear input value on ENTER';
			const comboCfg = {
				...commonComboCfg,
				queryMode: 'local',
				forceSelection: false,
			};

			duringStoreLoadSpecFn(title, comboCfg, '');
			afterStoreLoadSpecFn(title, comboCfg, '');
		});

		describe('local combo without forceSelection', () => {
			const title = 'should clear input value on ENTER';
			const comboCfg = {
				...commonComboCfg,
				queryMode: 'local',
				forceSelection: true,
			};

			duringStoreLoadSpecFn(title, comboCfg, unexistingStoreValue);
			afterStoreLoadSpecFn(title, comboCfg, unexistingStoreValue);
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

	describe('ExtJsBug-3(IntegratedFix): remote combo triggers store load while destroying', () => {
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

	describe('ExtJsBug-5(IntegratedFix): remote combo loads store on each expand', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose Country',
			displayField: 'name',
			valueField: 'code',
			queryMode: 'remote',
			store: {
				proxy: countriesProxy,
			},
		};

		const runScenario = (storeLoadCallCount) => {
			const combobox = new Ext.field.ComboBox(comboCfg);

			combobox.on('collapse', cy.spy().as('comboCollapseSpy'));
			combobox
				.getStore()
				.on('beforeload', cy.spy().as('storeBeforeLoadSpy'));

			cy.get(`#${combobox.getId()} .x-expandtrigger`).as('comboTrigger');

			cy.get('@comboTrigger').click(); //expanding the first time
			const picker = combobox.getPicker();
			picker.on('refresh', cy.spy().as('comboPickerRefreshSpy'));
			cy.get('@comboPickerRefreshSpy').should('have.been.called');
			cy.get('@storeBeforeLoadSpy').should('have.been.calledOnce');
			if (Cypress.browser.name === 'electron') {
				// Only on electron the collapse click occurs too fast
				cy.wait(200);
			}
			cy.get('@comboTrigger').click(); //collapsing
			cy.get('@comboCollapseSpy').should('have.been.called');

			cy.get('@comboTrigger').click(); //expanding the second time
			cy.get('@storeBeforeLoadSpy')
				.should('have.been.callCount', storeLoadCallCount)
				.then(() => {
					combobox.collapse();
				});
		};

		it('@override: should load store only on first expand', () => {
			runScenario(1);
		});
	});

	describe('ExtJsBug-6(IntegratedFix): remote combo clears original value on store load if it is not in resultset', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose Country',
			displayField: 'name',
			valueField: 'code',
			queryMode: 'remote',
			value: 'c100',
			store: {
				data: [{ code: 'c100', name: 'Country 100' }],
				proxy: countriesProxy,
			},
		};

		const runScenario = function (comboCfg, expectedInputValue) {
			const combobox = new Ext.field.ComboBox(comboCfg);

			cy.get(`#${combobox.getId()}`).within(() => {
				cy.get('input').should('not.have.value', '');

				combobox
					.getPicker()
					.on('refresh', cy.spy().as('comboPickerRefreshSpy'));

				cy.get('.x-expandtrigger').click();
				cy.get('@comboPickerRefreshSpy').should('have.been.called');
				cy.get('input')
					.should('have.value', expectedInputValue)
					.then(() => {
						combobox.collapse();
					});
			});
		};

		it('@override: should NOT keep original value on expand when "keepOriginalValue: false"', () => {
			runScenario(
				{
					...comboCfg,
					keepOriginalValue: false,
				},
				''
			);
		});

		it('@override: should keep original value on expand when "keepOriginalValue: true"', () => {
			runScenario(
				{
					...comboCfg,
					valueField: 'name',
					autoLoadOnValue: true,
					keepOriginalValue: true,
					store: {
						proxy: countriesProxy,
					},
				},
				'c100'
			);
		});
	});

	describe('ExtJsBug-7(IntegratedFix): remote combo with force selection clears input value on filtering and expand', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose Country',
			displayField: 'name',
			valueField: 'name',
			queryMode: 'remote',
			autoLoadOnValue: true,
			store: {
				proxy: countriesProxy,
			},
		};

		describe('On filtering', () => {
			const comboValue = 'Australia';

			const runScenario = function (endValue) {
				const combobox = new Ext.field.ComboBox({
					...comboCfg,
					value: comboValue,
				});

				cy.get(`#${combobox.getId()}`).within(() => {
					cy.get('input').should('have.value', comboValue);

					combobox.getStore().on('load', cy.spy().as('storeLoadSpy'));

					cy.get('@storeLoadSpy').should('have.been.called');

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

			it('@override: should keep value', () => {
				const comboValueWithoutLastChar = comboValue.slice(0, -1);
				runScenario(comboValueWithoutLastChar);
			});
		});

		describe('On expand (with "keepOriginal: true")', () => {
			it('@override: should keep value', () => {
				const comboValue = 'Uruguay';
				const combobox = new Ext.field.ComboBox({
					...comboCfg,
					keepOriginalValue: true,
				});

				cy.get(`#${combobox.getId()}`).within(() => {
					combobox
						.getPicker()
						.on('refresh', cy.spy().as('comboPickerRefreshSpy'));
					cy.get('.x-expandtrigger').as('comboTrigger');

					cy.get('input').as('inputEl').type(comboValue);
					cy.get('@comboPickerRefreshSpy').should('have.been.called');

					// Type a value of next pages
					cy.get('@inputEl')
						.should('have.value', comboValue)
						.then(($el) => {
							combobox.collapse();
							cy.get('@comboTrigger').click();
							cy.get('@comboPickerRefreshSpy').should(
								'have.been.calledTwice'
							);
							cy.get($el).should('have.value', comboValue);
						})
						.then(() => {
							combobox.collapse();
						});
				});
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
				proxy: countriesProxy,
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
				proxy: countriesProxy,
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

	describe('ExtJsBug-10(IntegratedFix): "onEnterKey" method not being called when boundlist is expanded', () => {
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
				proxy: countriesProxy,
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

		it('should call "onEnterKey" method', () => {
			runScenario('have.been.called');
		});
	});

	describe('ExtJsBug-13(IntegratedFix): input value not updated when there is an empty store with memory proxy', () => {
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
		'ExtJsBug-14(IntegratedFix): remote multiselect combo with force selection ' +
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
					proxy: countriesProxy,
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

			it('@override: should not reset selection on remote filter', () => {
				runScenario(2);
			});
		}
	);

	describe('Ext.dataview.selection.Model@ExtJsBug-2(IntegratedFix): remote multi combo with unordered values throws error when filtered and then removing chip elements', () => {
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
				proxy: countriesProxy,
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

		it('@override: should not throw when removing chips', () => {
			runScenario(1);
		});
	});

	describe(
		'ExtJsBug-15(IntegratedFix): multiselect combo without force selection not firing "change" event' +
			' when adding non-store values',
		() => {
			const comboCfg = {
				renderTo: Ext.getBody(),
				label: 'Choose Country',
				displayField: 'name',
				valueField: 'abbr',
				queryMode: 'local',
				multiSelect: true,
				forceSelection: false,
				value: ['c1'],
				store: {
					data: [
						{
							name: 'Country1',
							abbr: 'c1',
						},
						{
							name: 'Country2',
							abbr: 'c2',
						},
					],
				},
			};

			const runScenario = (listenerCallCount) => {
				const combobox = new Ext.field.ComboBox(comboCfg);

				cy.get(`#${combobox.getId()}`).within(() => {
					combobox.on('change', cy.spy().as('comboChangeSpy'));

					cy.get('input')
						.type('Country2{ENTER}') // store value
						.type('ViaEnter{ENTER}')
						.type(`ViaDelimiterType${combobox.getDelimiter()}`)
						.type('ViaFocusLose')
						.blur();

					cy.get('@comboChangeSpy').should(
						'have.been.callCount',
						listenerCallCount
					);

					cy.get('.x-body-el')
						.find('.x-chip')
						.its('length')
						.should('eq', 5)
						.then(() => {
							combobox.collapse();
						});
				});
			};

			it('@override: should fire "change" event for all changes', () => {
				runScenario(4);
			});
		}
	);

	describe('ExtJsBug-16(IntegratedFix): remote combo collapses when the input query text matches filtered store record "valueField" value', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose Country',
			displayField: 'name',
			valueField: 'code',
			queryMode: 'remote',
			forceSelection: false,
			store: {
				proxy: countriesProxy,
			},
		};
		const inputQuery = 'Canada';

		const runScenario = (collapseSpyExpectation) => {
			const combobox = new Ext.field.ComboBox(comboCfg);

			combobox.on('collapse', cy.spy().as('comboCollapseSpy'));
			combobox
				.getPicker()
				.on('refresh', cy.spy().as('comboPickerRefreshSpy'));

			cy.get(`#${combobox.getId()} input`).type(inputQuery);

			cy.get(`#${combobox.getPicker().getId()}`)
				.should('be.visible')
				.contains(inputQuery);

			cy.get('@comboPickerRefreshSpy').should('have.been.called');
			cy.get('@comboCollapseSpy')
				.should(collapseSpyExpectation)
				.then(() => {
					combobox.collapse();
				});
		};

		it('@override: should not collapse when input query matches filtered record value', () => {
			runScenario('not.have.been.called');
		});
	});

	describe(
		'ExtJsBug-17(IntegratedFix): clearable multiselect remote combo with "forceSelection" set to false,' +
			' is not updating chip elements on clear trigger click, after adding a new value',
		() => {
			const comboCfg = {
				renderTo: Ext.getBody(),
				label: 'Choose Country',
				displayField: 'name',
				valueField: 'code',
				queryMode: 'remote',
				forceSelection: false,
				multiSelect: true,
				store: {
					proxy: countriesProxy,
				},
			};

			const runScenario = (expectedChipElsCount) => {
				const combobox = new Ext.field.ComboBox(comboCfg);

				combobox
					.getStore()
					.on('beforeload', cy.spy().as('storeBeforeLoadSpy'));

				cy.get(`#${combobox.getId()}`).within(() => {
					cy.get('input').type('dummyValue');
					cy.get('@storeBeforeLoadSpy').should('have.been.called');
					cy.get('input').type('{ENTER}');

					cy.get('.x-cleartrigger').click();

					cy.get('.x-body-el .x-chip')
						.should('have.length', expectedChipElsCount)
						.then(() => {
							combobox.collapse();
						});
				});
			};

			it('@override: should clear chip elements on clear trigger click', () => {
				runScenario(0);
			});
		}
	);

	describe(
		'ExtJsBug-18(IntegratedFix): multiselect remote combo with "forceSelection" set to false,' +
			' and "autoFocusLast" set to false, throwing an error on expand when it has' +
			' user entered value (not present in the store)',
		() => {
			const comboCfg = {
				renderTo: Ext.getBody(),
				label: 'Choose Country',
				displayField: 'name',
				valueField: 'code',
				queryMode: 'remote',
				autoFocusLast: false,
				forceSelection: false,
				multiSelect: true,
				value: ['dummyValue'],
				autoLoadOnValue: true,
				store: {
					proxy: countriesProxy,
				},
			};

			const runScenario = () => {
				const combobox = new Ext.field.ComboBox(comboCfg);

				combobox
					.getStore()
					.on('load', cy.spy().as('comboStoreLoadSpy'));

				cy.get(`#${combobox.getId()}`).within(() => {
					cy.get('@comboStoreLoadSpy').should('have.been.called');

					cy.get('.x-expandtrigger').click();

					cy.wrap(combobox)
						.its('expanded')
						.should('not.eql', false)
						.then(() => {
							combobox.collapse();
						});
				});
			};

			it('@override: should not throw on expand', () => {
				runScenario();
			});
		}
	);

	describe('EXTJS-28512(Regression-7.5.0): issue results multiple query to perform action on search and then convert typed value to tag', () => {
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Choose Countries',
			queryMode: 'remote',
			displayField: 'name',
			valueField: 'code',
			multiSelect: true,
			forceSelection: false,
			store: {
				proxy: countriesProxy,
			},
		};
		const inputQuery = 'dova';

		const runScenario = function (endInputValue) {
			const combobox = new Ext.field.ComboBox(comboCfg);

			cy.get(`#${combobox.getId()}`).within(() => {
				combobox
					.getStore()
					.on('load', cy.spy().as('comboStoreLoadSpy'));
				combobox
					.getPicker()
					.on('refresh', cy.spy().as('comboPickerRefreshSpy'));

				cy.get('input').type(inputQuery);
				cy.get('@comboPickerRefreshSpy').should('have.been.called');

				cy.get('input').should('have.value', endInputValue);
				cy.get('@comboStoreLoadSpy').should('have.been.calledOnce');

				cy.get('.x-body-el .x-chip')
					.should('have.length', 0)
					.then(() => {
						combobox.collapse();
					});
			});
		};

		it('should load store once and keep input value, fixed in 7.5.0', () => {
			runScenario(inputQuery);
		});
	});

	describe(
		'ExtJsBug-19(IntegratedFix): multi select remote combo with "forceSelection" set to true, is clearing ' +
			'input filter value on store load, when a selected value record is loaded in the store.',
		() => {
			it('@override: it should keep input value on store load', () => {
				const comboCfg = {
					renderTo: Ext.getBody(),
					label: 'Choose Countries',
					queryMode: 'remote',
					displayField: 'name',
					valueField: 'code',
					multiSelect: true,
					forceSelection: true,
					store: {
						proxy: countriesProxy,
					},
				};

				const combobox = new Ext.field.ComboBox(comboCfg);

				combobox.getStore().on('load', cy.spy().as('storeLoadSpy'));

				cy.get(`#${combobox.getId()} input`)
					.as('comboInput')
					.type('Belg');
				// Selecting "Belgium"
				cy.get(`#${combobox.getPicker().getId()}`)
					.find('.x-boundlistitem')
					.eq(0)
					.click();
				// Typing a query that will return the previous
				// selecting value "Belgium"
				cy.get('@comboInput').type('Bel');
				cy.get('@storeLoadSpy').should('have.been.calledTwice');
				cy.get('@comboInput')
					.should('have.value', 'Bel')
					.then(() => {
						combobox.collapse();
					});
			});
		}
	);

	describe(
		'ExtJSBug-20(IntegratedFix): local combo without "forceSelection" ' +
			'updating selection, while the user is typing, if the typed value ' +
			'matches by "valueField" an existing record from the store',
		() => {
			const comboCfg = {
				renderTo: Ext.getBody(),
				label: 'Choose Countries',
				queryMode: 'local',
				displayField: 'name',
				valueField: 'code',
				forceSelection: false,
				store: {
					data: [
						{
							name: 'Test1',
							code: 'test',
						},
						{
							name: 'Test2',
							code: 'tester',
						},
					],
				},
			};

			it('@override: it should not change input value while user is typing', () => {
				const combobox = new Ext.field.ComboBox(comboCfg);
				const typedValue = 'test'; //note that it matches a store record by "code"
				cy.spy(combobox, 'syncValue').as('syncValueSpy');

				cy.get(`#${combobox.getId()} input`)
					.as('comboInput')
					.type(typedValue);
				cy.get('@syncValueSpy').should('have.been.called');
				cy.wrap(combobox).its('_inputValue').should('eq', typedValue);
				cy.get('@comboInput')
					.should('have.value', typedValue)
					.then(() => {
						combobox.collapse();
					});
			});

			it('@override: it should collapse the combo on clear trigger click', () => {
				const combobox = new Ext.field.ComboBox(comboCfg);

				cy.get(`#${combobox.getId()} input`).type('test');
				cy.get(`#${combobox.getPicker().getId()}`)
					.as('pickerEl')
					.should('be.visible');
				cy.get(`#${combobox.getId()} .x-cleartrigger`).click();
				cy.get('@pickerEl')
					.should('not.be.visible')
					.then(() => {
						combobox.collapse();
					});
			});
		}
	);
});

describe('Ext.field.Select@ExtJsBug-5(IntegratedFix): user is able to remove/select chip items in a readonly/disabled combo', () => {
	const comboCfg = {
		renderTo: Ext.getBody(),
		label: 'Choose Country',
		displayField: 'name',
		valueField: 'abbr',
		queryMode: 'local',
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
	const readOnlyComboCfg = {
		...comboCfg,
		readOnly: true,
		label: 'Readonly Combo',
	};
	const disabledComboCfg = {
		...comboCfg,
		disabled: true,
		label: 'Disabled Combo',
	};

	describe("chip item's close element visibility", () => {
		const runScenario = function (chipCloseElExpectation) {
			const readOnlyCombo = new Ext.field.ComboBox(readOnlyComboCfg);
			const disabledCombo = new Ext.field.ComboBox(disabledComboCfg);

			[readOnlyCombo, disabledCombo].forEach((combobox) => {
				cy.get(`#${combobox.getId()}`).as('comboEl');

				cy.get('@comboEl')
					.find('.x-chip')
					.should('have.length', 2)
					.find('.x-close-el')
					.should(chipCloseElExpectation);
			});
		};

		it('@override: should not be visible', () => {
			runScenario('not.be.visible');
		});
	});

	describe('removing selected chip elements (by click select and BACKSPACE)', () => {
		// No need to test disabled state in this spec since
		// chip elements in that state are not selectable.
		const runScenario = function (chipElsLength) {
			const readOnlyCombo = new Ext.field.ComboBox(readOnlyComboCfg);

			cy.get(`#${readOnlyCombo.getId()}`)
				.find('.x-chip')
				.as('chipEls')
				.click({ multiple: true })
				.last()
				.type('{backspace}');
			cy.get('@chipEls').should('have.length', chipElsLength);
		};

		it('@override: should not be able to remove elements', () => {
			runScenario(2);
		});
	});

	describe('should select chip on click', () => {
		const runScenario = function (combo, selectedClassAssertion) {
			cy.get(`#${combo.getId()} .x-chip`)
				.should('have.length', 2)
				.click({ multiple: true })
				.should(selectedClassAssertion, 'x-selected');
		};

		it('simple combo (without readOnly or disabled): should select 2 chips', () => {
			const combo = new Ext.field.ComboBox(comboCfg);
			runScenario(combo, 'have.class');
		});

		describe('readOnly combo', () => {
			it('@override: should not select chips', () => {
				const combo = new Ext.field.ComboBox(readOnlyComboCfg);
				runScenario(combo, 'not.have.class');
			});
		});

		describe('disabled combo', () => {
			it('@override: should not select chips', () => {
				const combo = new Ext.field.ComboBox(disabledComboCfg);
				runScenario(combo, 'not.have.class');
			});
		});
	});
});

describe(
	'Ext.field.Select@ExtJsBug-6(IntegratedFix): Fix multiselect combo with memory proxy does not update its' +
		'selection upon initialization if "multiSelect" config is specified before "value" config',
	() => {
		const comboValue = ['first'];
		const comboCfg = {
			renderTo: Ext.getBody(),
			label: 'Memory Proxy Combo',
			xtype: 'combobox',
			// "multiSelect" should be before "value"
			// for the bug to be reproducible
			multiSelect: true,
			value: comboValue,
			valueField: 'id',
			displayField: 'name',
			queryMode: 'local',
			forceSelection: false,
			store: {
				proxy: {
					type: 'memory',
				},
			},
		};

		const runScenario = function (chipElsCount) {
			const combo = new Ext.field.ComboBox(comboCfg);

			cy.get(`#${combo.getId()}`).within(() => {
				cy.wrap(combo)
					.its('_value')
					.should('eql', comboValue)
					.then(() => {
						const selection = combo.getSelection();
						if (chipElsCount) {
							expect(selection).to.have.lengthOf(chipElsCount);
						} else {
							expect(selection).to.eq(null);
						}

						cy.get('.x-chipview-body-el')
							.children()
							// "+1" because chipview also contain the input element
							.should('have.length', chipElsCount + 1);
					});
			});
		};

		it('should have visible selected value', () => {
			runScenario(1);
		});
	}
);

describe('Ext.dataview.ChipView@ExtJsBug-1(IntegratedFix): chip item element classes not synchronized on update', () => {
	const comboCfg = {
		renderTo: Ext.getBody(),
		label: 'Choose Country',
		displayField: 'name',
		valueField: 'abbr',
		queryMode: 'local',
		multiSelect: true,
		value: ['c1', 'c2'],
		store: {
			data: [
				{
					name: 'Country 1',
					abbr: 'c1',
				},
			],
		},
	};
	const runScenario = function (selectedClassAssertion) {
		const combo = new Ext.field.ComboBox(comboCfg);
		combo.setReadOnly(true);

		cy.get(`#${combo.getId()}`)
			.find('.x-chip')
			.first()
			.click()
			.should('have.class', 'x-hovered')
			.should(selectedClassAssertion, 'x-closable');
	};

	it('@override: "x-closable" class should not be available for readonly combo after chip click', () => {
		runScenario('not.have.class');
	});
});
