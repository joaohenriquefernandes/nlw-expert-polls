import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../libs/prisma'

export async function getPoll(app: FastifyInstance) {
  app.get('/polls/:pollId', async (request, reply) => {
    const createPollParamsSchema = z.object({
      pollId: z.string().uuid(),
    })

    const { pollId } = createPollParamsSchema.parse(request.params)

    const poll = await prisma.poll.findUnique({
      include: {
        options: {
          select: {
            title: true,
          },
          where: {
            pollId,
          },
        },
      },
      where: {
        id: pollId,
      },
    })

    return reply.status(200).send({ poll })
  })
}
