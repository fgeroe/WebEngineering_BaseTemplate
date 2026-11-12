export interface BearType {
  type: string;
  coat: string;
  adultSize: string;
  habitat: string;
  lifespan: string;
  diet: string;
}

export const bearTypes: BearType[] = [
  {
    type: 'Wild',
    coat: 'Brown or black',
    adultSize: '1.4 to 2.8 meters',
    habitat: 'Woods and forests',
    lifespan: '25 to 28 years',
    diet: 'Fish, meat, plants',
  },
  {
    type: 'Urban',
    coat: 'North Face',
    adultSize: '18 to 22',
    habitat: 'Condos and coffee shops',
    lifespan: '20 to 32 years',
    diet: 'Starbucks, sushi',
  },
];
