describe('Ext.field.Field', () => {
	describe('ExtJsBug-1(IntegratedFix): non-required field having "requiredCls" applied when required set to "null"', () => {
		const fieldCfg = {
			renderTo: Ext.getBody(),
			label: 'Non-required field',
			required: false,
		};

		runScenario = (requiredClsAssertion) => {
			const field = new Ext.field.Text(fieldCfg);

			field.setRequired(null);
			cy.get(`#${field.getId()}`).should(
				requiredClsAssertion,
				field.requiredCls
			);
		};

		it('@override: should not have required class', () => {
			runScenario('not.have.class');
		});
	});
});
