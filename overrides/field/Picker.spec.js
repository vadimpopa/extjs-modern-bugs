describe('Ext.field.Picker', () => {
	describe('ExtJsBug-1(IntegratedFix): Fix input value not cleared when introducing invalid value', () => {
		const typedInputValue = 333;
		const runScenario = function (inputValue) {
			const dateField = new Ext.field.Date({
				renderTo: Ext.getBody(),
				clearable: true,
				label: 'Date',
			});

			cy.get(`#${dateField.getId()}`).within(() => {
				cy.get('input').as('inputEl').type(typedInputValue);
				cy.get('.x-cleartrigger').click();
				cy.get('@inputEl').should('have.value', inputValue);
			});
		};

		it('@override: should clear input', () => {
			runScenario('');
		});
	});
});
