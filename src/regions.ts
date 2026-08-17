export interface Region {
  id: string;
  name: string;
  timezone: string;
  coordinate: { lat: number; lng: number };
  coordinateDelta: { lat: number; lng: number };
  providers: string[];
}

export const REGIONS: Region[] = [
  {
    id: 'seattle',
    name: 'Seattle',
    timezone: 'America/Los_Angeles',
    coordinate: { lat: 47.62405, lng: -122.23607 },
    coordinateDelta: { lat: 0.50, lng: 0.50 },
    providers: [
      'activenet:seattle',
      'activenet:shorelinewa',
      'courtreserve:7306',
      'courtreserve:6689',
      'clubautomation:tcsp',
      'courtreserve:17764',
      'clubautomation:edgebrook',
      'civicrec:wa-bellevue',
      'dudesolutions:bsd405',
      'fusion:reg.recreation.uw.edu',
      'activenet:kingcountyparks',
      'amilia:city-of-redmond',
      'civicrec:city-of-kirkland',
      'facilitron:lwsd98052',
      'gametime:cptc',
      'racquetdesk:estc',
      'courtreserve:9459',
      'gametime:stc',
      'manual:seattleparks',
      'manual:seattleu',
      'perfectmind:23494',
      'manual:mercer-island-school-district',
      'clubessential:mibeachclub.com',
      'cactennis:tennis.mercerislandcc.com',
      '123formbuilder:6956773',
      'manual:overlake-school',
      'northstar:mytrilogyredmondridge.com',
    ],
  },
  {
    id: 'san-francisco',
    name: 'San Francisco',
    timezone: 'America/Los_Angeles',
    coordinate: { lat: 37.754361, lng: -122.446944 },
    coordinateDelta: { lat: 0.15, lng: 0.15 },
    providers: [
      'rec:san-francisco-rec-park',
      'courtreserve:12465',
    ],
  },
  {
    id: 'south-bay',
    name: 'South Bay, CA',
    timezone: 'America/Los_Angeles',
    coordinate: { lat: 37.33, lng: -121.98 },
    coordinateDelta: { lat: 0.42, lng: 0.55 },
    providers: [
      'activenet:cupertino',
      'activenet:milpitasrec',
      'activenet:sanjoseparksandrec',
      'courtreserve:13233',
      'courtreserve:13234',
      'manual:campbell',
      'manual:de-anza-college',
      'manual:foothill-college',
      'manual:los-altos',
      'manual:sjsrc',
      'manual:sjsu',
      'manual:west-valley-college',
      'mindbody:mountain-view-tennis',
      'perfectmind:22167',
      'rec:city-of-mountain-view',
    ],
  },
];
