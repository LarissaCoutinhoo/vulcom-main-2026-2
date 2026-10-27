import prisma from '../database/client.js'

const controller = {}
const MAX_COMMENT_LENGTH = 1000

controller.retrieveComments = async function(req, res) {
  try {
    const comments = await prisma.xssComment.findMany({
      orderBy: { id: 'asc' }
    })

    res.send(comments)
  }
  catch(error) {
    console.error(error)
    res.status(500).end()
  }
}

controller.createComment = async function(req, res) {
  try {
    const rawContent = req.body?.content

    if(typeof rawContent !== 'string') {
      return res.status(400).send({
        success: false,
        message: 'O comentário deve ser um texto válido.'
      })
    }

    const content = rawContent.trim()

    if(content.length === 0) {
      return res.status(400).send({
        success: false,
        message: 'O comentário não pode estar vazio.'
      })
    }

    if(content.length > MAX_COMMENT_LENGTH) {
      return res.status(400).send({
        success: false,
        message: `O comentário deve ter no máximo ${MAX_COMMENT_LENGTH} caracteres.`
      })
    }

    // OWASP Top 10:2025 A05 - Injeção (XSS armazenado):
    // o conteúdo é persistido sem sanitização e depois interpretado como HTML em XssChallenge.jsx.
    await prisma.xssComment.create({
      data: { content }
    })

    res.status(201).end()
  }
  catch(error) {
    console.error(error)
    res.status(500).end()
  }
}

export default controller
