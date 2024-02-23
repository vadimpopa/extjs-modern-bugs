describe('Ext.field.Date', () => {
	describe('ExtJsBug-1(IntegratedFix): when "dateFormat" contains time info, it is removed on value parse', () => {
		const stringDateValue = '15.02.2021 15:31';
		const fieldCfg = {
			renderTo: Ext.getBody(),
			label: 'Date',
			dateFormat: 'dd.MM.y H:mm',
			altFormats: null,
		};

		it('@override: should keep time info', () => {
			const dateField = new Ext.field.Date(fieldCfg);
			dateField.setValue(stringDateValue);
			expect(dateField.getRawValue()).to.be.eq(stringDateValue);
		});
	});

	describe('ExtJsBug-2(IntegratedFix): field sets even invalid values, and is messing the picker as well', () => {
		const invalidValue = [];
		const fieldCfg = {
			renderTo: Ext.getBody(),
			label: 'Date',
		};

		it('@override: should not set an invalid value', () => {
			const dateField = new Ext.field.Date(fieldCfg);
			dateField.setValue(invalidValue);
			expect(dateField.getValue()).to.be.eq(null);
			expect(dateField.getValue()).not.to.be.eq(invalidValue);
		});
	});

	describe('ExtJsBug-3(IntegratedFix): min/max date reset not resetting picker constraints', () => {
		const fieldCfg = {
			renderTo: Ext.getBody(),
			label: 'Date',
			minDate: new Date(),
		};

		it('@override: should not set an invalid value', () => {
			const dateField = new Ext.field.Date(fieldCfg);

			cy.get(`#${dateField.getId()} .x-datetrigger`)
				.as('dateTriggerEl')
				.click();

			cy.get(`#${dateField.getPicker().getId()}`)
				.as('pickerEl')
				.should('be.visible')
				.then(() => {
					// picker "minDate" should match field "minDate"
					expect(
						dateField.getPicker().getMinDate().getTime()
					).to.be.eq(dateField.getMinDate().getTime());

					// trigger picker collapse, as the min/max date
					// restrictions are applied on picker show
					dateField.collapse();
				});

			cy.get('@pickerEl')
				.should('not.be.visible')
				.then(() => {
					dateField.setMinDate(null);
				});

			cy.get('@dateTriggerEl').click();
			cy.get('@pickerEl')
				.should('be.visible')
				.then(() => {
					// picker "minDate" should match field "minDate"
					expect(dateField.getPicker().getMinDate()).to.be.eq(null);
				});
		});
	});
});
