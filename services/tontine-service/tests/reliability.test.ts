import { calculateReliabilityScore, isAtRisk } from '../src/algorithms/reliability.js';

describe('calculateReliabilityScore', () => {
  it('donne 100 pour un nouveau membre sans historique', () => {
    expect(calculateReliabilityScore([])).toBe(100);
  });

  it('donne 100 quand tous les paiements sont à temps', () => {
    expect(calculateReliabilityScore([{ daysLate: 0 }, { daysLate: 0 }])).toBe(100);
  });

  it('pénalise les retards', () => {
    // 1 à temps sur 2 => 50, retard moyen = 5 => -25 => 25
    const score = calculateReliabilityScore([{ daysLate: 0 }, { daysLate: 10 }]);
    expect(score).toBe(25);
  });

  it('borne le score à 0 minimum', () => {
    const score = calculateReliabilityScore([{ daysLate: 30 }, { daysLate: 40 }]);
    expect(score).toBe(0);
  });

  it('borne le score à 100 maximum', () => {
    const score = calculateReliabilityScore([{ daysLate: 0 }]);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('isAtRisk', () => {
  it('est à risque sous le seuil par défaut (60)', () => {
    expect(isAtRisk(40)).toBe(true);
  });
  it("n'est pas à risque au-dessus du seuil", () => {
    expect(isAtRisk(80)).toBe(false);
  });
  it('respecte un seuil personnalisé', () => {
    expect(isAtRisk(70, 75)).toBe(true);
  });
});
