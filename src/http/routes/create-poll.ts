import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../libs/prisma'

export async function createPoll(app: FastifyInstance) {
  app.post('/polls', async (request, reply) => {
    const createPollBodySchema = z.object({
      title: z.string(),
      options: z.string().array(),
    })

    const { title, options } = createPollBodySchema.parse(request.body)

    await prisma.poll.create({
      data: {
        title,
        options: {
          createMany: {
            data: options.map((option) => {
              return { title: option }
            }),
          },
        },
      },
    })

    return reply.status(201).send()
  })
}
