import React, { useState } from 'react';
import axios from 'axios';
import { User, Heart, FileText, Upload, CheckCircle2, Share2, Download, ChevronRight, ChevronLeft, Camera, CreditCard, Copy, Check } from 'lucide-react';

const API_URL = 'https://gille3470.c35.integrator.host';

interface FormData {
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_endereco: string;
  responsavel_telefone: string;
  aluno_nome: string;
  aluno_cpf: string;
  data_nascimento: string;
  serie: string;
  is_pcd: boolean;
  tipo_deficiencia: string;
  recebe_beneficio: boolean;
  nis: string;
  foto_aluno: File | null;
  comprovante_pix: File | null;
}

interface ComprovanteData extends FormData {
  id: number | string;
  data: string;
}

export const FormInscricao: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [comprovante, setComprovante] = useState<ComprovanteData | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [pixPreview, setPixPreview] = useState<string | null>(null);
  const [pixCopiado, setPixCopiado] = useState<boolean>(false);

  const [formData, setFormData] = useState<FormData>({
    responsavel_nome: '',
    responsavel_cpf: '',
    responsavel_endereco: '',
    responsavel_telefone: '',
    aluno_nome: '',
    aluno_cpf: '',
    data_nascimento: '',
    serie: '6º Ano - Ensino Fundamental',
    is_pcd: false,
    tipo_deficiencia: '',
    recebe_beneficio: false,
    nis: '',
    foto_aluno: null,
    comprovante_pix: null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, foto_aluno: file }));
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handlePixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, comprovante_pix: file }));
      setPixPreview(file.name);
    }
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText('12346578911');
    setPixCopiado(true);
    setTimeout(() => setPixCopiado(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.foto_aluno) {
      alert('Por favor, tire ou anexe a foto de rosto do aluno na Etapa 3.');
      return;
    }
    if (!formData.comprovante_pix) {
      alert('Por favor, anexe o comprovante de pagamento da taxa na Etapa 4.');
      return;
    }

    setLoading(true);
    const data = new FormData();

    // Inserção explícita dos campos de texto e booleanos
    data.append('responsavel_nome', formData.responsavel_nome);
    data.append('responsavel_cpf', formData.responsavel_cpf);
    data.append('responsavel_endereco', formData.responsavel_endereco);
    data.append('responsavel_telefone', formData.responsavel_telefone);
    data.append('aluno_nome', formData.aluno_nome);
    data.append('aluno_cpf', formData.aluno_cpf);
    data.append('data_nascimento', formData.data_nascimento);
    data.append('serie', formData.serie);
    data.append('is_pcd', String(formData.is_pcd));
    data.append('tipo_deficiencia', formData.is_pcd ? formData.tipo_deficiencia : '');
    data.append('recebe_beneficio', String(formData.recebe_beneficio));
    data.append('nis', formData.recebe_beneficio ? formData.nis : '');
    
    // Inserção dos arquivos com as exatas chaves esperadas no backend
    data.append('foto_aluno', formData.foto_aluno, formData.foto_aluno.name);
    data.append('comprovante_pix', formData.comprovante_pix, formData.comprovante_pix.name);

    try {
      const response = await axios.post<{ aluno_id: number | string }>(`${API_URL}/matriculas`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setComprovante({
        id: response.data.aluno_id,
        data: new Date().toLocaleDateString('pt-BR'),
        ...formData,
      });
      setStep(5); // Vai para a tela de Sucesso
    } catch (error: any) {
      const msg = error.response?.data?.error || error.response?.data?.detail || 'Erro ao realizar inscrição. Tente novamente.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async (shareMode = false) => {
    const element = document.getElementById('ficha-comprovante');
    if (!element || !comprovante) return;

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      // Ignora erros de cores não suportadas do CSS/Tailwind (oklch)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.getElementById('ficha-comprovante');
          if (clonedEl) {
            clonedEl.style.color = '#000000';
            clonedEl.style.backgroundColor = '#ffffff';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      if (shareMode && navigator.share) {
        const pdfBlob = pdf.output('blob');
        const file = new File([pdfBlob], `Inscricao_CMT_XIII_${comprovante.aluno_cpf}.pdf`, { type: 'application/pdf' });
        await navigator.share({
          title: 'Comprovante de Inscrição CMT XIII',
          text: 'Ficha de Inscrição - Seletivo 2027',
          files: [file],
        });
      } else {
        pdf.save(`Inscricao_CMT_XIII_${comprovante.aluno_cpf}.pdf`);
      }
    } catch (err: any) {
      console.error('Erro na geração do PDF:', err);
      alert('Erro ao gerar o arquivo PDF. Verifique o console.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center p-2 sm:p-4 md:p-8 font-sans">
      {/* CABEÇALHO COM COR BRANCA FORÇADA NO TÍTULO */}
      <header className="w-full max-w-3xl bg-[#002b66] text-white rounded-t-2xl shadow-2xl border-b-4 border-[#ffcc00] overflow-hidden">
        <div className="bg-[#cc0000] text-white text-center text-[10px] sm:text-xs font-black uppercase py-1 tracking-widest px-2">
          A DISCIPLINA COMO MEIO, O SABER COMO FIM.
        </div>
        
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full p-1.5 flex items-center justify-center shadow-lg border-2 border-[#ffcc00] shrink-0">
            <img 
              src={`${import.meta.env.BASE_URL}Logo_CMT_XIII.png`} 
              alt="Logo CMT XIII" 
              className="w-full h-full object-contain" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }} 
            />
          </div>
          <div>
            {/* COR BRANCA ABSOLUTA FIXADA VIA STYLE */}
            <h1 
              style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }} 
              className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wide"
            >
              COLÉGIO MILITAR TIRADENTES XIII
            </h1>
            <p className="text-slate-200 font-bold text-xs sm:text-sm tracking-wide">Coroatá - Maranhão</p>
            <div className="mt-2 inline-block bg-[#ffcc00] text-[#002b66] px-4 py-1 rounded-full font-black text-xs sm:text-sm shadow border border-yellow-200 uppercase">
              SELETIVO 2027
            </div>
          </div>
        </div>
      </header>

      {/* CORPO DO FORMULÁRIO */}
      <div className="w-full max-w-3xl bg-white p-4 sm:p-8 rounded-b-2xl shadow-2xl border-x border-b border-gray-300">
        {step <= 4 && (
          <>
            {/* ETAPAS / STEPPER COM NOME 'PAGAMENTO' */}
            <div className="grid grid-cols-4 gap-1 mb-6 border-b pb-4">
              {[
                { stepNum: 1, label: 'Resp.' },
                { stepNum: 2, label: 'Aluno' },
                { stepNum: 3, label: 'Fotos' },
                { stepNum: 4, label: 'Pagamento' },
              ].map(item => (
                <div key={item.stepNum} className="flex flex-col items-center text-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm ${
                    step === item.stepNum ? 'bg-[#002b66] text-white ring-2 ring-[#ffcc00]' : step > item.stepNum ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > item.stepNum ? '✓' : item.stepNum}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold mt-1 ${step === item.stepNum ? 'text-[#002b66]' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ETAPA 1: RESPONSÁVEL */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-base sm:text-lg font-black text-[#002b66] flex items-center gap-2 border-b pb-2">
                    <User className="w-5 h-5 text-[#cc0000]" /> 1. Dados do Responsável Legal
                  </h2>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Nome Completo do Responsável *</label>
                    <input type="text" name="responsavel_nome" required value={formData.responsavel_nome} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#002b66] outline-none" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">CPF do Responsável *</label>
                      <input type="text" name="responsavel_cpf" required placeholder="Apenas números" value={formData.responsavel_cpf} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#002b66] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Telefone (WhatsApp) *</label>
                      <input type="text" name="responsavel_telefone" required placeholder="(99) 99999-9999" value={formData.responsavel_telefone} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#002b66] outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Endereço Completo *</label>
                    <textarea name="responsavel_endereco" required rows={2} value={formData.responsavel_endereco} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#002b66] outline-none" />
                  </div>
                </div>
              )}

              {/* ETAPA 2: ALUNO */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-base sm:text-lg font-black text-[#002b66] flex items-center gap-2 border-b pb-2">
                    <Heart className="w-5 h-5 text-[#cc0000]" /> 2. Dados Pessoais do Aluno(a)
                  </h2>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Nome Completo do Aluno(a) *</label>
                    <input type="text" name="aluno_nome" required value={formData.aluno_nome} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#002b66] outline-none" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">CPF do Aluno(a) *</label>
                      <input type="text" name="aluno_cpf" required placeholder="Apenas números" value={formData.aluno_cpf} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#002b66] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Data de Nascimento *</label>
                      <input type="date" name="data_nascimento" required value={formData.data_nascimento} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#002b66] outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Série que irá Cursar em 2027 *</label>
                    <select name="serie" value={formData.serie} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#002b66] outline-none font-medium">
                      <option value="6º Ano - Ensino Fundamental">6º Ano do Ensino Fundamental - Anos finais</option>
                      <option value="7º Ano - Ensino Fundamental">7º Ano do Ensino Fundamental - Anos finais</option>
                      <option value="8º Ano - Ensino Fundamental">8º Ano do Ensino Fundamental - Anos finais</option>
                      <option value="9º Ano - Ensino Fundamental">9º Ano do Ensino Fundamental - Anos finais</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ETAPA 3: FOTO + PCD/BENEFÍCIO */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-base sm:text-lg font-black text-[#002b66] flex items-center gap-2 border-b pb-2">
                    <Camera className="w-5 h-5 text-[#cc0000]" /> 3. Foto de Rosto do Aluno(a)
                  </h2>

                  {/* UPLOAD DE FOTO COM SELFIE (OPÇÃO CÂMERA E GALERIA) */}
                  <div className="bg-slate-50 border-2 border-dashed border-[#002b66]/30 p-4 sm:p-6 rounded-2xl text-center">
                    <div className="flex flex-col items-center gap-3">
                      {fotoPreview ? (
                        <div className="relative">
                          <img src={fotoPreview} alt="Preview Foto" className="w-32 h-32 object-cover rounded-full border-4 border-[#002b66] shadow-lg" />
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full absolute bottom-0 left-1/2 -translate-x-1/2">
                            Foto Carregada
                          </span>
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-[#002b66]/10 rounded-full flex items-center justify-center text-[#002b66]">
                          <Camera className="w-10 h-10" />
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
                        {/* Botão Câmera/Selfie para Celulares (com fallback de arquivo) */}
                        <label className="flex-1 bg-[#cc0000] text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer hover:bg-red-700 transition">
                          <Camera className="w-4 h-4" /> Tirar Selfie / Câmera
                          <input type="file" accept="image/*" capture="user" onChange={handleFotoChange} className="hidden" />
                        </label>

                        {/* Botão para carregar Foto Existente */}
                        <label className="flex-1 bg-[#002b66] text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer hover:bg-blue-900 transition">
                          <Upload className="w-4 h-4" /> Selecionar Arquivo
                          <input type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* PCD */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                    <p className="font-bold text-xs sm:text-sm text-gray-800">O aluno é Pessoa com Deficiência (PCD)? *</p>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 font-bold text-sm cursor-pointer">
                        <input type="radio" name="pcd_radio" checked={formData.is_pcd} onChange={() => setFormData(p => ({ ...p, is_pcd: true }))} /> Sim
                      </label>
                      <label className="flex items-center gap-2 font-bold text-sm cursor-pointer">
                        <input type="radio" name="pcd_radio" checked={!formData.is_pcd} onChange={() => setFormData(p => ({ ...p, is_pcd: false, tipo_deficiencia: '' }))} /> Não
                      </label>
                    </div>
                    {formData.is_pcd && (
                      <input type="text" name="tipo_deficiencia" required placeholder="Informe o tipo de deficiência" value={formData.tipo_deficiencia} onChange={handleChange} className="w-full mt-2 p-2 border rounded-lg text-sm outline-none" />
                    )}
                  </div>

                  {/* BENEFÍCIO */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                    <p className="font-bold text-xs sm:text-sm text-gray-800">O aluno recebe Benefício Social? *</p>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 font-bold text-sm cursor-pointer">
                        <input type="radio" name="ben_radio" checked={formData.recebe_beneficio} onChange={() => setFormData(p => ({ ...p, recebe_beneficio: true }))} /> Sim
                      </label>
                      <label className="flex items-center gap-2 font-bold text-sm cursor-pointer">
                        <input type="radio" name="ben_radio" checked={!formData.recebe_beneficio} onChange={() => setFormData(p => ({ ...p, recebe_beneficio: false, nis: '' }))} /> Não
                      </label>
                    </div>
                    {formData.recebe_beneficio && (
                      <input type="text" name="nis" required placeholder="Informe o número do NIS" value={formData.nis} onChange={handleChange} className="w-full mt-2 p-2 border rounded-lg text-sm outline-none" />
                    )}
                  </div>
                </div>
              )}

              {/* ETAPA 4: TAXA DE INSCRIÇÃO & PAGAMENTO */}
              {step === 4 && (
                <div className="space-y-5">
                  <h2 className="text-base sm:text-lg font-black text-[#002b66] flex items-center gap-2 border-b pb-2">
                    <CreditCard className="w-5 h-5 text-[#cc0000]" /> 4. Pagamento da Taxa de Inscrição
                  </h2>

                  <div className="bg-blue-50 border-2 border-[#002b66] p-4 sm:p-6 rounded-2xl text-center space-y-3">
                    <span className="bg-[#cc0000] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      Taxa de Inscrição: R$ 50,00
                    </span>
                    <p className="text-xs sm:text-sm text-gray-700 font-semibold pt-1">
                      Efetue o pagamento de <strong>R$ 50,00</strong> via Pix utilizando a chave abaixo:
                    </p>

                    <div className="flex items-center justify-center gap-2 bg-white p-3 rounded-xl border border-blue-200 shadow-inner max-w-md mx-auto">
                      <span className="font-mono font-bold text-slate-800 text-sm sm:text-base">12346578911</span>
                      <button type="button" onClick={copyPixKey} className="bg-[#002b66] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-900">
                        {pixCopiado ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        {pixCopiado ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 p-4 sm:p-6 rounded-2xl bg-gray-50 text-center">
                    <label className="block text-xs sm:text-sm font-bold text-[#002b66] mb-2">
                      Anexe o Comprovante do Pix (Foto ou PDF) *
                    </label>
                    <label className="inline-flex items-center justify-center gap-2 bg-[#002b66] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer shadow-md hover:bg-blue-900">
                      <FileText className="w-4 h-4" /> Escolher Comprovante
                      <input type="file" accept="image/*,application/pdf" onChange={handlePixChange} className="hidden" />
                    </label>
                    {pixPreview && (
                      <p className="text-xs font-bold text-emerald-700 mt-2">✓ Arquivo Selecionado: {pixPreview}</p>
                    )}
                  </div>
                </div>
              )}

              {/* BOTOES DE NAVEGACAO */}
              <div className="flex justify-between items-center pt-5 border-t">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 bg-gray-200 text-gray-800 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-gray-300">
                    <ChevronLeft className="w-4 h-4" /> Voltar
                  </button>
                )}
                {step < 4 ? (
                  <button type="button" onClick={() => setStep(s => s + 1)} className="ml-auto flex items-center gap-1 bg-[#002b66] text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-900 shadow-md">
                    Próximo <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="submit" disabled={loading} className="ml-auto flex items-center gap-2 bg-emerald-600 text-white px-6 sm:px-8 py-3 rounded-xl font-black text-xs sm:text-sm hover:bg-emerald-700 shadow-xl">
                    {loading ? 'Enviando...' : 'Concluir Inscrição ✓'}
                  </button>
                )}
              </div>
            </form>
          </>
        )}

        {/* COMPROVANTE E FICHA DE INSCRIÇÃO PDF */}
        {step === 5 && comprovante && (
          <div className="space-y-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
            <h2 className="text-xl sm:text-2xl font-black text-[#002b66]">Inscrição Concluída com Sucesso!</h2>
            <p className="text-xs sm:text-sm text-gray-600">Baixe ou compartilhe sua Ficha de Inscrição Oficial abaixo.</p>

            {/* DIV DO COMPROVANTE COM CORES HEX (COMPATÍVEIS COM HTML2CANVAS) */}
            <div 
              id="ficha-comprovante" 
              style={{ backgroundColor: '#ffffff', color: '#1e293b', borderColor: '#002b66' }}
              className="p-4 sm:p-6 border-2 rounded-2xl text-left space-y-4 shadow"
            >
              <div 
                style={{ borderColor: '#002b66' }} 
                className="flex justify-between items-center border-b-2 pb-3"
              >
                <div className="flex items-center gap-3">
                  <img src={`${import.meta.env.BASE_URL}Logo_CMT_XIII.png`} alt="Logo" className="w-12 h-12 object-contain" />
                  <div>
                    <h3 style={{ color: '#002b66' }} className="font-black text-xs sm:text-sm">COLÉGIO MILITAR TIRADENTES XIII</h3>
                    <p style={{ color: '#64748b' }} className="text-[10px] font-bold">COROATÁ - MARANHÃO</p>
                  </div>
                </div>
                <div className="text-right">
                  <span style={{ color: '#64748b' }} className="text-[10px] font-bold block">INSCRIÇÃO</span>
                  <span style={{ color: '#cc0000' }} className="text-base sm:text-lg font-black">#{comprovante.id}</span>
                </div>
              </div>

              <div style={{ color: '#334155' }} className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
                <div><strong>Aluno:</strong> {comprovante.aluno_nome}</div>
                <div><strong>CPF Aluno:</strong> {comprovante.aluno_cpf}</div>
                <div><strong>Série Pretendida:</strong> {comprovante.serie}</div>
                <div><strong>Responsável:</strong> {comprovante.responsavel_nome}</div>
                <div><strong>CPF Responsável:</strong> {comprovante.responsavel_cpf}</div>
                <div><strong>Telefone:</strong> {comprovante.responsavel_telefone}</div>
                <div><strong>PCD:</strong> {comprovante.is_pcd ? `Sim (${comprovante.tipo_deficiencia})` : 'Não'}</div>
                <div><strong>Benefício Social:</strong> {comprovante.recebe_beneficio ? `Sim (NIS: ${comprovante.nis})` : 'Não'}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button onClick={() => handleGeneratePDF(false)} className="bg-[#002b66] text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md">
                <Download className="w-4 h-4" /> Baixar Ficha PDF
              </button>
              {typeof navigator.share === 'function' && (
                <button onClick={() => handleGeneratePDF(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md">
                  <Share2 className="w-4 h-4" /> Compartilhar
                </button>
              )}
            </div>
          </div>
        )} 
      </div>
    </div>
  );
};