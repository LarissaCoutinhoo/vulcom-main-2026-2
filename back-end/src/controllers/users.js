
import prisma from '../database/client.js'
import jwt from 'jsonwebtoken'
import argon2 from 'argon2'

const controller = {}

const hashOptions = {
  type: argon2.argon2id,
  memoryCost: 66560,
  timeCost: 3,
  parallelism: 4
}

// Cadastro de usuário
controller.create = async function(req, res) {
  try {
    const { password, ...data } = req.body

    if (typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'Senha inválida' })
    }

    const passwordHash = await argon2.hash(password, hashOptions)

    await prisma.user.create({
      data: {
        ...data,
        is_admin: false,
        password: passwordHash
      }
    })

    res.status(201).end()
  }
  catch(error) {
    console.error(error)
    res.status(500).end()
  }
}

// Consultar todos os usuários
controller.retrieveAll = async function(req, res) {
  try {
    const result = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        is_admin: true
      }
    })

    res.send(result)
  }
  catch(error) {
    console.error(error)
    res.status(500).end()
  }
}

// Consultar um usuário
controller.retrieveOne = async function(req, res) {
  try {
    const result = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: {
        id: true,
        username: true,
        email: true,
        is_admin: true
      }
    })

    if(result) res.send(result)
    else res.status(404).end()
  }
  catch(error) {
    console.error(error)
    res.status(500).end()
  }
}

// Atualizar usuário
controller.update = async function(req, res) {
  try {
    const { password, is_admin, ...data } = req.body

    if(password !== undefined) {
      if(typeof password !== 'string' || password.length === 0) {
        return res.status(400).json({ error: 'Senha inválida' })
      }

      data.password = await argon2.hash(password, hashOptions)
    }

    await prisma.user.update({
      where: { id: Number(req.params.id) },
      data
    })

    res.status(204).end()
  }
  catch(error) {
    if(error?.code === 'P2025') {
      res.status(404).end()
    }
    else {
      console.error(error)
      res.status(500).end()
    }
  }
}

// Excluir usuário
controller.delete = async function(req, res) {
  try {
    await prisma.user.delete({
      where: { id: Number(req.params.id) }
    })

    res.status(204).end()
  }
  catch(error) {
    if(error?.code === 'P2025') {
      res.status(404).end()
    }
    else {
      console.error(error)
      res.status(500).end()
    }
  }
}

// Login
controller.login = async function(req, res) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: req.body?.username || undefined },
          { email: req.body?.email || undefined }
        ]
      }
    })

    if(!user) return res.status(401).end()

    const passwordIsValid = await argon2.verify(
      user.password,
      req.body?.password
    )

    if(!passwordIsValid) {
      return res.status(401).end()
    }

    const { password, ...safeUser } = user

    const token = jwt.sign(
      safeUser,
      process.env.TOKEN_SECRET,
      { expiresIn: '24h' }
    )

    res.cookie(process.env.AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000
    })

    res.send({
      token,
      user: safeUser
    })
  }
  catch(error) {
    console.error(error)
    res.status(500).end()
  }
}

// Usuário autenticado
controller.me = function(req, res) {
  res.send(req?.authUser)
}

controller.migratePasswords = async function(req, res) {
  try {
    const users = await prisma.user.findMany()

    for (const user of users) {
      // Verifica se a senha já está em Argon2
      if (!user.password.startsWith('$argon2id$')) {
        const passwordHash = await argon2.hash(
          user.password,
          hashOptions
        )

        await prisma.user.update({
          where: { id: user.id },
          data: { password: passwordHash }
        })
      }
    }

    res.send({
      message: 'Migração das senhas concluída!'
    })
  }
  catch(error) {
    console.error(error)
    res.status(500).end()
  }
}

export default controller
