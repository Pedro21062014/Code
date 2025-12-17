import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EditorView } from './components/EditorView';
import { ChatPanel } from './components/ChatPanel';
import { SettingsModal } from './components/SettingsModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { PricingPage } from './components/PricingPage';
import { ProjectsPage } from './components/ProjectsPage';
import { GithubImportModal } from './components/GithubImportModal';
import { PublishModal } from './components/PublishModal';
import { AuthModal } from './components/AuthModal';
import { ImageStudioModal } from './components/ImageStudioModal';
import { SupabaseAdminModal } from './components/SupabaseAdminModal';
import { StripeModal } from './components/StripeModal';
import { NeonModal } from './components/NeonModal';
import { OpenStreetMapModal } from './components/OpenStreetMapModal';
import { ProjectFile, ChatMessage, AIProvider, UserSettings, Theme, SavedProject } from './types';
import { downloadProjectAsZip } from './services/projectService';
import { INITIAL_CHAT_MESSAGE, DEFAULT_GEMINI_API_KEY, AI_MODELS, DAILY_CREDIT_LIMIT } from './constants';
import { generateCodeStreamWithGemini, generateProjectName } from './services/geminiService';
import { generateCodeStreamWithOpenAI } from './services/openAIService';
import { generateCodeStreamWithDeepSeek } from './services/deepseekService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, updateDoc } from "firebase/firestore";

// Helper para sanitizar objetos do Firestore (converte Timestamps para strings ISO)
const sanitizeFirestoreData = (data: any) => {
  if (!data) return data;
  const sanitized = { ...data };
  for (const key in sanitized) {
    if (sanitized[key] && typeof sanitized[key] === 'object' && typeof sanitized[key].toDate === 'function') {
      sanitized[key] = sanitized[key].toDate().toISOString();
    }
  }
  return sanitized;
};

const extractAndParseJson = (text: string): any => {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error("JSON inválido na resposta da IA.");
  }
  const jsonString = text.substring(firstBrace, lastBrace + 1);
  return JSON.parse(jsonString);
};

interface ProjectState {
  files: ProjectFile[];
  activeFile: string | null;
  chatMessages: ChatMessage[];
  projectName: string;
  envVars: Record<string, string>;
  currentProjectId: number | null;
}

const initialProjectState: ProjectState = {
  files: [],
  activeFile: null,
  chatMessages: [{ role: 'assistant', content: INITIAL_CHAT_MESSAGE }],
  projectName: 'NovoProjeto',
  envVars: {},
  currentProjectId: null,
};

export const App: React.FC = () => {
  const [project, setProject] = useLocalStorage<ProjectState>('codegen-studio-project', initialProjectState);
  const { files, activeFile, chatMessages, projectName, envVars, currentProjectId } = project;
  
  const [savedProjects, setSavedProjects] = useLocalStorage<SavedProject[]>('codegen-studio-saved-projects', []);
  const [view, setView] = useState<'welcome' | 'editor' | 'pricing' | 'projects'>(files.length > 0 ? 'editor' : 'welcome');

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isApiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [isGithubModalOpen, setGithubModalOpen] = useState(false);
  const [isLocalRunModalOpen, setLocalRunModalOpen] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isImageStudioOpen, setImageStudioOpen] = useState(false);
  const [isSupabaseAdminModalOpen, setSupabaseAdminModalOpen] = useState(false);
  const [isStripeModalOpen, setStripeModalOpen] = useState(false);
  const [isNeonModalOpen, setNeonModalOpen] = useState(false);
  const [isOSMModalOpen, setOSMModalOpen] = useState(false);
  
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isProUser, setIsProUser] = useLocalStorage<boolean>('is-pro-user', false);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');
  const [pendingPrompt, setPendingPrompt] = useState<any>(null);
  
  const [isInitializing, setIsInitializing] = useState(false); 
  const [generatingFile, setGeneratingFile] = useState<string | null>(null);
  const [generatedFileNames, setGeneratedFileNames] = useState<Set<string>>(new Set());

  const [codeError, setCodeError] = useState<string | null>(null);

  // sessionUser agora contém apenas dados primitivos para evitar erros de serialização circular
  const [sessionUser, setSessionUser] = useState<{ uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null>(null);
  const isFirebaseAvailable = useRef(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const canManipulateHistory = window.location.protocol.startsWith('http');
  const effectiveGeminiApiKey = userSettings?.gemini_api_key || DEFAULT_GEMINI_API_KEY;

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const fetchUserProjects = useCallback(async (userId: string) => {
    if (!isFirebaseAvailable.current) return;
    try {
        const q = query(collection(db, "projects"), where("ownerId", "==", userId));
        const querySnapshot = await getDocs(q);
        const projects: SavedProject[] = [];
        querySnapshot.forEach((doc: any) => {
            const data = sanitizeFirestoreData(doc.data());
            projects.push({ ...data, id: parseInt(doc.id) || Number(doc.id) || Date.now() } as SavedProject);
        });
        setSavedProjects(prev => {
            const remoteIds = new Set(projects.map(p => p.id));
            const localOnly = prev.filter(p => !remoteIds.has(p.id));
            const combined = [...projects, ...localOnly];
            return combined.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        });
    } catch (error: any) { console.error("Error fetching projects:", error); }
  }, [setSavedProjects]);

  const fetchUserSettings = useCallback(async (userId: string): Promise<UserSettings | null> => {
    const localDataKey = `user_settings_${userId}`;
    let localSettings: UserSettings = { id: userId, credits: DAILY_CREDIT_LIMIT };
    
    try {
        const stored = localStorage.getItem(localDataKey);
        if (stored) localSettings = { ...localSettings, ...JSON.parse(stored) };
    } catch (e) { console.warn("Failed to parse local settings", e); }

    if (!isFirebaseAvailable.current) {
        setIsOfflineMode(true);
        return localSettings;
    }

    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = sanitizeFirestoreData(docSnap.data());
        let mergedSettings = { id: userId, ...data } as UserSettings;
        const today = new Date().toISOString().split('T')[0];
        if (mergedSettings.last_credits_reset !== today) {
            mergedSettings.credits = DAILY_CREDIT_LIMIT;
            mergedSettings.last_credits_reset = today;
            await updateDoc(docRef, { credits: DAILY_CREDIT_LIMIT, last_credits_reset: today });
        }
        localStorage.setItem(localDataKey, JSON.stringify(mergedSettings));
        setIsOfflineMode(false);
        return mergedSettings;
      } else {
        const initialData = { credits: DAILY_CREDIT_LIMIT, last_credits_reset: new Date().toISOString().split('T')[0] };
        await setDoc(docRef, initialData);
        return { ...localSettings, ...initialData };
      }
    } catch (error: any) {
      console.error("Firestore settings fetch error:", error);
      isFirebaseAvailable.current = false;
      setIsOfflineMode(true);
      return localSettings;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      if (user) {
        // Criamos uma versão "limpa" do usuário para evitar referências circulares
        const cleanedUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        };
        setSessionUser(cleanedUser);
        const settings = await fetchUserSettings(user.uid);
        setUserSettings(settings);
        await fetchUserProjects(user.uid);
      } else {
        setSessionUser(null);
        setUserSettings(null);
      }
    });
    return () => unsubscribe();
  }, [fetchUserSettings, fetchUserProjects]);

  const handleNewProject = useCallback(() => {
    if (project.files.length > 0 && !window.confirm("Iniciar um novo projeto? O trabalho atual será perdido.")) return;
    setProject(initialProjectState);
    setCodeError(null);
    setView('welcome');
    setSidebarOpen(false);
  }, [project.files.length, setProject]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setProject(initialProjectState);
      setView('welcome');
    } catch (error: any) { alert(`Erro ao sair: ${error.message}`); }
  }, [setProject]);

  const handleLoadProject = useCallback((projectId: number, confirmLoad: boolean = true) => {
    if (confirmLoad && project.files.length > 0 && !window.confirm("Carregar este projeto?")) return;
    const projectToLoad = savedProjects.find(p => p.id === projectId);
    if (projectToLoad) {
        setProject({
            files: projectToLoad.files,
            projectName: projectToLoad.name,
            chatMessages: projectToLoad.chat_history,
            envVars: projectToLoad.env_vars || {},
            currentProjectId: projectToLoad.id,
            activeFile: projectToLoad.files.find(f => f.name.includes('html'))?.name || projectToLoad.files[0]?.name || null,
        });
        setCodeError(null);
        setView('editor');
    }
  }, [project.files.length, savedProjects, setProject]);

  const handleSaveSettings = useCallback(async (newSettings: any) => {
    if (!sessionUser) return;
    const settingsData = { ...newSettings, updated_at: new Date().toISOString() };
    setUserSettings(prev => prev ? { ...prev, ...settingsData } : { id: sessionUser.uid, ...settingsData });
    if (isFirebaseAvailable.current) {
        try { await setDoc(doc(db, "users", sessionUser.uid), settingsData, { merge: true }); }
        catch (e) { isFirebaseAvailable.current = false; setIsOfflineMode(true); }
    }
  }, [sessionUser]);

  const handleSaveProject = useCallback(async () => {
    if (project.files.length === 0 || !sessionUser) return;
    const now = new Date().toISOString();
    const projectId = project.currentProjectId || Date.now();
    const projectData: SavedProject = {
      id: projectId,
      ownerId: sessionUser.uid,
      name: project.projectName,
      files: project.files,
      chat_history: project.chatMessages,
      env_vars: project.envVars,
      created_at: now,
      updated_at: now,
    };
    setSavedProjects(prev => {
      const idx = prev.findIndex(p => p.id === projectId);
      if (idx > -1) { const n = [...prev]; n[idx] = projectData; return n; }
      return [projectData, ...prev];
    });
    setProject(p => ({ ...p, currentProjectId: projectId }));
    if (isFirebaseAvailable.current) {
        try { await setDoc(doc(db, "projects", String(projectId)), projectData); }
        catch (e) { isFirebaseAvailable.current = false; setIsOfflineMode(true); }
    }
    alert(`Projeto salvo!`);
  }, [project, savedProjects, setSavedProjects, setProject, sessionUser]);

  const handleSendMessage = useCallback(async (prompt: string, provider: AIProvider, modelId: string, attachments: any[] = []) => {
    if (!sessionUser) { setAuthModalOpen(true); return; }
    
    const selectedModel = AI_MODELS.find(m => m.id === modelId);
    const cost = selectedModel?.creditCost || 1;
    const currentCredits = userSettings?.credits || 0;

    if (currentCredits < cost) {
        alert(`Créditos insuficientes (${currentCredits}/${cost}).`);
        return;
    }

    setCodeError(null);
    
    if (provider === AIProvider.Gemini && !effectiveGeminiApiKey) {
      setPendingPrompt({ prompt, provider, model: modelId, attachments });
      setApiKeyModalOpen(true);
      return;
    }
    
    const newCreditBalance = currentCredits - cost;
    setUserSettings(prev => prev ? { ...prev, credits: newCreditBalance } : null);
    if (isFirebaseAvailable.current) {
        updateDoc(doc(db, "users", sessionUser.uid), { credits: newCreditBalance }).catch(console.error);
    }

    setProject(p => ({ ...p, chatMessages: [...p.chatMessages, { role: 'user', content: prompt }, { role: 'assistant', content: 'Pensando...',