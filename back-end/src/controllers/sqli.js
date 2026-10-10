import prisma from '../database/client.js'

const controller = {}

controller.login = async function(req, res) {
  const username = req.body?.username ?? ''
  const password = req.body?.password ?? ''

  // DESAFIO: esta concatenação é intencionalmente vulnerável a SQL Injection.
  // Não reutilizar este padrão em código de produção.
  // OWASP Top 10:2025 A05 - Injeção (SQL Injection):
  // entradas concatenadas ao SQL são executadas por $queryRawUnsafe como parte da consulta.
  
  // CÓDIGO ORIGINAL VULNERÁVEL:
  // const query = `SELECT * FROM "User" WHERE username = '${username}' AND password = '${password}'`

  try {

    // CORREÇÃO:
    // Usamos o Prisma para realizar a consulta. 
    // Assim, username e password são tratados como dados e não como parte do comando SQL.
    const user = await prisma.user.findFirst({
      where: {
        username: username,
        password: password
      }
    })


    // OWASP Top 10:2025 A09 - Falhas nos Logs de Segurança e no Sistema de Alertas:
    // a consulta registrada contém as credenciais informadas, incluindo a senha.

    // CÓDIGO ORIGINAL VULNERÁVEL:
    // console.log('****** INSECURE SQL:', query)

    // CORREÇÃO:
    // Registramos apenas que ocorreu uma tentativa de login,
    // sem expor username, senha ou consulta SQL.
    console.log('Tentativa de login realizada.')


    // CÓDIGO ORIGINAL VULNERÁVEL:
    // const users = await prisma.$queryRawUnsafe(query)

    // Como agora usamos findFirst(), ele retorna um usuário ou null.
    // Por isso não precisamos mais verificar users.length.

    // CÓDIGO ORIGINAL:
    // if(users.length > 0) {

    // CORREÇÃO:
    if(user) {
      return res.send({
        success: true,
        message: `Bem-vindo, ${username}!`,

        // A flag fazia parte do desafio de exploração da vulnerabilidade.
        // Como a vulnerabilidade foi corrigida, ela não deve ser retornada.
        // flag: 'VULCOM{SQLi_Exploit_Success}',

        // OWASP Top 10:2025 A01 - Falha no Controle de Acesso:
        // SELECT * expõe todos os campos encontrados, inclusive senhas em texto puro (A04).

        // CÓDIGO ORIGINAL VULNERÁVEL:
        // result: users,
        // query

        // CORREÇÃO:
        // Não retornamos o objeto completo do usuário,
        // pois ele pode conter informações sensíveis, como a senha.
      })
    }

    res.status(401).send({
      success: false,
      message: 'Login falhou!',

      // CÓDIGO ORIGINAL:
      // result: users,
      // query

      // CORREÇÃO:
      // Não retornamos informações sobre a consulta ou dados internos.
    })
  }
  catch(error) {

    // Mantemos o erro somente no servidor para ajudar na depuração.
    console.error(error)

    // OWASP Top 10:2025 A10 - Tratamento Inadequado de Condições Excepcionais:
    // a resposta de erro revela a consulta SQL e a estrutura interna da tabela.

    res.status(500).send({

      // CÓDIGO ORIGINAL:
      // success: false,
      // message: 'Erro no servidor',
      // query

      // CORREÇÃO:
      // O cliente recebe apenas uma mensagem genérica,
      // sem detalhes sobre a estrutura interna.
      success: false,
      message: 'Algo deu errado.'
    })
  }
}

export default controller

// esse commit seria dedicado a corrigir a vulnerabilidade de SQL Injection, como eu já havia corrigido, deixo esse comentário apenas para que seja possível o commit.