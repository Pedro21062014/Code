
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EditorView } from './components/EditorView';
import { ChatPanel } from './components/ChatPanel';
import { SettingsModal } from './components/SettingsModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { PricingPage } from './components/PricingPage';
import { ProjectsPage } from './components/ProjectsPage';
import { GithubImportModal } from './components/GithubImportModal';
import { GithubSyncModal } from './components/GithubSyncModal';
import { ShareModal } from './components/ShareModal';
import { PublishModal } from './components/PublishModal';
import { AuthModal } from './components/AuthModal';
import { ImageStudioModal } from './components/ImageStudioModal';
import { SupabaseAdminModal } from './components/SupabaseAdminModal';
import { ProWelcomeOnboarding } from './components/ProWelcomeOnboarding';
import { CodePreview } from './components/CodePreview';
import { LandingPage } from './components/LandingPage';
import { PrivacyPage } from './components/PrivacyPage';
import { TermsPage } from './components/TermsPage';
import { Toast } from './components/Toast';
import { ProjectFile, ChatMessage, AIProvider, UserSettings, Theme, SavedProject, AIModel } from './types';
import { downloadProjectAsZip } from './services/projectService';
import { INITIAL_CHAT_MESSAGE, AI_MODELS, DAILY_CREDIT_LIMIT } from './constants';
import { generateCodeStream, fetchAvailableModels } from './services/aiService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, serverTimestamp, arrayUnion, deleteDoc } from "firebase/firestore";
import { ChatIcon, TerminalIcon, LoaderIcon } from './components/Icons';

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
  try {
    return JSON.parse(text);
  } catch (e) {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
       return { message: text, files: [] };
    }
    const jsonString = text.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonString);
    } catch (innerError) {
      console.error("JSON Parse Error:", innerError);
      throw new Error("A resposta da IA não é um JSON válido.");
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
  const [sessionUser, setSessionUser] = useState<any | null>(null);

  const [view, setView] = useState<'landing' | 'welcome' | 'editor' | 'pricing' | 'projects' | 'public_preview' | 'privacy' | 'terms'>(() => {
     if (typeof window !== 'undefined' && window.location.search.includes('p=')) return 'public_preview';
     if (files.length > 0) return 'editor';
     const hasVisited = typeof localStorage !== 'undefined' ? localStorage.getItem('codegen-has-visited') : null;
     if (!hasVisited) return 'landing';
     return 'welcome';
  });

  const [previousView, setPreviousView] = useState<'landing' | 'welcome'>('landing');
  const [activeMobileTab, setActiveMobileTab] = useState<'chat' | 'editor'>('editor');

  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isApiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [isGithubModalOpen, setGithubModalOpen] = useState(false);
  const [isGithubSyncModalOpen, setGithubSyncModalOpen] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [isPublishModalOpen, setPublishModalOpen] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isImageStudioOpen, setImageStudioOpen] = useState(false);
  const [isSupabaseAdminModalOpen, setSupabaseAdminModalOpen] = useState(false);
  const [showProOnboarding, setShowProOnboarding] = useState(false);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);
  
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');
  
  const [availableModels, setAvailableModels] = useState<AIModel[]>(AI_MODELS);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const [isInitializing, setIsInitializing] = useState(false); 
  const [generatingFile, setGeneratingFile] = useState<string | null>(null);
  const [generatedFileNames, setGeneratedFileNames] = useState<Set<string>>(new Set());
  const [codeError, setCodeError] = useState<string | null>(null);
  const isFirebaseAvailable = useRef(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch models whenever user key changes or on load
  useEffect(() => {
    const loadModels = async () => {
        setIsLoadingModels(true);
        try {
            const models = await fetchAvailableModels(userSettings?.openrouter_api_key);
            if (models.length > 0) {
                setAvailableModels(models);
            }
        } catch (e) {
            console.error("Failed to load models", e);
        } finally {
            setIsLoadingModels(false);
        }
    };
    loadModels();
  }, [userSettings?.openrouter_api_key]);

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
        return mergedSettings;
      } else {
        const initialData = { email: currentUserEmail, credits: DAILY_CREDIT_LIMIT, plan: 'Hobby' as const, last_credits_reset: new Date().toISOString().split('T')[0], hasSeenProWelcome: false };
        await setDoc(docRef, initialData);
        return { id: userUid, ...initialData } as UserSettings;
      }
    } catch (error: any) { return null; }
  }, []);

  const handleUpdateSettings = async (newSettings: Partial<Omit<UserSettings, 'id' | 'updated_at'>>) => {
    if (!sessionUser) return;
    try {
      const docRef = doc(db, "users", sessionUser.uid);
      await updateDoc(docRef, { ...newSettings, updated_at: serverTimestamp() });
      setUserSettings(prev => prev ? { ...prev, ...newSettings } : null);
    } catch (error) { console.error("Erro ao atualizar configurações:", error); }
  };

  const handleCompleteProOnboarding = async () => {
    setShowProOnboarding(false);
    if (sessionUser) {
      const docRef = doc(db, "users", sessionUser.uid);
      setUserSettings(prev => prev ? { ...prev, hasSeenProWelcome: true } : null);
      await updateDoc(docRef, { hasSeenProWelcome: true }).catch(console.error);
    }
  };

  const handleSaveProject = useCallback(async () => {
    if (!sessionUser) { setAuthModalOpen(true); return; }
    if (files.length === 0) return;
    setIsSaving(true);
    const projectId = currentProjectId || Date.now();
    const projectData: SavedProject = {
      id: projectId,
      ownerId: sessionUser.uid,
      shared_with: project.currentProjectId ? (savedProjects.find(p => p.id === project.currentProjectId)?.shared_with || []) : [],
      name: projectName,
      files: files,
      chat_history: chatMessages,
      env_vars: envVars,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      setSavedProjects(prev => [projectData, ...prev.filter(p => p.id !== projectId)]);
      await setDoc(doc(db, "projects", projectId.toString()), { ...projectData, updated_at: serverTimestamp() }, { merge: true });
      setProject(prev => ({ ...prev, currentProjectId: projectId }));
    } catch (error: any) { alert("Erro ao salvar projeto."); } finally { setIsSaving(false); }
  }, [sessionUser, files, projectName, chatMessages, envVars, currentProjectId, savedProjects]);

  const handleShareProject = useCallback(async (targetUid: string, email: string) => {
    if (!currentProjectId) await handleSaveProject();
    if (currentProjectId) {
      try {
        await updateDoc(doc(db, "projects", currentProjectId.toString()), { shared_with: arrayUnion(targetUid) });
      } catch (error: any) { throw new Error(error.message); }
    }
  }, [currentProjectId, handleSaveProject]);

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
        setView(current => current === 'landing' ? 'welcome' : current);
      } else {
        setSessionUser(null);
        setUserSettings(null);
      }
    });
    return () => unsubscribe();
  }, [fetchUserSettings, fetchUserProjects]);

  const handleSendMessage = useCallback(async (prompt: string, provider: AIProvider, modelId: string, attachments: any[] = []) => {
    if (!sessionUser) { setAuthModalOpen(true); return; }
    
    let activeProjectState = project;
    if (view === 'welcome') {
        activeProjectState = { ...initialProjectState };
    }

    setProject({ 
        ...activeProjectState, 
        chatMessages: [...activeProjectState.chatMessages, { role: 'user', content: prompt }, { role: 'assistant', content: 'Processando...', isThinking: true }] 
    });

    if (view !== 'editor') setView('editor');
    setIsInitializing(true);
    
    try {
      const fullResponse = await generateCodeStream(
          prompt, 
          activeProjectState.files, 
          activeProjectState.envVars, 
          (c) => {}, 
          modelId, 
          attachments,
          userSettings?.openrouter_api_key // Passa a chave do usuário se existir
      );
      
      let payload = fullResponse.trim();
      if (payload.startsWith('```json')) payload = payload.replace(/^```json/, '').replace(/```$/, '');
      else if (payload.startsWith('```')) payload = payload.replace(/^```/, '').replace(/```$/, '');

      const result = extractAndParseJson(payload);
      
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
        console.error(e);
        // Exibe o Toast com o erro
        setToastError(e.message || "Erro desconhecido na geração.");
        setProject(p => ({
            ...p,
            chatMessages: [...p.chatMessages.slice(0, -1), { role: 'assistant', content: `Erro: ${e.message}`, isThinking: false }]
        }));
    } finally { 
        setIsInitializing(false); 
    }
  }, [project, userSettings, sessionUser, view]);

  const handleLoadProject = useCallback((projectId: number) => {
    const p = savedProjects.find(x => x.id === projectId);
    if (p) {
        setProject({ files: p.files, projectName: p.name, chatMessages: p.chat_history || [], envVars: p.env_vars || {}, currentProjectId: p.id, activeFile: p.files[0]?.name || null });
        setView('editor');
    }
  }, [savedProjects]);

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

  if (view === 'landing' && !sessionUser) {
    return (
        <>
            <LandingPage 
                onGetStarted={() => { localStorage.setItem('codegen-has-visited', 'true'); setView('welcome'); }}
                onLogin={() => { localStorage.setItem('codegen-has-visited', 'true'); setAuthModalOpen(true); }}
                onShowPricing={() => { setPreviousView('landing'); setView('pricing'); }}
                onShowPrivacy={() => { setPreviousView('landing'); setView('privacy'); }}
                onShowTerms={() => { setPreviousView('landing'); setView('terms'); }}
            />
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
        </>
    );
  }

  if (view === 'privacy') return <PrivacyPage onBack={() => setView(previousView)} />;
  if (view === 'terms') return <TermsPage onBack={() => setView(previousView)} />;

  return (
    <div className={theme}>
      {showProOnboarding && <ProWelcomeOnboarding onComplete={handleCompleteProOnboarding} />}
      
      {/* Toast para Erros Globais */}
      <Toast message={toastError} onClose={() => setToastError(null)} type="error" />

      {view === 'welcome' || (view === 'landing' && sessionUser) ? (
          <WelcomeScreen 
            session={sessionUser ? { user: sessionUser } : null}
            onLoginClick={() => setAuthModalOpen(true)}
            onPromptSubmit={(p, m, a) => handleSendMessage(p, AIProvider.Gemini, m, a)}
            onShowPricing={() => { setPreviousView('welcome'); setView('pricing'); }}
            onShowProjects={() => setView('projects')}
            onOpenGithubImport={() => setGithubModalOpen(true)}
            onFolderImport={f => { setProject(p => ({ ...p, files: f })); setView('editor'); }}
            onNewProject={() => { setProject(initialProjectState); setView('welcome'); }}
            onLogout={() => signOut(auth)}
            onOpenSettings={() => setSettingsOpen(true)}
            recentProjects={savedProjects}
            onLoadProject={handleLoadProject}
            credits={userSettings?.credits || 0}
            userGeminiKey={userSettings?.gemini_api_key}
            currentPlan={userSettings?.plan || 'Hobby'}
            availableModels={availableModels} // Passando modelos dinâmicos
          />
      ) : view === 'pricing' ? (
          <PricingPage onBack={() => setView(previousView)} onNewProject={() => {}} />
      ) : view === 'projects' ? (
          <ProjectsPage projects={savedProjects} onLoadProject={handleLoadProject} onDeleteProject={handleDeleteProject} onBack={() => setView('welcome')} onNewProject={() => {}} />
      ) : (
          <div className="flex flex-col h-screen bg-var-bg-default overflow-hidden">
            <div className="flex flex-1 overflow-hidden relative">
              <div className={`w-full lg:w-[420px] flex-shrink-0 border-r border-[#27272a] h-full z-10 bg-[#121214] transition-all ${activeMobileTab === 'chat' ? 'flex' : 'hidden lg:flex'}`}>
                <ChatPanel 
                    messages={chatMessages} 
                    onSendMessage={handleSendMessage} 
                    isProUser={userSettings?.plan === 'Pro'} 
                    projectName={projectName} 
                    credits={userSettings?.credits || 0} 
                    generatingFile={generatingFile} 
                    isGenerating={isInitializing}
                    availableModels={availableModels} // Passando modelos dinâmicos
                />
              </div>
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
                  onOpenImageStudio={() => setImageStudioOpen(true)}
                  onLogout={() => signOut(auth)}
                  onOpenSettings={() => setSettingsOpen(true)}
                  session={sessionUser}
                  isGenerating={isInitializing}
                  generatingFile={generatingFile}
                  generatedFileNames={generatedFileNames}
                />
              </main>
            </div>
          </div>
      )}
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} settings={userSettings || { id: '' }} onSave={handleUpdateSettings} />
      <GithubImportModal isOpen={isGithubModalOpen} onClose={() => setGithubModalOpen(false)} onImport={(f) => { setProject(p => ({ ...p, files: f })); setView('editor'); }} githubToken={userSettings?.github_access_token} onOpenSettings={() => setSettingsOpen(true)} />
      <GithubSyncModal isOpen={isGithubSyncModalOpen} onClose={() => setGithubSyncModalOpen(false)} files={files} projectName={projectName} githubToken={userSettings?.github_access_token} onOpenSettings={() => setSettingsOpen(true)} />
      <ShareModal isOpen={isShareModalOpen} onClose={() => setShareModalOpen(false)} onShare={handleShareProject} projectName={projectName} />
      <PublishModal isOpen={isPublishModalOpen} onClose={() => setPublishModalOpen(false)} onDownload={() => downloadProjectAsZip(files, projectName)} projectName={projectName} projectId={currentProjectId} onSaveRequired={handleSaveProject} />
      <ImageStudioModal isOpen={isImageStudioOpen} onClose={() => setImageStudioOpen(false)} onSaveImage={() => {}} apiKey={""} onOpenApiKeyModal={() => {}} />
      <SupabaseAdminModal isOpen={isSupabaseAdminModalOpen} onClose={() => setSupabaseAdminModalOpen(false)} settings={userSettings || { id: '' }} onSave={handleUpdateSettings} />
    </div>
  );
};

export default App;
