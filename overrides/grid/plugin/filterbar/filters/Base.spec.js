import '@/components/field/Grid';

describe('Ext.grid.plugin.filterbar.filters.Base', () => {
	describe('ExtJsBug-2(IntegratedFix): Fix dirty changes in filterbar fields modifying the dirty state of the wrapping form', () => {
		it('@override: filterbar field change should not change form dirty state', () => {
			const form = new Ext.form.Panel({
				width: 500,
				height: 300,
				layout: 'fit',
				renderTo: Ext.getBody(),
				items: {
					xtype: 'gridfield',
					gridConfig: {
						plugins: {
							gridfilterbar: true,
						},
						store: {},
						columns: [
							{
								text: 'Name',
								dataIndex: 'name',
								flex: 1,
								filterType: 'string',
							},
						],
					},
				},
			});

			cy.get(`#${form.getId()}`).within(() => {
				cy.wrap(form).invoke('isDirty').should('be.false');
				cy.get('.x-grid-filterbar .x-textfield').type('test');
				cy.wrap(form).invoke('isDirty').should('be.false');
			});
		});
	});
});
