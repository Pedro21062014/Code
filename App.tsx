
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Routes, Route, useNavigate, useLocation, Navigate, useSearchParams } from 'react-router-dom';
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
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { SaveSuccessAnimation } from './components/SaveSuccessAnimation';
import { ProjectFile, ChatMessage, AIProvider, UserSettings, Theme, SavedProject, AIModel, ChatMode, ProjectVersion } from './types';
import { downloadProjectAsZip } from './services/projectService';
import { INITIAL_CHAT_MESSAGE, AI_MODELS, GOOGLE_BYOK_MODELS, DEFAULT_GEMINI_API_KEY, GOOGLE_CLIENT_ID } from './constants';
import { generateCodeStream } from './services/aiService';
import { startE2bPreview, killE2bSandbox } from './services/e2bService';
import { startWebContainerPreview } from './services/webcontainerService';
import { generateImagesWithImagen } from './services/geminiService';
import { uploadProjectToDrive } from './services/googleDriveService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
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

const sanitizeFirestoreData = (data: any) => {
  const sanitized = { ...data };
  for (const key in sanitized) {
    if (sanitized[key] && typeof sanitized[key] === 'object' && typeof sanitized[key].toDate === 'function') {
      sanitized[key] = sanitized[key].toDate().toISOString();
    }
  }
  return sanitized;
};

// Garante que todo arquivo de projeto tenha content/name/language como strings,
// evitando erro React #31 (objeto como filho) ao renderizar package.json etc.
// Limita o plano a no máximo 8 passos totais (tarefas + sub-tarefas),
// garantindo que a IA nunca entregue mais que 8 mesmo que desobedeça.
const limitPlanTasks = (tasks: any[]): any[] => {
  if (!Array.isArray(tasks)) return [];
  const result: any[] = [];
  let count = 0;
  for (const t of tasks) {
    if (count >= 8) break;
    const item = { ...t };
    // Aceita as sub-tarefas apenas se ainda houver espaço
    if (Array.isArray(item.children)) {
      const remaining = 8 - count - 1;
      item.children = item.children.slice(0, Math.max(0, remaining));
      count += 1 + item.children.length;
    } else {
      count += 1;
    }
    result.push(item);
  }
  return result.slice(0, 8);
};

const sanitizeProjectFiles = (rawFiles: any[]): ProjectFile[] => {
  if (!Array.isArray(rawFiles)) return [];
  return rawFiles
    .filter((f: any) => f && typeof f === 'object')
    .map((f: any) => ({
      name: typeof f.name === 'string' ? f.name : String(f.name || 'arquivo'),
      language: typeof f.language === 'string' ? f.language : 'plaintext',
      content: typeof f.content === 'string' ? f.content : JSON.stringify(f.content ?? '', null, 2),
    }));
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
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [project, setProject] = useLocalStorage<ProjectState>('codegen-studio-project', initialProjectState);
  const { files, activeFile, chatMessages, projectName, envVars, currentProjectId, history } = project;
  
  const [savedProjects, setSavedProjects] = useLocalStorage<SavedProject[]>('codegen-studio-saved-projects', []);
  const [galleryProjects, setGalleryProjects] = useState<SavedProject[]>([]);
  const [sessionUser, setSessionUser] = useState<any | null>(null);

  const [view, rawSetView] = useState<'landing' | 'auth' | 'welcome' | 'editor' | 'pricing' | 'projects' | 'shared' | 'recent' | 'public_preview' | 'privacy' | 'terms' | 'integrations' | 'gallery' | 'settings'>(() => {
     if (typeof window !== 'undefined' && window.location.search.includes('p=')) return 'public_preview';
     if (files.length > 0) return 'editor';
     const hasVisited = typeof localStorage !== 'undefined' ? localStorage.getItem('codegen-has-visited') : null;
     if (!hasVisited) return 'landing';
     return 'welcome';
  });

  // Sync view state with URL
  useEffect(() => {
    const path = location.pathname.substring(1);
    if (!path && view !== 'landing' && view !== 'welcome' && view !== 'editor' && view !== 'public_preview') {
        // Default home behavior handled by initial state and Routes
        return;
    }
    
    if (path && ['welcome', 'editor', 'pricing', 'projects', 'shared', 'recent', 'public_preview', 'privacy', 'terms', 'integrations', 'gallery', 'settings', 'auth', 'landing'].includes(path)) {
        rawSetView(path as any);
    }
  }, [location.pathname]);

  // Sync navigation when setView is called
  const setView = useCallback((newView: any) => {
      const handleNavigation = (v: string) => {
          if (v === 'editor') navigate('/editor');
          else if (v === 'welcome') navigate('/welcome');
          else if (v === 'pricing') navigate('/pricing');
          else if (v === 'projects') navigate('/projects');
          else if (v === 'shared') navigate('/shared');
          else if (v === 'recent') navigate('/recent');
          else if (v === 'settings') navigate('/settings');
          else if (v === 'gallery') navigate('/gallery');
          else if (v === 'integrations') navigate('/integrations');
          else if (v === 'auth') navigate('/auth');
          else if (v === 'landing') navigate('/landing');
          else if (v === 'privacy') navigate('/privacy');
          else if (v === 'terms') navigate('/terms');
          else navigate(`/${v}`);
      };

      if (typeof newView === 'function') {
          rawSetView((prev: any) => {
              const next = newView(prev);
              handleNavigation(next);
              return next;
          });
      } else {
          rawSetView(newView);
          handleNavigation(newView);
      }
  }, [navigate]);

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

  const [showProOnboarding, setShowProOnboarding] = useState(false);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'light');
  
  const [availableModels, setAvailableModels] = useState<AIModel[]>(() => [
    ...AI_MODELS,
    ...GOOGLE_BYOK_MODELS,
  ]);
  
  const [isInitializing, setIsInitializing] = useState(false); 
  const [e2bPreviewUrl, setE2bPreviewUrl] = useState<string | null>(null);
  const [e2bPort, setE2bPort] = useState<number>(3000);
  const [e2bSandboxId, setE2bSandboxId] = useState<string | null>(null);
  const [e2bStatus, setE2bStatus] = useState<'idle' | 'starting' | 'ready' | 'error'>('idle');
  const [previewEngine, setPreviewEngine] = useState<'e2b' | 'webcontainer'>('e2b');
  const [wcStatus, setWcStatus] = useState<'idle' | 'starting' | 'ready' | 'error'>('idle');
  const [generatingFile, setGeneratingFile] = useState<string | null>(null);
  const [runningCommand, setRunningCommand] = useState<string | null>(null);
  const [generatedFileNames, setGeneratedFileNames] = useState<Set<string>>(new Set());
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [codeError, setCodeError] = useState<string | null>(null);
  const isFirebaseAvailable = useRef(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [chatSidebarWidth, setChatSidebarWidth] = useState(420);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(true);
  const isResizingRef = useRef(false);

  const abortControllerRef = useRef<AbortController | null>(null);

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
          // Since the panel is on the RIGHT, moving left (negative X) INCREASES width
          const newWidth = prevWidth - e.movementX;
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

  // Auto-save Chat History to Firebase (Debounced)
  useEffect(() => {
    // Only auto-save if:
    // 1. User is logged in
    // 2. Project has an ID (it's saved in DB)
    // 3. We are not currently in a manual save process
    if (!sessionUser || !project.currentProjectId || isSaving) return;

    // Avoid saving if chat is empty or just has initial message
    if (project.chatMessages.length <= 1) return;

    const timeoutId = setTimeout(async () => {
      try {
        const projectIdStr = project.currentProjectId!.toString();
        const projectRef = doc(db, "projects", projectIdStr);

        // Update only the chat history
        await updateDoc(projectRef, {
          chat_history: project.chatMessages
        });

        // Sync local cache
        setSavedProjects(prev => prev.map(p => {
          if (p.id === project.currentProjectId) {
            return { ...p, chat_history: project.chatMessages };
          }
          return p;
        }));

      } catch (error) {
        console.error("Failed to auto-save chat:", error);
      }
    }, 3000); // 3 seconds debounce to wait for typing/streaming to pause

    return () => clearTimeout(timeoutId);
  }, [project.chatMessages, project.currentProjectId, sessionUser, isSaving, setSavedProjects]);

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
            const safeFiles = sanitizeProjectFiles(data.files);
            setProject({
              files: safeFiles,
              projectName: data.name,
              chatMessages: data.chat_history || [],
              envVars: data.env_vars || {},
              currentProjectId: data.id,
              activeFile: safeFiles[0]?.name || null,
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

  // Handle Google Drive Connection Trigger (Using Firebase Auth Scope)
  const handleConnectGoogleDrive = useCallback(async () => {
      // Clear existing token to force clean slate perception
      setDriveAccessToken(null);
      
      const provider = new GoogleAuthProvider();
      // Add the specific Drive scope needed to read/write files created by this app
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      
      // Force consent prompt AND account selection to ensure the user sees the Drive permission request
      // and a fresh token is issued with the correct scopes. 
      // Removing login_hint prevents "quick login" behavior that might skip scope updates.
      provider.setCustomParameters({
          prompt: 'select_account consent',
          access_type: 'offline',
          include_granted_scopes: 'true'
      });

      try {
          // This will trigger the popup asking for permissions
          const result = await signInWithPopup(auth, provider);
          
          // Get the credential which contains the access token
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const accessToken = credential?.accessToken;

          if (accessToken) {
              setDriveAccessToken(accessToken);
              setToastSuccess("Google Drive conectado com sucesso!");
          } else {
              setToastError("Não foi possível obter o token de acesso do Google Drive.");
          }
      } catch (error: any) {
          console.error("Erro ao conectar Google Drive:", error);
          if (error.code === 'auth/popup-closed-by-user') {
              setToastError("Conexão cancelada.");
          } else {
              setToastError("Erro ao conectar: " + error.message);
          }
      }
  }, []);

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
          // IMPORTANT: Try to update existing first, BUT if we lack permissions to that file ID
          // (e.g., created by another app instance or user), we should gracefully fallback to creating a NEW file.
          let uploadResult: { id: string; webViewLink: string };
          
          try {
              uploadResult = await uploadProjectToDrive(
                  driveAccessToken, 
                  projectData, 
                  existingProject?.googleDriveFileId
              );
          } catch (firstAttemptError: any) {
              // Handle Authentication/Permission Errors specifically
              if (firstAttemptError.message && (
                  firstAttemptError.message.includes("401") || 
                  firstAttemptError.message.includes("403") || 
                  firstAttemptError.message.includes("permissions")
              )) {
                  // Re-throw to be caught by outer block for re-auth flow
                  throw firstAttemptError; 
              }

              // If we get a 404 (Not Found), implies lost access to specific file ID
              // We should try again as a NEW file.
              if (existingProject?.googleDriveFileId && firstAttemptError.message.includes('404')) {
                  console.warn("Lost access to existing Drive file. Creating a new one...");
                  uploadResult = await uploadProjectToDrive(
                      driveAccessToken, 
                      projectData, 
                      undefined // Force new file
                  );
              } else {
                  throw firstAttemptError; // Re-throw other errors
              }
          }

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
          
          // Handle Token Expiry or Unauthorized (401)
          if (e.message && (e.message.includes("401") || e.message.includes("token") || e.message.includes("Unauthorized"))) {
              setDriveAccessToken(null); // Force re-auth
              throw new Error("Sessão expirada. Por favor, conecte novamente.");
          }
          
          // Handle Permission/Scope Issues (403 or specific messages)
          if (e.message && (e.message.includes("permissions") || e.message.includes("403") || e.message.includes("Insufficient"))) {
              setDriveAccessToken(null); // Force re-auth to get scopes back
              throw new Error("Permissão negada. Por favor, conecte novamente e certifique-se de MARCAR a caixa de permissão do Google Drive na janela de login.");
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
          // Reseta estados de preview para abrir limpo o editor
          setE2bPreviewUrl(null);
          setE2bStatus('idle');
          setWcStatus('idle');
          setPreviewEngine('e2b');
          const safeFiles = sanitizeProjectFiles(p.files);
          setProject({
              files: safeFiles,
              activeFile: safeFiles.length > 0 ? safeFiles[0].name : null,
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
        setView((current: string) => (current === 'landing' || current === 'auth') ? 'editor' : current);
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

  // Executa o projeto num sandbox E2B e retorna a URL de preview ao vivo
  // Inicia o preview com retry (3x) no E2B e fallback para WebContainer
  const handleRunPreviewInE2B = useCallback(async (previewFiles: ProjectFile[], terminalCommands: string[] = []) => {
    if (!previewFiles || previewFiles.length === 0) return;
    // Mata o sandbox anterior para não vazar instâncias
    if (e2bSandboxId) { killE2bSandbox(e2bSandboxId).catch(() => {}); }
    setE2bStatus('starting');
    setE2bPreviewUrl(null);
    setPreviewEngine('e2b');

    const MAX_ATTEMPTS = 3;
    let lastError: any = null;

    // Tenta o E2B até 3 vezes
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const result = await startE2bPreview(previewFiles, terminalCommands, e2bPort);
        setE2bPreviewUrl(result.previewUrl);
        setE2bSandboxId(result.sandboxId);
        setE2bStatus('ready');
        return;
      } catch (error: any) {
        lastError = error;
        console.error(`Tentativa ${attempt}/${MAX_ATTEMPTS} do E2B falhou:`, error);
        // Pequena pausa entre tentativas
        await new Promise(r => setTimeout(r, attempt * 800));
      }
    }

    // E2B falhou após 3 tentativas → fallback para WebContainer
    console.warn('E2B falhou após 3 tentativas. Usando WebContainer como fallback.', lastError);
    setE2bStatus('error');
    setPreviewEngine('webcontainer');
    setWcStatus('starting');
    const e2bMsg = lastError?.message || 'Erro desconhecido';
    setToastError(`E2B indisponível (${e2bMsg}). Tentando WebContainer...`);

    try {
      const wcResult = await startWebContainerPreview(previewFiles, terminalCommands);
      if (wcResult.running) {
        setWcStatus('ready');
        // O WebContainer não expõe URL pública como o E2B; usamos o Sandpack
        // como preview visual (o CodePreview já decide). Marcamos para o
        // preview saber que o WebContainer está ativo.
        setE2bStatus('ready');
      }
    } catch (wcError: any) {
      console.error('WebContainer fallback também falhou:', wcError);
      setWcStatus('error');
      setE2bStatus('error');
      const wcMsg = wcError?.message || 'Erro desconhecido';
      setToastError(`Preview indisponível. E2B: ${e2bMsg} | WebContainer: ${wcMsg}`);
    }
  }, [e2bSandboxId, e2bPort]);

  // Reinicia o sandbox E2B: apaga o atual e cria um novo com os arquivos do projeto
  const handleRestartSandbox = useCallback(() => {
    if (files.length === 0) return;
    if (e2bSandboxId) { killE2bSandbox(e2bSandboxId).catch(() => {}); }
    handleRunPreviewInE2B(files);
  }, [files, e2bSandboxId, handleRunPreviewInE2B]);

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
        adjustedPrompt = `[PLANNING MODE] ${planContext}\n\nAct as a Senior Technical Project Manager. Create a step-by-step implementation plan.\n\nCRITICAL LIMIT: The plan MUST have AT MOST 8 steps TOTAL (counting every task AND every sub-task in "children"). Do not exceed 8. Keep it concise and high-level; merge related steps when needed.\n\nReturn a valid JSON object with:\n- "message": a short friendly summary of the plan (plain text, can use markdown lightly).\n- "tasks": an array of task objects, each with { "id": string, "label": string, "status": "pending", "note"?: string, "children"?: [ same shape ] }. Break the plan into clear steps; use children for sub-steps. All tasks start with status "pending". Total of tasks + children MUST be <= 8.\n\nExample tasks format (3 steps total):\n{ "message": "Aqui está o plano.", "tasks": [ { "id": "1", "label": "Configurar estrutura", "status": "pending" }, { "id": "2", "label": "Implementar lógica", "status": "pending" }, { "id": "3", "label": "Testar e publicar", "status": "pending" } ] }\n\nReturn ONLY valid JSON. Do not add markdown code blocks.`;
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
        : userSettings?.nvidia_api_key; 

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
              // Detecta o arquivo que a IA está criando/escrevendo (aparece no JSON do stream)
              const fileMatches = [...accumulatedResponse.matchAll(/"name":\s*"([^"]+)"/g)];
              if (fileMatches.length > 0) {
                  const lastFile = fileMatches[fileMatches.length - 1][1];
                  if (lastFile && !lastFile.includes('message') && !lastFile.includes('summary')) {
                      setGeneratingFile(lastFile);
                  }
              }
              // Detecta comandos de terminal que a IA manda rodar
              const cmdMatches = [...accumulatedResponse.matchAll(/"terminalCommands":\s*\[(.*?)\]/gs)];
              if (cmdMatches.length > 0) {
                  const raw = cmdMatches[cmdMatches.length - 1][1];
                  const cmdNames = [...raw.matchAll(/"([^"]+)"/g)].map(m => m[1]).filter((c: string) => c.length > 0);
                  if (cmdNames.length > 0) setRunningCommand(cmdNames[cmdNames.length - 1]);
              }
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

      // Mescla os arquivos gerados com os existentes (fora do setProject, para usar no E2B)
      const baseFiles = project.files || [];
      const map = new Map<string, ProjectFile>();
      baseFiles.forEach(f => map.set(f.name, f));
      if (result.files && Array.isArray(result.files)) {
          result.files.forEach((file: ProjectFile) => map.set(file.name, file));
      }
      const updatedFiles = Array.from(map.values());
      // Guarda nome + conteúdo dos arquivos gerados para exibir o que a IA escreveu
      const modifiedFileNames = result.files && Array.isArray(result.files)
        ? result.files.map((f: ProjectFile) => ({ name: f.name, content: f.content || '' }))
        : [];
      const filesDeepCopy = JSON.parse(JSON.stringify(updatedFiles));
      const newVersion: ProjectVersion = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          files: filesDeepCopy,
          message: prompt.substring(0, 30) + (prompt.length > 30 ? '...' : '')
      };

      setProject(p => {
            const newActiveFile = (result.files && result.files.length > 0) ? result.files[0].name : p.activeFile;
            const finalChatMessages = [...p.chatMessages];
            finalChatMessages[finalChatMessages.length - 1] = {
                role: 'assistant',
                content: result.message, 
                summary: result.summary,
                isThinking: false,
                groundingMetadata: p.chatMessages[p.chatMessages.length - 1].groundingMetadata,
                filesModified: modifiedFileNames,
                terminalCommands: result.terminalCommands,
                planTasks: result.tasks && Array.isArray(result.tasks) ? limitPlanTasks(result.tasks) : undefined
            };
            return { 
                ...p, 
                files: updatedFiles, 
                activeFile: newActiveFile, 
                chatMessages: finalChatMessages,
                history: [...(p.history || []), newVersion]
            };
        });

      // Sobe o preview num sandbox E2B automaticamente
      if (updatedFiles.length > 0) {
          handleRunPreviewInE2B(updatedFiles, result.terminalCommands || []);
      }
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
        setGeneratingFile(null);
        setRunningCommand(null);
        abortControllerRef.current = null;
    }
  }, [project, userSettings, sessionUser, view, aiSuggestions, setProject, setUserSettings, handleRunPreviewInE2B]);

  // Anexa um screenshot do preview a uma nova mensagem no chat
  const handleAttachPreviewToChat = useCallback((screenshot: string, note: string) => {
    if (!screenshot) return;
    const noteText = note && note.trim() ? note.trim() : 'Analise esta captura do preview e sugira melhorias.';
    // Adiciona a captura como anexo e envia
    handleSendMessage(
      noteText,
      AIProvider.Nvidia,
      availableModels.find(m => m.provider === AIProvider.Nvidia)?.id || 'minimaxai/minimax-m3',
      [{ data: screenshot, mimeType: 'image/png' }],
      'general'
    );
  }, [handleSendMessage, availableModels]);

  // Anexa um arquivo do computador à mensagem
  const handleAttachFileToChat = useCallback((data: string, mimeType: string, note?: string) => {
    if (!data) return;
    const isImage = mimeType.startsWith('image/');
    const noteText = note && note.trim() ? note.trim() : (isImage ? 'Analise esta imagem e sugira melhorias.' : 'Aqui está o arquivo que anexei. Por favor, analise.');
    handleSendMessage(
      noteText,
      AIProvider.Nvidia,
      availableModels.find(m => m.provider === AIProvider.Nvidia)?.id || 'minimaxai/minimax-m3',
      [{ data, mimeType }],
      'general'
    );
  }, [handleSendMessage, availableModels]);

  // Handle manual drive save click
  const onSaveToDriveClick = () => {
      setIsGoogleDriveModalOpen(true);
      setGoogleDriveModalReason('limit'); // default or change logic based on size
  };

  const isDashboardView = ['/welcome', '/projects', '/shared', '/recent', '/pricing', '/integrations', '/gallery', '/settings'].includes(location.pathname);

  const DashboardWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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

      <div className="flex-1 h-full overflow-hidden flex flex-col relative w-full">
          {children}
      </div>
    </div>
  );

  return (
    <AppErrorBoundary>
    <Routes>
      <Route path="/" element={<Navigate to={files.length > 0 ? "/editor" : "/welcome"} replace />} />
      
      <Route path="/landing" element={
        <div className="w-full h-full">
            <LandingPage 
                onGetStarted={() => { localStorage.setItem('codegen-has-visited', 'true'); setView('auth'); }}
                onLogin={() => { localStorage.setItem('codegen-has-visited', 'true'); setView('auth'); }}
                onShowPricing={() => { setPreviousView('landing'); setView('pricing'); }}
                onShowPrivacy={() => { setPreviousView('landing'); setView('privacy'); }}
                onShowTerms={() => { setPreviousView('landing'); setView('terms'); }}
                theme={theme}
                onThemeChange={setTheme}
            />
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} theme={theme} />
        </div>
      } />

      <Route path="/auth" element={
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#09090b]">
            <AuthPage 
                onBack={() => setView('landing')} 
                theme={theme}
                onThemeChange={setTheme}
            />
        </div>
      } />

      <Route path="/privacy" element={<div className="w-full h-full"><PrivacyPage onBack={() => setView(previousView || 'landing')} /></div>} />
      <Route path="/terms" element={<div className="w-full h-full"><TermsPage onBack={() => setView(previousView || 'landing')} /></div>} />

      <Route path="/public_preview" element={
        isLoadingPublic ? (
            <div className="h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
                <LoaderIcon className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-gray-400 font-mono text-sm animate-pulse tracking-widest">CARREGANDO APLICAÇÃO...</p>
            </div>
        ) : (
            <div className="h-screen w-full bg-white relative">
                <CodePreview files={files} theme="light" envVars={envVars} onError={() => {}} previewMode="publish" />
                <div className="fixed bottom-4 right-4 z-50">
                    <button onClick={() => window.location.href = window.location.origin} className="flex items-center gap-2 px-4 py-2 bg-black/80 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/10 hover:bg-black transition-all shadow-2xl">
                        Criado com Codegen Studio
                    </button>
                </div>
            </div>
        )
      } />

      <Route path="/welcome" element={
        <DashboardWrapper>
            <WelcomeScreen 
              session={sessionUser ? { user: sessionUser } : null}
              onLoginClick={() => setView('auth')}
              onPromptSubmit={(p, m, prov, a) => handleSendMessage(p, prov, m, a)}
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
        </DashboardWrapper>
      } />

      <Route path="/pricing" element={
        <DashboardWrapper>
            <PricingPage onBack={() => setView(previousView || 'welcome')} onNewProject={() => {}} />
        </DashboardWrapper>
      } />

      <Route path="/settings" element={
        <DashboardWrapper>
            <SettingsPage 
                settings={userSettings} 
                sessionUser={sessionUser} 
                onUpdateSettings={handleUpdateSettings} 
                onLogout={() => signOut(auth)} 
            />
        </DashboardWrapper>
      } />

      <Route path="/integrations" element={
        <DashboardWrapper>
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
        </DashboardWrapper>
      } />

      <Route path="/projects" element={
        <DashboardWrapper>
            <ProjectsPage 
              projects={savedProjects.filter(p => p.ownerId === sessionUser?.uid)}
              title='Meus Projetos'
              currentUserId={sessionUser?.uid}
              onLikeProject={handleToggleLike}
              onLoadProject={handleLoadProject} 
              onDeleteProject={handleDeleteProject} 
              onBack={() => setView('welcome')} 
              onNewProject={() => { setProject(initialProjectState); setView('welcome'); }} 
            />
        </DashboardWrapper>
      } />

      <Route path="/shared" element={
        <DashboardWrapper>
            <ProjectsPage 
              projects={savedProjects.filter(p => p.ownerId !== sessionUser?.uid)}
              title='Projetos Compartilhados'
              currentUserId={sessionUser?.uid}
              onLikeProject={handleToggleLike}
              onLoadProject={handleLoadProject} 
              onDeleteProject={handleDeleteProject} 
              onBack={() => setView('welcome')} 
              onNewProject={() => { setProject(initialProjectState); setView('welcome'); }} 
            />
        </DashboardWrapper>
      } />

      <Route path="/recent" element={
        <DashboardWrapper>
            <ProjectsPage 
              projects={savedProjects}
              title='Projetos Recentes'
              currentUserId={sessionUser?.uid}
              onLikeProject={handleToggleLike}
              onLoadProject={handleLoadProject} 
              onDeleteProject={handleDeleteProject} 
              onBack={() => setView('welcome')} 
              onNewProject={() => { setProject(initialProjectState); setView('welcome'); }} 
            />
        </DashboardWrapper>
      } />

      <Route path="/gallery" element={
        <DashboardWrapper>
            <ProjectsPage 
              projects={galleryProjects}
              title='Galeria da Comunidade'
              currentUserId={sessionUser?.uid}
              onLikeProject={handleToggleLike}
              onLoadProject={handleLoadProject} 
              onDeleteProject={handleDeleteProject} 
              onBack={() => setView('welcome')} 
              onNewProject={() => { setProject(initialProjectState); setView('welcome'); }} 
            />
        </DashboardWrapper>
      } />

      <Route path="/editor" element={
        <div className={`${theme} flex h-screen bg-[#09090b]`}>
            <SaveSuccessAnimation isVisible={showSaveSuccess} />
            {showProOnboarding && <ProWelcomeOnboarding onComplete={handleCompleteProOnboarding} />}
            <Toast message={toastError} onClose={() => setToastError(null)} type="error" />
            <Toast message={toastSuccess} onClose={() => setToastSuccess(null)} type="success" />

            <div className="flex-1 h-full overflow-hidden flex flex-col relative w-full">
                <div className="flex flex-col h-full bg-var-bg-default overflow-hidden w-full">
                    <div className="flex-1 flex flex-row overflow-hidden relative">
                      {/* Integrated Activity Bar (Slim Left Rail) */}
                      <div className="hidden lg:flex flex-shrink-0">
                          <NavigationSidebar 
                              activeView="editor" 
                              onNavigate={v => setView(v as any)} 
                              session={sessionUser ? { user: sessionUser } : null}
                              onLogin={() => setAuthModalOpen(true)}
                              onLogout={() => signOut(auth)}
                              onOpenSettings={() => setView('settings')}
                              credits={userSettings?.credits || 0}
                              currentPlan={userSettings?.plan || 'Free'}
                              onRedeemCredits={handleRedeemCredits}
                              lastRedemptionDate={userSettings?.last_credit_redemption}
                          />
                      </div>

                      {/* Main Center: Editor & Explorer */}
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
                          runningCommand={runningCommand}
                          generatedFileNames={generatedFileNames}
                          aiSuggestions={aiSuggestions}
                          deployedUrl={e2bPreviewUrl || (currentSavedProject?.deployedUrl ? currentSavedProject.deployedUrl : undefined)}
                          isPublished={!!currentSavedProject?.deployedUrl}
                          chatMode={chatMode}
                          projectHistory={history}
                          onRestoreVersion={handleRestoreVersion}
                          onFileUpload={handleFileUpload}
                          onRenameFile={handleRenameFile}
                          onMoveFile={handleMoveFile}
                          onSaveToDrive={onSaveToDriveClick}
                          onToggleChat={() => setIsChatPanelOpen(!isChatPanelOpen)}
                          isChatOpen={isChatPanelOpen}
                          terminalCommands={project.chatMessages[project.chatMessages.length - 1]?.terminalCommands}
                          e2bStatus={e2bStatus}
                          e2bPreviewUrl={e2bPreviewUrl}
                          onAttachPreview={handleAttachPreviewToChat}
                          onAttachFile={handleAttachFileToChat}
                          onRestartSandbox={handleRestartSandbox}
                          e2bPort={e2bPort}
                          onE2bPortChange={setE2bPort}
                        />
                      </main>

                      {/* Resizer Logic - Corrected for Right Panel */}
                      <div 
                          onMouseDown={startResizing}
                          className={`w-1 h-full bg-transparent hover:bg-blue-500 cursor-col-resize z-20 transition-colors hidden lg:block border-l border-gray-200 dark:border-[#27272a] ${!isChatPanelOpen && 'pointer-events-none opacity-0'}`}
                          title="Redimensionar Chat"
                      />

                      {/* Right Panel: Chat (Bolt style) */}
                      <div 
                          className={`flex-shrink-0 bg-[#fbfbfb] dark:bg-[#0c0c0e] border-l border-gray-200 dark:border-[#27272a] transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] z-10 ${!isChatPanelOpen && 'lg:w-0 lg:overflow-hidden lg:opacity-0'}`}
                          style={{ width: activeMobileTab === 'chat' ? '100%' : (isChatPanelOpen ? `${chatSidebarWidth}px` : '0px') }}
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
                    </div>
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
      } />
    </Routes>

    {/* Modal de importação GitHub disponível em TODAS as rotas */}
    <GithubImportModal 
      isOpen={isGithubModalOpen} 
      onClose={() => setGithubModalOpen(false)} 
      onImport={(f, name) => { 
          setProject({
              ...initialProjectState,
              files: f,
              projectName: name || 'GitHub Project',
              activeFile: f.length > 0 ? f[0].name : null,
              chatMessages: [{ role: 'assistant', content: `Repositório **${name}** importado com sucesso! Iniciando sandbox para visualização...` }]
          }); 
          setView('editor'); 
          // Cria um sandbox E2B automaticamente com os arquivos importados
          if (f && f.length > 0) {
              setTimeout(() => handleRunPreviewInE2B(f), 500);
          }
      }} 
      githubToken={userSettings?.github_access_token} 
      onOpenSettings={() => setView('settings')} 
      onSaveToken={(token) => handleUpdateSettings({ github_access_token: token })}
    />
    </AppErrorBoundary>
  );
};
