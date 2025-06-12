import { describe, it, expect } from 'vitest';
import {
  mapSessionDoc,
  extractExerciseIds,
  enrichAndSortSets,
  buildExerciseMap,
} from './sessionUtils';

describe('sessionUtils', () => {
  describe('mapSessionDoc', () => {
    it('maps full data correctly', () => {
      const id = 'sess123';
      const raw = {
        pr_hit: true,
        body_weight: 180,
        session_notes: 'Test notes',
        category: 'Push',
        set_ids: ['set1', 'set2'],
        date: '2025-06-01T12:00:00Z',
      };
      const mapped = mapSessionDoc(id, raw);
      expect(mapped).toEqual({
        id: 'sess123',
        pr_hit: true,
        body_weight: 180,
        session_notes: 'Test notes',
        category: 'Push',
        set_ids: ['set1', 'set2'],
        date: '2025-06-01T12:00:00Z',
      });
    });

    it('fills missing fields with defaults', () => {
      const mapped = mapSessionDoc('x', {});
      expect(mapped).toEqual({
        id: 'x',
        pr_hit: false,
        body_weight: null,
        session_notes: '',
        category: '',
        set_ids: [],
        date: '',
      });
    });
  });

  describe('extractExerciseIds', () => {
    it('returns unique exercise IDs', () => {
      const sets = [
        { exerciseId: 'a' },
        { exerciseId: 'b' },
        { exerciseId: 'a' },
      ];
      expect(extractExerciseIds(sets).sort()).toEqual(['a','b']);
    });

    it('returns empty array when no sets', () => {
      expect(extractExerciseIds([])).toEqual([]);
    });
  });

  describe('buildExerciseMap', () => {
    it('creates id->displayName map', () => {
      const docs = [
        { id: 'e1', data: () => ({ name: 'Alpha', variation: 'X' }) },
        { id: 'e2', data: () => ({ name: 'Beta', variation: '' }) },
      ];
      const map = buildExerciseMap(docs);
      expect(map).toEqual({
        e1: 'Alpha (X)',
        e2: 'Beta',
      });
    });
  });

  describe('enrichAndSortSets', () => {
    it('enriches with exerciseName and sorts by timestamp descending', () => {
      const sets = [
        { id: 's1', exerciseId: 'e1', timestamp: '2025-06-01T08:00:00Z' },
        { id: 's2', exerciseId: 'e2', timestamp: '2025-06-02T09:00:00Z' },
      ];
      const nameMap = { e1: 'Alpha', e2: 'Beta' };
      const enriched = enrichAndSortSets(sets, nameMap);
      expect(enriched.map(s => s.id)).toEqual(['s2','s1']);
      expect(enriched[0].exerciseName).toBe('Beta');
      expect(enriched[1].exerciseName).toBe('Alpha');
    });
  });
});
