import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../libs/prisma'
import { redis } from '../../libs/redis'

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

    if (!poll) {
      return reply.status(400).send({ message: 'Poll not found' })
    }

    const result = await redis.zrange(pollId, 0, -1, 'WITHSCORES')

    const votes = result.reduce(
      (obj, line, index) => {
        if (index % 2 === 0) {
          const score = result[index + 1]

          Object.assign(obj, { [line]: Number(score) })
        }

        return obj
      },
      {} as Record<string, number>,
    )
    return reply.status(200).send({
      poll: {
        id: poll.id,
        title: poll.title,
        options: poll.options.map((option) => {
          return {
            id: option.id,
            title: option.title,
            score: option.id in votes ? votes[option.id] : 0,
          }
        }),
      },
    })
  })
}
