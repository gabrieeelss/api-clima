const inputCidade = document.getElementById('cidade')
const btnBuscar = document.getElementById('btnBuscar')
const resultado = document.getElementById('resultado')

async function buscarClima() {
  const cidade = inputCidade.value.trim()

  if (!cidade) {
    resultado.innerHTML = `<div class="alert alert-warning">Digite uma cidade.</div>`
    return
  }

  resultado.innerHTML = `<div class="text-center">Carregando...</div>`

  try {
    const resposta = await fetch(`http://localhost:3000/clima?cidade=${encodeURIComponent(cidade)}`)
    const dados = await resposta.json()

    if (!resposta.ok) {
      resultado.innerHTML = `<div class="alert alert-danger">${dados.erro}</div>`
      return
    }

    resultado.innerHTML = `
      <div class="card mt-3">
        <div class="card-body text-start">

          <h5 class="card-title text-center mb-3">
            ${dados.cidade} - ${dados.estado}
          </h5>

          <p><strong>🌡 Temperatura:</strong> ${dados.temperatura} °C</p>
          <p><strong>💨 Vento:</strong> ${dados.vento} km/h</p>
          <p><strong>🌍 País:</strong> ${dados.pais}</p>
          <p><strong>⏰ Horário:</strong> ${dados.horario}</p>

        </div>
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