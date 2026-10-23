import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Printer, Edit, Trash2, LogOut, FileText, Image as ImageIcon, Download } from 'lucide-react';

const API_URL = 'https://gille3470.c35.integrator.host';

interface AlunoMatricula {
  id: number;
  nome: string;
  cpf: string;
  data_nascimento: string;
  serie: string;
  is_pcd: boolean;
  tipo_deficiencia: string;
  recebe_beneficio: boolean;
  nis: string;
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_telefone: string;
  responsavel_endereco: string;
  foto_aluno_path?: string;
  comprovante_pix_path?: string;
}

interface AdmProps {
  onLogout: () => void;
}

export const Adm: React.FC<AdmProps> = ({ onLogout }) => {
  const [matriculas, setMatriculas] = useState<AlunoMatricula[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroTurma, setFiltroTurma] = useState('TODAS');
  const [editAluno, setEditAluno] = useState<AlunoMatricula | null>(null);

  useEffect(() => {
    carregarMatriculas();
  }, []);

  const carregarMatriculas = async () => {
    setLoading(true);
    try {
      const response = await axios.get<AlunoMatricula[]>(`${API_URL}/matriculas`);
      setMatriculas(response.data);
    } catch (err) {
      alert('Erro ao carregar lista de matrículas.');
    } finally {
      setLoading(false);
    }
  };

  const matriculasFiltradas = matriculas.filter(m => {
    const matchNome = m.nome.toLowerCase().includes(filtroNome.toLowerCase()) || m.cpf.includes(filtroNome);
    const matchTurma = filtroTurma === 'TODAS' || m.serie === filtroTurma;
    return matchNome && matchTurma;
  });

  const turmasCount = {
    total: matriculas.length,
    ano6: matriculas.filter(m => m.serie.includes('6º')).length,
    ano7: matriculas.filter(m => m.serie.includes('7º')).length,
    ano8: matriculas.filter(m => m.serie.includes('8º')).length,
    ano9: matriculas.filter(m => m.serie.includes('9º')).length,
  };

  const handlePrintRelatorio = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Relatório de Alunos Inscritos - CMT XIII</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2, h4 { margin: 5px 0; text-align: center; color: #002b66; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #002b66; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h2>COLÉGIO MILITAR TIRADENTES XIII - COROATÁ/MA</h2>
          <h4>RELATÓRIO DE INSCRITOS - SELETIVO 2027</h4>
          <p><strong>Filtro de Turma:</strong> ${filtroTurma} | <strong>Total Registrado:</strong> ${matriculasFiltradas.length}</p>
          <table>
            <thead>
              <tr>
                <th>#ID</th>
                <th>Nome do Aluno</th>
                <th>CPF Aluno</th>
                <th>Série / Turma</th>
                <th>Responsável</th>
                <th>Telefone</th>
              </tr>
            </thead>
            <tbody>
              ${matriculasFiltradas.map(a => `
                <tr>
                  <td>#${a.id}</td>
                  <td>${a.nome}</td>
                  <td>${a.cpf}</td>
                  <td>${a.serie}</td>
                  <td>${a.responsavel_nome}</td>
                  <td>${a.responsavel_telefone}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAluno) return;

    try {
      await axios.put(`${API_URL}/matriculas/${editAluno.id}`, editAluno);
      alert('Dados atualizados com sucesso!');
      setEditAluno(null);
      carregarMatriculas();
    } catch (err) {
      alert('Erro ao salvar alterações.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja remover esta inscrição?')) {
      try {
        await axios.delete(`${API_URL}/matriculas/${id}`);
        carregarMatriculas();
      } catch (err) {
        alert('Erro ao excluir matrícula.');
      }
    }
  };

  const handleDownloadFile = async (fileName: string, defaultName: string) => {
    try {
      const fileUrl = `${API_URL}/uploads/${fileName}`;
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error('Arquivo não encontrado no servidor.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const extension = fileName.split('.').pop() || 'jpg';
      link.download = `${defaultName}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erro ao baixar arquivo. Verifique se o arquivo existe no servidor.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      {/* CABEÇALHO */}
      <header className="bg-[#002b66] text-white p-5 rounded-2xl shadow-xl flex justify-between items-center mb-6 border-b-4 border-[#ffcc00]">
        <div>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-wide" style={{ color: '#ffffff' }}>
            PAINEL ADMINISTRATIVO
          </h1>
          <p className="text-xs text-[#ffcc00] font-bold mt-1">Colégio Militar Tiradentes XIII - Coroatá/MA</p>
        </div>
        
        {/* BOTÃO SAIR */}
        <button 
          onClick={onLogout} 
          style={{ backgroundColor: '#cc0000', color: '#ffffff' }}
          className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md hover:opacity-90 transition cursor-pointer border-none"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </header>

      {/* DASHBOARD DE CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-md border-l-4 border-[#002b66]">
          <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">TOTAL INSCRIÇÕES</p>
          <p className="text-2xl sm:text-3xl font-black text-[#002b66] mt-1.5">{turmasCount.total}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-md border-l-4 border-emerald-600">
          <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">6º ANO</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-1.5">{turmasCount.ano6}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-md border-l-4 border-amber-500">
          <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">7º ANO</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-1.5">{turmasCount.ano7}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-md border-l-4 border-purple-600">
          <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">8º ANO</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-1.5">{turmasCount.ano8}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-md border-l-4 border-[#cc0000]">
          <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">9º ANO</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-1.5">{turmasCount.ano9}</p>
        </div>
      </div>

      {/* FILTROS E AÇÃO DE IMPRESSÃO */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-md mb-6 flex flex-col md:flex-row gap-3.5 justify-between items-center border border-gray-200">
        <div className="flex flex-col sm:flex-row flex-1 gap-3 w-full md:w-auto">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 z-10 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={filtroNome}
              onChange={e => setFiltroNome(e.target.value)}
              style={{ paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.6rem', paddingBottom: '0.6rem' }}
              className="w-full border border-gray-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#002b66] shadow-sm bg-white"
            />
          </div>
          <select
            value={filtroTurma}
            onChange={e => setFiltroTurma(e.target.value)}
            style={{ padding: '0.6rem 1rem' }}
            className="border border-gray-300 rounded-xl text-xs sm:text-sm bg-white font-bold outline-none shadow-sm text-gray-800"
          >
            <option value="TODAS">Todas as Turmas</option>
            <option value="6º Ano - Ensino Fundamental">6º Ano</option>
            <option value="7º Ano - Ensino Fundamental">7º Ano</option>
            <option value="8º Ano - Ensino Fundamental">8º Ano</option>
            <option value="9º Ano - Ensino Fundamental">9º Ano</option>
          </select>
        </div>

        {/* BOTÃO IMPRIMIR PDF */}
        <button 
          onClick={handlePrintRelatorio} 
          style={{ backgroundColor: '#059669', color: '#ffffff' }}
          className="w-full md:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition cursor-pointer border-none"
        >
          <Printer className="w-4 h-4" /> Imprimir Relatório PDF
        </button>
      </div>

      {/* TABELA DE INSCRITOS */}
      <div className="bg-white rounded-2xl shadow-md overflow-x-auto border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#002b66] text-white text-xs uppercase tracking-wider">
              <th className="p-4">Inscrição</th>
              <th className="p-4">Aluno</th>
              <th className="p-4">Turma</th>
              <th className="p-4">Responsável</th>
              <th className="p-4">Telefone</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="text-xs divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">Carregando matrículas...</td>
              </tr>
            ) : matriculasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">Nenhuma matrícula encontrada.</td>
              </tr>
            ) : matriculasFiltradas.map(aluno => (
              <tr key={aluno.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-black text-[#cc0000]">#{aluno.id}</td>
                <td className="p-4 font-bold text-gray-900">
                  {aluno.nome}
                  <br/>
                  <span className="text-[10px] text-gray-400 font-medium">{aluno.cpf}</span>
                </td>
                <td className="p-4 font-semibold text-gray-700">{aluno.serie}</td>
                <td className="p-4 font-medium text-gray-800">{aluno.responsavel_nome}</td>
                <td className="p-4 font-medium text-gray-800">{aluno.responsavel_telefone}</td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {/* BOTÃO EDITAR */}
                    <button 
                      onClick={() => setEditAluno(aluno)} 
                      title="Editar Ficha"
                      style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                      className="p-2.5 rounded-xl shadow-md hover:opacity-90 transition cursor-pointer border-none"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* BOTÃO EXCLUIR */}
                    <button 
                      onClick={() => handleDelete(aluno.id)} 
                      title="Excluir Inscrição"
                      style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                      className="p-2.5 rounded-xl shadow-md hover:opacity-90 transition cursor-pointer border-none"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE EDIÇÃO E CONFERÊNCIA DE DOCUMENTOS */}
      {editAluno && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto border-t-4 border-[#002b66]">
            <h3 className="text-base font-black text-[#002b66] border-b pb-3 mb-4">Editar Ficha de Matrícula #{editAluno.id}</h3>
            
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Nome do Aluno</label>
                  <input type="text" value={editAluno.nome} onChange={e => setEditAluno({ ...editAluno, nome: e.target.value })} style={{ padding: '0.6rem 0.8rem' }} className="w-full border rounded-lg outline-none focus:ring-2 focus:ring-[#002b66]" />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">CPF Aluno</label>
                  <input type="text" value={editAluno.cpf} onChange={e => setEditAluno({ ...editAluno, cpf: e.target.value })} style={{ padding: '0.6rem 0.8rem' }} className="w-full border rounded-lg outline-none focus:ring-2 focus:ring-[#002b66]" />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Série Pretendida</label>
                  <select value={editAluno.serie} onChange={e => setEditAluno({ ...editAluno, serie: e.target.value })} style={{ padding: '0.6rem 0.8rem' }} className="w-full border rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#002b66]">
                    <option value="6º Ano - Ensino Fundamental">6º Ano</option>
                    <option value="7º Ano - Ensino Fundamental">7º Ano</option>
                    <option value="8º Ano - Ensino Fundamental">8º Ano</option>
                    <option value="9º Ano - Ensino Fundamental">9º Ano</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Responsável Legal</label>
                  <input type="text" value={editAluno.responsavel_nome} onChange={e => setEditAluno({ ...editAluno, responsavel_nome: e.target.value })} style={{ padding: '0.6rem 0.8rem' }} className="w-full border rounded-lg outline-none focus:ring-2 focus:ring-[#002b66]" />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Telefone Responsável</label>
                  <input type="text" value={editAluno.responsavel_telefone} onChange={e => setEditAluno({ ...editAluno, responsavel_telefone: e.target.value })} style={{ padding: '0.6rem 0.8rem' }} className="w-full border rounded-lg outline-none focus:ring-2 focus:ring-[#002b66]" />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Endereço</label>
                  <input type="text" value={editAluno.responsavel_endereco} onChange={e => setEditAluno({ ...editAluno, responsavel_endereco: e.target.value })} style={{ padding: '0.6rem 0.8rem' }} className="w-full border rounded-lg outline-none focus:ring-2 focus:ring-[#002b66]" />
                </div>
              </div>

              {/* SEÇÃO DE CONFERÊNCIA DE DOCUMENTOS ANEXADOS */}
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 space-y-3 mt-2">
                <p className="font-black text-[#002b66] uppercase text-[11px] tracking-wider border-b pb-1">Conferência de Documentos / Anexos</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* COMPROVANTE PIX */}
                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="font-bold text-gray-800 text-xs flex items-center gap-1.5 mb-1">
                        <FileText className="w-4 h-4 text-[#002b66]" /> Comprovante de Pagamento
                      </p>
                      {editAluno.recebe_beneficio ? (
                        <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                          Isento (NIS: {editAluno.nis || 'Não informado'})
                        </span>
                      ) : editAluno.comprovante_pix_path ? (
                        <p className="text-[10px] text-gray-500 truncate">Arquivo: {editAluno.comprovante_pix_path}</p>
                      ) : (
                        <p className="text-[10px] text-red-600 font-semibold">Nenhum comprovante anexado</p>
                      )}
                    </div>

                    {editAluno.comprovante_pix_path && (
                      <button 
                        type="button"
                        onClick={() => handleDownloadFile(editAluno.comprovante_pix_path!, `Comprovante_Pix_Aluno_${editAluno.id}`)}
                        className="mt-2.5 bg-[#002b66] hover:bg-blue-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border-none"
                      >
                        <Download className="w-3.5 h-3.5" /> Baixar Comprovante
                      </button>
                    )}
                  </div>

                  {/* FOTO DO ALUNO */}
                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="font-bold text-gray-800 text-xs flex items-center gap-1.5 mb-1">
                        <ImageIcon className="w-4 h-4 text-[#002b66]" /> Foto de Rosto do Aluno
                      </p>
                      {editAluno.foto_aluno_path ? (
                        <p className="text-[10px] text-gray-500 truncate">Arquivo: {editAluno.foto_aluno_path}</p>
                      ) : (
                        <p className="text-[10px] text-red-600 font-semibold">Nenhuma foto anexada</p>
                      )}
                    </div>

                    {editAluno.foto_aluno_path && (
                      <button 
                        type="button"
                        onClick={() => handleDownloadFile(editAluno.foto_aluno_path!, `Foto_Aluno_${editAluno.id}`)}
                        className="mt-2.5 bg-[#002b66] hover:bg-blue-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border-none"
                      >
                        <Download className="w-3.5 h-3.5" /> Baixar Foto do Aluno
                      </button>
                    )}
                  </div>

                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t">
                <button type="button" onClick={() => setEditAluno(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition cursor-pointer">Cancelar</button>
                <button type="submit" style={{ backgroundColor: '#059669', color: '#ffffff' }} className="px-5 py-2 rounded-xl font-bold hover:opacity-90 shadow transition border-none cursor-pointer">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};