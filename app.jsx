import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookOpen, Calendar as CalendarIcon, CheckSquare, Heart, Clock,
  Star, Award, Book, PenTool, Globe, Sun, ShieldCheck,
  Music, Activity, Edit3, Plus, Settings, Trash2, Lock, Unlock,
  Lightbulb, CheckCircle2, XCircle, Home, Smile, ChevronLeft, ChevronRight,
  TrendingUp, Zap
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const appFirebase = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = appFirebase ? getAuth(appFirebase) : null;
const db = appFirebase ? getFirestore(appFirebase) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- GRADE HORÁRIA ---
const gradeOlavoBilac1201 = {
  Segunda: [
    { id: 1, horario: '13h–13h50', materia: 'Português', icone: Book, cor: '#4F8EF7' },
    { id: 2, horario: '13h50–14h40', materia: 'Português', icone: Book, cor: '#4F8EF7' },
    { id: 3, horario: '14h40–15h30', materia: 'Português', icone: Book, cor: '#4F8EF7' },
    { id: 4, horario: '15h30–15h45', materia: 'Recreio 🎉', icone: Clock, cor: '#F5A623' },
    { id: 5, horario: '15h50–16h40', materia: 'História', icone: Globe, cor: '#E07B54' },
    { id: 6, horario: '16h40–17h30', materia: 'História', icone: Globe, cor: '#E07B54' },
  ],
  Terça: [
    { id: 7, horario: '13h–13h50', materia: 'Leiturização', icone: BookOpen, cor: '#7B6CF6' },
    { id: 8, horario: '13h50–14h40', materia: 'Ed. Física', icone: Activity, cor: '#34C98A' },
    { id: 9, horario: '14h40–15h30', materia: 'Musicalização', icone: Music, cor: '#F76B8A' },
    { id: 10, horario: '15h30–15h45', materia: 'Recreio 🎉', icone: Clock, cor: '#F5A623' },
    { id: 11, horario: '15h50–16h40', materia: 'Ortografia', icone: Edit3, cor: '#4F8EF7' },
    { id: 12, horario: '16h40–17h30', materia: 'Empreendedorismo', icone: Star, cor: '#F5A623' },
  ],
  Quarta: [
    { id: 13, horario: '13h–13h50', materia: 'Matemática', icone: PenTool, cor: '#E74C3C' },
    { id: 14, horario: '13h50–14h40', materia: 'Matemática', icone: PenTool, cor: '#E74C3C' },
    { id: 15, horario: '14h40–15h30', materia: 'Matemática', icone: PenTool, cor: '#E74C3C' },
    { id: 16, horario: '15h30–15h45', materia: 'Recreio 🎉', icone: Clock, cor: '#F5A623' },
    { id: 17, horario: '15h50–16h40', materia: 'Geografia', icone: Globe, cor: '#34C98A' },
    { id: 18, horario: '16h40–17h30', materia: 'Geografia', icone: Globe, cor: '#34C98A' },
  ],
  Quinta: [
    { id: 19, horario: '13h–13h50', materia: 'Ciências', icone: Sun, cor: '#1ABC9C' },
    { id: 20, horario: '13h50–14h40', materia: 'Ciências', icone: Sun, cor: '#1ABC9C' },
    { id: 21, horario: '14h40–15h30', materia: 'Cálculo', icone: PenTool, cor: '#E74C3C' },
    { id: 22, horario: '15h30–15h45', materia: 'Recreio 🎉', icone: Clock, cor: '#F5A623' },
    { id: 23, horario: '15h50–16h40', materia: 'Laboratório', icone: Award, cor: '#9B59B6' },
    { id: 24, horario: '16h40–17h30', materia: 'Arte', icone: Star, cor: '#E91E8C' },
  ],
  Sexta: [
    { id: 25, horario: '13h–13h50', materia: 'Inglês', icone: Globe, cor: '#2980B9' },
    { id: 26, horario: '13h50–14h40', materia: 'Matemática', icone: PenTool, cor: '#E74C3C' },
    { id: 27, horario: '14h40–15h30', materia: 'Matemática', icone: PenTool, cor: '#E74C3C' },
    { id: 28, horario: '15h30–15h45', materia: 'Recreio 🎉', icone: Clock, cor: '#F5A623' },
    { id: 29, horario: '15h50–16h40', materia: 'Português', icone: Book, cor: '#4F8EF7' },
    { id: 30, horario: '16h40–17h30', materia: 'Português', icone: Book, cor: '#4F8EF7' },
  ]
};

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const diasJS = [1, 2, 3, 4, 5]; // Monday=1 ... Friday=5

function getDiaAtual() {
  const d = new Date().getDay(); // 0=Dom, 1=Seg, ...
  const idx = diasJS.indexOf(d);
  return idx >= 0 ? diasSemana[idx] : 'Segunda';
}

function getDataHoje() {
  return new Date().toISOString().split('T')[0];
}

const iconesDisponiveis = { Book, PenTool, Globe, Sun, Star, Lightbulb, Award };

const avaliacoesIniciais = [
  { id: 1, data: '04/05', materia: 'Português', conteudo: 'Interpretação, Sinônimos, Frases.', iconeName: 'Book', cor: '#4F8EF7', revisado: false },
  { id: 2, data: '05/05', materia: 'Matemática', conteudo: 'Números ordinais, Material dourado.', iconeName: 'PenTool', cor: '#E74C3C', revisado: false },
  { id: 3, data: '06/05', materia: 'História', conteudo: 'Eu e os outros, Viver é conviver.', iconeName: 'Globe', cor: '#E07B54', revisado: false },
  { id: 4, data: '07/05', materia: 'Geografia', conteudo: 'Representação (Quadra/maquete).', iconeName: 'Globe', cor: '#34C98A', revisado: false },
  { id: 5, data: '08/05', materia: 'Ciências / Inglês', conteudo: 'Importância do Sol / Exercícios.', iconeName: 'Sun', cor: '#F5A623', revisado: false },
];

const missoesIniciais = [
  { id: 1, texto: 'Coloquei meu tênis (obrigatório!)', feito: false },
  { id: 2, texto: 'Minha garrafinha está com nome', feito: false },
  { id: 3, texto: 'Arrumei minha mochila', feito: false },
  { id: 4, texto: 'Estudei 15 minutinhos hoje', feito: false },
];

const defaultData = {
  aluno: { nome: 'Adriano', turma: '2º ano', ano: 2025 },
  avatarUrl: '',
  emocao: '😊',
  missoes: missoesIniciais,
  ultimoResetMissoes: '',
  avaliacoes: avaliacoesIniciais,
  simulado: [
    { id: 1, tipo: 'multiplaEscolha', materia: 'Português', pergunta: 'Qual é a palavra parecida (sinônimo) de FELIZ?', opcoes: ['Alegre', 'Triste', 'Bravo'], respostaCerta: 'Alegre' },
    { id: 2, tipo: 'texto', materia: 'Matemática', pergunta: 'Resolva usando os dedinhos: 5 + 3 = ?', respostaCerta: '8' },
    { id: 3, tipo: 'texto', materia: 'Ciências', pergunta: 'O animalzinho de estimação que faz "MIAU" se chama:', respostaCerta: 'gato' },
    { id: 4, tipo: 'multiplaEscolha', materia: 'História', pergunta: 'Para vivermos bem com os amigos, devemos:', opcoes: ['Brigar', 'Respeitar e ajudar', 'Esconder brinquedos'], respostaCerta: 'Respeitar e ajudar' },
  ],
  nosDeAfeto: 2,
  mensagensAfeto: [
    { texto: "Bom dia, filhão! Deixei um nó no seu lençol e outro aqui no app. Te amo!", data: "hoje" },
    { texto: "Boa prova de Matemática! Você é fera no Material Dourado!", data: "ontem" },
  ],
  avisosEscola: [
    "Semana de provas (04/05 a 08/05): saída antecipada às 16h.",
    "29/04: Culminância do Projeto Exatas.",
  ],
  historicoSimulados: [],
  historicoEmocoes: [],
  senhaPais: '1234',
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function App() {
  const [data, setData] = useState(defaultData);
  const [user, setUser] = useState(null);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('hoje');
  const [diaSelecionado, setDiaSelecionado] = useState(getDiaAtual());
  const [isParentUnlocked, setIsParentUnlocked] = useState(false);
  const [inputSenha, setInputSenha] = useState('');
  const [erroSenha, setErroSenha] = useState(false);
  const [novaMissao, setNovaMissao] = useState('');
  const [novoAviso, setNovoAviso] = useState('');
  const [novaSenhaInput, setNovaSenhaInput] = useState('');
  const [novaProvaData, setNovaProvaData] = useState('');
  const [novaProvaMateria, setNovaProvaMateria] = useState('');
  const [novaProvaConteudo, setNovaProvaConteudo] = useState('');
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [pontos, setPontos] = useState(0);
  const [quizFinalizado, setQuizFinalizado] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [respostaTexto, setRespostaTexto] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [msgAfeto, setMsgAfeto] = useState('');
  const nomeRef = useRef(null);
  const saveTimerRef = useRef(null);
  const emojis = ['😊','😂','😎','🤓','🥳','🤩','😴','😤','😭','🤯','🦸‍♂️','🚀','⭐','❤️','💪','🎯'];

  // EFEITO 1: AUTH
  useEffect(() => {
    const timer = setTimeout(() => setIsDbLoaded(true), 2500);
    if (!auth) { setIsDbLoaded(true); return () => clearTimeout(timer); }
    const init = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error(e); setIsDbLoaded(true); }
    };
    init();
    const unsub = onAuthStateChanged(auth, setUser);
    return () => { clearTimeout(timer); unsub(); };
  }, []);

  // EFEITO 2: FIRESTORE SYNC
  useEffect(() => {
    if (!user || !db) return;
    const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'state');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setData(snap.data());
      } else {
        setDoc(ref, defaultData).catch(console.error);
      }
      setIsDbLoaded(true);
    }, () => setIsDbLoaded(true));
    return () => unsub();
  }, [user]);

  // EFEITO 3: RESET AUTOMÁTICO DE MISSÕES
  useEffect(() => {
    const hoje = getDataHoje();
    if (data.ultimoResetMissoes !== hoje && isDbLoaded) {
      const missoesReset = data.missoes.map(m => ({ ...m, feito: false }));
      updateData({ missoes: missoesReset, ultimoResetMissoes: hoje });
    }
  }, [isDbLoaded]);

  const updateData = useCallback((updates) => {
    setData(prev => {
      const newData = { ...prev, ...updates };
      if (user && db) {
        const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'state');
        setDoc(ref, newData).catch(console.error);
      }
      return newData;
    });
  }, [user]);

  const toggleMissao = (id) => updateData({ missoes: data.missoes.map(m => m.id === id ? { ...m, feito: !m.feito } : m) });
  const toggleRevisao = (id) => updateData({ avaliacoes: data.avaliacoes.map(a => a.id === id ? { ...a, revisado: !a.revisado } : a) });
  const progressoMissoes = data.missoes.length ? Math.round(data.missoes.filter(m => m.feito).length / data.missoes.length * 100) : 0;

  const adicionarMissao = () => {
    if (novaMissao.trim()) {
      updateData({ missoes: [...data.missoes, { id: Date.now(), texto: novaMissao.trim(), feito: false }] });
      setNovaMissao('');
    }
  };
  const removerMissao = (id) => updateData({ missoes: data.missoes.filter(m => m.id !== id) });
  const adicionarAviso = () => {
    if (novoAviso.trim()) {
      updateData({ avisosEscola: [novoAviso.trim(), ...data.avisosEscola] });
      setNovoAviso('');
    }
  };
  const removerAviso = (idx) => updateData({ avisosEscola: data.avisosEscola.filter((_, i) => i !== idx) });

  const adicionarAvaliacao = () => {
    if (!novaProvaData.trim() || !novaProvaMateria.trim() || !novaProvaConteudo.trim()) return;
    const mat = novaProvaMateria.toLowerCase();
    let iconeName = 'Star', cor = '#9B59B6';
    if (mat.includes('port')) { iconeName = 'Book'; cor = '#4F8EF7'; }
    else if (mat.includes('mat') || mat.includes('calc')) { iconeName = 'PenTool'; cor = '#E74C3C'; }
    else if (mat.includes('hist') || mat.includes('geo') || mat.includes('ing')) { iconeName = 'Globe'; cor = '#34C98A'; }
    else if (mat.includes('ciên') || mat.includes('cien')) { iconeName = 'Sun'; cor = '#1ABC9C'; }
    updateData({
      avaliacoes: [...data.avaliacoes, { id: Date.now(), data: novaProvaData, materia: novaProvaMateria, conteudo: novaProvaConteudo, iconeName, cor, revisado: false }]
    });
    setNovaProvaData(''); setNovaProvaMateria(''); setNovaProvaConteudo('');
  };
  const removerAvaliacao = (id) => updateData({ avaliacoes: data.avaliacoes.filter(a => a.id !== id) });

  const enviarAfeto = () => {
    if (!msgAfeto.trim()) return;
    const novaMsg = { texto: msgAfeto.trim(), data: new Date().toLocaleDateString('pt-BR') };
    updateData({ nosDeAfeto: data.nosDeAfeto + 1, mensagensAfeto: [novaMsg, ...data.mensagensAfeto] });
    setMsgAfeto('');
  };

  const verificarSenha = () => {
    if (inputSenha === data.senhaPais) { setIsParentUnlocked(true); setErroSenha(false); setInputSenha(''); }
    else setErroSenha(true);
  };

  const alterarSenha = () => {
    if (novaSenhaInput.trim().length >= 4) { updateData({ senhaPais: novaSenhaInput.trim() }); setNovaSenhaInput(''); alert('Senha alterada!'); }
    else alert('Mínimo 4 caracteres!');
  };

  const salvarNomeDebounced = (nome) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateData({ aluno: { ...data.aluno, nome } });
    }, 800);
  };

  // ===================== TELA: HOJE =====================
  const renderHoje = () => {
    const diaLabel = getDiaAtual();
    const aulasDia = gradeOlavoBilac1201[diaLabel] || [];
    const isWeekend = ![1,2,3,4,5].includes(new Date().getDay());
    const proxProva = data.avaliacoes.filter(a => !a.revisado)[0];
    const missoesPendentes = data.missoes.filter(m => !m.feito);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Saudação */}
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 28, padding: '24px 20px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 100, opacity: 0.08 }}>🎒</div>
          <p style={{ fontSize: 13, fontWeight: 700, opacity: 0.8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
            {isWeekend ? 'Final de semana!' : diaLabel}-feira
          </p>
          <h2 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 6px' }}>E aí, {data.aluno.nome}! 👋</h2>
          <p style={{ fontSize: 14, opacity: 0.85, margin: 0 }}>
            {isWeekend ? 'Hoje é dia de descanso e diversão!' : `Você tem ${aulasDia.length} aulas hoje.`}
          </p>
        </div>

        {/* Cards de status rápido */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div onClick={() => setActiveTab('missoes')} style={{ background: progressoMissoes === 100 ? '#d4edda' : '#fff', border: '2px solid', borderColor: progressoMissoes === 100 ? '#28a745' : '#f0f0f0', borderRadius: 20, padding: '16px 14px', cursor: 'pointer' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{progressoMissoes === 100 ? '🏆' : '⭐'}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: progressoMissoes === 100 ? '#28a745' : '#333' }}>{progressoMissoes}%</div>
            <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Missões do dia</div>
            <div style={{ height: 4, background: '#eee', borderRadius: 4, marginTop: 8 }}>
              <div style={{ height: 4, background: progressoMissoes === 100 ? '#28a745' : '#667eea', borderRadius: 4, width: `${progressoMissoes}%`, transition: 'width 0.5s ease' }} />
            </div>
          </div>
          <div onClick={() => setActiveTab('afeto')} style={{ background: '#fff5f7', border: '2px solid #ffe0e9', borderRadius: 20, padding: '16px 14px', cursor: 'pointer' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🪢</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#e91e63' }}>{data.nosDeAfeto}</div>
            <div style={{ fontSize: 12, color: '#c2185b', fontWeight: 600 }}>Nós de afeto</div>
            <div style={{ fontSize: 11, color: '#e91e63', marginTop: 8, opacity: 0.8 }}>Ver mensagens ›</div>
          </div>
        </div>

        {/* Missões pendentes */}
        {missoesPendentes.length > 0 && (
          <div style={{ background: '#fffbf0', border: '2px solid #ffeaa7', borderRadius: 20, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#b8860b', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>⚡ Falta completar</p>
            {missoesPendentes.slice(0, 3).map(m => (
              <div key={m.id} onClick={() => { toggleMissao(m.id); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #ffeaa7', cursor: 'pointer' }}>
                <div style={{ width: 22, height: 22, borderRadius: 8, border: '2px solid #f5a623', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: '#5a4000', fontWeight: 600 }}>{m.texto}</span>
              </div>
            ))}
            {missoesPendentes.length > 3 && <p style={{ fontSize: 12, color: '#b8860b', marginTop: 8, fontWeight: 700 }}>+{missoesPendentes.length - 3} mais...</p>}
          </div>
        )}

        {/* Próxima prova */}
        {proxProva && (
          <div onClick={() => setActiveTab('estudo')} style={{ background: '#f0f4ff', border: '2px solid #c7d2fe', borderRadius: 20, padding: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: proxProva.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {React.createElement(iconesDisponiveis[proxProva.iconeName] || Star, { size: 24, color: '#fff' })}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 2px' }}>📚 Próxima prova</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#1e1b4b', margin: '0 0 2px' }}>{proxProva.materia}</p>
              <p style={{ fontSize: 12, color: '#6366f1', margin: 0 }}>{proxProva.data} · {proxProva.conteudo}</p>
            </div>
            <ChevronRight size={18} color="#6366f1" />
          </div>
        )}

        {/* Aulas de hoje */}
        {!isWeekend && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Aulas de hoje</p>
            <div style={{ background: '#fff', borderRadius: 20, border: '2px solid #f0f0f0', overflow: 'hidden' }}>
              {aulasDia.map((aula, i) => {
                const Icon = aula.icone;
                const isRecreio = aula.materia.includes('Recreio');
                return (
                  <div key={aula.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: i < aulasDia.length - 1 ? '1px solid #f5f5f5' : 'none', background: isRecreio ? '#fffbf0' : '#fff' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${aula.cor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
                      <Icon size={18} color={aula.cor} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isRecreio ? '#b8860b' : '#333' }}>{aula.materia}</div>
                      <div style={{ fontSize: 11, color: '#aaa', fontWeight: 600 }}>{aula.horario}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Avisos */}
        {data.avisosEscola.length > 0 && (
          <div style={{ background: '#fff8e1', border: '2px solid #ffe082', borderRadius: 20, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#f57f17', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>📢 Avisos da escola</p>
            {data.avisosEscola.map((a, i) => (
              <p key={i} style={{ fontSize: 13, color: '#6d4c00', margin: '0 0 6px', lineHeight: 1.5 }}>• {a}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ===================== TELA: ROTINA =====================
  const renderRotina = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'linear-gradient(135deg, #4776e6, #8e54e9)', borderRadius: 28, padding: '22px 20px', color: '#fff' }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>Minha Rotina 🎒</h2>
        <p style={{ fontSize: 13, opacity: 0.85, margin: '0 0 18px' }}>Selecione o dia da semana</p>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {diasSemana.map(dia => (
            <button key={dia} onClick={() => setDiaSelecionado(dia)}
              style={{ padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', background: diaSelecionado === dia ? '#fff' : 'rgba(255,255,255,0.2)', color: diaSelecionado === dia ? '#5c35b3' : '#fff', transform: diaSelecionado === dia ? 'scale(1.05)' : 'scale(1)', transition: 'all 0.2s' }}>
              {dia}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 24, border: '2px solid #f0f0f0', overflow: 'hidden' }}>
        {(gradeOlavoBilac1201[diaSelecionado] || []).map((aula, i, arr) => {
          const Icon = aula.icone;
          const isRecreio = aula.materia.includes('Recreio');
          return (
            <div key={aula.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : 'none', background: isRecreio ? '#fffbf0' : '#fff' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `${aula.cor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                <Icon size={22} color={aula.cor} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: isRecreio ? '#b8860b' : '#222' }}>{aula.materia}</div>
                <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600, marginTop: 2 }}>{aula.horario}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ===================== TELA: ESTUDO =====================
  const renderEstudo = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'linear-gradient(135deg, #2193b0, #6dd5ed)', borderRadius: 28, padding: '22px 20px', color: '#fff' }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>Estude Comigo 🚀</h2>
        <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>Marque o que já revisou para a prova!</p>
      </div>
      {data.avaliacoes.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Nenhuma prova cadastrada. Tudo tranquilo! 😎</div>
      )}
      {data.avaliacoes.map(prova => {
        const Icon = iconesDisponiveis[prova.iconeName] || Star;
        return (
          <div key={prova.id} style={{ background: prova.revisado ? '#f0fff4' : '#fff', border: `2px solid ${prova.revisado ? '#28a745' : '#f0f0f0'}`, borderRadius: 24, padding: 18, transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{ width: 50, height: 50, borderRadius: 16, background: prova.revisado ? '#28a745' : prova.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {prova.revisado ? <CheckCircle2 size={26} color="#fff" /> : <Icon size={26} color="#fff" />}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: prova.revisado ? '#28a745' : '#222', textDecoration: prova.revisado ? 'line-through' : 'none' }}>{prova.materia}</div>
                <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>📅 {prova.data}</div>
              </div>
            </div>
            <div style={{ background: prova.revisado ? '#d4edda' : '#f8f9fa', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#555', lineHeight: 1.5 }}>
              <strong>Assunto:</strong> {prova.conteudo}
            </div>
            <button onClick={() => toggleRevisao(prova.id)}
              style={{ width: '100%', padding: '12px', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14, background: prova.revisado ? '#d4edda' : '#e8f0fe', color: prova.revisado ? '#28a745' : '#4f46e5', transition: 'all 0.2s' }}>
              {prova.revisado ? '✅ Revisão concluída!' : '📖 Marcar como estudado'}
            </button>
          </div>
        );
      })}
    </div>
  );

  // ===================== TELA: SIMULADO =====================
  const renderSimulado = () => {
    const perguntas = data.simulado || defaultData.simulado;
    if (!perguntas || perguntas.length === 0) {
      return <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Nenhuma pergunta cadastrada ainda!</div>;
    }

    if (quizFinalizado) {
      const pct = Math.round(pontos / perguntas.length * 100);
      const historico = [...(data.historicoSimulados || []), { data: new Date().toLocaleDateString('pt-BR'), pontos, total: perguntas.length, pct }].slice(-20);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', paddingTop: 20 }}>
          <div style={{ background: 'linear-gradient(135deg, #f7971e, #ffd200)', borderRadius: 28, padding: '32px 24px', color: '#fff', textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: 60, marginBottom: 8 }}>{pct >= 75 ? '🏆' : pct >= 50 ? '👍' : '💪'}</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 8px' }}>Fim de jogo!</h2>
            <p style={{ fontSize: 18, opacity: 0.9, margin: '0 0 20px' }}>Você acertou <strong>{pontos}</strong> de <strong>{perguntas.length}</strong></p>
            <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 12, padding: '8px 16px', marginBottom: 20, fontSize: 15, fontWeight: 700 }}>
              {pct}% de aproveitamento
            </div>
            <button onClick={() => {
              updateData({ historicoSimulados: historico });
              setPerguntaAtual(0); setPontos(0); setQuizFinalizado(false); setFeedback(null); setRespostaTexto('');
            }} style={{ background: '#fff', color: '#f57f17', border: 'none', borderRadius: 20, padding: '14px 32px', fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>
              Jogar de novo 🎮
            </button>
          </div>
          {(data.historicoSimulados || []).length > 0 && (
            <div style={{ width: '100%', background: '#fff', borderRadius: 20, border: '2px solid #f0f0f0', padding: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: '#888', textTransform: 'uppercase', marginBottom: 12 }}>📈 Histórico</p>
              {[...historico].reverse().slice(0, 5).map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                  <span style={{ color: '#888' }}>{h.data}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ height: 6, width: 80, background: '#eee', borderRadius: 4 }}>
                      <div style={{ height: 6, width: `${h.pct}%`, background: h.pct >= 75 ? '#28a745' : h.pct >= 50 ? '#f5a623' : '#e74c3c', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontWeight: 800, color: '#333' }}>{h.pontos}/{h.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    const pergunta = perguntas[perguntaAtual];
    const responder = (resposta) => {
      if (feedback) return;
      const certa = String(pergunta.respostaCerta).trim().toLowerCase();
      const dada = String(resposta).trim().toLowerCase();
      if (dada === certa) { setFeedback('certo'); setPontos(p => p + 1); }
      else setFeedback('errado');
      setTimeout(() => {
        setFeedback(null); setRespostaTexto('');
        if (perguntaAtual + 1 < perguntas.length) setPerguntaAtual(p => p + 1);
        else setQuizFinalizado(true);
      }, 2000);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'linear-gradient(135deg, #5c35b3, #7b6cf6)', borderRadius: 28, padding: '22px 20px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Super Simulado 🧠</h2>
            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>{perguntaAtual + 1}/{perguntas.length}</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 4, marginBottom: 14 }}>
            <div style={{ height: 4, background: '#fff', borderRadius: 4, width: `${(perguntaAtual / perguntas.length) * 100}%`, transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ background: '#fff', color: '#5c35b3', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 900, display: 'inline-block', marginBottom: 8 }}>{pergunta.materia}</span>
          <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, margin: 0 }}>{pergunta.pergunta}</p>
        </div>

        {pergunta.tipo === 'texto' ? (
          <div style={{ background: '#fff', borderRadius: 24, border: '2px solid #f0f0f0', padding: 20 }}>
            <input type="text" value={respostaTexto} onChange={e => setRespostaTexto(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && respostaTexto.trim() && responder(respostaTexto)}
              disabled={!!feedback} placeholder="Escreva aqui..."
              style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', padding: '14px', borderRadius: 14, border: `2px solid ${feedback === 'certo' ? '#28a745' : feedback === 'errado' ? '#e74c3c' : '#e0e0e0'}`, fontSize: 20, fontWeight: 900, marginBottom: 12, outline: 'none', background: feedback === 'certo' ? '#f0fff4' : feedback === 'errado' ? '#fff5f5' : '#fafafa' }} />
            <button onClick={() => responder(respostaTexto)} disabled={!!feedback || !respostaTexto.trim()}
              style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: feedback || !respostaTexto.trim() ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 15, background: feedback || !respostaTexto.trim() ? '#eee' : '#5c35b3', color: feedback || !respostaTexto.trim() ? '#aaa' : '#fff' }}>
              Confirmar
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(pergunta.opcoes || []).map((opcao, i) => {
              const isCerta = opcao === pergunta.respostaCerta;
              let bg = '#fff', border = '#e0e0e0', color = '#333';
              if (feedback) {
                if (isCerta) { bg = '#d4edda'; border = '#28a745'; color = '#155724'; }
                else if (feedback === 'errado') { bg = '#f8d7da'; border = '#f5c6cb'; color = '#721c24'; }
              }
              return (
                <button key={i} onClick={() => responder(opcao)} disabled={!!feedback}
                  style={{ width: '100%', textAlign: 'left', padding: '16px 18px', borderRadius: 20, border: `2px solid ${border}`, background: bg, color, fontSize: 15, fontWeight: 700, cursor: feedback ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}>
                  {opcao}
                  {feedback && isCerta && <CheckCircle2 size={20} color="#28a745" />}
                  {feedback === 'errado' && !isCerta && <XCircle size={20} color="#e74c3c" />}
                </button>
              );
            })}
          </div>
        )}

        {feedback === 'certo' && <p style={{ textAlign: 'center', color: '#28a745', fontWeight: 900, fontSize: 18 }}>Mandou bem! 🎉</p>}
        {feedback === 'errado' && <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#e74c3c', fontWeight: 800, fontSize: 16, margin: '0 0 4px' }}>Ops! A resposta certa era:</p>
          <p style={{ color: '#333', fontWeight: 900, fontSize: 20, margin: 0 }}>"{pergunta.respostaCerta}"</p>
        </div>}
      </div>
    );
  };

  // ===================== TELA: MISSÕES =====================
  const renderMissoes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'linear-gradient(135deg, #11998e, #38ef7d)', borderRadius: 28, padding: '22px 20px', color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 4 }}>{progressoMissoes === 100 ? '🏆' : '⭐'}</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 6px' }}>Super Missões</h2>
        <p style={{ fontSize: 13, opacity: 0.85, margin: '0 0 16px' }}>Mostre que você já é independente!</p>
        <div style={{ height: 10, background: 'rgba(0,0,0,0.15)', borderRadius: 10 }}>
          <div style={{ height: 10, background: '#fff', borderRadius: 10, width: `${progressoMissoes}%`, transition: 'width 0.8s ease' }} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 800, marginTop: 8 }}>{progressoMissoes}% concluído</p>
      </div>
      {data.missoes.map(m => (
        <div key={m.id} onClick={() => toggleMissao(m.id)}
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 20, cursor: 'pointer', background: m.feito ? '#f0fff4' : '#fff', border: `2px solid ${m.feito ? '#28a745' : '#f0f0f0'}`, transition: 'all 0.25s' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: m.feito ? '#28a745' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.25s' }}>
            {m.feito && <CheckCircle2 size={20} color="#fff" />}
          </div>
          <p style={{ flex: 1, fontSize: 15, fontWeight: 700, color: m.feito ? '#28a745' : '#333', textDecoration: m.feito ? 'line-through' : 'none', margin: 0 }}>{m.texto}</p>
        </div>
      ))}
      {data.missoes.length === 0 && <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Nenhuma missão cadastrada.</div>}
    </div>
  );

  // ===================== TELA: AFETO =====================
  const renderAfeto = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'linear-gradient(135deg, #e91e63, #ff6090)', borderRadius: 28, padding: '28px 20px', color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🪢</div>
        <h2 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 4px' }}>O Nó do Afeto</h2>
        <p style={{ fontSize: 13, opacity: 0.85, margin: '0 0 16px' }}>"Um gesto de amor, mesmo que seja um simples nó."</p>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: '10px 20px', display: 'inline-block', fontSize: 20, fontWeight: 900 }}>
          {data.nosDeAfeto} nós guardados
        </div>
      </div>
      {data.mensagensAfeto.map((msg, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 20, border: '2px solid #f0f0f0', padding: '16px 18px', display: 'flex', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffe4ef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>❤️</div>
          <div>
            <p style={{ fontSize: 14, color: '#333', lineHeight: 1.6, margin: '0 0 6px' }}>"{typeof msg === 'string' ? msg : msg.texto}"</p>
            {typeof msg !== 'string' && msg.data && <p style={{ fontSize: 11, color: '#aaa', margin: 0, fontWeight: 600 }}>{msg.data}</p>}
          </div>
        </div>
      ))}
    </div>
  );

  // ===================== TELA: PAIS =====================
  const renderPais = () => {
    if (!isParentUnlocked) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 40 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🔒</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#333', margin: 0 }}>Área dos Pais</h2>
          <p style={{ color: '#888', textAlign: 'center', margin: 0 }}>Digite a senha para acessar</p>
          <input type="password" placeholder="Senha" value={inputSenha}
            onChange={e => { setInputSenha(e.target.value); setErroSenha(false); }}
            onKeyDown={e => e.key === 'Enter' && verificarSenha()}
            style={{ width: 180, textAlign: 'center', padding: '12px', borderRadius: 14, border: `2px solid ${erroSenha ? '#e74c3c' : '#e0e0e0'}`, fontSize: 20, fontWeight: 800, letterSpacing: 4, outline: 'none', boxSizing: 'border-box' }} />
          {erroSenha && <p style={{ color: '#e74c3c', fontSize: 13, fontWeight: 700, margin: 0 }}>Senha incorreta!</p>}
          <button onClick={verificarSenha}
            style={{ background: '#333', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 32px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
            Entrar
          </button>
          <p style={{ fontSize: 11, color: '#ccc', margin: 0 }}>Senha padrão: 1234</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 100 }}>
        <div style={{ background: 'linear-gradient(135deg, #2c3e50, #4a5568)', borderRadius: 28, padding: '22px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>Área dos Pais 👨‍👩‍👦</h2>
            <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>Configurações e conteúdo</p>
          </div>
          <button onClick={() => setIsParentUnlocked(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 12, padding: '8px 12px', color: '#fff', cursor: 'pointer' }}>
            <Lock size={20} />
          </button>
        </div>

        {/* Nome */}
        <Section title="👤 Nome do aluno">
          <input type="text" defaultValue={data.aluno.nome}
            onChange={e => salvarNomeDebounced(e.target.value)}
            style={inputStyle} />
        </Section>

        {/* Foto */}
        <Section title="🖼️ URL da foto de perfil">
          <input type="text" value={data.avatarUrl} placeholder="Cole o link da imagem"
            onChange={e => updateData({ avatarUrl: e.target.value })}
            style={inputStyle} />
        </Section>

        {/* Provas */}
        <Section title="📚 Provas e estudos">
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input type="text" value={novaProvaData} placeholder="Data (ex: 10/06)" onChange={e => setNovaProvaData(e.target.value)} style={{ ...inputStyle, width: '35%' }} />
            <input type="text" value={novaProvaMateria} placeholder="Matéria" onChange={e => setNovaProvaMateria(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input type="text" value={novaProvaConteudo} placeholder="Conteúdo..." onChange={e => setNovaProvaConteudo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && adicionarAvaliacao()} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={adicionarAvaliacao} style={btnAdd}>+</button>
          </div>
          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.avaliacoes.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f9fa', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}>
                <div>
                  <strong>{a.materia}</strong> <span style={{ color: '#888' }}>({a.data})</span>
                  <div style={{ color: '#aaa', fontSize: 11 }}>{a.conteudo}</div>
                </div>
                <button onClick={() => removerAvaliacao(a.id)} style={btnTrash}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </Section>

        {/* Missões */}
        <Section title="⭐ Missões diárias">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input type="text" value={novaMissao} placeholder="Nova missão..." onChange={e => setNovaMissao(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && adicionarMissao()} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={adicionarMissao} style={btnAdd}>+</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.missoes.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f9fa', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}>
                <span>{m.texto}</span>
                <button onClick={() => removerMissao(m.id)} style={btnTrash}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </Section>

        {/* Avisos */}
        <Section title="📢 Avisos da escola">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input type="text" value={novoAviso} placeholder="Adicionar aviso..." onChange={e => setNovoAviso(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && adicionarAviso()} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={adicionarAviso} style={btnAdd}>+</button>
          </div>
          {data.avisosEscola.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f9fa', borderRadius: 10, padding: '8px 12px', fontSize: 13, marginBottom: 6 }}>
              <span style={{ flex: 1, marginRight: 8 }}>{a}</span>
              <button onClick={() => removerAviso(i)} style={btnTrash}><Trash2 size={14} /></button>
            </div>
          ))}
        </Section>

        {/* Afeto */}
        <Section title="❤️ Enviar mensagem de afeto">
          <textarea value={msgAfeto} onChange={e => setMsgAfeto(e.target.value)} placeholder="Escreva uma mensagem de encorajamento..."
            style={{ width: '100%', boxSizing: 'border-box', border: '2px solid #f0f0f0', borderRadius: 14, padding: '12px 14px', fontSize: 14, minHeight: 90, resize: 'none', outline: 'none', marginBottom: 10, fontFamily: 'inherit' }} />
          <button onClick={enviarAfeto} style={{ width: '100%', padding: '13px', borderRadius: 14, border: 'none', background: '#e91e63', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
            Dar um Nó Virtual 🪢
          </button>
        </Section>

        {/* Senha */}
        <Section title="🔒 Alterar senha">
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="password" value={novaSenhaInput} placeholder="Nova senha (mín. 4 carac.)" onChange={e => setNovaSenhaInput(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={alterarSenha} style={{ ...btnAdd, padding: '0 16px', fontSize: 13, borderRadius: 14 }}>Salvar</button>
          </div>
        </Section>

        {/* Portfólio / Histórico */}
        <Section title="📈 Histórico do Adriano">
          <p style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>Turma atual: {data.aluno.turma} · {data.aluno.ano}</p>
          {(data.historicoSimulados || []).length === 0 ? (
            <p style={{ color: '#ccc', fontSize: 13 }}>Nenhum simulado realizado ainda.</p>
          ) : (
            [...(data.historicoSimulados || [])].reverse().slice(0, 10).map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                <span style={{ color: '#888', minWidth: 60 }}>{h.data}</span>
                <div style={{ flex: 1, height: 6, background: '#eee', borderRadius: 4 }}>
                  <div style={{ height: 6, width: `${h.pct}%`, background: h.pct >= 75 ? '#28a745' : h.pct >= 50 ? '#f5a623' : '#e74c3c', borderRadius: 4 }} />
                </div>
                <span style={{ fontWeight: 800, minWidth: 40, textAlign: 'right' }}>{h.pct}%</span>
              </div>
            ))
          )}
        </Section>
      </div>
    );
  };

  // Estilos reutilizáveis
  const inputStyle = { border: '2px solid #f0f0f0', borderRadius: 12, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fafafa', width: '100%', boxSizing: 'border-box' };
  const btnAdd = { background: '#5c35b3', color: '#fff', border: 'none', borderRadius: 12, padding: '0 14px', fontSize: 22, cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, height: 44 };
  const btnTrash = { background: '#fff0f0', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#e74c3c', display: 'flex', alignItems: 'center', flexShrink: 0 };

  // ===================== LOADING =====================
  if (!isDbLoaded && auth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', gap: 16 }}>
        <div style={{ width: 56, height: 56, border: '4px solid #e8e0ff', borderTop: '4px solid #5c35b3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#5c35b3', fontWeight: 800, fontSize: 15 }}>Carregando... 🚀</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const tabs = [
    { id: 'hoje', label: 'Hoje', emoji: '🏠' },
    { id: 'rotina', label: 'Rotina', emoji: '📅' },
    { id: 'estudo', label: 'Estudar', emoji: '📚' },
    { id: 'simulado', label: 'Quiz', emoji: '🧠' },
    { id: 'missoes', label: 'Missões', emoji: '⭐' },
    { id: 'afeto', label: 'Afeto', emoji: '❤️' },
    { id: 'pais', label: 'Pais', emoji: '🔒' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: "'Nunito', 'Segoe UI', sans-serif", paddingBottom: 90 }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: '#fff', padding: '16px 20px 14px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: '0 0 24px 24px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <div onClick={() => setShowEmojiPicker(p => !p)}
                style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 2px 10px rgba(102,126,234,0.4)' }}>
                {data.avatarUrl ? (
                  <img src={data.avatarUrl} alt="perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => updateData({ avatarUrl: '' })} />
                ) : (
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>{(data.aluno.nome || 'A')[0]}</span>
                )}
              </div>
              <div onClick={() => setShowEmojiPicker(p => !p)}
                style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, background: '#fff', borderRadius: '50%', border: '2px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                {data.emocao}
              </div>
              {showEmojiPicker && (
                <div style={{ position: 'absolute', top: 60, left: 0, background: '#fff', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #f0f0f0', padding: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, zIndex: 200, width: 200 }}>
                  {emojis.map(e => (
                    <button key={e} onClick={() => { updateData({ emocao: e }); setShowEmojiPicker(false); }}
                      style={{ background: '#f8f9fa', border: 'none', borderRadius: 10, padding: 8, fontSize: 22, cursor: 'pointer' }}>
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#aaa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>{data.aluno.turma}</p>
              <h1 style={{ fontSize: 18, fontWeight: 900, color: '#222', margin: 0 }}>E aí, {data.aluno.nome}!</h1>
            </div>
          </div>
          <div onClick={() => setActiveTab('afeto')} style={{ background: '#fff0f5', border: '2px solid #ffe0ea', borderRadius: 16, padding: '8px 12px', cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: 16 }}>🪢</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#e91e63' }}>{data.nosDeAfeto}</div>
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>
        {activeTab === 'hoje' && renderHoje()}
        {activeTab === 'rotina' && renderRotina()}
        {activeTab === 'estudo' && renderEstudo()}
        {activeTab === 'simulado' && renderSimulado()}
        {activeTab === 'missoes' && renderMissoes()}
        {activeTab === 'afeto' && renderAfeto()}
        {activeTab === 'pais' && renderPais()}
      </div>

      {/* NAV INFERIOR */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 480, margin: '0 auto', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(0,0,0,0.06)', borderRadius: '24px 24px 0 0', display: 'flex', justifyContent: 'space-around', padding: '8px 4px 12px', boxShadow: '0 -4px 24px rgba(0,0,0,0.08)' }}>
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 10px', borderRadius: 16, border: 'none', background: active ? '#f0ebff' : 'transparent', cursor: 'pointer', transition: 'all 0.2s', minWidth: 52 }}>
                <span style={{ fontSize: active ? 24 : 20, transition: 'all 0.2s', transform: active ? 'scale(1.15)' : 'scale(1)', display: 'block' }}>{tab.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: active ? 800 : 600, color: active ? '#5c35b3' : '#aaa', transition: 'all 0.2s' }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar de seção na área dos pais
function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 24, border: '2px solid #f0f0f0', padding: '18px 18px' }}>
      <p style={{ fontSize: 12, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14, margin: '0 0 14px' }}>{title}</p>
      {children}
    </div>
  );
}
