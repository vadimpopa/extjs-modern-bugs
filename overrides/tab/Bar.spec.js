describe('Ext.tab.Bar', () => {
	describe('ExtJsBug-2: Fix trying to show active indicator element of a tab that was destroyed', () => {
		const runScenarion = () => {
			const tabPanel = new Ext.tab.Panel({
				renderTo: Ext.getBody(),
				height: 200,
				tabBar: {
					// This is a key config for this test case.
					// We delay the animation on purpose so that we close
					// a tab while its animation is still running.
					indicatorAnimationSpeed: 1000,
				},
				defaults: {
					closable: true,
				},
				items: [
					{
						title: 'First',
					},
					{
						title: 'Second',
					},
					{
						title: 'Third',
					},
				],
			});

			cy.contains(`#${tabPanel.getId()} .x-tab`, 'Third')
				.click()
				.find('.x-close-icon-el')
				.click()
				.then(() => {
					const { $indicatorAnimation } = tabPanel.getTabBar();

					cy.spy(
						$indicatorAnimation.events.animationend.listeners[1],
						'fn'
					).as('animationEndSpy');
					cy.get('@animationEndSpy').should('have.been.called');
				});
		};

		it('should throw error on animation end', (done) => {
			const TabbarPrototype = Ext.tab.Bar.prototype;
			//Bypass the override
			cy.stub(
				TabbarPrototype,
				'animateTabIndicator',
				TabbarPrototype.animateTabIndicator.$previous
			);

			cy.on('uncaught:exception', (err) => {
				expect(err.message).to.include(
					'Cannot read properties of null'
				);

				// using mocha's async done callback to finish this test
				// so we prove that an uncaught exception was thrown
				done();

				// return false to prevent the error from failing this test
				return false;
			});

			runScenarion();
		});

		it('@override: should not throw error on animation end', () => {
			runScenarion();
		});
	});
});
