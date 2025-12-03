import { useState, useEffect } from 'react';
import { 
  Plus, Dumbbell, Trash2, Edit3, Save, X, Video, Image, RefreshCw 
} from 'lucide-react';

import { saveOperation } from "../../../offline/db";
import { triggerSync } from "../../../offline/sync";

interface MuscleGroup {
  _id: string;
  name: string;
  description?: string;
}

interface Exercise {
  _id: string;
  name: string;
  description: string;
  series: number;
  repetitions: number;
  videoUrl: string;
  imageUrl: string;
  muscleGroup: MuscleGroup | null; // ✅ Puede ser null
}

interface Message {
  type: 'success' | 'error';
  text: string;
  id: string;
}

interface AdminMusclesExercisesProps {}

export function AdminMusclesExercises({}: AdminMusclesExercisesProps) {
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'muscles' | 'exercises'>('muscles');
  
  const [showMuscleForm, setShowMuscleForm] = useState(false);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [editingMuscle, setEditingMuscle] = useState<MuscleGroup | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  
  const [muscleName, setMuscleName] = useState('');
  const [muscleDescription, setMuscleDescription] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseDescription, setExerciseDescription] = useState('');
  const [exerciseSeries, setExerciseSeries] = useState(3);
  const [exerciseRepetitions, setExerciseRepetitions] = useState(12);
  const [exerciseVideoUrl, setExerciseVideoUrl] = useState('');
  const [exerciseImageUrl, setExerciseImageUrl] = useState('');
  const [selectedMuscleForExercise, setSelectedMuscleForExercise] = useState('');

  const [formLoading, setFormLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const API_URL = import.meta.env.VITE_API_URL;
  const MUSCLES_CACHE_KEY = 'adminMuscles';
  const EXERCISES_CACHE_KEY = 'adminExercises';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const showMessage = (type: 'success' | 'error', baseText: string) => {
    const text = navigator.onLine
      ? baseText.replace('localmente. Se enviará cuando haya conexión.', 'exitosamente.')
      : baseText;

    const newMessage: Message = {
      type,
      text,
      id: Date.now().toString()
    };

    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => closeMessage(newMessage.id), 5000);
  };

  const closeMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const loadFromCache = () => {
    try {
      const musclesCache = localStorage.getItem(MUSCLES_CACHE_KEY);
      const exercisesCache = localStorage.getItem(EXERCISES_CACHE_KEY);
      if (musclesCache) setMuscleGroups(JSON.parse(musclesCache));
      if (exercisesCache) setExercises(JSON.parse(exercisesCache));
    } catch (e) {
      console.warn('Error loading cache');
    }
  };

  const fetchMuscleGroups = async () => {
    try {
      const response = await fetch(`${API_URL}/muscle-groups`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setMuscleGroups(data);
        if (navigator.onLine) {
          localStorage.setItem(MUSCLES_CACHE_KEY, JSON.stringify(data));
        }
      }
    } catch (error) {
      console.error('Error fetching muscle groups:', error);
      showMessage('error', 'Error al cargar grupos musculares');
      if (!navigator.onLine) loadFromCache();
    }
  };

  const fetchExercises = async () => {
    try {
      const response = await fetch(`${API_URL}/exercises`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setExercises(data);
        if (navigator.onLine) {
          localStorage.setItem(EXERCISES_CACHE_KEY, JSON.stringify(data));
        }
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
      showMessage('error', 'Error al cargar ejercicios');
      if (!navigator.onLine) loadFromCache();
    }
  };

  useEffect(() => {
    if (!navigator.onLine) {
      loadFromCache();
      setLoading(false);
    } else {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchMuscleGroups(), fetchExercises()]);
        setLoading(false);
      };
      loadData();
    }
  }, []);

  const refreshData = () => {
    fetchMuscleGroups();
    fetchExercises();
  };

  // Muscle Group Functions
  const createMuscleGroup = async () => {
    if (formLoading || !muscleName.trim()) {
      if (!muscleName.trim()) showMessage('error', 'El nombre del grupo muscular es requerido');
      return;
    }

    setFormLoading(true);
    const tempMuscle: MuscleGroup = {
      _id: `temp-${Date.now()}`,
      name: muscleName,
      description: muscleDescription
    };
    const updatedMuscles = [...muscleGroups, tempMuscle];
    setMuscleGroups(updatedMuscles);

    try {
      localStorage.setItem(MUSCLES_CACHE_KEY, JSON.stringify(updatedMuscles));
    } catch (e) {
      console.warn('No se pudo guardar en caché', e);
    }

    await saveOperation({
      type: 'CREATE',
      resource: 'muscle-group',
      payload: { name: muscleName, description: muscleDescription },
      timestamp: Date.now()
    });

    resetMuscleForm();
    setShowMuscleForm(false);
    showMessage('success', 'Grupo muscular guardado localmente. Se enviará cuando haya conexión.');

    if (navigator.onLine) {
      triggerSync();
      setTimeout(refreshData, 800);
    }

    setFormLoading(false);
  };

  const updateMuscleGroup = async () => {
    if (formLoading || !editingMuscle || !muscleName.trim()) {
      if (!muscleName.trim()) showMessage('error', 'El nombre del grupo muscular es requerido');
      return;
    }

    setFormLoading(true);
    const updatedMuscle: MuscleGroup = {
      ...editingMuscle,
      name: muscleName,
      description: muscleDescription
    };

    const updatedMuscles = muscleGroups.map(m => 
      m._id === editingMuscle._id ? updatedMuscle : m
    );
    setMuscleGroups(updatedMuscles);

    try {
      localStorage.setItem(MUSCLES_CACHE_KEY, JSON.stringify(updatedMuscles));
    } catch (e) {
      console.warn('No se pudo guardar en caché', e);
    }

    await saveOperation({
      type: 'UPDATE',
      resource: 'muscle-group',
      payload: { id: editingMuscle._id, name: muscleName, description: muscleDescription },
      timestamp: Date.now()
    });

    resetMuscleForm();
    setShowMuscleForm(false);
    showMessage('success', 'Grupo muscular actualizado localmente. Se enviará cuando haya conexión.');

    if (navigator.onLine) {
      triggerSync();
      setTimeout(refreshData, 800);
    }

    setFormLoading(false);
  };

  const deleteMuscleGroup = async (muscleGroupId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este grupo muscular?')) {
      return;
    }

    const updatedMuscles = muscleGroups.filter(m => m._id !== muscleGroupId);
    setMuscleGroups(updatedMuscles);

    try {
      localStorage.setItem(MUSCLES_CACHE_KEY, JSON.stringify(updatedMuscles));
    } catch (e) {
      console.warn('No se pudo guardar en caché', e);
    }

    await saveOperation({
      type: 'DELETE',
      resource: 'muscle-group',
      payload: { id: muscleGroupId },
      timestamp: Date.now()
    });

    showMessage('success', 'Grupo muscular eliminado. Se sincronizará cuando haya conexión.');

    if (navigator.onLine) {
      triggerSync();
      setTimeout(refreshData, 800);
    }
  };

  // Exercise Functions
  const createExercise = async () => {
    if (formLoading || !exerciseName.trim() || !selectedMuscleForExercise) {
      if (!exerciseName.trim() || !selectedMuscleForExercise) {
        showMessage('error', 'Nombre y grupo muscular son requeridos');
      }
      return;
    }

    // ✅ VALIDACIÓN EXTRA: evitar IDs temporales o inválidos
    if (selectedMuscleForExercise.startsWith('temp-') || selectedMuscleForExercise.length !== 24) {
      showMessage('error', 'Selecciona un grupo muscular válido');
      return;
    }

    setFormLoading(true);
    
    const muscleGroupName = muscleGroups.find(mg => mg._id === selectedMuscleForExercise)?.name || 'Desconocido';
    
    const newExercise: Exercise = {
      _id: `temp-${Date.now()}`,
      name: exerciseName,
      description: exerciseDescription,
      series: exerciseSeries,
      repetitions: exerciseRepetitions,
      videoUrl: exerciseVideoUrl,
      imageUrl: exerciseImageUrl,
      muscleGroup: {
        _id: selectedMuscleForExercise,
        name: muscleGroupName
      }
    };

    const updatedExercises = [...exercises, newExercise];
    setExercises(updatedExercises);

    try {
      localStorage.setItem(EXERCISES_CACHE_KEY, JSON.stringify(updatedExercises));
    } catch (e) {
      console.warn('No se pudo guardar en caché', e);
    }

    await saveOperation({
      type: 'CREATE',
      resource: 'exercise',
      payload: {
        name: exerciseName,
        description: exerciseDescription,
        series: exerciseSeries,
        repetitions: exerciseRepetitions,
        videoUrl: exerciseVideoUrl,
        imageUrl: exerciseImageUrl,
        muscleGroup: selectedMuscleForExercise
      },
      timestamp: Date.now()
    });

    resetExerciseForm();
    setShowExerciseForm(false);
    showMessage('success', 'Ejercicio guardado localmente. Se enviará cuando haya conexión.');

    if (navigator.onLine) {
      triggerSync();
      setTimeout(refreshData, 800);
    }

    setFormLoading(false);
  };

  const updateExercise = async () => {
    if (formLoading || !editingExercise || !exerciseName.trim() || !selectedMuscleForExercise) {
      if (!exerciseName.trim() || !selectedMuscleForExercise) {
        showMessage('error', 'Nombre y grupo muscular son requeridos');
      }
      return;
    }

    // ✅ VALIDACIÓN EXTRA: evitar IDs temporales o inválidos
    if (selectedMuscleForExercise.startsWith('temp-') || selectedMuscleForExercise.length !== 24) {
      showMessage('error', 'Selecciona un grupo muscular válido');
      return;
    }

    setFormLoading(true);
    
    const muscleGroupName = muscleGroups.find(mg => mg._id === selectedMuscleForExercise)?.name || editingExercise?.muscleGroup?.name || 'Desconocido';
    
    const updatedExercise: Exercise = {
      ...editingExercise!,
      name: exerciseName,
      description: exerciseDescription,
      series: exerciseSeries,
      repetitions: exerciseRepetitions,
      videoUrl: exerciseVideoUrl,
      imageUrl: exerciseImageUrl,
      muscleGroup: {
        _id: selectedMuscleForExercise,
        name: muscleGroupName
      }
    };

    const updatedExercises = exercises.map(e => 
      e._id === editingExercise!._id ? updatedExercise : e
    );
    setExercises(updatedExercises);

    try {
      localStorage.setItem(EXERCISES_CACHE_KEY, JSON.stringify(updatedExercises));
    } catch (e) {
      console.warn('No se pudo guardar en caché', e);
    }

    await saveOperation({
      type: 'UPDATE',
      resource: 'exercise',
      payload: {
        id: editingExercise!._id,
        name: exerciseName,
        description: exerciseDescription,
        series: exerciseSeries,
        repetitions: exerciseRepetitions,
        videoUrl: exerciseVideoUrl,
        imageUrl: exerciseImageUrl,
        muscleGroup: selectedMuscleForExercise
      },
      timestamp: Date.now()
    });

    resetExerciseForm();
    setShowExerciseForm(false);
    showMessage('success', 'Ejercicio actualizado localmente. Se enviará cuando haya conexión.');

    if (navigator.onLine) {
      triggerSync();
      setTimeout(refreshData, 800);
    }

    setFormLoading(false);
  };

  const deleteExercise = async (exerciseId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este ejercicio?')) {
      return;
    }

    const updatedExercises = exercises.filter(e => e._id !== exerciseId);
    setExercises(updatedExercises);

    try {
      localStorage.setItem(EXERCISES_CACHE_KEY, JSON.stringify(updatedExercises));
    } catch (e) {
      console.warn('No se pudo guardar en caché', e);
    }

    await saveOperation({
      type: 'DELETE',
      resource: 'exercise',
      payload: { id: exerciseId },
      timestamp: Date.now()
    });

    showMessage('success', 'Ejercicio eliminado. Se sincronizará cuando haya conexión.');

    if (navigator.onLine) {
      triggerSync();
      setTimeout(refreshData, 800);
    }
  };

  const resetMuscleForm = () => {
    setMuscleName('');
    setMuscleDescription('');
    setEditingMuscle(null);
  };

  const resetExerciseForm = () => {
    setExerciseName('');
    setExerciseDescription('');
    setExerciseSeries(3);
    setExerciseRepetitions(12);
    setExerciseVideoUrl('');
    setExerciseImageUrl('');
    setSelectedMuscleForExercise('');
    setEditingExercise(null);
  };

  const openEditMuscle = (muscle: MuscleGroup) => {
    setEditingMuscle(muscle);
    setMuscleName(muscle.name);
    setMuscleDescription(muscle.description || '');
    setShowMuscleForm(true);
  };

  const openEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setExerciseName(exercise.name);
    setExerciseDescription(exercise.description);
    setExerciseSeries(exercise.series);
    setExerciseRepetitions(exercise.repetitions);
    setExerciseVideoUrl(exercise.videoUrl);
    setExerciseImageUrl(exercise.imageUrl);
    // ✅ Manejo seguro de muscleGroup null
    setSelectedMuscleForExercise(exercise.muscleGroup?._id || '');
    setShowExerciseForm(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-soleo-yellow text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-heading font-bold text-white">Músculos y Ejercicios</h1>
          <p className="text-soleo-light mt-2">
            Administra grupos musculares y ejercicios
          </p>
        </div>
        <button
          onClick={refreshData}
          className="bg-soleo-yellow text-soleo-text-dark py-2 px-4 rounded-full hover:bg-amber-400 transition-colors font-bold flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {messages.map(message => (
        <div 
          key={message.id}
          className={`${
            message.type === 'success' 
              ? 'bg-green-600/20 border border-green-600' 
              : 'bg-red-600/20 border border-red-600'
          } text-white p-4 rounded-lg mb-4 relative`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => closeMessage(message.id)}
            className="absolute top-2 right-2 text-white/70 hover:text-white"
            aria-label="Cerrar mensaje"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}

      <div className="flex border-b border-soleo-brown/50 mb-6">
        <button
          onClick={() => setActiveTab('muscles')}
          className={`py-3 px-6 font-bold border-b-2 transition-colors ${
            activeTab === 'muscles'
              ? 'border-soleo-yellow text-soleo-yellow'
              : 'border-transparent text-soleo-light hover:text-white'
          }`}
        >
          Grupos Musculares
        </button>
        <button
          onClick={() => setActiveTab('exercises')}
          className={`py-3 px-6 font-bold border-b-2 transition-colors ${
            activeTab === 'exercises'
              ? 'border-soleo-yellow text-soleo-yellow'
              : 'border-transparent text-soleo-light hover:text-white'
          }`}
        >
          Ejercicios
        </button>
      </div>

      {activeTab === 'muscles' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-soleo-yellow">Grupos Musculares</h2>
            <button
              onClick={() => {
                resetMuscleForm();
                setShowMuscleForm(true);
              }}
              className="bg-soleo-yellow text-soleo-text-dark py-2 px-4 rounded-full hover:bg-amber-400 transition-colors font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Grupo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {muscleGroups.map(muscle => (
              <div key={muscle._id} className="bg-soleo-brown/20 p-4 rounded-lg border border-soleo-brown/50">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-soleo-yellow">{muscle.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditMuscle(muscle)}
                      className="text-blue-400 hover:text-blue-300"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMuscleGroup(muscle._id)}
                      className="text-red-400 hover:text-red-300"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {muscle.description && (
                  <p className="text-soleo-light text-sm">{muscle.description}</p>
                )}
              </div>
            ))}
          </div>

          {muscleGroups.length === 0 && (
            <div className="text-center py-12">
              <Dumbbell className="w-16 h-16 text-soleo-light mx-auto mb-4" />
              <p className="text-soleo-yellow text-lg mb-2">No hay grupos musculares</p>
              <p className="text-soleo-light">Crea tu primer grupo muscular para comenzar</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'exercises' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-soleo-yellow">Ejercicios</h2>
            <button
              onClick={() => {
                resetExerciseForm();
                setShowExerciseForm(true);
              }}
              className="bg-soleo-yellow text-soleo-text-dark py-2 px-4 rounded-full hover:bg-amber-400 transition-colors font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Ejercicio
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exercises.map(exercise => (
              <div key={exercise._id} className="bg-soleo-dark/50 p-4 rounded-lg border border-soleo-brown/30">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-soleo-yellow">{exercise.name}</h3>
                    {/* ✅ PROTECCIÓN CONTRA muscleGroup null */}
                    <p className="text-soleo-light text-sm">
                      {exercise.muscleGroup?.name || 'Grupo muscular no asignado'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditExercise(exercise)}
                      className="text-blue-400 hover:text-blue-300"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteExercise(exercise._id)}
                      className="text-red-400 hover:text-red-300"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-soleo-light text-sm mb-3">{exercise.description}</p>

                <div className="flex justify-between text-sm mb-3">
                  <div>
                    <span className="text-soleo-yellow">Series: </span>
                    <span className="font-bold">{exercise.series}</span>
                  </div>
                  <div>
                    <span className="text-soleo-yellow">Reps: </span>
                    <span className="font-bold">{exercise.repetitions}</span>
                  </div>
                </div>

                <div className="flex gap-2 text-xs">
                  {exercise.videoUrl && (
                    <span className="bg-blue-600 px-2 py-1 rounded flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      Video
                    </span>
                  )}
                  {exercise.imageUrl && (
                    <span className="bg-green-600 px-2 py-1 rounded flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      Imagen
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {exercises.length === 0 && (
            <div className="text-center py-12">
              <Dumbbell className="w-16 h-16 text-soleo-light mx-auto mb-4" />
              <p className="text-soleo-yellow text-lg mb-2">No hay ejercicios</p>
              <p className="text-soleo-light">Crea tu primer ejercicio para comenzar</p>
            </div>
          )}
        </div>
      )}

      {showMuscleForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-soleo-dark border-2 border-soleo-brown rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-soleo-yellow">
                  {editingMuscle ? 'Editar Grupo Muscular' : 'Nuevo Grupo Muscular'}
                </h2>
                <button 
                  onClick={() => setShowMuscleForm(false)}
                  className="text-soleo-light hover:text-white text-2xl font-bold p-2"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-soleo-yellow font-bold mb-2">
                    Nombre del Grupo Muscular *
                  </label>
                  <input
                    type="text"
                    value={muscleName}
                    onChange={(e) => setMuscleName(e.target.value)}
                    className="w-full bg-soleo-dark border border-soleo-brown text-white p-3 rounded"
                    placeholder="Ej: Pecho, Espalda, Piernas..."
                  />
                </div>

                <div>
                  <label className="block text-soleo-yellow font-bold mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={muscleDescription}
                    onChange={(e) => setMuscleDescription(e.target.value)}
                    className="w-full bg-soleo-dark border border-soleo-brown text-white p-3 rounded"
                    placeholder="Descripción opcional..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-soleo-brown/50">
                  <button
                    onClick={() => setShowMuscleForm(false)}
                    className="bg-gray-600 text-white py-2 px-6 rounded-full hover:bg-gray-500 transition-colors font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingMuscle ? updateMuscleGroup : createMuscleGroup}
                    disabled={formLoading || !muscleName.trim()}
                    className="bg-soleo-yellow text-soleo-text-dark py-2 px-6 rounded-full hover:bg-amber-400 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {formLoading ? 'Guardando...' : editingMuscle ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExerciseForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-soleo-dark border-2 border-soleo-brown rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-soleo-yellow">
                  {editingExercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
                </h2>
                <button 
                  onClick={() => setShowExerciseForm(false)}
                  className="text-soleo-light hover:text-white text-2xl font-bold p-2"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-soleo-yellow font-bold mb-2">
                      Nombre del Ejercicio *
                    </label>
                    <input
                      type="text"
                      value={exerciseName}
                      onChange={(e) => setExerciseName(e.target.value)}
                      className="w-full bg-soleo-dark border border-soleo-brown text-white p-3 rounded"
                      placeholder="Ej: Press de banca, Sentadillas..."
                    />
                  </div>

                  <div>
                    <label className="block text-soleo-yellow font-bold mb-2">
                      Grupo Muscular *
                    </label>
                    <select
                      value={selectedMuscleForExercise}
                      onChange={(e) => setSelectedMuscleForExercise(e.target.value)}
                      className="w-full bg-soleo-dark border border-soleo-brown text-white p-3 rounded"
                    >
                      <option value="">Selecciona un grupo muscular</option>
                      {muscleGroups.map(mg => (
                        <option key={mg._id} value={mg._id}>
                          {mg.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-soleo-yellow font-bold mb-2">
                    Descripción *
                  </label>
                  <textarea
                    value={exerciseDescription}
                    onChange={(e) => setExerciseDescription(e.target.value)}
                    className="w-full bg-soleo-dark border border-soleo-brown text-white p-3 rounded"
                    placeholder="Describe cómo realizar el ejercicio..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-soleo-yellow font-bold mb-2">
                      Series *
                    </label>
                    <input
                      type="number"
                      value={exerciseSeries}
                      onChange={(e) => setExerciseSeries(parseInt(e.target.value) || 3)}
                      className="w-full bg-soleo-dark border border-soleo-brown text-white p-3 rounded"
                      min="1"
                      max="10"
                    />
                  </div>

                  <div>
                    <label className="block text-soleo-yellow font-bold mb-2">
                      Repeticiones *
                    </label>
                    <input
                      type="number"
                      value={exerciseRepetitions}
                      onChange={(e) => setExerciseRepetitions(parseInt(e.target.value) || 12)}
                      className="w-full bg-soleo-dark border border-soleo-brown text-white p-3 rounded"
                      min="1"
                      max="50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-soleo-yellow font-bold mb-2">
                      URL del Video
                    </label>
                    <input
                      type="url"
                      value={exerciseVideoUrl}
                      onChange={(e) => setExerciseVideoUrl(e.target.value)}
                      className="w-full bg-soleo-dark border border-soleo-brown text-white p-3 rounded"
                      placeholder="https://ejemplo.com/video.mp4  "
                    />
                  </div>

                  <div>
                    <label className="block text-soleo-yellow font-bold mb-2">
                      URL de la Imagen
                    </label>
                    <input
                      type="url"
                      value={exerciseImageUrl}
                      onChange={(e) => setExerciseImageUrl(e.target.value)}
                      className="w-full bg-soleo-dark border border-soleo-brown text-white p-3 rounded"
                      placeholder="https://ejemplo.com/imagen.jpg  "
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-soleo-brown/50">
                  <button
                    onClick={() => setShowExerciseForm(false)}
                    className="bg-gray-600 text-white py-2 px-6 rounded-full hover:bg-gray-500 transition-colors font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingExercise ? updateExercise : createExercise}
                    disabled={formLoading || !exerciseName.trim() || !selectedMuscleForExercise}
                    className="bg-soleo-yellow text-soleo-text-dark py-2 px-6 rounded-full hover:bg-amber-400 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {formLoading ? 'Guardando...' : editingExercise ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}