import {
  getNextBeneficiary,
  recommendRotationOrder,
  isCycleComplete,
  type RotationMember,
} from '../src/algorithms/rotation.js';

const members: RotationMember[] = [
  { userId: 'a', rotationOrder: 1, receivedAt: '2026-01-01', reliabilityScore: 80, payoutDate: null },
  { userId: 'b', rotationOrder: 2, receivedAt: null, reliabilityScore: 95, payoutDate: null },
  { userId: 'c', rotationOrder: 3, receivedAt: null, reliabilityScore: 60, payoutDate: null },
];

describe('getNextBeneficiary', () => {
  it('sans date de bouffe : retourne le membre en attente avec le plus petit rang', () => {
    expect(getNextBeneficiary(members)?.userId).toBe('b');
  });

  it('retourne undefined si tout le monde a reçu', () => {
    const allReceived = members.map((m) => ({ ...m, receivedAt: '2026-01-01' }));
    expect(getNextBeneficiary(allReceived)).toBeUndefined();
  });

  it('avec dates de bouffe : retourne le membre dont la date arrive en premier', () => {
    const withDates: RotationMember[] = [
      { userId: 'a', rotationOrder: 1, receivedAt: null, reliabilityScore: 80, payoutDate: '2026-09-10' },
      { userId: 'b', rotationOrder: 2, receivedAt: null, reliabilityScore: 95, payoutDate: '2026-07-01' },
      { userId: 'c', rotationOrder: 3, receivedAt: null, reliabilityScore: 60, payoutDate: '2026-08-15' },
    ];
    expect(getNextBeneficiary(withDates)?.userId).toBe('b');
  });

  it('les membres avec date passent avant ceux sans date', () => {
    const mixed: RotationMember[] = [
      { userId: 'a', rotationOrder: 1, receivedAt: null, reliabilityScore: 80, payoutDate: null },
      { userId: 'b', rotationOrder: 2, receivedAt: null, reliabilityScore: 95, payoutDate: '2026-12-31' },
    ];
    expect(getNextBeneficiary(mixed)?.userId).toBe('b');
  });
});

describe('recommendRotationOrder', () => {
  it('trie par score de fiabilité décroissant', () => {
    const order = recommendRotationOrder(members).map((m) => m.userId);
    expect(order).toEqual(['b', 'a', 'c']);
  });

  it('ne mute pas le tableau original', () => {
    recommendRotationOrder(members);
    expect(members[0].userId).toBe('a');
  });
});

describe('isCycleComplete', () => {
  it('est faux quand certains membres attendent', () => {
    expect(isCycleComplete(members)).toBe(false);
  });
  it('est vrai quand tous ont reçu', () => {
    const allReceived = members.map((m) => ({ ...m, receivedAt: '2026-01-01' }));
    expect(isCycleComplete(allReceived)).toBe(true);
  });
  it('est faux pour une liste vide', () => {
    expect(isCycleComplete([])).toBe(false);
  });
});
