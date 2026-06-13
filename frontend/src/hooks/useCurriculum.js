import { useCallback, useEffect, useMemo, useState } from 'react';

export const useCurriculum = () => {
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurriculum = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const [modulesRes, lessonsRes] = await Promise.all([
        fetch(`${apiUrl}/api/modules`),
        fetch(`${apiUrl}/api/lessons`)
      ]);

      if (!modulesRes.ok || !lessonsRes.ok) {
        throw new Error(`Failed to load curriculum (${modulesRes.status}/${lessonsRes.status})`);
      }

      const modulesPayload = await modulesRes.json();
      const lessonsPayload = await lessonsRes.json();

      setModules(Array.isArray(modulesPayload) ? modulesPayload : []);
      setLessons(Array.isArray(lessonsPayload) ? lessonsPayload : []);
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to load curriculum');
      setModules([]);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurriculum();
  }, [fetchCurriculum]);

  const lessonsById = useMemo(() => {
    const map = new Map();
    lessons.forEach((lesson) => map.set(lesson.id, lesson));
    return map;
  }, [lessons]);

  const getLessonById = useCallback((lessonId) => lessonsById.get(lessonId), [lessonsById]);

  return { modules, lessons, loading, error, refresh: fetchCurriculum, getLessonById };
};
