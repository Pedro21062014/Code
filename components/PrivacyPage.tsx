
import React from 'react';
import { AppLogo } from './Icons';

interface PrivacyPageProps {
  onBack: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
  return (
    <div className="h-screen w-full bg-[#09090b] text-white font-sans overflow-y-auto custom-scrollbar">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-20 p-6 bg-[#09090b]/80 backdrop-blur-md border-b border-[#27272a]">
        <div className="container mx-auto max-w-4xl flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
             <AppLogo className="w-6 h-6 text-white" />
             <span className="font-semibold tracking-tight text-sm">codegen<span className="font-light opacity-70">studio</span></span>
          </div>
          <button 
            onClick={onBack} 
            className="text-xs font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            &larr; Voltar
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto animate-fadeIn">
          <h1 className="text-4xl font-bold mb-2 tracking-tight">Política de Privacidade</h1>
          <p className="text-gray-500 mb-12 text-sm">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <div className="space-y-12 text-gray-300 leading-relaxed text-sm md:text-base">
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Introdução</h2>
              <p>
                A sua privacidade é importante para nós. Esta política descreve como o Codegen Studio coleta, usa e protege suas informações quando você utiliza nossa plataforma de desenvolvimento assistido por IA.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Coleta de Dados</h2>
              <p className="mb-4">Coletamos os seguintes tipos de informações:</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-400">
                <li><strong className="text-white">Informações da Conta:</strong> Seu email e nome (via autenticação Google ou Firebase) para gerenciar sua identidade na plataforma.</li>
                <li><strong className="text-white">Dados do Projeto:</strong> O código, arquivos, prompts e configurações de ambiente que você cria ou envia para a plataforma.</li>
                <li><strong className="text-white">Chaves de API:</strong> Chaves pessoais (como Gemini API Key, GitHub Token) são armazenadas de forma criptografada e usadas apenas para realizar as requisições solicitadas por você.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Uso de Inteligência Artificial</h2>
              <p>
                Nossa ferramenta utiliza modelos de IA (como Google Gemini, OpenAI, DeepSeek) para gerar código. Ao enviar prompts, o texto e o contexto do código podem ser enviados para esses provedores terceiros estritamente para o propósito de geração de resposta. Recomendamos não inserir dados sensíveis, segredos comerciais ou informações pessoais identificáveis (PII) nos prompts de código.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Segurança</h2>
              <p>
                Implementamos medidas de segurança robustas, incluindo criptografia em trânsito e em repouso, para proteger seus dados. Utilizamos serviços confiáveis como Google Firebase e Supabase para infraestrutura.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Seus Direitos</h2>
              <p>
                Você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento. Você pode excluir seus projetos diretamente na interface ou entrar em contato conosco para a exclusão completa da conta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Contato</h2>
              <p>
                Se tiver dúvidas sobre esta política, entre em contato através do email: <a href="mailto:privacy@codegen.studio" className="text-blue-400 hover:underline">privacy@codegen.studio</a>.
              </p>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
};
