describe('Ext.field.Date', () => {
	const DatePrototype = Ext.field.Date.prototype;

	describe('ExtJsBug-1: when "dateFormat" contains time info, it is removed on value parse', () => {
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

	describe('ExtJsBug-2: field sets even invalid values, and is messing the picker as well', () => {
		const invalidValue = [];
		const fieldCfg = {
			renderTo: Ext.getBody(),
			label: 'Date',
		};

		it('should set an invalid value', () => {
			//Bypass the override
			cy.stub(
				DatePrototype,
				'applyValue',
				DatePrototype.applyValue.$previous
			);

			const dateField = new Ext.field.Date(fieldCfg);
			dateField.setValue(invalidValue);
			expect(dateField.getValue()).to.be.eq(invalidValue);
		});

		it('@override: should not set an invalid value', () => {
			const dateField = new Ext.field.Date(fieldCfg);
			dateField.setValue(invalidValue);
			expect(dateField.getValue()).to.be.eq(null);
			expect(dateField.getValue()).not.to.be.eq(invalidValue);
		});
	});
});
