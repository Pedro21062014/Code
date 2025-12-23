
import React from 'react';
import { AppLogo } from './Icons';

interface TermsPageProps {
  onBack: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
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
          <h1 className="text-4xl font-bold mb-2 tracking-tight">Termos de Uso</h1>
          <p className="text-gray-500 mb-12 text-sm">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <div className="space-y-12 text-gray-300 leading-relaxed text-sm md:text-base">
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e utilizar o Codegen Studio, você concorda em cumprir estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Descrição do Serviço</h2>
              <p>
                O Codegen Studio é uma ferramenta de desenvolvimento assistida por Inteligência Artificial que permite gerar, editar e visualizar código para aplicações web. Oferecemos planos gratuitos e pagos com diferentes níveis de acesso e recursos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Propriedade do Código Gerado</h2>
              <p>
                Você mantém todos os direitos de propriedade intelectual sobre o código gerado através da plataforma utilizando seus prompts. O Codegen Studio não reivindica a propriedade do output gerado pela IA para seus projetos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Responsabilidades do Usuário</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-400">
                <li>Você é responsável por manter a confidencialidade de suas credenciais de acesso.</li>
                <li>Você concorda em não usar o serviço para gerar código malicioso, spam ou conteúdo ilegal.</li>
                <li>Você entende que o código gerado por IA pode conter erros ou vulnerabilidades e deve ser revisado antes de ser utilizado em produção.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Limitação de Responsabilidade</h2>
              <p>
                O serviço é fornecido "como está". O Codegen Studio não garante que o serviço será ininterrupto ou livre de erros. Em nenhuma circunstância seremos responsáveis por quaisquer danos diretos, indiretos ou consequentes resultantes do uso ou incapacidade de usar o serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Alterações nos Termos</h2>
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos sobre alterações significativas através da plataforma ou por email.
              </p>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
};
