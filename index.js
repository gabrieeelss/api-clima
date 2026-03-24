process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const http = require('http')

const PORT = 3000

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

            const urlClima = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m&timezone=auto`
            const respostaClima = await fetch(urlClima)

            if (!respostaClima.ok) {
                throw new Error(`Erro na API do clima: ${respostaClima.status}`)
            }

            const dadosClima = await respostaClima.json()

            if (!dadosClima.current) {
                throw new Error('A resposta da API não trouxe o objeto current')
            }

            const resultado = {
                cidade: local.name,
                estado: local.admin1 || 'Não informado',
                pais: local.country,
                latitude,
                longitude,
                temperatura: dadosClima.current.temperature_2m,
                vento: dadosClima.current.wind_speed_10m,
                horario: dadosClima.current.time
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