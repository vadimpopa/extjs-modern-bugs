describe('Ext.field.Picker', () => {
	describe('ExtJsBug-1: Fix input value not cleared when introducing invalid value', () => {
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

		it('should not clear input', () => {
			// Bypass the override
			const pickerFieldPrototype = Ext.field.Date.prototype;

			cy.stub(
				pickerFieldPrototype,
				'clearValue',
				Ext.field.Text.prototype.clearValue
			);

			runScenario(typedInputValue);
		});

		it('@override: should clear input', () => {
			runScenario('');
		});
	});
});
