process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const http = require('http')

const PORT = 3000

function traduzirWeatherCode(codigo) {
    const descricoes = {
        0: 'Céu limpo',
        1: 'Principalmente limpo',
        2: 'Parcialmente nublado',
        3: 'Encoberto',
        45: 'Nevoeiro',
        48: 'Nevoeiro com geada',
        51: 'Garoa fraca',
        53: 'Garoa moderada',
        55: 'Garoa intensa',
        56: 'Garoa congelante fraca',
        57: 'Garoa congelante intensa',
        61: 'Chuva fraca',
        63: 'Chuva moderada',
        65: 'Chuva forte',
        66: 'Chuva congelante fraca',
        67: 'Chuva congelante forte',
        80: 'Pancadas de chuva fracas',
        81: 'Pancadas de chuva moderadas',
        82: 'Pancadas de chuva fortes',
        95: 'Trovoada',
        96: 'Trovoada com granizo fraco',
        99: 'Trovoada com granizo forte'
    }

    return descricoes[codigo] || 'Não informado'
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')

    const url = new URL(req.url, `http://localhost:${PORT}`)

    if (url.pathname === '/clima') {
        const cidade = url.searchParams.get('cidade')

        if (!cidade) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({
                erro: 'Informe a cidade na URL. Ex: /clima?cidade=Campinas'
            }))
        }

        try {
            const urlGeo = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`
            const respostaGeo = await fetch(urlGeo)

            if (!respostaGeo.ok) {
                throw new Error(`Erro na geocoding API: ${respostaGeo.status}`)
            }

            const dadosGeo = await respostaGeo.json()

            if (!dadosGeo.results || dadosGeo.results.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' })
                return res.end(JSON.stringify({ erro: 'Cidade não encontrada' }))
            }

            const local = dadosGeo.results[0]
            const latitude = local.latitude
            const longitude = local.longitude

            const urlClima = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`
            const respostaClima = await fetch(urlClima)

            if (!respostaClima.ok) {
                throw new Error(`Erro na API do clima: ${respostaClima.status}`)
            }

            const dadosClima = await respostaClima.json()

            if (!dadosClima.current) {
                throw new Error('API não retornou clima atual')
            }

            if (!dadosClima.daily || !dadosClima.daily.time) {
                throw new Error('API não retornou previsão diária')
            }
            const previsaoDias = dadosClima.daily.time.map((data, index) => ({
                data: data,
                descricao: traduzirWeatherCode(dadosClima.daily.weather_code[index]),
                temperatura_max: dadosClima.daily.temperature_2m_max[index],
                temperatura_min: dadosClima.daily.temperature_2m_min[index],
                chance_chuva: dadosClima.daily.precipitation_probability_max[index]
            }))

            const resultado = {
                cidade: local.name,
                estado: local.admin1 || 'Não informado',
                pais: local.country,
                latitude,
                longitude,
                clima_atual: {
                    temperatura: dadosClima.current.temperature_2m,
                    vento: dadosClima.current.wind_speed_10m,
                    descricao: traduzirWeatherCode(dadosClima.current.weather_code),
                    horario: dadosClima.current.time
                },
                previsao: previsaoDias
            }

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(resultado, null, 2))

        } catch (erro) {
            console.log('ERRO DETALHADO:', erro)

            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({
                erro: 'Erro ao buscar dados do clima',
                detalhe: erro.message
            }))
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ erro: 'Rota não encontrada' }))
    }
})

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
})