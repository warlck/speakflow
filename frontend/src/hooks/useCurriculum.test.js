import { renderHook, waitFor } from '@testing-library/react';
import { useCurriculum } from './useCurriculum';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useCurriculum', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch and return modules and lessons on success', async () => {
    const mockModules = [{ id: 'm1', title: 'Module 1' }];
    const mockLessons = [{ id: 'l1', moduleId: 'm1', title: 'Lesson 1' }];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockModules,
      status: 200,
    });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLessons,
      status: 200,
    });

    const { result } = renderHook(() => useCurriculum());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.modules).toEqual(mockModules);
    expect(result.current.lessons).toEqual(mockLessons);
    expect(result.current.error).toBeNull();
    expect(result.current.getLessonById('l1')).toEqual(mockLessons[0]);
  });

  it('should handle fetch errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCurriculum());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.modules).toEqual([]);
    expect(result.current.lessons).toEqual([]);
  });

  it('should handle HTTP failure status codes', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      status: 200,
    });

    const { result } = renderHook(() => useCurriculum());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toContain('Failed to load curriculum');
    expect(result.current.modules).toEqual([]);
    expect(result.current.lessons).toEqual([]);
  });
});
