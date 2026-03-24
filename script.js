const inputCidade = document.getElementById('cidade')
const btnBuscar = document.getElementById('btnBuscar')
const resultado = document.getElementById('resultado')

function formatarData(dataTexto) {
  const data = new Date(dataTexto + 'T00:00:00')
  return data.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  })
}

async function buscarClima() {
  const cidade = inputCidade.value.trim()

  if (!cidade) {
    resultado.innerHTML = `<div class="alert alert-warning">Digite uma cidade.</div>`
    return
  }

  resultado.innerHTML = `
    <div class="text-center">
      <div class="spinner-border" role="status"></div>
      <p class="mt-2">Carregando...</p>
    </div>
  `

  try {
    const resposta = await fetch(`http://localhost:3000/clima?cidade=${encodeURIComponent(cidade)}`)
    const dados = await resposta.json()

    if (!resposta.ok) {
      resultado.innerHTML = `<div class="alert alert-danger">${dados.erro}</div>`
      return
    }

    if (!dados.previsao || !Array.isArray(dados.previsao)) {
  resultado.innerHTML = `<div class="alert alert-danger">A API não retornou a previsão dos próximos dias.</div>`
  console.log('RESPOSTA DA API:', dados)
  return
}
    const cardsPrevisao = dados.previsao.map((dia, index) => `
      <div class="col-md-6 col-lg-4 mb-3">
        <div class="card h-100 ${index === 0 ? 'border-primary' : ''}">
          <div class="card-body">
            <h5 class="card-title">${index === 0 ? 'Hoje' : formatarData(dia.data)}</h5>
            <p class="mb-2"><strong>${dia.descricao}</strong></p>
            <p class="mb-1">🌡 Máx: ${dia.temperatura_max} °C</p>
            <p class="mb-1">🥶 Mín: ${dia.temperatura_min} °C</p>
            <p class="mb-0">🌧 Chuva: ${dia.chance_chuva}%</p>
          </div>
        </div>
      </div>
    `).join('')

    resultado.innerHTML = `
      <div class="card mb-4">
        <div class="card-body text-start">
          <h4 class="text-center mb-3">${dados.cidade} - ${dados.estado}</h4>
          <p class="mb-1"><strong>🌍 País:</strong> ${dados.pais}</p>
          <p class="mb-1"><strong>🌤 Agora:</strong> ${dados.clima_atual.descricao}</p>
          <p class="mb-1"><strong>🌡 Temperatura atual:</strong> ${dados.clima_atual.temperatura} °C</p>
          <p class="mb-1"><strong>💨 Vento:</strong> ${dados.clima_atual.vento} km/h</p>
          <p class="mb-0"><strong>⏰ Horário:</strong> ${dados.clima_atual.horario}</p>
        </div>
      </div>

      <h4 class="mb-3">Previsão para os próximos dias</h4>
      <div class="row">
        ${cardsPrevisao}
      </div>
    `

  } catch (erro) {
    resultado.innerHTML = `<div class="alert alert-danger">Erro ao conectar com a API.</div>`
    console.log(erro)
  }
}

btnBuscar.addEventListener('click', buscarClima)

inputCidade.addEventListener('keypress', function (event) {
  if (event.key === 'Enter') {
    buscarClima()
  }
})