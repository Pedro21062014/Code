
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
import { ProjectFile, ChatMessage, AIProvider, UserSettings, Theme, SavedProject, AIModel, ChatMode, ProjectVersion } from './types';
import { downloadProjectAsZip } from './services/projectService';
import { INITIAL_CHAT_MESSAGE, AI_MODELS, DEFAULT_GEMINI_API_KEY, GOOGLE_CLIENT_ID } from './constants';
import { generateCodeStream } from './services/aiService';
import { generateImagesWithImagen } from './services/geminiService';
import { uploadProjectToDrive } from './services/googleDriveService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, serverTimestamp, arrayUnion, deleteDoc, limit, increment, arrayRemove } from "firebase/firestore";
import { LoaderIcon } from './components/Icons';
import { StripeModal } from './components/StripeModal';
import { NeonModal } from './components/NeonModal';
import { OpenStreetMapModal } from './components/OpenStreetMapModal';
import { IntegrationsPage } from './components/IntegrationsPage';
import { OpenAIModal } from './components/OpenAIModal';
import { NetlifyModal } from './components/NetlifyModal';
import { SettingsPage } from './components/SettingsPage';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';
import { GoogleDriveSaveModal } from './components/GoogleDriveSaveModal';

// Declare Google Identity Services Types globally
declare global {
    interface Window {
        google?: {
            accounts: {
                oauth2: {
                    initTokenClient: (config: any) => any;
                }
            }
        }
    }
}

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
  
  // Remove markdown code blocks if present
  let cleanText = text.trim()
    .replace(/^```json\s*/, '')
    .replace(/^```\s*/, '')
    .replace(/```$/, '')
    .trim();

  try {
    // Attempt standard parsing
    return JSON.parse(cleanText);
  } catch (e) {
    console.warn("JSON Parse Failed (Standard), attempting repair/fallback:", e);

    // 1. Try to find the outermost JSON object bounds
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
       const potentialJson = cleanText.substring(firstBrace, lastBrace + 1);
       try {
         return JSON.parse(potentialJson);
       } catch (e2) {
         // Continue to fallback
       }
    }

    // 2. Regex Fallback for "message" content
    const messageMatch = cleanText.match(/"message":\s*"((?:[^"\\]|\\.)*)/);
    let extractedMessage = text; 

    if (messageMatch) {
        try {
            extractedMessage = JSON.parse(`"${messageMatch[1]}"`); 
        } catch (e) {
            extractedMessage = messageMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
    } else if (cleanText.includes('"message":')) {
        extractedMessage = cleanText.split('"message":')[1]?.split('"files":')[0]?.trim() || text;
    }
    
    return { 
        message: extractedMessage, 
        files: [] 
    };
  }
};

interface ProjectState {
  files: ProjectFile[];
  activeFile: string | null;
  chatMessages: ChatMessage[];
  projectName: string;
  envVars: Record<string, string>;
  currentProjectId: number | null;
  history: ProjectVersion[];
}

const initialProjectState: ProjectState = {
  files: [],
  activeFile: null,
  chatMessages: [{ role: 'assistant', content: INITIAL_CHAT_MESSAGE }],
  projectName: 'NovoProjeto',
  envVars: {},
  currentProjectId: null,
  history: [],
};

export const App: React.FC = () => {
  const [project, setProject] = useLocalStorage<ProjectState>('codegen-studio-project', initialProjectState);
  const { files, activeFile, chatMessages, projectName, envVars, currentProjectId, history } = project;
  
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
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState(false);
  const [googleDriveModalReason, setGoogleDriveModalReason] = useState<'limit' | 'size'>('limit');
  const [currentProjectSize, setCurrentProjectSize] = useState(0);

  const currentSavedProject = savedProjects.find(p => p.id === project.currentProjectId);

  // Google Drive State
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const tokenClient = useRef<any>(null);

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
  
  const [chatSidebarWidth, setChatSidebarWidth] = useState(420);
  const isResizingRef = useRef(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load Google Identity Services Script
  useEffect(() => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
          if (window.google) {
              tokenClient.current = window.google.accounts.oauth2.initTokenClient({
                  client_id: GOOGLE_CLIENT_ID,
                  scope: 'https://www.googleapis.com/auth/drive.file', // Apenas acesso a arquivos criados pelo app
                  callback: (tokenResponse: any) => {
                      if (tokenResponse && tokenResponse.access_token) {
                          setDriveAccessToken(tokenResponse.access_token);
                      }
                  },
              });
          }
      };
      document.body.appendChild(script);
      return () => {
          document.body.removeChild(script);
      };
  }, []);

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
              activeFile: data.files[0]?.name || null,
              history: []
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

  const fetchUserProjects = useCallback(async (userId: string, userEmail?: string) => {
    if (!isFirebaseAvailable.current) return;
    try {
        const projectsMap = new Map<string, SavedProject>();
        
        // Query projects owned by user
        const qOwner = query(collection(db, "projects"), where("ownerId", "==", userId));
        
        // Query projects shared with user UID (legacy)
        const qSharedUid = query(collection(db, "projects"), where("shared_with", "array-contains", userId));
        
        // Query projects shared with user Email (new standard)
        const qSharedEmail = userEmail ? query(collection(db, "projects"), where("shared_with", "array-contains", userEmail)) : null;

        const promises = [getDocs(qOwner), getDocs(qSharedUid)];
        if (qSharedEmail) promises.push(getDocs(qSharedEmail));

        const results = await Promise.allSettled(promises);
        
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

  // Handle Google Drive Connection Trigger
  const handleConnectGoogleDrive = useCallback(() => {
      if (tokenClient.current) {
          const options: any = {
              prompt: '' // Tenta usar a sessão existente sem forçar o seletor se possível
          };
          
          // Se o usuário já está logado no app com email (e possivelmente Google Auth),
          // usamos esse email como dica para o fluxo do Google Drive.
          if (sessionUser?.email) {
              options.hint = sessionUser.email;
          }

          tokenClient.current.requestAccessToken(options);
      } else {
          setToastError("Serviço do Google Drive não disponível. Tente recarregar.");
      }
  }, [sessionUser]);

  const handleSaveToGoogleDrive = useCallback(async () => {
      if (!sessionUser) { setAuthModalOpen(true); return; }
      
      // Ensure we have a token
      if (!driveAccessToken) {
          throw new Error("Não conectado ao Google Drive.");
      }

      const projectId = currentProjectId || Date.now();
      
      // Safely find existing project without relying on closed-over state if possible, 
      // but here we use savedProjects from closure which is updated via deps.
      const existingProject = savedProjects.find(p => p.id === projectId);

      const projectData: SavedProject = {
          id: projectId,
          ownerId: sessionUser.uid,
          shared_with: project.currentProjectId ? (existingProject?.shared_with || []) : [],
          is_public_in_gallery: false, 
          name: projectName,
          files: files,
          chat_history: chatMessages,
          env_vars: envVars,
          likes: 0,
          likedBy: [],
          author: sessionUser.displayName || "Eu",
          created_at: existingProject?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          storage: 'google_drive', 
          googleDriveFileId: existingProject?.googleDriveFileId // Preserve if exists
      };

      try {
          // 1. Upload to Drive API
          const uploadResult = await uploadProjectToDrive(
              driveAccessToken, 
              projectData, 
              existingProject?.googleDriveFileId
          );

          // 2. Update local metadata with Drive ID
          const updatedProjectData = {
              ...projectData,
              googleDriveFileId: uploadResult.id
          };

          // 3. Persist metadata to Firestore/Local State
          // Functional update to avoid stale state
          setSavedProjects(prev => {
              const others = prev.filter(p => p.id !== projectId);
              return [updatedProjectData, ...others];
          });
          
          await setDoc(doc(db, "projects", projectId.toString()), { 
              ...updatedProjectData, 
              updated_at: serverTimestamp() 
          }, { merge: true });

          // Update current project state safely
          setProject(prev => ({ ...prev, currentProjectId: projectId }));
          
      } catch (e: any) {
          console.error("Save to Drive Error in App.tsx:", e);
          if (e.message && (e.message.includes("401") || e.message.includes("token"))) {
              setDriveAccessToken(null); // Force re-auth
              throw new Error("Sessão expirada. Por favor, conecte novamente.");
          }
          throw e; // Rethrow to let modal handle it
      }
  }, [sessionUser, currentProjectId, projectName, files, chatMessages, envVars, savedProjects, driveAccessToken, setSavedProjects, setProject]);

  const handleSaveProject = useCallback(async (): Promise<number | null> => {
    if (!sessionUser) { setAuthModalOpen(true); return null; }
    if (files.length === 0) return null;
    
    setIsSaving(true);
    const projectId = currentProjectId || Date.now();
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
      netlifySiteId: existingProject?.netlifySiteId || null,
      deployedUrl: existingProject?.deployedUrl || null,
      previewImage: existingProject?.previewImage || null,
      logo: existingProject?.logo || null,
      description: existingProject?.description || "",
      category: existingProject?.category || "uncategorized",
      author: sessionUser.displayName || sessionUser.email?.split('@')[0] || "Anon",
      created_at: existingProject?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      githubRepo: existingProject?.githubRepo || null, 
      storage: 'firebase',
    };

    // --- CHECK STORAGE LIMITS ---
    const projectSizeKB = (new Blob([JSON.stringify(projectData)]).size) / 1024;
    setCurrentProjectSize(projectSizeKB);

    const isNewProject = !existingProject;
    
    // Count projects owned by user stored in firebase
    const userProjectCount = savedProjects.filter(p => p.ownerId === sessionUser.uid && (!p.storage || p.storage === 'firebase')).length;

    if (projectSizeKB > 500) {
        setGoogleDriveModalReason('size');
        setIsGoogleDriveModalOpen(true);
        setIsSaving(false);
        return null;
    }

    if (isNewProject && userProjectCount >= 4) {
        setGoogleDriveModalReason('limit');
        setIsGoogleDriveModalOpen(true);
        setIsSaving(false);
        return null;
    }
    // ----------------------------

    try {
      const cleanData = JSON.parse(JSON.stringify(projectData));

      setSavedProjects(prev => {
          const others = prev.filter(p => p.id !== projectId);
          return [cleanData, ...others];
      });
      
      await setDoc(doc(db, "projects", projectId.toString()), { 
          ...cleanData, 
          updated_at: serverTimestamp() 
      }, { merge: true });
      
      const filesDeepCopy = JSON.parse(JSON.stringify(files));
      const newVersion: ProjectVersion = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          files: filesDeepCopy,
          message: "Salvamento Manual"
      };

      setProject(prev => ({ 
          ...prev, 
          currentProjectId: projectId,
          history: [...(prev.history || []), newVersion]
      }));
      
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2500);
      
      return projectId;

    } catch (error: any) { 
        console.error("Erro detalhado ao salvar:", error);
        setToastError(`Erro ao salvar projeto: ${error.message}`);
        return null;
    } finally { 
        setIsSaving(false); 
    }
  }, [sessionUser, files, projectName, chatMessages, envVars, currentProjectId, savedProjects, setSavedProjects, setProject]);

  const handleRestoreVersion = useCallback((version: ProjectVersion) => {
      const restoredFiles = JSON.parse(JSON.stringify(version.files));
      const newHistoryEntry: ProjectVersion = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          files: restoredFiles,
          message: `Restaurado: ${version.message || 'Versão anterior'}`
      };

      setProject(prev => ({
          ...prev,
          files: restoredFiles,
          history: [...(prev.history || []), newHistoryEntry],
          chatMessages: [...prev.chatMessages, { 
              role: 'system', 
              content: `Projeto restaurado para a versão de ${new Date(version.timestamp).toLocaleString()}` 
          }]
      }));
      setToastSuccess("Versão restaurada com sucesso.");
  }, [setProject]);

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
  }, [currentProjectId, setSavedProjects, setProject]);

  const handleUpdateProjectSettings = useCallback(async (projectId: number, updates: Partial<SavedProject>) => {
      setSavedProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
      
      if (currentProjectId === projectId) {
          if (updates.name) setProject(prev => ({ ...prev, projectName: updates.name! }));
      }

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
  }, [currentProjectId, setSavedProjects, setProject]);

  const handleShareProject = useCallback(async (targetEmail: string, _unusedEmail: string) => {
    if (!currentProjectId) await handleSaveProject();
    if (currentProjectId) {
      try {
        await updateDoc(doc(db, "projects", currentProjectId.toString()), { shared_with: arrayUnion(targetEmail) });
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
  }, [currentProjectId, handleSaveProject, setSavedProjects]);

  const handleProjectMetaUpdate = useCallback((projectId: number, updates: Partial<SavedProject>) => {
      setSavedProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
      setGalleryProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
  }, [setSavedProjects]);

  const handleGithubConnect = useCallback(async (repoData: { owner: string, name: string, branch: string, url: string }) => {
      let projectId = currentProjectId;
      if (!projectId) {
          projectId = await handleSaveProject(); 
      }
      
      if (projectId) {
          const updates = { githubRepo: repoData };
          handleProjectMetaUpdate(projectId, updates);
          try {
              await updateDoc(doc(db, "projects", projectId.toString()), updates);
          } catch (e) {
              console.error("Failed to save github repo link", e);
          }
      }
  }, [currentProjectId, handleSaveProject, handleProjectMetaUpdate]);

  const handleGithubDisconnect = useCallback(async () => {
      if (currentProjectId) {
          const updates = { githubRepo: null };
          handleProjectMetaUpdate(currentProjectId, updates); 
          try {
              await updateDoc(doc(db, "projects", currentProjectId.toString()), updates);
          } catch (e) {
              console.error("Failed to disconnect github repo", e);
          }
      }
  }, [currentProjectId, handleProjectMetaUpdate]);

  const handleToggleLike = useCallback(async (projectId: number) => {
      if (!sessionUser) {
          setAuthModalOpen(true);
          return;
      }

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
          setGalleryProjects(prevGallery);
          setSavedProjects(prevSaved);

          if (error.code === 'permission-denied') {
              setToastError("Permissão negada. Verifique as regras do Firebase.");
          } else {
              setToastError("Erro ao curtir projeto.");
          }
      }
  }, [sessionUser, galleryProjects, savedProjects, setGalleryProjects, setSavedProjects]);

  const handleDeleteProject = useCallback(async (projectId: number) => {
    setSavedProjects(prev => prev.filter(p => p.id !== projectId));
    if (project.currentProjectId === projectId) { setProject(initialProjectState); }
    if (sessionUser) { try { await deleteDoc(doc(db, "projects", projectId.toString())); } catch (error) { console.error("Erro ao deletar projeto:", error); } }
  }, [sessionUser, project.currentProjectId, setSavedProjects, setProject]);

  const handleLoadProject = useCallback((projectId: number) => {
      const p = savedProjects.find(pr => pr.id === projectId);
      if (p) {
          setProject({
              files: p.files,
              activeFile: p.files.length > 0 ? p.files[0].name : null,
              chatMessages: p.chat_history || [],
              projectName: p.name,
              envVars: p.env_vars || {},
              currentProjectId: p.id,
              history: []
          });
          setView('editor');
      }
  }, [savedProjects, setProject]);

  const handleFileDelete = useCallback((fileName: string) => {
      setProject(prev => {
          const newFiles = prev.files.filter(f => f.name !== fileName && !f.name.startsWith(fileName + '/'));
          let newActive = prev.activeFile;
          if (newActive === fileName || newActive?.startsWith(fileName + '/')) {
              newActive = newFiles.length > 0 ? newFiles[0].name : null;
          }
          return { ...prev, files: newFiles, activeFile: newActive };
      });
  }, [setProject]);

  const handleFileUpload = useCallback((newFiles: ProjectFile[]) => {
      setProject(prev => {
          const mergedFiles = [...prev.files];
          newFiles.forEach(nf => {
              const idx = mergedFiles.findIndex(f => f.name === nf.name);
              if (idx >= 0) mergedFiles[idx] = nf;
              else mergedFiles.push(nf);
          });
          return { ...prev, files: mergedFiles };
      });
  }, [setProject]);

  const handleRenameFile = useCallback((oldName: string, newName: string) => {
      setProject(prev => {
          const newFiles = prev.files.map(f => {
              if (f.name === oldName) return { ...f, name: newName };
              if (f.name.startsWith(oldName + '/')) {
                  return { ...f, name: f.name.replace(oldName, newName) };
              }
              return f;
          });
          let newActive = prev.activeFile;
          if (newActive === oldName) newActive = newName;
          else if (newActive?.startsWith(oldName + '/')) newActive = newActive.replace(oldName, newName);
          
          return { ...prev, files: newFiles, activeFile: newActive };
      });
  }, [setProject]);

  const handleMoveFile = useCallback((oldPath: string, newPath: string) => {
      handleRenameFile(oldPath, newPath);
  }, [handleRenameFile]);

  const handleOpenProjectSettings = useCallback(async () => {
      if (!currentSavedProject) {
          const id = await handleSaveProject();
          if (id) setIsProjectSettingsModalOpen(true);
      } else {
          setIsProjectSettingsModalOpen(true);
      }
  }, [currentSavedProject, handleSaveProject]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      if (user) {
        setSessionUser({ uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL });
        const settings = await fetchUserSettings(user.uid);
        setUserSettings(settings);
        fetchUserProjects(user.uid, user.email);
        localStorage.setItem('codegen-has-visited', 'true');
        setView(current => (current === 'landing' || current === 'auth') ? 'welcome' : current);
      } else {
        setSessionUser(null);
        setUserSettings(null);
      }
    });
    return () => unsubscribe();
  }, [fetchUserSettings, fetchUserProjects, setUserSettings, setSavedProjects]);

  const handleStopGeneration = useCallback(() => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
          setProject(p => ({
              ...p,
              chatMessages: [
                  ...p.chatMessages.slice(0, -1),
                  { role: 'assistant', content: 'Geração interrompida pelo usuário.', isThinking: false }
              ]
          }));
          setIsInitializing(false);
          setGeneratingFile(null);
          setToastSuccess("Geração parada.");
      }
  }, [setProject]);

  const handleClearChat = useCallback(() => {
      if (window.confirm("Iniciar nova conversa? O histórico atual será limpo e você começará do zero.")) {
          setProject(prev => ({
              ...prev,
              chatMessages: [{ role: 'assistant', content: INITIAL_CHAT_MESSAGE }]
          }));
      }
  }, [setProject]);

  const handleSendMessage = useCallback(async (prompt: string, provider: AIProvider, modelId: string, attachments: any[] = [], mode: ChatMode = 'general') => {
    if (!sessionUser) { setView('auth'); return; }
    
    const currentCredits = userSettings?.credits || 0;
    
    // ... [Original Logic Kept Intact] ...
    const imageTagMatch = prompt.match(/<tools\/image>(.*?)<\/tools\/image>/is);
    const deployTagMatch = prompt.match(/<tools\/deploy\s*\/>/i);
    const fixTagMatch = prompt.match(/<tools\/fix>(.*?)<\/tools\/fix>/is);
    const planTagMatch = prompt.match(/<tools\/plan>/i);
    
    if (imageTagMatch) {
        const imagePrompt = imageTagMatch[1].trim();
        if (currentCredits < 40) {
            setToastError("Créditos insuficientes para gerar imagem (necessário: 40).");
            return;
        }
        let activeProjectState = project;
        if (view === 'welcome') {
            activeProjectState = { ...initialProjectState };
        }
        setProject({
            ...activeProjectState,
            chatMessages: [
                ...activeProjectState.chatMessages,
                { role: 'user', content: `[Ferramenta Imagem] ${imagePrompt}` },
                { role: 'assistant', content: 'Gerando imagem (1:1)...', isThinking: true, isImageGenerator: true }
            ]
        });
        if (view !== 'editor') setView('editor');
        try {
            const newCredits = currentCredits - 40;
            setUserSettings(prev => prev ? { ...prev, credits: newCredits } : null);
            updateDoc(doc(db, "users", sessionUser.uid), { credits: increment(-40) }).catch(console.error);
            const apiKey = userSettings?.gemini_api_key || DEFAULT_GEMINI_API_KEY;
            const images = await generateImagesWithImagen(imagePrompt, apiKey, 1, "1:1");
            if (images.length > 0) {
                setProject(p => ({
                    ...p,
                    chatMessages: [
                        ...p.chatMessages.slice(0, -1),
                        { 
                            role: 'assistant', 
                            content: `Imagem gerada para: "${imagePrompt}"`, 
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

    if (deployTagMatch) {
        setPublishModalOpen(true);
        setProject(p => ({
            ...p,
            chatMessages: [
                ...p.chatMessages,
                { role: 'user', content: '[Ferramenta Deploy] Iniciando publicação...' },
                { role: 'assistant', content: 'Abrindo painel de publicação...', isThinking: false }
            ]
        }));
        return;
    }

    if (currentCredits <= 0) {
        setToastError("Você não tem créditos suficientes. Por favor, recarregue.");
        return;
    }

    let activeProjectState = project;
    if (view === 'welcome') {
        activeProjectState = { ...initialProjectState };
    }

    let adjustedPrompt = prompt;
    if (fixTagMatch) {
        const fixPrompt = fixTagMatch[1].trim();
        adjustedPrompt = `[FIX MODE] Identify and fix errors based on this request: ${fixPrompt}. Review current files carefully.`;
    } else if (planTagMatch) {
        const userIntent = prompt.replace('<tools/plan>', '').trim();
        const planContext = userIntent ? `User Intent: ${userIntent}` : "Analyze the current project state.";
        adjustedPrompt = `[PLANNING MODE] ${planContext}\n\nAct as a Senior Technical Project Manager. Create a comprehensive, step-by-step implementation plan. Return the plan as a Markdown list with checkboxes (e.g., "- [ ] Step 1").`;
    } else if (mode === 'design') {
        adjustedPrompt = `[DESIGN EXPERT MODE] Act as a senior UI/UX engineer. Focus on aesthetics and modern design. User request: ${prompt}`;
    } else if (mode === 'backend') {
        adjustedPrompt = `[BACKEND EXPERT MODE] Act as a senior Backend engineer. Focus on logic and data. User request: ${prompt}`;
    }

    setProject({ 
        ...activeProjectState, 
        chatMessages: [...activeProjectState.chatMessages, { role: 'user', content: prompt }, { role: 'assistant', content: 'Pensando...', isThinking: true }] 
    });

    if (view !== 'editor') setView('editor');
    setIsInitializing(true);
    setAiSuggestions([]); 
    
    abortControllerRef.current = new AbortController();
    
    let accumulatedResponse = "";

    try {
      const newCredits = currentCredits - 1;
      setUserSettings(prev => prev ? { ...prev, credits: newCredits } : null);
      updateDoc(doc(db, "users", sessionUser.uid), { credits: increment(-1) }).catch((err: any) => console.error("Failed to update credits", err));

      const apiKey = modelId.includes('gemini') || provider === AIProvider.Gemini
        ? (userSettings?.gemini_api_key || DEFAULT_GEMINI_API_KEY)
        : userSettings?.openrouter_api_key; 

      const handleMetadata = (metadata: any) => {
          setProject(p => {
              const msgs = [...p.chatMessages];
              const lastMsg = msgs[msgs.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                  msgs[msgs.length - 1] = { ...lastMsg, groundingMetadata: metadata };
              }
              return { ...p, chatMessages: msgs };
          });
      };

      const fullResponse = await generateCodeStream(
          adjustedPrompt, 
          activeProjectState.files, 
          activeProjectState.envVars, 
          (chunk) => {
              accumulatedResponse += chunk;
              const messageMatch = accumulatedResponse.match(/"message":\s*"((?:[^"\\]|\\.)*)/);
              setProject(current => {
                  const msgs = [...current.chatMessages];
                  const lastIndex = msgs.length - 1;
                  const lastMsg = msgs[lastIndex];
                  if (lastMsg.role === 'assistant' && lastMsg.isThinking) {
                      let displayContent = lastMsg.content;
                      if (messageMatch) {
                          displayContent = messageMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                      } else if (accumulatedResponse.length > 50 && !accumulatedResponse.trim().startsWith('{')) {
                          displayContent = accumulatedResponse;
                      }
                      msgs[lastIndex] = { ...lastMsg, content: displayContent };
                      return { ...current, chatMessages: msgs };
                  }
                  return current;
              });
              if (aiSuggestions.length === 0) {
                  const suggestionsMatch = accumulatedResponse.match(/"suggestions":\s*\[([\s\S]*?)\]/);
                  if (suggestionsMatch && suggestionsMatch[1]) {
                      try {
                          const rawArray = `[${suggestionsMatch[1]}]`;
                          const parsed = JSON.parse(rawArray.split('"').length % 2 !== 0 ? rawArray.substring(0, rawArray.lastIndexOf('"') + 1) + ']' : rawArray);
                          if (Array.isArray(parsed) && parsed.length > 0) setAiSuggestions(parsed);
                      } catch (e) {}
                  }
              }
          }, 
          modelId, 
          attachments,
          apiKey,
          abortControllerRef.current.signal,
          handleMetadata
      );
      
      const result = extractAndParseJson(fullResponse);
      if (result.suggestions && Array.isArray(result.suggestions)) setAiSuggestions(result.suggestions);

      setProject(p => {
            const map = new Map<string, ProjectFile>();
            p.files.forEach(f => map.set(f.name, f));
            if (result.files && Array.isArray(result.files)) {
                result.files.forEach((file: ProjectFile) => map.set(file.name, file));
            }
            const newActiveFile = (result.files && result.files.length > 0) ? result.files[0].name : p.activeFile;
            const updatedFiles = Array.from(map.values());
            const modifiedFileNames = result.files ? result.files.map((f: ProjectFile) => f.name) : [];
            const filesDeepCopy = JSON.parse(JSON.stringify(updatedFiles));
            const newVersion: ProjectVersion = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                files: filesDeepCopy,
                message: prompt.substring(0, 30) + (prompt.length > 30 ? '...' : '')
            };
            const finalChatMessages = [...p.chatMessages];
            finalChatMessages[finalChatMessages.length - 1] = {
                role: 'assistant',
                content: result.message, 
                summary: result.summary,
                isThinking: false,
                groundingMetadata: p.chatMessages[p.chatMessages.length - 1].groundingMetadata,
                filesModified: modifiedFileNames
            };
            return { 
                ...p, 
                files: updatedFiles, 
                activeFile: newActiveFile, 
                chatMessages: finalChatMessages,
                history: [...(p.history || []), newVersion]
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
  }, [project, userSettings, sessionUser, view, aiSuggestions, setProject, setUserSettings]);

  // Handle manual drive save click
  const onSaveToDriveClick = () => {
      setIsGoogleDriveModalOpen(true);
      setGoogleDriveModalReason('limit'); // default or change logic based on size
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
                  onFolderImport={f => { 
                      setProject({
                          ...initialProjectState,
                          files: f,
                          activeFile: f.length > 0 ? f[0].name : null,
                          chatMessages: [{ role: 'assistant', content: "Pasta importada com sucesso! O que você gostaria de fazer com esses arquivos?" }]
                      }); 
                      setView('editor'); 
                  }}
                  onNewProject={() => { setProject(initialProjectState); setView('welcome'); }}
                  onLogout={() => signOut(auth)}
                  onOpenSettings={() => setView('settings')}
                  recentProjects={savedProjects}
                  onLoadProject={handleLoadProject}
                  credits={userSettings?.credits || 0}
                  userGeminiKey={userSettings?.gemini_api_key ? userSettings.gemini_api_key : undefined}
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
                    onOpenDriveAuth={handleConnectGoogleDrive}
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
                        : savedProjects
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
                  onNewProject={() => { setProject(initialProjectState); setView('welcome'); }} 
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
                          activeMode={chatMode} 
                          onModeChange={setChatMode}
                          onClearChat={handleClearChat}
                      />
                    </div>
                    
                    <div 
                        onMouseDown={startResizing}
                        className="w-1 h-full bg-transparent hover:bg-blue-500 cursor-col-resize z-20 transition-colors hidden lg:block border-l border-gray-200 dark:border-[#27272a]"
                        title="Redimensionar Painel"
                    />

                    <main className={`flex-1 min-w-0 h-full relative ${activeMobileTab === 'editor' ? 'block' : 'hidden lg:block'}`}>
                      <EditorView 
                        files={files} activeFile={activeFile} projectName={projectName} theme={theme} onThemeChange={setTheme}
                        onFileSelect={n => setProject(p => ({...p, activeFile: n}))} 
                        onFileDelete={handleFileDelete}
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
                        deployedUrl={currentSavedProject?.deployedUrl ? currentSavedProject.deployedUrl : undefined}
                        chatMode={chatMode}
                        projectHistory={history}
                        onRestoreVersion={handleRestoreVersion}
                        onFileUpload={handleFileUpload}
                        onRenameFile={handleRenameFile}
                        onMoveFile={handleMoveFile}
                        onSaveToDrive={onSaveToDriveClick}
                      />
                    </main>
                  </div>
                </div>
            )}
          </div>
      </div>
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} theme={theme} />
      
      <GoogleDriveSaveModal 
          isOpen={isGoogleDriveModalOpen} 
          onClose={() => setIsGoogleDriveModalOpen(false)}
          reason={googleDriveModalReason}
          currentCount={savedProjects.filter(p => p.ownerId === sessionUser?.uid && (!p.storage || p.storage === 'firebase')).length}
          currentSizeKB={currentProjectSize}
          onConfirmSave={handleSaveToGoogleDrive}
          isConnected={!!driveAccessToken}
          onConnect={handleConnectGoogleDrive}
      />

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
        connectedRepo={currentSavedProject?.githubRepo}
        onConnect={handleGithubConnect}
        onDisconnect={handleGithubDisconnect}
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
        existingSiteId={currentSavedProject?.netlifySiteId ? currentSavedProject.netlifySiteId : undefined}
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
