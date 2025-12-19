
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
import { GithubSyncModal } from './components/GithubSyncModal';
import { PublishModal } from './components/PublishModal';
import { AuthModal } from './components/AuthModal';
import { ImageStudioModal } from './components/ImageStudioModal';
import { SupabaseAdminModal } from './components/SupabaseAdminModal';
import { ProWelcomeOnboarding } from './components/ProWelcomeOnboarding';
import { ProjectFile, ChatMessage, AIProvider, UserSettings, Theme, SavedProject } from './types';
import { downloadProjectAsZip } from './services/projectService';
import { INITIAL_CHAT_MESSAGE, DEFAULT_GEMINI_API_KEY, AI_MODELS, DAILY_CREDIT_LIMIT } from './constants';
import { generateCodeStreamWithGemini, generateProjectName } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";
import { ChatIcon, TerminalIcon } from './components/Icons';

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
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error("Resposta da IA não contém um JSON válido.");
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
  const [activeMobileTab, setActiveMobileTab] = useState<'chat' | 'editor'>('editor');

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isApiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [isGithubModalOpen, setGithubModalOpen] = useState(false);
  const [isGithubSyncModalOpen, setGithubSyncModalOpen] = useState(false);
  const [isLocalRunModalOpen, setLocalRunModalOpen] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isImageStudioOpen, setImageStudioOpen] = useState(false);
  const [isSupabaseAdminModalOpen, setSupabaseAdminModalOpen] = useState(false);
  const [showProOnboarding, setShowProOnboarding] = useState(false);
  
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isProUser] = useLocalStorage<boolean>('is-pro-user', false);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');
  const [pendingPrompt, setPendingPrompt] = useState<any>(null);
  
  const [isInitializing, setIsInitializing] = useState(false); 
  const [generatingFile, setGeneratingFile] = useState<string | null>(null);
  const [generatedFileNames, setGeneratedFileNames] = useState<Set<string>>(new Set());

  const [codeError, setCodeError] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  const isFirebaseAvailable = useRef(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
        setSavedProjects(projects.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
    } catch (error: any) { console.error("Error fetching projects:", error); }
  }, [setSavedProjects]);

  const fetchUserSettings = useCallback(async (userUid: string): Promise<UserSettings | null> => {
    const localDataKey = `user_settings_${userUid}`;
    let localSettings: UserSettings = { id: userUid, credits: DAILY_CREDIT_LIMIT, plan: 'Hobby' };
    
    try {
        const stored = localStorage.getItem(localDataKey);
        if (stored) localSettings = { ...localSettings, ...JSON.parse(stored) };
    } catch (e) { console.warn("Failed to parse local settings", e); }

    if (!isFirebaseAvailable.current) {
        setIsOfflineMode(true);
        return localSettings;
    }

    try {
      const docRef = doc(db, "users", userUid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = sanitizeFirestoreData(docSnap.data());
        let mergedSettings = { id: userUid, ...data } as unknown as UserSettings;
        
        const plan = mergedSettings.plan?.toLowerCase();
        if (plan === 'pro' && !mergedSettings.hasSeenProWelcome) {
            setShowProOnboarding(true);
        }

        const planLimit = plan === 'pro' ? 500 : 300;
        const today = new Date().toISOString().split('T')[0];
        
        if (mergedSettings.last_credits_reset !== today) {
            mergedSettings.credits = planLimit;
            mergedSettings.last_credits_reset = today;
            await updateDoc(docRef, { credits: planLimit, last_credits_reset: today });
        }
        
        localStorage.setItem(localDataKey, JSON.stringify(mergedSettings));
        setIsOfflineMode(false);
        return mergedSettings;
      } else {
        const initialData = { 
            credits: DAILY_CREDIT_LIMIT, 
            plan: 'Hobby' as const,
            last_credits_reset: new Date().toISOString().split('T')[0],
            hasSeenProWelcome: false
        };
        await setDoc(docRef, initialData);
        return { ...localSettings, ...initialData } as UserSettings;
      }
    } catch (error: any) {
      console.error("Firebase fetch settings failed", error);
      isFirebaseAvailable.current = false;
      setIsOfflineMode(true);
      return localSettings;
    }
  }, []);

  const handleSaveProject = useCallback(async () => {
    if (!sessionUser) {
      setAuthModalOpen(true);
      return;
    }

    if (files.length === 0) {
      alert("Não há arquivos para salvar.");
      return;
    }

    setIsSaving(true);
    const projectId = currentProjectId || Date.now();
    
    const projectData: SavedProject = {
      id: projectId,
      ownerId: sessionUser.uid,
      name: projectName,
      files: files,
      chat_history: chatMessages,
      env_vars: envVars,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      // 1. Salvar no LocalStorage para redundância
      setSavedProjects(prev => {
        const filtered = prev.filter(p => p.id !== projectId);
        return [projectData, ...filtered];
      });

      // 2. Sincronizar com Firestore se disponível
      if (isFirebaseAvailable.current) {
        await setDoc(doc(db, "projects", projectId.toString()), {
          ...projectData,
          updated_at: serverTimestamp()
        }, { merge: true });
      }

      // 3. Atualizar o estado do projeto atual com o ID correto
      setProject(prev => ({ ...prev, currentProjectId: projectId }));
      
      console.log("Projeto salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      alert("Erro ao salvar o projeto. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }, [sessionUser, files, projectName, chatMessages, envVars, currentProjectId, setSavedProjects, setProject]);

  const handleCompleteOnboarding = async () => {
    if (sessionUser && userSettings) {
        setShowProOnboarding(false);
        const updated = { ...userSettings, hasSeenProWelcome: true };
        setUserSettings(updated);
        if (isFirebaseAvailable.current) {
            try {
                await updateDoc(doc(db, "users", sessionUser.uid), { hasSeenProWelcome: true });
            } catch (e) {
                console.error("Failed to save welcome status", e);
            }
        }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      if (user) {
        setSessionUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
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

  const handleSendMessage = useCallback(async (prompt: string, provider: AIProvider, modelId: string, attachments: any[] = []) => {
    if (!sessionUser) { setAuthModalOpen(true); return; }
    
    const selectedModel = AI_MODELS.find(m => m.id === modelId);
    const isUsingOwnGeminiKey = provider === AIProvider.Gemini && !!userSettings?.gemini_api_key;
    const cost = isUsingOwnGeminiKey ? 0 : (selectedModel?.creditCost || 1);
    const currentCredits = userSettings?.credits || 0;

    if (currentCredits < cost) {
        alert(`Créditos insuficientes (${currentCredits}/${cost}). Configure sua própria chave do Gemini nas configurações para gerar código gratuitamente.`);
        return;
    }

    if (provider === AIProvider.Gemini && !effectiveGeminiApiKey) {
      setPendingPrompt({ prompt, provider, model: modelId, attachments });
      setApiKeyModalOpen(true);
      return;
    }

    if (provider !== AIProvider.Gemini) {
      alert("Apenas o provedor Gemini está disponível no momento.");
      return;
    }
    
    if (cost > 0) {
        const newCreditBalance = currentCredits - cost;
        setUserSettings(prev => prev ? { ...prev, credits: newCreditBalance } : null);
        if (isFirebaseAvailable.current) {
            updateDoc(doc(db, "users", sessionUser.uid), { credits: newCreditBalance }).catch(console.error);
        }
    }

    setProject(p => ({ 
      ...p, 
      chatMessages: [...p.chatMessages, { role: 'user', content: prompt }, { role: 'assistant', content: 'Processando solicitação...', isThinking: true }] 
    }));
    
    if (view !== 'editor') setView('editor');
    if (window.innerWidth < 1024) setActiveMobileTab('chat');
    
    setIsInitializing(true);
    setGeneratedFileNames(new Set());
    setCodeError(null);

    if (project.files.length === 0 && effectiveGeminiApiKey) {
      setGeneratingFile('Analisando...');
      generateProjectName(prompt, effectiveGeminiApiKey).then(n => setProject(p => ({...p, projectName: n})));
    }

    let accumulatedContent = "";
    const onChunk = (chunk: string) => {
        accumulatedContent += chunk;
        const fileMatches = [...accumulatedContent.matchAll(/"name":\s*"([^"]+)"/g)];
        if (fileMatches.length > 0) {
            const names = new Set<string>();
            fileMatches.forEach(m => names.add(m[1]));
            setGeneratedFileNames(names);
            setGeneratingFile(fileMatches[fileMatches.length - 1][1]);
        }
    };

    try {
      const fullResponse = await generateCodeStreamWithGemini(prompt, project.files, project.envVars, onChunk, modelId, effectiveGeminiApiKey!, attachments);
      
      const payload = fullResponse.includes('\n---\n') ? fullResponse.substring(fullResponse.indexOf('\n---\n') + 5) : fullResponse;
      const result = extractAndParseJson(payload);
      
      if (result.files) {
        setProject(p => {
            const map = new Map(p.files.map(f => [f.name, f]));
            result.files.forEach((file: ProjectFile) => map.set(file.name, file));
            return { ...p, files: Array.from(map.values()), activeFile: p.activeFile || result.files[0].name };
        });
      }

      setProject(p => {
            const msgs = [...p.chatMessages];
            const last = msgs[msgs.length - 1];
            if (last?.role === 'assistant') {
                last.content = result.message || 'Pronto! O código foi gerado.';
                last.summary = result.summary;
                last.isThinking = false;
            }
            return { ...p, chatMessages: msgs };
      });
      
      if (window.innerWidth < 1024) setActiveMobileTab('editor');
        
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      setProject(p => {
            const msgs = [...p.chatMessages];
            const last = msgs[msgs.length - 1];
            if (last?.isThinking) { last.content = `Desculpe, ocorreu um erro: ${msg}`; last.isThinking = false; }
            return { ...p, chatMessages: msgs };
        });
    } finally { setIsInitializing(false); setGeneratingFile(null); }
  }, [project, effectiveGeminiApiKey, userSettings, sessionUser, view, setProject]);

  const handleFixCode = useCallback(() => {
    if (!codeError) return;
    const prompt = `O preview da aplicação falhou com o seguinte erro: "${codeError}". Por favor, analise os arquivos atuais e aplique as correções necessárias para que o projeto funcione corretamente. Foque em corrigir erros de importação, sintaxe ou lógica do React.`;
    handleSendMessage(prompt, AIProvider.Gemini, 'gemini-3-flash-preview');
  }, [codeError, handleSendMessage]);

  const handleLoadProject = useCallback((projectId: number) => {
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
        setActiveMobileTab('editor');
    }
  }, [savedProjects, setProject]);

  const handleSaveSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!sessionUser) return;
    const updated = { ...userSettings, ...newSettings };
    setUserSettings(updated as UserSettings);
    if (isFirebaseAvailable.current) {
        await updateDoc(doc(db, "users", sessionUser.uid), newSettings);
    }
  }, [sessionUser, userSettings]);

  return (
    <div className={theme}>
      {showProOnboarding && <ProWelcomeOnboarding onComplete={handleCompleteOnboarding} />}
      {view === 'welcome' ? (
          <WelcomeScreen 
            session={sessionUser ? { user: sessionUser } : null}
            onLoginClick={() => setAuthModalOpen(true)}
            onPromptSubmit={(p, m, a) => { const mod = AI_MODELS.find(x => x.id === m); handleSendMessage(p, mod!.provider, m, a); }}
            onShowPricing={() => setView('pricing')}
            onShowProjects={() => setView('projects')}
            onOpenGithubImport={() => setGithubModalOpen(true)}
            onFolderImport={f => { setProject(p => ({ ...p, files: f })); setView('editor'); setActiveMobileTab('editor'); }}
            onNewProject={() => { setProject(initialProjectState); setView('welcome'); }}
            onLogout={() => signOut(auth).then(() => { setProject(initialProjectState); setView('welcome'); })}
            onOpenSettings={() => setSettingsOpen(true)}
            recentProjects={savedProjects}
            onLoadProject={id => handleLoadProject(id)}
            credits={userSettings?.credits || 0}
            userGeminiKey={userSettings?.gemini_api_key}
            currentPlan={userSettings?.plan || 'Hobby'}
          />
      ) : view === 'pricing' ? (
          <PricingPage onBack={() => setView('welcome')} onNewProject={() => { setProject(initialProjectState); setView('welcome'); }} />
      ) : view === 'projects' ? (
          <ProjectsPage projects={savedProjects} onLoadProject={handleLoadProject} onDeleteProject={id => setSavedProjects(p => p.filter(x => x.id !== id))} onBack={() => setView('welcome')} onNewProject={() => { setProject(initialProjectState); setView('welcome'); }} />
      ) : (
          <div className="flex flex-col h-screen bg-var-bg-default overflow-hidden">
            <div className="flex flex-1 overflow-hidden relative">
              <div className={`
                w-full lg:w-[400px] flex-shrink-0 border-r border-var-border-default h-full z-10 bg-[#121214] transition-all
                ${activeMobileTab === 'chat' ? 'flex' : 'hidden lg:flex'}
              `}>
                <ChatPanel 
                    messages={chatMessages} onSendMessage={handleSendMessage} isProUser={isProUser} 
                    onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} projectName={projectName}
                    credits={userSettings?.credits || 0}
                    generatingFile={generatingFile}
                    isGenerating={isInitializing}
                    userGeminiKey={userSettings?.gemini_api_key}
                    onCloseMobile={() => setActiveMobileTab('editor')}
                />
              </div>
              
              <main className={`flex-1 min-w-0 h-full relative ${activeMobileTab === 'editor' ? 'block' : 'hidden lg:block'}`}>
                <EditorView 
                  files={files} activeFile={activeFile} projectName={projectName} theme={theme} onThemeChange={setTheme}
                  onFileSelect={n => setProject(p => ({...p, activeFile: n}))} onFileDelete={n => setProject(p => ({ ...p, files: p.files.filter(f => f.name !== n) }))} 
                  onRunLocally={() => setLocalRunModalOpen(true)}
                  onSyncGithub={() => setGithubSyncModalOpen(true)}
                  codeError={codeError} onFixCode={handleFixCode} onClearError={() => setCodeError(null)} onError={setCodeError} envVars={envVars}
                  onOpenChatMobile={() => setActiveMobileTab('chat')}
                />
              </main>

              <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center bg-[#18181b] border border-[#27272a] rounded-full p-1 shadow-2xl z-50">
                  <button 
                    onClick={() => setActiveMobileTab('chat')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${activeMobileTab === 'chat' ? 'bg-white text-black font-bold' : 'text-gray-500'}`}
                  >
                    <ChatIcon className="w-5 h-5" />
                    <span className="text-xs">Chat</span>
                  </button>
                  <button 
                    onClick={() => setActiveMobileTab('editor')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${activeMobileTab === 'editor' ? 'bg-white text-black font-bold' : 'text-gray-500'}`}
                  >
                    <TerminalIcon className="w-5 h-5" />
                    <span className="text-xs">Editor</span>
                  </button>
              </div>

              <div className={`fixed inset-0 z-[60] transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
                 <div className={`absolute top-0 left-0 w-[280px] sm:w-[320px] h-full bg-[#121214] shadow-2xl transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <Sidebar
                        files={files} envVars={envVars} onEnvVarChange={v => setProject(p => ({ ...p, envVars: v }))} activeFile={activeFile} onFileSelect={f => {setProject(p => ({...p, activeFile: f})); setSidebarOpen(false);}}
                        onDownload={() => downloadProjectAsZip(files, projectName)} onOpenSettings={() => setSettingsOpen(true)}
                        onOpenGithubImport={() => setGithubModalOpen(true)} onOpenSupabaseAdmin={() => setSupabaseAdminModalOpen(true)}
                        onSaveProject={handleSaveProject} onOpenProjects={() => setView('projects')}
                        onNewProject={() => { setProject(initialProjectState); setView('welcome'); }} onOpenImageStudio={() => setImageStudioOpen(true)} onClose={() => setSidebarOpen(false)}
                        onRenameFile={(o, n) => setProject(p => ({ ...p, files: p.files.map(f => f.name === o ? {...f, name: n} : f) }))} 
                        onDeleteFile={n => setProject(p => ({ ...p, files: p.files.filter(f => f.name !== n) }))}
                        onOpenStripeModal={() => {}} onOpenNeonModal={() => {}} onOpenOSMModal={() => {}}
                        session={sessionUser} onLogin={() => setAuthModalOpen(true)} onLogout={() => signOut(auth)}
                        isOfflineMode={isOfflineMode} generatingFile={generatingFile} isGenerating={isInitializing} generatedFileNames={generatedFileNames}
                    />
                 </div>
              </div>
            </div>
          </div>
      )}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen && !!sessionUser} onClose={() => setSettingsOpen(false)} settings={userSettings || { id: '' }} onSave={handleSaveSettings} />
      <SupabaseAdminModal isOpen={isSupabaseAdminModalOpen && !!sessionUser} onClose={() => setSupabaseAdminModalOpen(false)} settings={userSettings || { id: '' }} onSave={handleSaveSettings} />
      <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} onSave={k => { handleSaveSettings({ gemini_api_key: k }); if (pendingPrompt) { handleSendMessage(pendingPrompt.prompt, pendingPrompt.provider, pendingPrompt.model, pendingPrompt.attachments); setPendingPrompt(null); } }} />
      <GithubImportModal isOpen={isGithubModalOpen} onClose={() => setGithubModalOpen(false)} onImport={f => { setProject(p => ({...p, files: f, activeFile: f.find(x => x.name.includes('html'))?.name || f[0]?.name || null})); setGithubModalOpen(false); setView('editor'); setActiveMobileTab('editor'); }} githubToken={userSettings?.github_access_token} onOpenSettings={() => setSettingsOpen(true)} />
      <GithubSyncModal isOpen={isGithubSyncModalOpen} onClose={() => setGithubSyncModalOpen(false)} files={files} githubToken={userSettings?.github_access_token} onOpenSettings={() => setSettingsOpen(true)} projectName={projectName} />
      <PublishModal isOpen={isLocalRunModalOpen} onClose={() => setLocalRunModalOpen(false)} onDownload={() => downloadProjectAsZip(files, projectName)} projectName={projectName} />
      <ImageStudioModal isOpen={isImageStudioOpen} onClose={() => setImageStudioOpen(false)} onSaveImage={(d, n) => setProject(p => ({...p, files: [...p.files, { name: n, language: 'image', content: d }] }))} apiKey={effectiveGeminiApiKey} onOpenApiKeyModal={() => setApiKeyModalOpen(true)} />
    </div>
  );
};

export default App;
