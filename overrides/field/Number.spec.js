describe('Ext.field.Number', () => {
	describe('ExtJsBug-1(IntegratedFix): serialization ignoring "decimals" config', () => {
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

		it('@override: serialized value should respect "decimals" config', () => {
			runScenario('notEqual');
			runScenario('notEqual', { decimals: 3, value: 123.1234 });
		});
	});
});
