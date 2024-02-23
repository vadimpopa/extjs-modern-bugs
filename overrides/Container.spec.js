describe('Ext.Container', () => {
	describe('Ext.Container@ExtJsBug-1(IntegratedFix): docked items duplicated when "defaultFocus" is specified at class definition', () => {
		const runScenario = function (textfieldsLength) {
			// Redefine the class in each scenarion
			// as the bug is related to "tabIndex" cached configs.
			Ext.define('MyGrid', {
				extend: Ext.grid.Grid,
				defaultFocus: 'textfield',
				items: [
					{
						docked: 'top',
						xtype: 'textfield',
						padding: 5,
					},
				],
			});

			const grid = new MyGrid({
				store: [],
				width: 500,
				height: 150,
				renderTo: Ext.getBody(),
				columns: [
					{
						text: 'Name',
						dataIndex: 'name',
						flex: 1,
					},
				],
			});

			cy.get(`#${grid.getId()}`).within(() => {
				cy.get('.x-textfield').should('have.length', textfieldsLength);
			});
		};

		it('@override: docked items should not be duplicated', () => {
			runScenario(1);
		});
	});

	describe('masking', function () {
		let ct;

		beforeEach(() => {
			Ext.destroy(ct);
		});

		it('should create a mask when "masked" config is set to a string', () => {
			ct = new Ext.Container({
				renderTo: Ext.getBody(),
				masked: 'Foo',
			});

			const mask = ct.getMasked();

			expect(mask.getMessage()).to.eq('Foo');
			expect(mask.isHidden()).to.eq(false);
		});

		it('should create a mask when "masked" config is set to "true"', function () {
			ct = new Ext.Container({
				renderTo: Ext.getBody(),
				masked: true,
			});

			expect(ct.getMasked()).not.to.eq(null);
		});

		it('should not create a mask when "masked" config is set to "false"', function () {
			ct = new Ext.Container({
				renderTo: Ext.getBody(),
				masked: false,
			});

			expect(ct.getMasked()).to.eq(null);
		});

		it('should create a mask on "mask" call', function () {
			ct = new Ext.Container({
				renderTo: Ext.getBody(),
			});

			ct.mask();
			const mask = ct.getMasked();

			expect(mask).not.to.eq(null);
			expect(mask.isHidden()).to.eq(false);
		});

		it('should hide mask on "unmask" call', function () {
			ct = new Ext.Container({
				renderTo: Ext.getBody(),
			});

			ct.mask();
			const mask = ct.getMasked();
			expect(mask.isVisible()).to.eq(true);

			ct.unmask();
			expect(mask.isVisible()).to.eq(false);
		});

		it('should reuse existing mask', () => {
			ct = new Ext.Container({
				renderTo: Ext.getBody(),
			});

			ct.mask();
			const firstMaskId = ct.getMasked().id;

			expect(typeof firstMaskId).to.eq('string');
			expect(firstMaskId.length).not.to.eq(0);

			ct.unmask();

			ct.mask('Loading');
			expect(ct.getMasked().id).to.eq(firstMaskId);
		});

		it('should not create a mask on "unmask" call if no masking has been triggered before', () => {
			ct = new Ext.Container({
				renderTo: Ext.getBody(),
			});

			ct.unmask();
			expect(ct.getMasked()).to.eq(null);
		});
	});
});
