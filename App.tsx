import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EditorView } from './components/EditorView';
import { ChatPanel } from './components/ChatPanel';
import { NavigationSidebar } from './components/NavigationSidebar';
import { ApiKeyModal } from './components/ApiKeyModal';
import { PricingPage } from './components/PricingPage';
import { ProjectsPage } from './components/ProjectsPage';
import { GithubImportModal } from './components/GithubImportModal';
import { GithubSyncModal } from './components/GithubSyncModal';
import { ShareModal } from './components/ShareModal';
import { PublishModal } from './components/PublishModal';
import { AuthModal } from './components/AuthModal'; 
import { AuthPage } from './components/AuthPage'; 
import { SupabaseAdminModal } from './components/SupabaseAdminModal';
import { ProWelcomeOnboarding } from './components/ProWelcomeOnboarding';
import { CodePreview } from './components/CodePreview';
import { LandingPage } from './components/LandingPage';
import { PrivacyPage } from './components/PrivacyPage';
import { TermsPage } from './components/TermsPage';
import { Toast } from './components/Toast';
import { SaveSuccessAnimation } from './components/SaveSuccessAnimation';
import { ProjectFile, ChatMessage, AIProvider, UserSettings, Theme, SavedProject, AIModel, ChatMode } from './types';
import { downloadProjectAsZip } from './services/projectService';
import { INITIAL_CHAT_MESSAGE, AI_MODELS, DEFAULT_GEMINI_API_KEY } from './constants';
import { generateCodeStream } from './services/aiService'; // Import generateCodeStream from aiService to support abort signal
import { generateImagesWithImagen } from './services/geminiService';
// Note: generateCodeStream in aiService internally calls provider specific services
import { useLocalStorage } from './hooks/useLocalStorage';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut, GoogleAuthProvider, linkWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, serverTimestamp, arrayUnion, deleteDoc, limit, orderBy, increment, arrayRemove } from "firebase/firestore";
import { LoaderIcon } from './components/Icons';
import { StripeModal } from './components/StripeModal';
import { NeonModal } from './components/NeonModal';
import { OpenStreetMapModal } from './components/OpenStreetMapModal';
import { IntegrationsPage } from './components/IntegrationsPage';
import { OpenAIModal } from './components/OpenAIModal';
import { NetlifyModal } from './components/NetlifyModal';
import { SettingsPage } from './components/SettingsPage';
import { ProjectSettingsModal } from './components/ProjectSettingsModal'; // Import new modal

const sanitizeFirestoreData = (data: any) => {
  const sanitized = { ...data };
  for (const key in sanitized) {
    if (sanitized[key] && typeof sanitized[key] === 'object' && typeof sanitized[key].toDate === 'function') {
      sanitized[key] = sanitized[key].toDate().toISOString();
    }
  }
  return sanitized;
};

const extractAndParseJson = (text: string): any => {
  if (!text) return { message: "Erro: Resposta vazia da IA.", files: [] };
  
  // 1. First, attempt to clean up Markdown code blocks
  let cleanText = text.trim();
  
  // Replace "```json" or "```" at start
  cleanText = cleanText.replace(/^```json\s*/, '').replace(/^```\s*/, '');
  
  // Replace "```" at the end
  cleanText = cleanText.replace(/```$/, '').trim();

  // 2. Try parsing the clean text
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    // 3. If standard parse fails, try to find the outermost JSON object
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        // Fallback: If absolutely no JSON structure is found, return the text as message
       return { message: text, files: [] };
    }
    
    const jsonString = text.substring(firstBrace, lastBrace + 1);
    
    try {
      return JSON.parse(jsonString);
    } catch (innerError) {
      console.error("JSON Parse Error:", innerError);
      // Last resort fallback
      return { message: `Erro ao processar resposta da IA. Texto bruto: ${text.substring(0, 100)}...`, files: [] };
    }
  }
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
  const [galleryProjects, setGalleryProjects] = useState<SavedProject[]>([]);
  const [sessionUser, setSessionUser] = useState<any | null>(null);

  const [view, setView] = useState<'landing' | 'auth' | 'welcome' | 'editor' | 'pricing' | 'projects' | 'shared' | 'recent' | 'public_preview' | 'privacy' | 'terms' | 'integrations' | 'gallery' | 'settings'>(() => {
     if (typeof window !== 'undefined' && window.location.search.includes('p=')) return 'public_preview';
     if (files.length > 0) return 'editor';
     const hasVisited = typeof localStorage !== 'undefined' ? localStorage.getItem('codegen-has-visited') : null;
     if (!hasVisited) return 'landing';
     return 'welcome';
  });

  const [previousView, setPreviousView] = useState<'landing' | 'welcome'>('landing');
  const [activeMobileTab, setActiveMobileTab] = useState<'chat' | 'editor'>('editor');
  
  // Lifted Chat Mode State
  const [chatMode, setChatMode] = useState<ChatMode>('general');

  const [isApiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [isOpenAIModalOpen, setOpenAIModalOpen] = useState(false);
  const [isGithubModalOpen, setGithubModalOpen] = useState(false);
  const [isGithubSyncModalOpen, setGithubSyncModalOpen] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [isPublishModalOpen, setPublishModalOpen] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isSupabaseAdminModalOpen, setSupabaseAdminModalOpen] = useState(false);
  const [isStripeModalOpen, setStripeModalOpen] = useState(false);
  const [isNeonModalOpen, setNeonModalOpen] = useState(false);
  const [isOSMModalOpen, setOSMModalOpen] = useState(false);
  const [isNetlifyModalOpen, setNetlifyModalOpen] = useState(false);
  const [isProjectSettingsModalOpen, setIsProjectSettingsModalOpen] = useState(false); 
  const [showProOnboarding, setShowProOnboarding] = useState(false);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'light');
  
  const [availableModels, setAvailableModels] = useState<AIModel[]>(AI_MODELS);
  
  const [isInitializing, setIsInitializing] = useState(false); 
  const [generatingFile, setGeneratingFile] = useState<string | null>(null);
  const [generatedFileNames, setGeneratedFileNames] = useState<Set<string>>(new Set());
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [codeError, setCodeError] = useState<string | null>(null);
  const isFirebaseAvailable = useRef(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Chat Sidebar Resizing State
  const [chatSidebarWidth, setChatSidebarWidth] = useState(420);
  const isResizingRef = useRef(false);

  // Abort controller for cancelling generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Resizing Logic
  const startResizing = useCallback(() => {
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizingRef.current) {
      setChatSidebarWidth(prevWidth => {
          const newWidth = prevWidth + e.movementX;
          if (newWidth < 300) return 300;
          if (newWidth > 800) return 800;
          return newWidth;
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);


  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get('access_token');
        
        if (token) {
            if (window.opener) {
                window.opener.postMessage({ type: 'NETLIFY_TOKEN', token }, '*');
                window.close();
            } else {
                window.location.hash = '';
            }
        }
    }
  }, []);

  useEffect(() => {
    if (!userSettings) return;
    const plan = userSettings.plan || 'Hobby';
    const hasSeen = userSettings.hasSeenProWelcome === true;
    if (plan.toLowerCase() === 'pro' && !hasSeen) {
      const timer = setTimeout(() => { setShowProOnboarding(true); }, 500);
      return () => clearTimeout(timer);
    }
  }, [userSettings]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const publicProjectId = params.get('p');
    if (publicProjectId) {
      setIsLoadingPublic(true);
      const fetchPublicProject = async () => {
        try {
          const docRef = doc(db, "projects", publicProjectId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = sanitizeFirestoreData(docSnap.data()) as SavedProject;
            setProject({
              files: data.files,
              projectName: data.name,
              chatMessages: data.chat_history || [],
              envVars: data.env_vars || {},
              currentProjectId: data.id,
              activeFile: data.files[0]?.name || null
            });
            setView('public_preview');
          } else {
            alert("Projeto não encontrado ou o link expirou.");
            window.location.href = window.location.origin;
          }
        } catch (error) {
          console.error("Error loading public project:", error);
        } finally {
          setIsLoadingPublic(false);
        }
      };
      fetchPublicProject();
    }
  }, []);

  useEffect(() => { document.documentElement.className = theme; }, [theme]);

  const fetchUserProjects = useCallback(async (userId: string) => {
    if (!isFirebaseAvailable.current) return;
    try {
        const projectsMap = new Map<string, SavedProject>();
        const qOwner = query(collection(db, "projects"), where("ownerId", "==", userId));
        const qShared = query(collection(db, "projects"), where("shared_with", "array-contains", userId));
        const results = await Promise.allSettled([getDocs(qOwner), getDocs(qShared)]);
        results.forEach((res) => {
          if (res.status === 'fulfilled') {
            const snapshot = (res as any).value;
            snapshot.forEach((doc: any) => {
              const data = sanitizeFirestoreData(doc.data());
              const p = { ...data, id: parseInt(doc.id) || Number(doc.id) || Date.now() } as SavedProject;
              projectsMap.set(doc.id, p);
            });
          }
        });
        const sorted = Array.from(projectsMap.values()).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        setSavedProjects(sorted);
    } catch (error: any) { console.error("Error fetching projects:", error); }
  }, [setSavedProjects]);

  const fetchGalleryProjects = useCallback(async () => {
      try {
          const q = query(
              collection(db, "projects"), 
              where("is_public_in_gallery", "==", true),
              limit(50)
          );
          const snapshot = await getDocs(q);
          const projects: SavedProject[] = [];
          snapshot.forEach((doc: any) => {
              const data = sanitizeFirestoreData(doc.data());
              const p = { ...data, id: parseInt(doc.id) || Number(doc.id) || Date.now() } as SavedProject;
              projects.push(p);
          });
          projects.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          setGalleryProjects(projects);
      } catch (error) {
          console.error("Error fetching gallery:", error);
      }
  }, []);

  useEffect(() => {
      if (view === 'gallery') {
          fetchGalleryProjects();
      }
  }, [view, fetchGalleryProjects]);

  const fetchUserSettings = useCallback(async (userUid: string): Promise<UserSettings | null> => {
    if (!isFirebaseAvailable.current) return null;
    try {
      const docRef = doc(db, "users", userUid);
      const docSnap = await getDoc(docRef);
      const currentUserEmail = auth.currentUser?.email?.toLowerCase() || "";
      if (docSnap.exists()) {
        const data = sanitizeFirestoreData(docSnap.data());
        let mergedSettings = { id: userUid, ...data } as unknown as UserSettings;
        if ((!data.email || data.email !== currentUserEmail) && currentUserEmail) {
            await updateDoc(docRef, { email: currentUserEmail }).catch(() => {});
            mergedSettings.email = currentUserEmail;
        }
        if (mergedSettings.credits === undefined) {
            const defaultCredits = 50;
            await updateDoc(docRef, { credits: defaultCredits }).catch(() => {});
            mergedSettings.credits = defaultCredits;
        }
        return mergedSettings;
      } else {
        const initialData = { email: currentUserEmail, plan: 'Hobby' as const, hasSeenProWelcome: false, credits: 50 };
        await setDoc(docRef, initialData);
        return { id: userUid, ...initialData } as UserSettings;
      }
    } catch (error: any) { return null; }
  }, []);

  const handleUpdateSettings = useCallback(async (newSettings: Partial<Omit<UserSettings, 'id' | 'updated_at'>>) => {
    if (!sessionUser) return;
    try {
      const docRef = doc(db, "users", sessionUser.uid);
      await updateDoc(docRef, { ...newSettings, updated_at: serverTimestamp() });
      setUserSettings(prev => prev ? { ...prev, ...newSettings } : null);
      if (newSettings.netlify_access_token) {
          setToastSuccess("Netlify conectado com sucesso!");
      }
    } catch (error) { console.error("Erro ao atualizar configurações:", error); }
  }, [sessionUser]);

  const handleCompleteProOnboarding = async () => {
    setShowProOnboarding(false);
    if (sessionUser) {
      const docRef = doc(db, "users", sessionUser.uid);
      setUserSettings(prev => prev ? { ...prev, hasSeenProWelcome: true } : null);
      await updateDoc(docRef, { hasSeenProWelcome: true }).catch(console.error);
    }
  };

  const handleRedeemCredits = useCallback(async () => {
      if (!sessionUser || !userSettings) return;

      const lastRedeemDate = userSettings.last_credit_redemption ? new Date(userSettings.last_credit_redemption) : null;
      const today = new Date();

      if (lastRedeemDate && lastRedeemDate.toDateString() === today.toDateString()) {
          setToastError("Você já resgatou seus créditos diários hoje. Volte amanhã!");
          return;
      }

      const amountToAdd = userSettings.plan === 'Pro' ? 400 : 200;
      const newCredits = (userSettings.credits || 0) + amountToAdd;

      try {
          const userRef = doc(db, "users", sessionUser.uid);
          await updateDoc(userRef, {
              credits: increment(amountToAdd),
              last_credit_redemption: today.toISOString()
          });

          setUserSettings(prev => prev ? {
              ...prev,
              credits: newCredits,
              last_credit_redemption: today.toISOString()
          } : null);

          setToastSuccess(`Resgatado! +${amountToAdd} créditos adicionados.`);
      } catch (error) {
          console.error(error);
          setToastError("Erro ao resgatar créditos.");
      }
  }, [sessionUser, userSettings]);

  const handleSaveProject = useCallback(async () => {
    if (!sessionUser) { setAuthModalOpen(true); return; }
    if (files.length === 0) return;
    setIsSaving(true);
    const projectId = currentProjectId || Date.now();
    
    // Maintain existing status if saving an existing project
    const existingProject = savedProjects.find(p => p.id === projectId);
    
    const projectData: SavedProject = {
      id: projectId,
      ownerId: sessionUser.uid,
      shared_with: project.currentProjectId ? (existingProject?.shared_with || []) : [],
      is_public_in_gallery: existingProject?.is_public_in_gallery || false,
      name: projectName,
      files: files,
      chat_history: chatMessages,
      env_vars: envVars,
      likes: existingProject?.likes || 0,
      likedBy: existingProject?.likedBy || [],
      // Use null or defaults for optional fields to avoid 'undefined' error in Firestore
      netlifySiteId: existingProject?.netlifySiteId || null,
      deployedUrl: existingProject?.deployedUrl || null,
      previewImage: existingProject?.previewImage || null,
      logo: existingProject?.logo || null,
      description: existingProject?.description || "",
      category: existingProject?.category || "uncategorized",
      author: sessionUser.displayName || sessionUser.email?.split('@')[0] || "Anon",
      created_at: existingProject?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      // 1. Sanitize Data: JSON methods strip undefined values automatically
      const cleanData = JSON.parse(JSON.stringify(projectData));

      // 2. Optimistic UI update
      setSavedProjects(prev => [cleanData, ...prev.filter(p => p.id !== projectId)]);
      
      // 3. Firestore Save
      await setDoc(doc(db, "projects", projectId.toString()), { 
          ...cleanData, 
          updated_at: serverTimestamp() 
      }, { merge: true });
      
      setProject(prev => ({ ...prev, currentProjectId: projectId }));
      
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2500);

    } catch (error: any) { 
        console.error("Erro detalhado ao salvar:", error);
        setToastError(`Erro ao salvar projeto: ${error.message}`);
    } finally { 
        setIsSaving(false); 
    }
  }, [sessionUser, files, projectName, chatMessages, envVars, currentProjectId, savedProjects]);

  const handleRenameProject = useCallback(async (newName: string) => {
      if (!newName.trim()) return;
      setProject(prev => ({ ...prev, projectName: newName }));
      
      if (currentProjectId) {
          try {
              setSavedProjects(prev => prev.map(p => p.id === currentProjectId ? { ...p, name: newName } : p));
              await updateDoc(doc(db, "projects", currentProjectId.toString()), { name: newName });
          } catch (error) {
              console.error("Failed to rename saved project", error);
          }
      }
  }, [currentProjectId, setSavedProjects]);

  const handleUpdateProjectSettings = useCallback(async (projectId: number, updates: Partial<SavedProject>) => {
      // 1. Update in local storage state
      setSavedProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
      
      // 2. Update current project context if it's the active one
      if (currentProjectId === projectId) {
          if (updates.name) setProject(prev => ({ ...prev, projectName: updates.name! }));
          // other fields like logo/preview are not in active ProjectState currently, only in SavedProject
      }

      // 3. Update Firestore
      try {
          await updateDoc(doc(db, "projects", projectId.toString()), { 
              ...updates, 
              updated_at: serverTimestamp() 
          });
          setToastSuccess("Configurações do projeto salvas!");
      } catch (error) {
          console.error("Failed to update project settings", error);
          setToastError("Erro ao salvar configurações do projeto.");
      }
  }, [currentProjectId, setSavedProjects]);

  const handleShareProject = useCallback(async (targetUid: string, email: string) => {
    if (!currentProjectId) await handleSaveProject();
    if (currentProjectId) {
      try {
        await updateDoc(doc(db, "projects", currentProjectId.toString()), { shared_with: arrayUnion(targetUid) });
      } catch (error: any) { throw new Error(error.message); }
    }
  }, [currentProjectId, handleSaveProject]);

  const handleToggleGallery = useCallback(async (isPublic: boolean) => {
      if (!currentProjectId) await handleSaveProject();
      if (currentProjectId) {
          try {
              await updateDoc(doc(db, "projects", currentProjectId.toString()), { is_public_in_gallery: isPublic });
              setSavedProjects(prev => prev.map(p => p.id === currentProjectId ? { ...p, is_public_in_gallery: isPublic } : p));
          } catch (error: any) { throw new Error(error.message); }
      }
  }, [currentProjectId, handleSaveProject]);

  const handleProjectMetaUpdate = useCallback((projectId: number, updates: Partial<SavedProject>) => {
      // Ensure we update both the saved list AND the current project context if it matches
      setSavedProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
      
      // Update gallery list if present there too
      setGalleryProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
  }, [setSavedProjects]);

  const handleToggleLike = useCallback(async (projectId: number) => {
      if (!sessionUser) {
          setAuthModalOpen(true);
          return;
      }

      // Save previous state for rollback
      const prevGallery = [...galleryProjects];
      const prevSaved = [...savedProjects];

      let targetProject = galleryProjects.find(p => p.id === projectId) || savedProjects.find(p => p.id === projectId);
      
      if (!targetProject) return;

      const isLiked = targetProject.likedBy?.includes(sessionUser.uid);
      const newLikesCount = (targetProject.likes || 0) + (isLiked ? -1 : 1);
      
      const updater = (prev: SavedProject[]) => prev.map(p => {
          if (p.id === projectId) {
              const currentLikedBy = p.likedBy || [];
              const newLikedBy = isLiked 
                  ? currentLikedBy.filter(id => id !== sessionUser.uid)
                  : [...currentLikedBy, sessionUser.uid];
              return { ...p, likes: Math.max(0, newLikesCount), likedBy: newLikedBy };
          }
          return p;
      });

      // Optimistic Update
      setGalleryProjects(updater);
      setSavedProjects(updater);

      try {
          const projectRef = doc(db, "projects", projectId.toString());
          if (isLiked) {
              await updateDoc(projectRef, {
                  likes: increment(-1),
                  likedBy: arrayRemove(sessionUser.uid)
              });
          } else {
              await updateDoc(projectRef, {
                  likes: increment(1),
                  likedBy: arrayUnion(sessionUser.uid)
              });
          }
      } catch (error: any) {
          console.error("Failed to toggle like:", error);
          
          // Rollback on error
          setGalleryProjects(prevGallery);
          setSavedProjects(prevSaved);

          if (error.code === 'permission-denied') {
              setToastError("Permissão negada. Verifique as regras do Firebase.");
          } else {
              setToastError("Erro ao curtir projeto.");
          }
      }
  }, [sessionUser, galleryProjects, savedProjects]);

  const handleDeleteProject = useCallback(async (projectId: number) => {
    setSavedProjects(prev => prev.filter(p => p.id !== projectId));
    if (project.currentProjectId === projectId) { setProject(initialProjectState); }
    if (sessionUser) { try { await deleteDoc(doc(db, "projects", projectId.toString())); } catch (error) { console.error("Erro ao deletar projeto:", error); } }
  }, [sessionUser, project.currentProjectId, setSavedProjects, setProject]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      if (user) {
        setSessionUser({ uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL });
        const settings = await fetchUserSettings(user.uid);
        setUserSettings(settings);
        fetchUserProjects(user.uid);
        localStorage.setItem('codegen-has-visited', 'true');
        setView(current => (current === 'landing' || current === 'auth') ? 'welcome' : current);
      } else {
        setSessionUser(null);
        setUserSettings(null);
      }
    });
    return () => unsubscribe();
  }, [fetchUserSettings, fetchUserProjects]);

  const handleStopGeneration = useCallback(() => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
          
          // Add a system message indicating interruption
          setProject(p => ({
              ...p,
              chatMessages: [
                  ...p.chatMessages.slice(0, -1), // Remove the "Thinking..." or active message
                  { role: 'assistant', content: 'Geração interrompida pelo usuário.', isThinking: false }
              ]
          }));
          
          setIsInitializing(false);
          setGeneratingFile(null);
          setToastSuccess("Geração parada.");
      }
  }, []);

  const handleSendMessage = useCallback(async (prompt: string, provider: AIProvider, modelId: string, attachments: any[] = [], mode: ChatMode = 'general') => {
    if (!sessionUser) { setView('auth'); return; }
    
    const currentCredits = userSettings?.credits || 0;
    
    // IMAGE GENERATION HANDLER
    // Updated Regex to handle conjugations: "crie", "gera", "desenhe", etc.
    const isImageRequest = /(\b(gerar|gera|criar|crie|fazer|faça|desenhar|desenhe)\b.*\bimagem\b)|(\b(generate|create|make|draw)\b.*\bimage\b)/i.test(prompt);
    
    if (isImageRequest) {
        if (currentCredits < 40) {
            setToastError("Créditos insuficientes para gerar imagem (necessário: 40).");
            return;
        }

        // Add user message
        let activeProjectState = project;
        if (view === 'welcome') {
            activeProjectState = { ...initialProjectState };
        }

        setProject({
            ...activeProjectState,
            chatMessages: [
                ...activeProjectState.chatMessages,
                { role: 'user', content: prompt },
                { role: 'assistant', content: 'Gerando imagem (1:1)...', isThinking: true, isImageGenerator: true }
            ]
        });

        if (view !== 'editor') setView('editor');
        
        try {
            // Deduct credits
            const newCredits = currentCredits - 40;
            setUserSettings(prev => prev ? { ...prev, credits: newCredits } : null);
            updateDoc(doc(db, "users", sessionUser.uid), { credits: increment(-40) }).catch(console.error);

            // Use Default API Key for images if user key not present (as per requirement)
            const apiKey = userSettings?.gemini_api_key || DEFAULT_GEMINI_API_KEY;
            
            // Generate Image
            const images = await generateImagesWithImagen(prompt, apiKey, 1, "1:1");
            
            if (images.length > 0) {
                setProject(p => ({
                    ...p,
                    chatMessages: [
                        ...p.chatMessages.slice(0, -1),
                        { 
                            role: 'assistant', 
                            content: `Imagem gerada para: "${prompt}"`, 
                            isThinking: false, 
                            isImageGenerator: true,
                            image: images[0]
                        }
                    ]
                }));
            } else {
                throw new Error("Nenhuma imagem retornada.");
            }

        } catch (e: any) {
            console.error(e);
            setToastError("Erro ao gerar imagem: " + e.message);
            setProject(p => ({
                ...p,
                chatMessages: [
                    ...p.chatMessages.slice(0, -1),
                    { role: 'assistant', content: `Erro ao gerar imagem: ${e.message}`, isThinking: false, isImageGenerator: true }
                ]
            }));
        }
        return;
    }

    // NORMAL CODE GENERATION
    if (currentCredits <= 0) {
        setToastError("Você não tem créditos suficientes. Por favor, recarregue.");
        return;
    }

    let activeProjectState = project;
    if (view === 'welcome') {
        activeProjectState = { ...initialProjectState };
    }

    // APPLY MODE CONTEXT
    let adjustedPrompt = prompt;
    if (mode === 'design') {
        adjustedPrompt = `[DESIGN EXPERT MODE] Act as a senior UI/UX engineer. Focus heavily on aesthetics, modern design patterns, Tailwind CSS best practices, responsiveness, and animations. Ensure the UI is beautiful and polished. User request: ${prompt}`;
    } else if (mode === 'backend') {
        adjustedPrompt = `[BACKEND EXPERT MODE] Act as a senior Backend/Data engineer. Focus on data structure, API logic, Supabase/Firebase integration, security, and performance. User request: ${prompt}`;
    }

    setProject({ 
        ...activeProjectState, 
        chatMessages: [...activeProjectState.chatMessages, { role: 'user', content: prompt }, { role: 'assistant', content: 'Processando...', isThinking: true }] 
    });

    if (view !== 'editor') setView('editor');
    setIsInitializing(true);
    setAiSuggestions([]); 
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    let accumulatedResponse = "";

    try {
      const newCredits = currentCredits - 1;
      setUserSettings(prev => prev ? { ...prev, credits: newCredits } : null);
      updateDoc(doc(db, "users", sessionUser.uid), { credits: increment(-1) }).catch((err: any) => console.error("Failed to update credits", err));

      const apiKey = modelId.includes('gemini') || provider === AIProvider.Gemini
        ? (userSettings?.gemini_api_key || DEFAULT_GEMINI_API_KEY)
        : userSettings?.openrouter_api_key; 

      const fullResponse = await generateCodeStream(
          adjustedPrompt, 
          activeProjectState.files, 
          activeProjectState.envVars, 
          (chunk) => {
              accumulatedResponse += chunk;
              if (aiSuggestions.length === 0) {
                  const suggestionsMatch = accumulatedResponse.match(/"suggestions":\s*\[([\s\S]*?)\]/);
                  if (suggestionsMatch && suggestionsMatch[1]) {
                      try {
                          const rawArray = `[${suggestionsMatch[1]}]`;
                          if (rawArray.split('"').length % 2 !== 0) {
                              const partial = rawArray.substring(0, rawArray.lastIndexOf('"') + 1) + ']';
                              const parsed = JSON.parse(partial);
                              if (Array.isArray(parsed) && parsed.length > 0) setAiSuggestions(parsed);
                          } else {
                              const parsed = JSON.parse(rawArray);
                              if (Array.isArray(parsed) && parsed.length > 0) setAiSuggestions(parsed);
                          }
                      } catch (e) {}
                  }
              }
          }, 
          modelId, 
          attachments,
          apiKey,
          abortControllerRef.current.signal
      );
      
      const result = extractAndParseJson(fullResponse);
      
      if (result.suggestions && Array.isArray(result.suggestions)) {
          setAiSuggestions(result.suggestions);
      }

      setProject(p => {
            const map = new Map(p.files.map(f => [f.name, f]));
            if (result.files && Array.isArray(result.files)) {
                result.files.forEach((file: ProjectFile) => map.set(file.name, file));
            }
            const newActiveFile = (result.files && result.files.length > 0) ? result.files[0].name : p.activeFile;
            
            return { 
                ...p, 
                files: Array.from(map.values()), 
                activeFile: newActiveFile, 
                chatMessages: [...p.chatMessages.slice(0, -1), { role: 'assistant', content: result.message, summary: result.summary, isThinking: false }] 
            };
        });

    } catch (e: any) { 
        if (e.message !== "AbortError") {
            console.error(e);
            setToastError(e.message || "Erro desconhecido na geração.");
            setProject(p => ({
                ...p,
                chatMessages: [...p.chatMessages.slice(0, -1), { role: 'assistant', content: `Erro: ${e.message}`, isThinking: false }]
            }));
        }
    } finally { 
        setIsInitializing(false); 
        abortControllerRef.current = null;
    }
  }, [project, userSettings, sessionUser, view, aiSuggestions]);

  const handleLoadProject = useCallback((projectId: number) => {
    let p = savedProjects.find(x => x.id === projectId);
    if (!p) p = galleryProjects.find(x => x.id === projectId);

    if (p) {
        setProject({ files: p.files, projectName: p.name, chatMessages: p.chat_history || [], envVars: p.env_vars || {}, currentProjectId: p.id, activeFile: p.files[0]?.name || null });
        setView('editor');
    }
  }, [savedProjects, galleryProjects]);

  const currentSavedProject = savedProjects.find(p => p.id === currentProjectId);

  // Helper to open project settings safely
  const handleOpenProjectSettings = () => {
      if (!currentProjectId) {
          // If project not saved yet, prompt to save
          handleSaveProject();
          return;
      }
      setIsProjectSettingsModalOpen(true);
  };

  if (isLoadingPublic) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <LoaderIcon className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-gray-400 font-mono text-sm animate-pulse tracking-widest">CARREGANDO APLICAÇÃO...</p>
      </div>
    );
  }

  if (view === 'public_preview') {
    return (
      <div className="h-screen w-full bg-white relative">
        <CodePreview files={files} theme="light" envVars={envVars} onError={() => {}} />
        <div className="fixed bottom-4 right-4 z-50">
            <button onClick={() => window.location.href = window.location.origin} className="flex items-center gap-2 px-4 py-2 bg-black/80 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/10 hover:bg-black transition-all shadow-2xl">
                Criado com Codegen Studio
            </button>
        </div>
      </div>
    );
  }

  if (!sessionUser) {
    if (view === 'auth') {
        return (
            <div className="w-full h-full">
                <AuthPage 
                    onBack={() => setView('landing')} 
                    theme={theme}
                    onThemeChange={setTheme}
                />
            </div>
        );
    }
    
    if (view === 'landing' || view === 'pricing' || view === 'privacy' || view === 'terms') {
        if (view === 'privacy') return <div className="w-full h-full"><PrivacyPage onBack={() => setView(previousView)} /></div>;
        if (view === 'terms') return <div className="w-full h-full"><TermsPage onBack={() => setView(previousView)} /></div>;
        
        return (
            <div className="w-full h-full">
                {view === 'pricing' ? (
                    <PricingPage onBack={() => setView('landing')} onNewProject={() => {}} />
                ) : (
                    <LandingPage 
                        onGetStarted={() => { localStorage.setItem('codegen-has-visited', 'true'); setView('auth'); }}
                        onLogin={() => { localStorage.setItem('codegen-has-visited', 'true'); setView('auth'); }}
                        onShowPricing={() => { setPreviousView('landing'); setView('pricing'); }}
                        onShowPrivacy={() => { setPreviousView('landing'); setView('privacy'); }}
                        onShowTerms={() => { setPreviousView('landing'); setView('terms'); }}
                        theme={theme}
                        onThemeChange={setTheme}
                    />
                )}
                <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} theme={theme} />
            </div>
        );
    }
  }

  if (view === 'privacy') return <div className="w-full h-full"><PrivacyPage onBack={() => setView(previousView)} /></div>;
  if (view === 'terms') return <div className="w-full h-full"><TermsPage onBack={() => setView(previousView)} /></div>;

  const isDashboardView = ['welcome', 'projects', 'shared', 'recent', 'pricing', 'integrations', 'gallery', 'settings'].includes(view);

  return (
    <div className={`${theme} flex h-screen bg-[#09090b]`}>
      <SaveSuccessAnimation isVisible={showSaveSuccess} />
      {showProOnboarding && <ProWelcomeOnboarding onComplete={handleCompleteProOnboarding} />}
      <Toast message={toastError} onClose={() => setToastError(null)} type="error" />
      <Toast message={toastSuccess} onClose={() => setToastSuccess(null)} type="success" />

      {isDashboardView && (
          <NavigationSidebar 
              activeView={view}
              onNavigate={(v) => setView(v)}
              session={sessionUser ? { user: sessionUser } : null}
              onLogin={() => setView('auth')}
              onLogout={() => signOut(auth)}
              onOpenSettings={() => setView('settings')}
              credits={userSettings?.credits || 0} 
              currentPlan={userSettings?.plan || 'Hobby'}
              onRedeemCredits={handleRedeemCredits}
              lastRedemptionDate={userSettings?.last_credit_redemption}
          />
      )}

      <div className="flex-1 h-full overflow-hidden flex flex-col relative">
          
          <div key={view} className="w-full h-full flex flex-col">
            {view === 'welcome' && (
                <WelcomeScreen 
                  session={sessionUser ? { user: sessionUser } : null}
                  onLoginClick={() => setView('auth')}
                  onPromptSubmit={(p, m, a) => handleSendMessage(p, AIProvider.Gemini, m, a)}
                  onShowPricing={() => setView('pricing')}
                  onShowProjects={() => setView('projects')}
                  onOpenGithubImport={() => setGithubModalOpen(true)}
                  onFolderImport={f => { setProject(p => ({ ...p, files: f })); setView('editor'); }}
                  onNewProject={() => { setProject(initialProjectState); setView('welcome'); }}
                  onLogout={() => signOut(auth)}
                  onOpenSettings={() => setView('settings')}
                  recentProjects={savedProjects}
                  onLoadProject={handleLoadProject}
                  credits={userSettings?.credits || 0}
                  userGeminiKey={userSettings?.gemini_api_key || undefined} // Fixed potentially null
                  currentPlan={userSettings?.plan || 'Hobby'}
                  availableModels={availableModels}
                  theme={theme}
                  onThemeChange={setTheme}
                />
            )}

            {view === 'pricing' && (
                <PricingPage onBack={() => setView(previousView)} onNewProject={() => {}} />
            )}

            {view === 'settings' && (
                <SettingsPage 
                    settings={userSettings} 
                    sessionUser={sessionUser} 
                    onUpdateSettings={handleUpdateSettings} 
                    onLogout={() => signOut(auth)} 
                />
            )}

            {view === 'integrations' && (
                <IntegrationsPage 
                    onOpenGithubImport={() => setGithubModalOpen(true)}
                    onOpenSupabaseAdmin={() => setSupabaseAdminModalOpen(true)}
                    onOpenStripeModal={() => setStripeModalOpen(true)}
                    onOpenNeonModal={() => setNeonModalOpen(true)}
                    onOpenOSMModal={() => setOSMModalOpen(true)}
                    onOpenGeminiModal={() => setApiKeyModalOpen(true)}
                    onOpenOpenAIModal={() => setOpenAIModalOpen(true)}
                    onOpenDriveAuth={() => {}} // Removed functionality
                    onOpenNetlifyModal={() => setNetlifyModalOpen(true)}
                />
            )}

            {(view === 'projects' || view === 'shared' || view === 'recent' || view === 'gallery') && (
                <ProjectsPage 
                  projects={
                    view === 'gallery' ? galleryProjects :
                    view === 'projects' 
                      ? savedProjects.filter(p => p.ownerId === sessionUser?.uid)
                      : view === 'shared' 
                        ? savedProjects.filter(p => p.ownerId !== sessionUser?.uid)
                        : savedProjects // recent
                  }
                  title={
                    view === 'gallery' ? 'Galeria da Comunidade' :
                    view === 'projects' ? 'Meus Projetos' : 
                    view === 'shared' ? 'Projetos Compartilhados' : 'Projetos Recentes'
                  }
                  currentUserId={sessionUser?.uid}
                  onLikeProject={handleToggleLike}
                  onLoadProject={handleLoadProject} 
                  onDeleteProject={handleDeleteProject} 
                  onBack={() => setView('welcome')} 
                  onNewProject={() => {}} 
                />
            )}

            {view === 'editor' && (
                <div className="flex flex-col h-full bg-var-bg-default overflow-hidden w-full">
                  <div className="flex flex-1 overflow-hidden relative">
                    <div 
                        className={`flex-shrink-0 border-r border-[#27272a] h-full z-10 bg-[#121214] transition-none ${activeMobileTab === 'chat' ? 'flex w-full lg:w-auto' : 'hidden lg:flex'}`}
                        style={{ width: activeMobileTab === 'chat' ? '100%' : `${chatSidebarWidth}px` }}
                    >
                      <ChatPanel 
                          messages={chatMessages} 
                          onSendMessage={handleSendMessage} 
                          isProUser={userSettings?.plan === 'Pro'} 
                          projectName={projectName} 
                          credits={userSettings?.credits || 0}
                          generatingFile={generatingFile} 
                          isGenerating={isInitializing}
                          onStopGeneration={handleStopGeneration}
                          availableModels={availableModels}
                          onOpenSupabase={() => setSupabaseAdminModalOpen(true)}
                          onOpenGithub={() => setGithubSyncModalOpen(true)}
                          onOpenSettings={() => setView('settings')}
                          activeMode={chatMode} // Pass activeMode prop
                          onModeChange={setChatMode} // Pass callback to change mode
                      />
                    </div>
                    
                    {/* Resizer Handle */}
                    <div 
                        onMouseDown={startResizing}
                        className="w-1.5 h-full bg-[#121214] hover:bg-blue-500 cursor-col-resize z-20 transition-colors hidden lg:block border-l border-[#27272a]"
                    />

                    <main className={`flex-1 min-w-0 h-full relative ${activeMobileTab === 'editor' ? 'block' : 'hidden lg:block'}`}>
                      <EditorView 
                        files={files} activeFile={activeFile} projectName={projectName} theme={theme} onThemeChange={setTheme}
                        onFileSelect={n => setProject(p => ({...p, activeFile: n}))} onFileDelete={() => {}} 
                        onRunLocally={() => setPublishModalOpen(true)}
                        onSyncGithub={() => setGithubSyncModalOpen(true)}
                        onShare={() => setShareModalOpen(true)}
                        codeError={codeError} onFixCode={() => {}} onClearError={() => {}} onError={() => {}} envVars={envVars}
                        onDownload={() => downloadProjectAsZip(files, projectName)}
                        onSave={handleSaveProject}
                        onOpenProjects={() => setView('projects')}
                        onNewProject={() => { setProject(initialProjectState); setView('welcome'); }}
                        onLogout={() => signOut(auth)}
                        onOpenSettings={() => setView('settings')}
                        onOpenProjectSettings={handleOpenProjectSettings}
                        onRenameProject={handleRenameProject}
                        onNavigateHome={() => setView('welcome')}
                        session={sessionUser}
                        isGenerating={isInitializing}
                        generatingFile={generatingFile}
                        generatedFileNames={generatedFileNames}
                        aiSuggestions={aiSuggestions}
                        deployedUrl={currentSavedProject?.deployedUrl || undefined} // Fixed potential null
                        chatMode={chatMode} // Pass chatMode to EditorView for CodePreview logic
                      />
                    </main>
                  </div>
                </div>
            )}
          </div>
      </div>
      
      {/* Global Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} theme={theme} />
      
      {/* Project Settings Modal */}
      {currentSavedProject && (
          <ProjectSettingsModal 
              isOpen={isProjectSettingsModalOpen}
              onClose={() => setIsProjectSettingsModalOpen(false)}
              project={currentSavedProject}
              onSave={handleUpdateProjectSettings}
          />
      )}
      
      <GithubImportModal 
        isOpen={isGithubModalOpen} 
        onClose={() => setGithubModalOpen(false)} 
        onImport={(f, name) => { 
            // Creates a new project state with imported files
            setProject({
                ...initialProjectState,
                files: f,
                projectName: name || 'GitHub Project',
                activeFile: f.length > 0 ? f[0].name : null,
                chatMessages: [{ role: 'assistant', content: `Repositório **${name}** importado com sucesso! Como posso ajudar a editá-lo?` }]
            }); 
            setView('editor'); 
        }} 
        githubToken={userSettings?.github_access_token} 
        onOpenSettings={() => setView('settings')} 
        onSaveToken={(token) => handleUpdateSettings({ github_access_token: token })}
      />
      
      <GithubSyncModal 
        isOpen={isGithubSyncModalOpen} 
        onClose={() => setGithubSyncModalOpen(false)} 
        files={files} 
        projectName={projectName} 
        githubToken={userSettings?.github_access_token} 
        onOpenSettings={() => setView('settings')} 
        onSaveToken={(token) => handleUpdateSettings({ github_access_token: token })}
      />
      
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setShareModalOpen(false)} 
        onShare={handleShareProject} 
        onToggleGallery={handleToggleGallery}
        projectName={projectName} 
        projectId={currentProjectId}
      />
      
      <PublishModal 
        isOpen={isPublishModalOpen} 
        onClose={() => setPublishModalOpen(false)} 
        onDownload={() => downloadProjectAsZip(files, projectName)} 
        projectName={projectName} 
        projectId={currentProjectId} 
        files={files} 
        onSaveRequired={handleSaveProject} 
        netlifyToken={userSettings?.netlify_access_token} 
        existingSiteId={currentSavedProject?.netlifySiteId}
        onSaveToken={(token) => handleUpdateSettings({ netlify_access_token: token })}
        onProjectUpdate={handleProjectMetaUpdate}
      />
      
      <SupabaseAdminModal isOpen={isSupabaseAdminModalOpen} onClose={() => setSupabaseAdminModalOpen(false)} settings={userSettings || { id: '' }} onSave={handleUpdateSettings} />
      <StripeModal isOpen={isStripeModalOpen} onClose={() => setStripeModalOpen(false)} settings={userSettings || { id: '' }} onSave={handleUpdateSettings} />
      <NeonModal isOpen={isNeonModalOpen} onClose={() => setNeonModalOpen(false)} settings={userSettings || { id: '' }} onSave={handleUpdateSettings} />
      <OpenStreetMapModal isOpen={isOSMModalOpen} onClose={() => setOSMModalOpen(false)} />
      <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} onSave={(key) => handleUpdateSettings({ gemini_api_key: key })} />
      <OpenAIModal isOpen={isOpenAIModalOpen} onClose={() => setOpenAIModalOpen(false)} settings={userSettings || { id: '' }} onSave={handleUpdateSettings} />
      <NetlifyModal isOpen={isNetlifyModalOpen} onClose={() => setNetlifyModalOpen(false)} settings={userSettings || { id: '' }} onSave={handleUpdateSettings} />
    </div>
  );
};

export default App;