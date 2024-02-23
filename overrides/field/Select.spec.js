describe('Ext.field.Select', () => {
	describe('ExtJsBug-1(IntegratedFix): multiselect combo value is not checked correctly for equality', () => {
		const multiComboCfg = {
			multiSelect: true,
			label: 'Multi select combo',
		};
		const value1 = ['a', 'b', 'c'];
		const value2 = ['a', 'b', 'c'];

		it('@override: should be equal', () => {
			const multiCombobox = new Ext.field.ComboBox(multiComboCfg);

			expect(multiCombobox.isEqual(value1, value2)).to.be.true;
		});
	});
});
