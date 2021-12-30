describe('Ext.field.Field', () => {
	const FieldPrototype = Ext.field.Field.prototype;

	describe('ExtJsBug-1: non-required field having "requiredCls" applied when required set to "null"', () => {
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

		it('should have required class', () => {
			//Bypass the override
			cy.stub(
				FieldPrototype,
				'updateRequired',
				FieldPrototype.updateRequired.$previous
			);

			runScenario('have.class');
		});

		it('@override: should not have required class', () => {
			runScenario('not.have.class');
		});
	});
});
