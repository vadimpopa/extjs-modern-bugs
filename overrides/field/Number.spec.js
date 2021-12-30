describe('Ext.field.Number', () => {
	describe('ExtJsBug-1: serialization ignoring "decimals" config', () => {
		const runScenario = function (assertion, numberFieldCfg = {}) {
			const numberField = new Ext.field.Number({
				value: 123.123,
				decimals: 2, //default value
				renderTo: Ext.getBody(),
				label: 'Number',
				...numberFieldCfg,
			});
			const initialValue = numberField.getValue();

			assert.notEqual(
				numberField.getInputValue(),
				initialValue.toString(),
				'input value should always be formatted'
			);
			assert[assertion](numberField.serialize(), initialValue);
		};

		it('serialized value should ignore "decimals" config', () => {
			// Bypass the override
			const numberFieldPrototype = Ext.field.Number.prototype;

			cy.stub(
				numberFieldPrototype,
				'serialize',
				Ext.field.Field.prototype.serialize
			);

			runScenario('equal');
			runScenario('equal', { decimals: 3, value: 123.1234 });
		});

		it('@override: serialized value should respect "decimals" config', () => {
			runScenario('notEqual');
			runScenario('notEqual', { decimals: 3, value: 123.1234 });
		});
	});
});
