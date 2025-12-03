import { useState, useEffect } from 'react';
import { Plus, Dumbbell, Activity, Search, CheckCircle, AlertCircle, Users, Target, Trash2 } from 'lucide-react';

// ✅ IMPORTACIONES OFFLINE
import { saveOperation } from "../../../offline/db";
import { triggerSync } from "../../../offline/sync";

// ✅ INTERFAZ VACÍA: el componente es autónomo
interface AdminBulkingProps {}

interface Exercise {
  _id: string;
  name: string;
  description: string;
  series: number;
  repetitions: number;
  videoUrl: string;
  imageUrl: string;
  muscleGroup: string;
  createdAt: string;
  updatedAt: string;
}

interface MuscleGroup {
  _id: string;
  name: string;
  description?: string;
}

interface RoutineMuscleGroup {
  muscleGroup: MuscleGroup | null;
  exercises: Exercise[];
}

interface Routine {
  _id: string;
  name: string;
  muscleGroups: RoutineMuscleGroup[];
  status: string;
  createdAt: string;
}

// ✅ COMPONENTE PARA IMÁGENES OFFLINE
const OfflineImage = ({ 
  src, 
  alt, 
  className = "w-full h-32 object-cover rounded-md" 
}: { 
  src: string; 
  alt: string; 
  className?: string; 
}) => {
  const [imgError, setImgError] = useState(false);
  const isOnline = navigator.onLine;

  if (!isOnline && /^https?:\/\//.test(src)) {
    return (
      <div className={`${className} bg-soleo-dark/50 flex items-center justify-center border border-dashed border-amber-700`}>
        <div className="text-center px-2">
          <AlertCircle className="w-5 h-5 text-amber-500 mx-auto" />
          <span className="text-amber-400 text-[10px] mt-1 block">Material no disponible sin conexión</span>
        </div>
      </div>
    );
  }

  if (imgError) {
    return (
      <div className={`${className} bg-soleo-dark/50 flex items-center justify-center border border-dashed border-gray-600`}>
        <span className="text-gray-500 text-xs">Imagen no cargada</span>
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setImgError(true)} loading="lazy" />;
};

// ✅ AHORA NO RECIBE PROPS
export function AdminBulking({}: AdminBulkingProps) {
  const [loading, setLoading] = useState(true);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [availableMuscleGroups, setAvailableMuscleGroups] = useState<MuscleGroup[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [exercisesCache, setExercisesCache] = useState<Record<string, Exercise[]>>({});
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'builder' | 'preview'>('builder');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // ✅ ESTADO INTERNO PARA MENSAJES
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchBulkingRoutine = async () => {
    try {
      const response = await fetch(`${API_URL}/routines/bulking`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Error al cargar la rutina');
      
      const data = await response.json();
      const safeRoutine = {
        ...data,
        muscleGroups: (data.muscleGroups || []).filter((mg: any) => mg && mg.muscleGroup !== null)
      };
      setRoutine(safeRoutine);
    } catch (error) {
      console.error('Error fetching routine:', error);
      setError('No se pudo cargar la rutina de bulking'); // ✅ Usa setError
    }
  };

  const fetchMuscleGroups = async () => {
    try {
      if (!navigator.onLine) return;

      const response = await fetch(`${API_URL}/muscle-groups`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableMuscleGroups(data.muscleGroups || data || []);
      }
    } catch (error) {
      console.error('Error loading muscle groups:', error);
    }
  };

  // ✅ CARGA EJERCICIOS CON CACHÉ (FUNCIONA OFFLINE)
  const fetchExercisesByMuscleGroup = async (muscleGroupId: string) => {
    // Si ya están en caché, usarlos (online u offline)
    if (exercisesCache[muscleGroupId]) {
      setAvailableExercises(exercisesCache[muscleGroupId]);
      return;
    }

    // Si no hay conexión y no están en caché → vacío
    if (!navigator.onLine) {
      setAvailableExercises([]);
      return;
    }

    // Estás online: cargar del backend
    try {
      const response = await fetch(`${API_URL}/exercises/muscle-group/${muscleGroupId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        const exercises = data.exercises || data || [];
        setAvailableExercises(exercises);
        // Guardar en caché
        setExercisesCache(prev => ({ ...prev, [muscleGroupId]: exercises }));
      } else {
        setAvailableExercises([]);
      }
    } catch (error) {
      console.error('Error cargando ejercicios:', error);
      setAvailableExercises([]);
    }
  };

  // ✅ ELIMINAR GRUPO (OFFLINE)
  const removeMuscleGroupFromRoutine = async (muscleGroupId: string) => {
    if (!routine) return;

    const updatedMuscleGroups = routine.muscleGroups.filter(mg => 
      mg && mg.muscleGroup && mg.muscleGroup._id !== muscleGroupId
    );
    setRoutine({ ...routine, muscleGroups: updatedMuscleGroups });

    await saveOperation({
      type: 'DELETE',
      resource: 'routine-muscle-group',
      customEndpoint: `/routines/${routine._id}/muscle-groups/${muscleGroupId}`,
      payload: {},
      timestamp: Date.now()
    });

    setDeleteConfirm(null);
    setSuccess('Grupo muscular eliminado. Se sincronizará cuando haya conexión.'); // ✅ Usa setSuccess

    if (navigator.onLine) {
      triggerSync();
    }
  };

  // ✅ CARGAR EJERCICIOS AL CAMBIAR GRUPO
  useEffect(() => {
    if (selectedMuscleGroup) {
      fetchExercisesByMuscleGroup(selectedMuscleGroup);
      setSelectedExercises([]);
      setSearchTerm('');
    } else {
      setAvailableExercises([]);
    }
  }, [selectedMuscleGroup]);

  const filteredExercises = availableExercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ AGREGAR GRUPO (OFFLINE)
  const addMuscleGroupsToRoutine = async () => {
    if (!routine) {
      setError('Rutina no disponible. Conéctate a internet e intenta nuevamente.'); // ✅ Usa setError
      return;
    }
    if (!selectedMuscleGroup) {
      setError('Selecciona un grupo muscular'); // ✅ Usa setError
      return;
    }
    if (selectedExercises.length < 3) {
      setError(`Selecciona al menos 3 ejercicios. Actual: ${selectedExercises.length}`); // ✅ Usa setError
      return;
    }

    // Actualización optimista
    const newMuscleGroup: RoutineMuscleGroup = {
      muscleGroup: availableMuscleGroups.find(mg => mg._id === selectedMuscleGroup) || null,
      exercises: availableExercises.filter(ex => selectedExercises.includes(ex._id))
    };

    const updatedRoutine = {
      ...routine,
      muscleGroups: [...(routine.muscleGroups || []), newMuscleGroup]
    };
    setRoutine(updatedRoutine);

    // Guardar operación offline
    await saveOperation({
      type: 'CREATE',
      resource: 'routine-muscle-group',
      customEndpoint: `/routines/${routine._id}/muscle-groups`,
      payload: {
        muscleGroups: [{
          muscleGroup: selectedMuscleGroup,
          exercises: selectedExercises
        }]
      },
      timestamp: Date.now()
    });

    setSelectedMuscleGroup('');
    setSelectedExercises([]);
    setSearchTerm('');
    setSuccess(`¡Grupo muscular agregado con ${selectedExercises.length} ejercicios!`); // ✅ Usa setSuccess

    if (navigator.onLine) {
      triggerSync();
    }
  };

  const toggleExercise = (exerciseId: string) => {
    setSelectedExercises(prev =>
      prev.includes(exerciseId)
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const isMuscleGroupInRoutine = (muscleGroupId: string) => {
    return routine?.muscleGroups.some(mg => 
      mg && mg.muscleGroup && mg.muscleGroup._id === muscleGroupId
    );
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchBulkingRoutine();
      await fetchMuscleGroups();
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-soleo-yellow text-lg">Cargando rutina de bulking...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold text-white">Constructor de Rutina Bulking</h1>
          <p className="text-soleo-light mt-2">
            Diseña la rutina perfecta para ganar masa muscular
          </p>
        </div>
        
        <div className="flex bg-soleo-dark rounded-lg p-1 border border-soleo-brown/50">
          <button
            onClick={() => setViewMode('builder')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'builder'
                ? 'bg-soleo-yellow text-soleo-text-dark'
                : 'text-soleo-light hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Constructor
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'preview'
                ? 'bg-soleo-yellow text-soleo-text-dark'
                : 'text-soleo-light hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Vista Previa
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-600/20 border border-red-600 text-white p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}
      {success && (
        <div className="bg-green-600/20 border border-green-600 text-white p-4 rounded-lg">
          {success}
        </div>
      )}

      {viewMode === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
              <h3 className="text-lg font-bold text-soleo-yellow mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Paso 1: Selecciona Grupo Muscular
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableMuscleGroups.map((group) => (
                  <button
                    key={group._id}
                    onClick={() => setSelectedMuscleGroup(group._id)}
                    disabled={isMuscleGroupInRoutine(group._id)}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      selectedMuscleGroup === group._id
                        ? 'bg-soleo-yellow/20 border-soleo-yellow text-soleo-yellow'
                        : isMuscleGroupInRoutine(group._id)
                        ? 'bg-gray-600/20 border-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-soleo-dark border-soleo-brown/50 text-white hover:border-soleo-yellow/50'
                    }`}
                  >
                    <div className="font-medium text-sm">{group.name}</div>
                    {isMuscleGroupInRoutine(group._id) && (
                      <div className="text-xs text-gray-400 mt-1">(En rutina)</div>
                    )}
                  </button>
                ))}
              </div>

              {!navigator.onLine && availableMuscleGroups.length === 0 && (
                <div className="text-amber-400 text-sm mt-4 text-center">
                  🔒 Modo offline: conéctate para cargar grupos musculares.
                </div>
              )}
            </div>

            {selectedMuscleGroup && (
              <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
                <h3 className="text-lg font-bold text-soleo-yellow mb-4 flex items-center gap-2">
                  <Dumbbell className="w-5 h-5" />
                  Paso 2: Selecciona Ejercicios
                  <span className="text-amber-400 text-sm ml-auto">
                    {selectedExercises.length}/3 mínimo
                  </span>
                </h3>

                <div className="relative mb-4">
                  <Search className="w-4 h-4 text-soleo-light absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Buscar en ${availableExercises.length} ejercicios...`}
                    className="w-full bg-soleo-dark border border-soleo-brown/50 rounded-lg pl-10 pr-4 py-3 text-white placeholder-soleo-light focus:outline-none focus:ring-2 focus:ring-soleo-yellow"
                  />
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredExercises.map((exercise) => (
                    <div
                      key={exercise._id}
                      onClick={() => toggleExercise(exercise._id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedExercises.includes(exercise._id)
                          ? 'bg-soleo-yellow/20 border-soleo-yellow'
                          : 'bg-soleo-dark border-soleo-brown/50 hover:border-soleo-yellow/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {selectedExercises.includes(exercise._id) ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-soleo-brown" />
                          )}
                          <div>
                            <div className="font-medium text-white">{exercise.name}</div>
                            <div className="text-soleo-light text-sm">
                              {exercise.series} series × {exercise.repetitions} reps
                            </div>
                          </div>
                        </div>
                        <Dumbbell className="w-4 h-4 text-soleo-yellow" />
                      </div>
                    </div>
                  ))}
                  
                  {filteredExercises.length === 0 && (
                    <div className="text-center py-8 text-soleo-light">
                      <Dumbbell className="w-12 h-12 text-soleo-yellow mx-auto mb-4 opacity-50" />
                      <p>No se encontraron ejercicios</p>
                      <p className="text-sm">
                        {!navigator.onLine && !exercisesCache[selectedMuscleGroup]
                          ? "Conéctate a internet para cargar ejercicios."
                          : "Intenta con otro término de búsqueda"}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={addMuscleGroupsToRoutine}
                  disabled={selectedExercises.length < 3}
                  className="w-full bg-soleo-yellow text-soleo-text-dark py-4 px-6 rounded-lg hover:bg-amber-400 transition-colors font-bold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  <Plus className="w-5 h-5" />
                  Agregar a Rutina ({selectedExercises.length} ejercicios)
                </button>
              </div>
            )}
          </div>

          <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-soleo-yellow flex items-center gap-2">
                <Users className="w-5 h-5" />
                Vista Previa de la Rutina
              </h3>
              <div className="text-soleo-light text-sm">
                {routine?.muscleGroups?.filter(mg => mg && mg.muscleGroup).length || 0} grupos
              </div>
            </div>

            <div className="space-y-4">
              {routine?.muscleGroups?.filter(mg => mg && mg.muscleGroup).map((muscleGroup) => (
                <div key={muscleGroup.muscleGroup!._id} className="bg-soleo-dark/50 rounded-lg p-4 relative group">
                  <button
                    onClick={() => setDeleteConfirm(muscleGroup.muscleGroup!._id)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10"
                    title="Remover grupo de la rutina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {deleteConfirm === muscleGroup.muscleGroup!._id && (
                    <div className="absolute -top-2 -right-2 bg-red-600 rounded-lg p-3 z-20 shadow-lg">
                      <div className="text-white text-sm mb-2">
                        ¿Remover {muscleGroup.muscleGroup!.name}?
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => removeMuscleGroupFromRoutine(muscleGroup.muscleGroup!._id)}
                          className="bg-white text-red-600 px-2 py-1 rounded text-xs font-bold hover:bg-gray-100"
                        >
                          Sí
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  )}

                  <h4 className="font-bold text-soleo-yellow mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    {muscleGroup.muscleGroup!.name}
                  </h4>
                  
                  <div className="space-y-2">
                    {muscleGroup.exercises?.filter(ex => ex).map((exercise) => (
                      <div key={exercise._id} className="flex justify-between items-center py-2 border-b border-soleo-brown/30 last:border-b-0">
                        <span className="text-white text-sm">{exercise.name}</span>
                        <span className="text-soleo-light text-xs">
                          {exercise.series}×{exercise.repetitions}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {(!routine?.muscleGroups || routine.muscleGroups.filter(mg => mg && mg.muscleGroup).length === 0) && (
                <div className="text-center py-8 text-soleo-light">
                  <Activity className="w-12 h-12 text-soleo-yellow mx-auto mb-4 opacity-50" />
                  <p>La rutina está vacía</p>
                  <p className="text-sm">Comienza agregando grupos musculares</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'preview' && (
        <div className="bg-soleo-brown/20 p-6 rounded-lg border border-soleo-brown/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-soleo-yellow flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Vista Completa de la Rutina Bulking
            </h3>
            <div className="text-soleo-light">
              {routine?.muscleGroups?.filter(mg => mg && mg.muscleGroup).length || 0} grupos musculares
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routine?.muscleGroups?.filter(mg => mg && mg.muscleGroup).map((muscleGroup) => (
              <div key={muscleGroup.muscleGroup!._id} className="bg-soleo-dark/30 rounded-lg p-5 border border-soleo-brown/50 relative group">
                <button
                  onClick={() => setDeleteConfirm(muscleGroup.muscleGroup!._id)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10"
                  title="Remover grupo de la rutina"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {deleteConfirm === muscleGroup.muscleGroup!._id && (
                  <div className="absolute -top-2 -right-2 bg-red-600 rounded-lg p-3 z-20 shadow-lg">
                    <div className="text-white text-sm mb-2">
                      ¿Remover {muscleGroup.muscleGroup!.name}?
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => removeMuscleGroupFromRoutine(muscleGroup.muscleGroup!._id)}
                        className="bg-white text-red-600 px-2 py-1 rounded text-xs font-bold hover:bg-gray-100"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-soleo-yellow/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Target className="w-6 h-6 text-soleo-yellow" />
                  </div>
                  <h4 className="font-bold text-soleo-yellow text-lg">{muscleGroup.muscleGroup!.name}</h4>
                  <div className="text-soleo-light text-sm">
                    {muscleGroup.exercises?.length || 0} ejercicios
                  </div>
                </div>

                <div className="space-y-3">
                  {muscleGroup.exercises?.filter(ex => ex).map((exercise, index) => (
                    <div key={exercise._id} className="bg-soleo-dark/50 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-soleo-yellow rounded-full flex items-center justify-center text-soleo-text-dark text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{exercise.name}</div>
                          
                          {/* ✅ IMAGEN CON SOPORTE OFFLINE */}
                          <div className="mt-2">
                            <OfflineImage 
                              src={exercise.imageUrl || '/placeholder-exercise.jpg'} 
                              alt={exercise.name} 
                            />
                          </div>

                          <div className="text-soleo-light text-sm mt-2">
                            <span className="bg-soleo-yellow/20 text-soleo-yellow px-2 py-1 rounded text-xs">
                              {exercise.series} series × {exercise.repetitions} reps
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {(!routine?.muscleGroups || routine.muscleGroups.filter(mg => mg && mg.muscleGroup).length === 0) && (
              <div className="col-span-3 text-center py-12 text-soleo-light">
                <Activity className="w-16 h-16 text-soleo-yellow mx-auto mb-4 opacity-50" />
                <p className="text-xl mb-2">Rutina Vacía</p>
                <p>Cambia al modo "Constructor" para comenzar a agregar ejercicios</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}