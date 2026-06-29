import { useState, useEffect, useCallback } from "react";
import { profileAPI } from "../services/api";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileAPI.get();
      setProfile(data);
    } catch (err) {
      setError(err.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}

export function usePersonas() {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPersonas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await personasAPI.list();
      setPersonas(data);
    } catch {
      setPersonas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPersonas(); }, [fetchPersonas]);

  return { personas, loading, refetch: fetchPersonas };
}
