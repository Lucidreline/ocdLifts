import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi } from 'vitest';
import ExercisePage from './ExercisePage';
import * as firestore from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';

// Mock react-router hooks
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useParams: vi.fn(),
  useNavigate: vi.fn(),
}));

// Mock Firestore functions with vi.importActual to avoid missing exports like "addDoc"
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    initializeApp: vi.fn(),
    getFirestore: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(), // ✅ this fixes the "No 'addDoc'" export error
  };
});


describe('ExercisePage', () => {
  let navigateMock;

  beforeEach(() => {
    vi.clearAllMocks();
    useParams.mockReturnValue({ exerciseId: 'ex1' });
    navigateMock = vi.fn();
    useNavigate.mockReturnValue(navigateMock);

    // <–– Stub doc() to return an object with the same shape our test asserts on
    firestore.doc.mockReturnValue({ _ref: 'docRef' });
  });

  it('shows loading then renders exercise details', async () => {
    firestore.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'ex1',
      data: () => ({
        name: 'Bicep Curl',
        variation: 'Dumbbell',
        category: 'Pull',
        primaryMuscleGroup: 'Biceps',
        secondaryMuscleGroup: '',
        thirdMuscleGroup: '',
        pr: {
          reps: 5,
          resistanceWeight: 20,
          resistanceHeight: null,
          lastUpdated: '2025-06-20T00:00:00Z',
        },
      }),
    });
    firestore.getDocs.mockResolvedValue({ docs: [] });

    render(<ExercisePage />);

    expect(screen.getByText('Loading…')).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1 })
      ).toHaveTextContent('Bicep Curl (Dumbbell)')
    );

    expect(screen.getByText('Category: Pull')).toBeInTheDocument();
    expect(screen.getByText('Primary Muscle: Biceps')).toBeInTheDocument();
    expect(screen.getByText('PR:')).toBeInTheDocument();
    expect(screen.getByText(/5 reps, 20lbs, height/)).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    expect(screen.getByText('No recent sets.')).toBeInTheDocument();
  });

  it('resets PR when Reset PR button is clicked', async () => {
    firestore.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'ex1',
      data: () => ({
        name: 'Dip',
        variation: '',
        category: 'Push',
        primaryMuscleGroup: 'Chest',
        secondaryMuscleGroup: '',
        thirdMuscleGroup: '',
        pr: {
          reps: 3,
          resistanceWeight: 0,
          resistanceHeight: 0,
          lastUpdated: '2025-06-01T00:00:00Z',
        },
      }),
    });
    firestore.getDocs.mockResolvedValue({ docs: [] });

    render(<ExercisePage />);

    await waitFor(() => screen.getByText('Dip'));

    fireEvent.click(screen.getByText('Reset PR'));

    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      {
        pr: expect.objectContaining({
          reps: null,
          resistanceWeight: null,
          resistanceHeight: null,
        }),
      }
    );

    await waitFor(() => expect(screen.getByText('None')).toBeInTheDocument());
  });

  it('deletes exercise when Delete is confirmed', async () => {
    firestore.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'ex1',
      data: () => ({ name: 'Squat', pr: {} }),
    });
    firestore.getDocs.mockResolvedValue({ docs: [] });
    firestore.deleteDoc.mockResolvedValue(); // make deleteDoc resolve
    window.confirm = vi.fn().mockReturnValue(true);

    render(<ExercisePage />);

    await waitFor(() => screen.getByText('Squat'));

    fireEvent.click(screen.getByText('Delete'));

    // waitFor both deleteDoc and navigation
    await waitFor(() => {
      expect(firestore.deleteDoc).toHaveBeenCalledWith({ _ref: 'docRef' });
      expect(navigateMock).toHaveBeenCalledWith('/exercises');
    });

    expect(window.confirm).toHaveBeenCalledWith('Really delete this exercise?');
  });

  it('shows not found message for missing exercise', async () => {
    firestore.getDoc.mockResolvedValue({ exists: () => false });
    render(<ExercisePage />);
    await waitFor(() =>
      expect(screen.getByText('Exercise not found.')).toBeInTheDocument()
    );
  });
});
