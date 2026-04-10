const API_URL = 'https://script.google.com/macros/s/AKfycbzAgqgJeU_Di0aL-VUaH4bqFiWfaj_96U0RVA6qxUKBkrtO2RXpFeJWaGIFxPirBOk7/exec';

let leads = [];
let filteredLeads = [];

async function carregarDados() {
  try {
    const res = await fetch(API_URL);
    leads = await res.json();
    popularFiltroResponsavel();
    aplicarFiltro();
    document.getElementById('lastUpdate').textContent = 'Atualizado em: ' + new Date().toLocaleString('pt-BR');
  } catch (e) {
    console.error('Erro ao carregar dados:', e);
  }
}

function popularFiltroResponsavel() {
  const sel = document.getElementById('filterResp');
  const responsaveis = [...new Set(leads.map(l => l.responsavel).filter(Boolean))].sort();
  sel.innerHTML = '<option value="todos">Todos</option>';
  responsaveis.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    sel.appendChild(opt);
  });
}

function aplicarFiltro() {
  const resp = document.getElementById('filterResp').value;
  filteredLeads = resp === 'todos' ? leads : leads.filter(l => l.responsavel === resp);
  renderDashboard();
  gerarEmailAlerta();
}

function renderDashboard() {
  const total = filteredLeads.length;
  const ativos = filteredLeads.filter(l => l.status === 'ativo').length;
  const ganhos = filteredLeads.filter(l => l.status === 'ganho').length;
  const perdidos = filteredLeads.filter(l => l.status === 'perdido').length;

  const taxaConv = total > 0 ? ((ganhos / total) * 100).toFixed(1) : 0;

  const dash = document.getElementById('tab-dashboard');
  dash.innerHTML = `
    <div class="cards">
      <div class="card"><div class="num">${total}</div><div class="lbl">Total de Leads</div></div>
      <div class="card"><div class="num">${ativos}</div><div class="lbl">Em Prospecção</div></div>
      <div class="card"><div class="num">${ganhos}</div><div class="lbl">Ganhos</div></div>
      <div class="card"><div class="num">${perdidos}</div><div class="lbl">Perdidos</div></div>
      <div class="card"><div class="num">${taxaConv}%</div><div class="lbl">Taxa de Conversão</div></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Empresa</th>
          <th>Status</th>
          <th>Responsável</th>
          <th>Segmento</th>
          <th>Cidade/UF</th>
          <th>Desde</th>
        </tr>
      </thead>
      <tbody>
        ${filteredLeads.map(l => `
          <tr>
            <td>${l.empresa || '-'}</td>
            <td>${badgeStatus(l.status)}</td>
            <td>${l.responsavel || '-'}</td>
            <td>${l.segmento || '-'}</td>
            <td>${[l.cidade, l.estado].filter(Boolean).join('/') || '-'}</td>
            <td>${l.desde || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function badgeStatus(status) {
  const map = {
    'ativo': 'badge-blue',
    'ganho': 'badge-green',
    'perdido': 'badge-red'
  };
  const cls = map[status] || 'badge-gray';
  return `<span class="badge ${cls}">${status || '-'}</span>`;
}

function switchTab(tab) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  event.target.classList.add('active');
}

function buscarEmpresa() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const results = leads.filter(l => l.empresa && l.empresa.toLowerCase().includes(q));
  const div = document.getElementById('searchResults');
  if (!q) { div.innerHTML = ''; return; }
  if (!results.length) { div.innerHTML = '<p>Nenhuma empresa encontrada.</p>'; return; }
  div.innerHTML = `
    <table>
      <thead>
        <tr><th>Empresa</th><th>Status</th><th>Responsável</th><th>Segmento</th><th>Cidade/UF</th><th>Motivo Perda</th></tr>
      </thead>
      <tbody>
        ${results.map(l => `
          <tr>
            <td>${l.empresa}</td>
            <td>${badgeStatus(l.status)}</td>
            <td>${l.responsavel || '-'}</td>
            <td>${l.segmento || '-'}</td>
            <td>${[l.cidade, l.estado].filter(Boolean).join('/') || '-'}</td>
            <td>${l.motivo_perda || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function gerarEmailAlerta() {
  const perdidos = filteredLeads.filter(l => l.status === 'perdido');
  if (!perdidos.length) {
    document.getElementById('emailPreview').textContent = 'Nenhum lead perdido no filtro atual.';
    return;
  }
  const lista = perdidos.map(l => `  - ${l.empresa} (${l.segmento || 'segmento não informado'}): ${l.motivo_perda || 'motivo não informado'}`).join('\n');
  document.getElementById('emailPreview').textContent =
`Assunto: Resumo de Leads Perdidos — ${new Date().toLocaleDateString('pt-BR')}

Olá,

Seguem os leads com status "perdido" no painel de prospecção:

${lista}

Total de perdas: ${perdidos.length}

Por favor, avalie oportunidades de reengajamento ou ajuste de abordagem.

Att,
Equipe Comercial`;
}

function copiarEmail() {
  const texto = document.getElementById('emailPreview').textContent;
  navigator.clipboard.writeText(texto).then(() => alert('E-mail copiado!')).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = texto;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('E-mail copiado!');
  });
}

carregarDados();
