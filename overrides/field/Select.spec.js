describe('Ext.field.Select', () => {
	describe('ExtJsBug-1: multiselect combo value is not checked correctly for equality', () => {
		const multiComboCfg = {
			multiSelect: true,
			label: 'Multi select combo',
		};
		const value1 = ['a', 'b', 'c'];
		const value2 = ['a', 'b', 'c'];

		it('should not be equal', () => {
			//Bypass the override
			const selectPrototype = Ext.field.Select.prototype;
			cy.stub(
				selectPrototype,
				'isEqual',
				Ext.field.Text.prototype.isEqual
			);

			const multiCombobox = new Ext.field.ComboBox(multiComboCfg);

			expect(multiCombobox.isEqual(value1, value2)).to.be.false;
		});

		it('@override: should be equal', () => {
			const multiCombobox = new Ext.field.ComboBox(multiComboCfg);

			expect(multiCombobox.isEqual(value1, value2)).to.be.true;
		});
	});
});
