import { getPendingOperations, markAsSynced } from './db';

type Operation = Awaited<ReturnType<typeof getPendingOperations>>[0] & {
  customEndpoint?: string;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const getResourceEndpoint = (resource: string): string => {
  const mapping: Record<string, string> = {
    membership: '/memberships',
    client: '/users',
    'muscle-group': '/muscle-groups',
    exercise: '/exercises',
    routine: '/routines',
    // ✅ Añadimos la ruta correcta para routine-muscle-group
    'routine-muscle-group': '/routines/muscle-groups',
  };
  return mapping[resource] || `/${resource}s`;
};

const updateExerciseCache = async (tempId: string, realExercise: any) => {
  if (!tempId || !tempId.startsWith('temp-')) return;

  try {
    const EXERCISES_CACHE_KEY = 'adminExercises';
    const cached = localStorage.getItem(EXERCISES_CACHE_KEY);
    if (!cached) return;

    const exercises = JSON.parse(cached);
    const updated = exercises.map((ex: any) =>
      ex._id === tempId 
        ? { ...realExercise, muscleGroup: ex.muscleGroup }
        : ex
    );
    localStorage.setItem(EXERCISES_CACHE_KEY, JSON.stringify(updated));
  } catch (e) {
    // Silencioso en producción
  }
};

const isValidObjectId = (id: string): boolean => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

// ✅ NUEVA FUNCIÓN: Validar si una operación es válida para sincronizar
const isValidOperation = (op: Operation): boolean => {
  // Si tiene customEndpoint, verificamos que sea una ruta conocida
  if (op.customEndpoint) {
    // Rutas válidas de customEndpoint
    const validCustomEndpoints = [
      '/routines/',
      '/memberships/',
      '/users/',
      '/muscle-groups/',
      '/exercises/'
    ];
    
    return validCustomEndpoints.some(validPath => 
      op.customEndpoint!.startsWith(validPath)
    );
  }
  
  // Si no tiene customEndpoint, siempre es válida
  return true;
};

const sendOperation = async (op: Operation, API_URL: string): Promise<boolean> => {
  const authHeaders = getAuthHeaders();
  if (!authHeaders) {
    return false;
  }

  // Silenciosamente esperar si muscleGroup es temporal
  if (op.resource === 'exercise' && op.payload?.muscleGroup) {
    const muscleGroupId = op.payload.muscleGroup;
    if (muscleGroupId && muscleGroupId.startsWith('temp-')) {
      return false;
    }
  }

  // ✅ Validar operación antes de intentar enviar
  if (!isValidOperation(op)) {
    console.warn('⚠️ Operación con customEndpoint inválido, marcando como sincronizada:', op.id);
    return true; // Marcar como sincronizada para eliminarla
  }

  const url = op.customEndpoint 
    ? `${API_URL}${op.customEndpoint}` 
    : `${API_URL}${getResourceEndpoint(op.resource)}`;

  try {
    let response: Response;

    if (op.type === 'CREATE') {
      const payload = op.payload || {};
      let payloadToSend = payload;
      let tempIdForCache: string | undefined;

      if (op.resource === 'exercise') {
        const { _id, muscleGroup, ...rest } = payload;
        
        if (muscleGroup && !muscleGroup.startsWith('temp-') && !isValidObjectId(muscleGroup)) {
          return false;
        }
        
        payloadToSend = { ...rest, muscleGroup: muscleGroup || undefined };
        tempIdForCache = _id;
      }

      response = await fetch(url, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payloadToSend),
      });

      if (op.resource === 'exercise' && response.ok) {
        const realExercise = await response.json();
        if (tempIdForCache) {
          await updateExerciseCache(tempIdForCache, realExercise);
        }
      }
      
      if (op.resource === 'exercise' && response.status === 400) {
        return false;
      }
    } else if (op.type === 'UPDATE') {
      const id = op.payload?.id;
      if (!id) return false;
      
      let payloadToUpdate = op.payload;
      if (op.resource === 'exercise') {
        const { id, muscleGroup, ...rest } = op.payload || {};
        
        if (muscleGroup && !muscleGroup.startsWith('temp-') && !isValidObjectId(muscleGroup)) {
          return false;
        }
        
        payloadToUpdate = { id, ...rest, muscleGroup: muscleGroup || undefined };
      }
      
      response = await fetch(`${url}/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(payloadToUpdate),
      });
    } else if (op.type === 'DELETE') {
      if (op.customEndpoint) {
        response = await fetch(url, {
          method: 'DELETE',
          headers: authHeaders,
        });
      } else {
        const id = op.payload?.id;
        if (!id) return false;
        response = await fetch(`${url}/${id}`, {
          method: 'DELETE',
          headers: authHeaders,
        });
      }
    } else {
      return false;
    }

    if (op.type === 'DELETE' && response.status === 404) {
      return true;
    }

    return response.ok;
  } catch (err) {
    // ✅ Manejo especial para errores 404 en customEndpoint
    if (op.customEndpoint && (err as any)?.status === 404) {
      console.warn('⚠️ customEndpoint 404, operación inválida:', op.customEndpoint);
      return true; // Marcar como sincronizada para eliminarla
    }
    return false;
  }
};

export const syncPendingOperations = async (API_URL: string) => {
  if (!navigator.onLine) return;

  try {
    const pending = await getPendingOperations();
    
    // ✅ Filtrar operaciones válidas
    const validOperations = pending.filter(isValidOperation);
    
    if (pending.length !== validOperations.length) {
      console.log(`🗑️ ${pending.length - validOperations.length} operaciones inválidas ignoradas`);
    }

    const muscleGroupOps = validOperations.filter(op => op.resource === 'muscle-group');
    const exerciseOps = validOperations.filter(op => op.resource === 'exercise');
    const otherOps = validOperations.filter(op => op.resource !== 'muscle-group' && op.resource !== 'exercise');

    const allOpsInOrder = [...muscleGroupOps, ...otherOps, ...exerciseOps];

    for (const op of allOpsInOrder) {
      const success = await sendOperation(op as Operation, API_URL);
      if (success) {
        await markAsSynced(op.id);
        console.log(`✅ Operación sincronizada: ${op.id}`);
      } else {
        console.log(`⚠️ Operación fallida: ${op.id}`);
      }
    }
  } catch (error) {
    // Silencioso en producción
  }
};

export const triggerSync = () => {
  if (navigator.onLine) {
    const API_URL = import.meta.env.VITE_API_URL;
    syncPendingOperations(API_URL);
  }
};

export const initSync = () => {
  const handleOnline = () => {
    console.log('🔌 Conexión recuperada. Sincronizando operaciones pendientes...');
    const API_URL = import.meta.env.VITE_API_URL;
    syncPendingOperations(API_URL);
  };

  window.addEventListener('online', handleOnline);
  
  if (navigator.onLine && localStorage.getItem('token')) {
    const API_URL = import.meta.env.VITE_API_URL;
    syncPendingOperations(API_URL);
  }

  return () => window.removeEventListener('online', handleOnline);
};