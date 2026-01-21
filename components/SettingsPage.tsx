
import React, { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { auth, db } from '../services/firebase';
import { updateProfile, deleteUser, sendPasswordResetEmail } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { 
    UserIcon, KeyIcon, ShieldIcon, SaveIcon, 
    LoaderIcon, CheckCircleIcon, GithubIcon, NetlifyIcon, 
    GeminiIcon, CloseIcon, LogOutIcon, LinkIcon
} from './Icons';
import { NETLIFY_CLIENT_ID } from '../constants';

interface SettingsPageProps {
    settings: UserSettings | null;
    sessionUser: any;
    onUpdateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
    onLogout: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, sessionUser, onUpdateSettings, onLogout }) => {
    // Profile State
    const [displayName, setDisplayName] = useState(sessionUser?.displayName || '');
    const [photoURL, setPhotoURL] = useState(sessionUser?.photoURL || '');
    
    // API Keys State
    const [geminiKey, setGeminiKey] = useState('');
    const [githubToken, setGithubToken] = useState('');
    const [netlifyToken, setNetlifyToken] = useState('');
    const [netlifyClientId, setNetlifyClientId] = useState('');

    // GitHub User State
    const [githubUser, setGithubUser] = useState<any | null>(null);
    const [loadingGithub, setLoadingGithub] = useState(false);

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    // Delete Account State
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteStep, setDeleteStep] = useState(0); 
    const [deleteInput1, setDeleteInput1] = useState('');
    const [deleteInput2, setDeleteInput2] = useState('');

    useEffect(() => {
        if (settings) {
            setGeminiKey(settings.gemini_api_key || '');
            setGithubToken(settings.github_access_token || '');
            setNetlifyToken(settings.netlify_access_token || '');
            setNetlifyClientId(settings.netlify_client_id || '');
        }
        if (sessionUser) {
            setDisplayName(sessionUser.displayName || '');
            setPhotoURL(sessionUser.photoURL || '');
        }
    }, [settings, sessionUser]);

    useEffect(() => {
        const fetchGithubUser = async () => {
            if (!settings?.github_access_token) {
                setGithubUser(null);
                return;
            }
            setLoadingGithub(true);
            try {
                const res = await fetch('https://api.github.com/user', {
                    headers: { Authorization: `Bearer ${settings.github_access_token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setGithubUser(data);
                } else {
                    setGithubUser(null);
                }
            } catch (e) {
                console.error("Error fetching github user", e);
                setGithubUser(null);
            } finally {
                setLoadingGithub(false);
            }
        };
        fetchGithubUser();
    }, [settings?.github_access_token]);

    const showMessage = (type: 'success' | 'error', msg: string) => {
        if (type === 'success') {
            setSuccessMsg(msg);
            setTimeout(() => setSuccessMsg(null), 3000);
        } else {
            setErrorMsg(msg);
            setTimeout(() => setErrorMsg(null), 5000);
        }
    };

    const handleUpdateProfile = async () => {
        setIsLoading(true);
        try {
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: displayName,
                    photoURL: photoURL
                });
                
                await onUpdateSettings({});
                showMessage('success', 'Perfil atualizado com sucesso.');
            }
        } catch (error: any) {
            showMessage('error', error.message || 'Erro ao atualizar perfil.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        const user = auth.currentUser;
        if (!user || !user.email) {
            showMessage('error', 'Email não encontrado.');
            return;
        }
        
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, user.email);
            showMessage('success', `Email enviado para ${user.email}.`);
        } catch (error: any) {
            showMessage('error', error.message || 'Erro ao enviar email.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateKeys = async () => {
        setIsLoading(true);
        try {
            await onUpdateSettings({
                gemini_api_key: geminiKey.trim(),
                netlify_access_token: netlifyToken.trim(),
                netlify_client_id: netlifyClientId.trim(),
            });
            showMessage('success', 'Configurações salvas.');
        } catch (error: any) {
            showMessage('error', 'Erro ao salvar.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGithubDisconnect = async () => {
        if (!window.confirm("Deseja desconectar sua conta do GitHub?")) return;
        setIsLoading(true);
        try {
            await onUpdateSettings({ github_access_token: "" });
            setGithubToken(""); 
            setGithubUser(null);
            showMessage('success', 'GitHub desconectado.');
        } catch (e: any) {
            showMessage('error', 'Erro ao desconectar.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 h-full bg-[#fbfbfb] dark:bg-[#09090b] overflow-y-auto custom-scrollbar p-6 md:p-12 transition-colors font-sans">
            <div className="max-w-4xl mx-auto space-y-10 pb-24">
                
                <header>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Configurações</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Gerencie sua conta e integrações.</p>
                </header>

                {/* Notifications */}
                {(successMsg || errorMsg) && (
                    <div className={`fixed bottom-6 right-6 p-4 rounded-xl border flex items-center gap-3 shadow-2xl animate-slide-up z-50 backdrop-blur-md ${successMsg ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
                        {successMsg ? <CheckCircleIcon className="w-5 h-5"/> : <CloseIcon className="w-5 h-5"/>}
                        <span className="font-medium text-sm">{successMsg || errorMsg}</span>
                    </div>
                )}

                {/* Profile */}
                <section className="space-y-6">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <UserIcon className="w-4 h-4" /> Perfil
                    </h2>
                    <div className="bg-white dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-[#27272a] p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex-shrink-0 flex justify-center">
                                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-50 dark:border-[#1a1a1c] shadow-lg relative group">
                                    {photoURL ? (
                                        <img src={photoURL} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-[#1a1a1c] text-3xl font-bold text-gray-400">
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome de Exibição</label>
                                        <input 
                                            type="text" 
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 focus:border-gray-400 dark:focus:border-gray-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">URL da Foto</label>
                                        <input 
                                            type="text" 
                                            value={photoURL}
                                            onChange={(e) => setPhotoURL(e.target.value)}
                                            placeholder="https://..."
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 focus:border-gray-400 dark:focus:border-gray-500 transition-all"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center pt-2">
                                    <button onClick={handlePasswordReset} className="text-xs font-medium text-gray-500 hover:text-black dark:hover:text-white underline transition-colors">
                                        Redefinir Senha
                                    </button>
                                    <button 
                                        onClick={handleUpdateProfile}
                                        disabled={isLoading}
                                        className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-lg hover:opacity-80 transition-all disabled:opacity-50"
                                    >
                                        {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Integrations */}
                <section className="space-y-6">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <KeyIcon className="w-4 h-4" /> Integrações
                    </h2>
                    
                    <div className="grid grid-cols-1 gap-6">
                        {/* GitHub Integration Card */}
                        <div className={`relative p-6 rounded-2xl border transition-all ${githubUser ? 'bg-gradient-to-br from-[#1a1f24] to-[#0d1117] border-gray-700' : 'bg-white dark:bg-[#121214] border-gray-200 dark:border-[#27272a]'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-700">
                                        <GithubIcon className="w-6 h-6 text-black dark:text-white" />
                                    </div>
                                    <div>
                                        <h3 className={`text-base font-bold ${githubUser ? 'text-white' : 'text-gray-900 dark:text-white'}`}>GitHub</h3>
                                        <p className={`text-sm ${githubUser ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {githubUser ? 'Conta conectada e sincronizada.' : 'Conecte para sincronizar repositórios.'}
                                        </p>
                                    </div>
                                </div>
                                {githubUser && (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-green-500 uppercase">Ativo</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6">
                                {githubUser ? (
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <img src={githubUser.avatar_url} alt="" className="w-10 h-10 rounded-full border-2 border-white/10" />
                                            <div>
                                                <div className="text-sm font-bold text-white">{githubUser.login}</div>
                                                <a href={githubUser.html_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                                                    Ver Perfil <LinkIcon className="w-3 h-3"/>
                                                </a>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleGithubDisconnect} 
                                            className="px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-bold transition-colors"
                                        >
                                            Desconectar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <input 
                                            type="password" 
                                            value={githubToken} 
                                            onChange={e => setGithubToken(e.target.value)}
                                            placeholder="ghp_..."
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0c0c0e] border border-gray-200 dark:border-[#27272a] rounded-xl text-sm focus:border-black dark:focus:border-white transition-colors outline-none"
                                        />
                                        <div className="flex justify-end">
                                            <button onClick={handleUpdateKeys} className="text-xs font-bold text-black dark:text-white hover:underline">Salvar Token Manualmente</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Gemini & Netlify Cards (Grid) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Gemini */}
                            <div className="p-6 bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <GeminiIcon className="w-6 h-6" />
                                    <h3 className="font-bold text-gray-900 dark:text-white">Google Gemini</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">API Key</label>
                                        <input 
                                            type="password" 
                                            value={geminiKey}
                                            onChange={e => setGeminiKey(e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                                            placeholder="••••••••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Netlify */}
                            <div className="p-6 bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <NetlifyIcon className="w-6 h-6 text-[#00C7B7]" />
                                    <h3 className="font-bold text-gray-900 dark:text-white">Netlify</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Access Token</label>
                                        <input 
                                            type="password" 
                                            value={netlifyToken}
                                            onChange={e => setNetlifyToken(e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-lg text-sm outline-none focus:border-[#00C7B7] transition-colors"
                                            placeholder="nfp_..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end">
                             <button 
                                onClick={handleUpdateKeys}
                                disabled={isLoading}
                                className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
                            >
                                Salvar Todas as Chaves
                            </button>
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="pt-10 border-t border-gray-200 dark:border-[#27272a]">
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl p-6">
                        <h2 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <ShieldIcon className="w-4 h-4"/> Zona de Perigo
                        </h2>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                A exclusão da sua conta é permanente e removerá todos os seus projetos.
                            </p>
                            <button 
                                onClick={() => { setIsDeleting(true); setDeleteStep(1); }}
                                className="px-4 py-2 bg-white dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-bold text-xs rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            >
                                Deletar Conta
                            </button>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};
