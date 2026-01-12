
import React, { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { auth, db } from '../services/firebase';
import { updateProfile, updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
    UserIcon, KeyIcon, ShieldIcon, TrashIcon, SaveIcon, 
    LoaderIcon, CheckCircleIcon, GithubIcon, NetlifyIcon, 
    GeminiIcon, CloseIcon 
} from './Icons';

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
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // API Keys State
    const [geminiKey, setGeminiKey] = useState('');
    const [githubToken, setGithubToken] = useState('');
    const [netlifyToken, setNetlifyToken] = useState('');

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    // Delete Account State
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteStep, setDeleteStep] = useState(0); // 0: Idle, 1: First Confirm, 2: Second Confirm
    const [deleteInput1, setDeleteInput1] = useState('');
    const [deleteInput2, setDeleteInput2] = useState('');

    useEffect(() => {
        if (settings) {
            setGeminiKey(settings.gemini_api_key || '');
            setGithubToken(settings.github_access_token || '');
            setNetlifyToken(settings.netlify_access_token || '');
        }
        if (sessionUser) {
            setDisplayName(sessionUser.displayName || '');
            setPhotoURL(sessionUser.photoURL || '');
        }
    }, [settings, sessionUser]);

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
                
                // Update Firestore as well for consistency if needed, though Auth is primary for profile
                await onUpdateSettings({}); // Trigger generic update to refresh app state if needed
                
                if (newPassword) {
                    if (newPassword !== confirmPassword) {
                        throw new Error("As senhas não coincidem.");
                    }
                    if (newPassword.length < 6) {
                        throw new Error("A senha deve ter pelo menos 6 caracteres.");
                    }
                    await updatePassword(auth.currentUser, newPassword);
                }
                
                showMessage('success', 'Perfil atualizado com sucesso.');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                showMessage('error', 'Por segurança, faça login novamente para alterar a senha.');
            } else {
                showMessage('error', error.message || 'Erro ao atualizar perfil.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateKeys = async () => {
        setIsLoading(true);
        try {
            await onUpdateSettings({
                gemini_api_key: geminiKey,
                github_access_token: githubToken,
                netlify_access_token: netlifyToken
            });
            showMessage('success', 'Chaves de API salvas com sucesso.');
        } catch (error: any) {
            showMessage('error', 'Erro ao salvar chaves.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!auth.currentUser) return;
        const targetName = sessionUser?.displayName || sessionUser?.email;

        if (deleteInput1 !== targetName || deleteInput2 !== targetName) {
            showMessage('error', 'Os nomes digitados não correspondem ao nome da conta.');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Delete Firestore User Doc
            await deleteDoc(doc(db, "users", auth.currentUser.uid));
            
            // 2. Delete User from Auth
            await deleteUser(auth.currentUser);
            
            // 3. Logout/Redirect handled by onAuthStateChanged in App.tsx
        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                showMessage('error', 'Faça login novamente para realizar esta ação crítica.');
            } else {
                showMessage('error', `Erro ao deletar conta: ${error.message}`);
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 h-full bg-gray-50 dark:bg-[#09090b] overflow-y-auto custom-scrollbar p-6 md:p-12 transition-colors">
            <div className="max-w-3xl mx-auto space-y-8 pb-20">
                
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Configurações da Conta</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Gerencie seu perfil, integrações e segurança.</p>
                </header>

                {/* Notifications */}
                {successMsg && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-xl flex items-center gap-3 text-green-700 dark:text-green-400 animate-fadeIn">
                        <CheckCircleIcon className="w-5 h-5" />
                        {successMsg}
                    </div>
                )}
                {errorMsg && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 animate-fadeIn">
                        <CloseIcon className="w-5 h-5" />
                        {errorMsg}
                    </div>
                )}

                {/* Profile Section */}
                <section className="bg-white dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-[#27272a] p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-[#27272a] pb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <UserIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Perfil Público</h2>
                            <p className="text-xs text-gray-500">Como você aparece no Codegen Studio</p>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-shrink-0">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 dark:border-[#27272a] bg-gray-100 dark:bg-[#1a1a1c]">
                                    {photoURL ? (
                                        <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 w-full space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL da Foto</label>
                                    <input 
                                        type="text" 
                                        value={photoURL}
                                        onChange={(e) => setPhotoURL(e.target.value)}
                                        placeholder="https://exemplo.com/sua-foto.jpg"
                                        className="w-full p-2.5 bg-gray-50 dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Cole um link direto para uma imagem.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome de Exibição</label>
                                    <input 
                                        type="text" 
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 dark:border-[#27272a]">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Alterar Senha</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nova Senha</label>
                                    <input 
                                        type="password" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full p-2.5 bg-gray-50 dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Confirmar Senha</label>
                                    <input 
                                        type="password" 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full p-2.5 bg-gray-50 dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button 
                                onClick={handleUpdateProfile}
                                disabled={isLoading}
                                className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 text-sm disabled:opacity-50"
                            >
                                {isLoading ? <LoaderIcon className="w-4 h-4 animate-spin"/> : <SaveIcon className="w-4 h-4"/>}
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </section>

                {/* API Keys Section */}
                <section className="bg-white dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-[#27272a] p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-[#27272a] pb-4">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                            <KeyIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chaves de API & Tokens</h2>
                            <p className="text-xs text-gray-500">Conecte serviços externos ao seu fluxo de trabalho.</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {/* Gemini */}
                        <div className="p-4 bg-gray-50 dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-[#27272a]">
                            <div className="flex items-center gap-2 mb-2 text-gray-900 dark:text-white font-medium text-sm">
                                <GeminiIcon className="w-4 h-4" /> Google Gemini API Key
                            </div>
                            <input 
                                type="password" 
                                value={geminiKey}
                                onChange={(e) => setGeminiKey(e.target.value)}
                                placeholder="AIza..."
                                className="w-full p-2 bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-[#27272a] rounded-lg text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* GitHub */}
                        <div className="p-4 bg-gray-50 dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-[#27272a]">
                            <div className="flex items-center gap-2 mb-2 text-gray-900 dark:text-white font-medium text-sm">
                                <GithubIcon className="w-4 h-4" /> GitHub Access Token
                            </div>
                            <input 
                                type="password" 
                                value={githubToken}
                                onChange={(e) => setGithubToken(e.target.value)}
                                placeholder="ghp_..."
                                className="w-full p-2 bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-[#27272a] rounded-lg text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* Netlify */}
                        <div className="p-4 bg-gray-50 dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-[#27272a]">
                            <div className="flex items-center gap-2 mb-2 text-gray-900 dark:text-white font-medium text-sm">
                                <NetlifyIcon className="w-4 h-4 text-[#00C7B7]" /> Netlify Access Token
                            </div>
                            <input 
                                type="password" 
                                value={netlifyToken}
                                onChange={(e) => setNetlifyToken(e.target.value)}
                                placeholder="nfp_..."
                                className="w-full p-2 bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-[#27272a] rounded-lg text-gray-900 dark:text-white text-sm focus:border-[#00C7B7] focus:outline-none"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button 
                                onClick={handleUpdateKeys}
                                disabled={isLoading}
                                className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 text-sm disabled:opacity-50"
                            >
                                {isLoading ? <LoaderIcon className="w-4 h-4 animate-spin"/> : <SaveIcon className="w-4 h-4"/>}
                                Atualizar Chaves
                            </button>
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="bg-red-50/50 dark:bg-red-900/5 rounded-2xl border border-red-200 dark:border-red-900/30 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-red-200 dark:border-red-900/30">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                            <ShieldIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">Zona de Perigo</h2>
                            <p className="text-xs text-red-600/70 dark:text-red-400/60">Ações irreversíveis.</p>
                        </div>
                    </div>

                    {!isDeleting ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">Deletar Conta</h3>
                                <p className="text-sm text-gray-500 mt-1">Isso excluirá permanentemente seus projetos e dados.</p>
                            </div>
                            <button 
                                onClick={() => { setIsDeleting(true); setDeleteStep(1); }}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-red-900/20"
                            >
                                Deletar Conta
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fadeIn">
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">
                                {deleteStep === 1 ? "Confirmação 1/2: Digite o nome da sua conta." : "Confirmação 2/2: Digite o nome novamente para confirmar."}
                            </p>
                            <div className="p-3 bg-white dark:bg-black rounded-lg border border-red-200 dark:border-red-900/30 font-mono text-center text-sm">
                                {sessionUser?.displayName || sessionUser?.email}
                            </div>
                            
                            {deleteStep === 1 && (
                                <input 
                                    type="text"
                                    value={deleteInput1}
                                    onChange={e => setDeleteInput1(e.target.value)}
                                    placeholder="Digite o nome da conta"
                                    className="w-full p-2 border border-red-300 dark:border-red-900/50 rounded-lg bg-transparent text-gray-900 dark:text-white focus:border-red-500 focus:outline-none"
                                />
                            )}
                            
                            {deleteStep === 2 && (
                                <input 
                                    type="text"
                                    value={deleteInput2}
                                    onChange={e => setDeleteInput2(e.target.value)}
                                    placeholder="Digite o nome novamente"
                                    className="w-full p-2 border border-red-300 dark:border-red-900/50 rounded-lg bg-transparent text-gray-900 dark:text-white focus:border-red-500 focus:outline-none"
                                />
                            )}

                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => { setIsDeleting(false); setDeleteStep(0); setDeleteInput1(''); setDeleteInput2(''); }}
                                    className="flex-1 py-2 bg-gray-200 dark:bg-[#27272a] text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-300 dark:hover:bg-[#3f3f46]"
                                >
                                    Cancelar
                                </button>
                                {deleteStep === 1 && (
                                    <button 
                                        onClick={() => {
                                            if(deleteInput1 === (sessionUser?.displayName || sessionUser?.email)) setDeleteStep(2);
                                            else showMessage('error', 'Nome incorreto.');
                                        }}
                                        className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700"
                                    >
                                        Próximo
                                    </button>
                                )}
                                {deleteStep === 2 && (
                                    <button 
                                        onClick={handleDeleteAccount}
                                        disabled={isLoading}
                                        className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Apagando...' : 'Confirmar Exclusão'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
};
