describe('Ext.util.Format', () => {
	beforeEach(() => {
		cy.stub(CARA, 't', (locale) => {
			if (locale.includes('abbreviation.date.hour')) {
				return 'h';
			} else if (locale.includes('abbreviation.date.minute')) {
				return 'm';
			} else if (locale.includes('abbreviation.date.second')) {
				return 's';
			}
		});
	});

	it('secondsToHms', () => {
		const { Format } = Ext.util;

		expect(Format.secondsToHms()).to.eq('');
		expect(Format.secondsToHms(1)).to.eq('1s');
		expect(Format.secondsToHms(11)).to.eq('11s');
		expect(Format.secondsToHms(60)).to.eq('1m');
		expect(Format.secondsToHms(80)).to.eq('1m 20s');
		expect(Format.secondsToHms(1000)).to.eq('16m 40s');
		expect(Format.secondsToHms(3600)).to.eq('1h');
		expect(Format.secondsToHms(3601)).to.eq('1h 1s');
	});

	it('minutesToHm', () => {
		const { Format } = Ext.util;

		expect(Format.minutesToHm()).to.eq('');
		expect(Format.minutesToHm(1)).to.eq('1m');
		expect(Format.minutesToHm(11)).to.eq('11m');
		expect(Format.minutesToHm(60)).to.eq('1h');
		expect(Format.minutesToHm(80)).to.eq('1h 20m');
		expect(Format.minutesToHm(1000)).to.eq('16h 40m');
		expect(Format.minutesToHm(3600)).to.eq('60h');
		expect(Format.minutesToHm(3601)).to.eq('60h 1m');
	});
});
