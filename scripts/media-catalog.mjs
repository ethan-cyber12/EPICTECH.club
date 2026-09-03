export const founderAssets = [
  {
    id: 'ethan-platt-graduation-close',
    input: '.private-media/founder/ethan-close-graduation-original',
    workingInput: '.private-media/founder/ethan-close-graduation-working.png',
    outputBase: 'assets/images/founder/ethan-platt-graduation-close',
    widths: [640, 1200],
    formats: ['avif', 'webp'],
    jpgWidths: [1200],
    aspect: { width: 4, height: 5 },
    crop: { strategy: 'attention' },
    alt: 'Ethan Platt, founder of EPIC TECH LLC'
  }
];

const workshopIds = [
  'epic-hero-connected-workshop',
  'epic-service-network-wifi',
  'epic-service-firewalls-security',
  'epic-service-websites',
  'epic-service-business-apps',
  'epic-service-automation',
  'epic-service-ecommerce',
  'epic-service-virtualization',
  'epic-service-internal-tools',
  'epic-detail-network-wifi',
  'epic-detail-firewalls-security',
  'epic-detail-websites',
  'epic-detail-business-apps',
  'epic-detail-automation',
  'epic-detail-ecommerce',
  'epic-detail-virtualization',
  'epic-detail-internal-tools'
];

export const workshopAssets = workshopIds.map((id) => ({
  id,
  master: '.private-media/workshop-masters/' + id + '-master.png',
  outputBase: 'assets/images/service-visuals/' + id,
  widths: [640, 1200, 1920],
  formats: ['avif', 'webp'],
  aspect: { width: 8, height: 5 },
  budgets: id === 'epic-hero-connected-workshop'
    ? { 640: 120000, 1200: 200000, 1920: 250000 }
    : { 640: 90000, 1200: 140000, 1920: 160000 }
}));

export const socialAssets = [
  {
    id: 'epic-tech-home-og',
    input: '.private-media/workshop-masters/epic-hero-connected-workshop-master.png',
    output: 'assets/images/social/epic-tech-home-og-1200x630.jpg',
    width: 1200,
    height: 630,
    position: 'attention',
    maximumBytes: 600000
  },
  {
    id: 'ethan-platt-founder-og',
    input: 'assets/images/founder/ethan-platt-graduation-close-1200.jpg',
    artInput: '.private-media/workshop-masters/epic-hero-connected-workshop-master.png',
    output: 'assets/images/social/ethan-platt-founder-og-1200x630.jpg',
    width: 1200,
    height: 630,
    position: 'north',
    maximumBytes: 600000
  }
];

export function outputPath(base, width, format) {
  return base + '-' + width + '.' + format;
}
