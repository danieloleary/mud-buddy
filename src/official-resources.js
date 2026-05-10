const officialResources = Object.freeze({
  account: {
    icon: 'account_circle',
    title: 'Your account',
    href: 'https://www.ebmud.com/customers/account',
    text: 'Account access, My Water Report entry points, alerts, and official customer settings.'
  },
  myWaterReport: {
    icon: 'query_stats',
    title: 'My Water Report',
    href: 'https://www.ebmud.com/water/conservation-and-rebates/my-water-report-program',
    text: 'EBMUD guidance for Track Usage, alerts, and gallons-per-day charts.'
  },
  billingQuestions: {
    title: 'Billing questions',
    href: 'https://www.ebmud.com/customers/billing-questions'
  },
  leaksHighBills: {
    icon: 'plumbing',
    title: 'Leaks and high bills',
    href: 'https://www.ebmud.com/customers/billing-questions/leaks-and-high-bills',
    text: 'Official leak and high-bill guidance when a pattern is worth checking.'
  },
  alertsOutages: {
    icon: 'warning',
    title: 'Alerts and outages',
    href: 'https://www.ebmud.com/customers/alerts',
    text: 'Use EBMUD directly for outages, service alerts, pressure, and urgent issues.'
  },
  waterQuality: {
    title: 'Water quality',
    href: 'https://www.ebmud.com/water/about-your-water/water-quality'
  },
  conservationRebates: {
    icon: 'water_drop',
    title: 'Conservation and rebates',
    href: 'https://www.ebmud.com/water/conservation-and-rebates',
    text: 'Official conservation services, rebates, landscape help, and efficiency programs.'
  },
  contactEmergency: {
    icon: 'support_agent',
    title: 'Contact / emergency',
    href: 'https://www.ebmud.com/contact-us',
    text: 'Official support for account, emergency, billing, pressure, and water-quality issues.'
  }
});

export const landingResources = Object.freeze([
  officialResources.account,
  officialResources.myWaterReport,
  officialResources.leaksHighBills,
  officialResources.conservationRebates,
  officialResources.alertsOutages,
  officialResources.contactEmergency
]);

export const reportOfficialLinks = Object.freeze([
  officialResources.billingQuestions,
  officialResources.leaksHighBills,
  officialResources.alertsOutages,
  officialResources.waterQuality,
  officialResources.conservationRebates,
  officialResources.contactEmergency
]);
