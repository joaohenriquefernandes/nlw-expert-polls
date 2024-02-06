import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../libs/prisma'
import { randomUUID } from 'node:crypto'

export async function voteOnPoll(app: FastifyInstance) {
  app.post('/polls/:pollId/votes', async (request, reply) => {
    const votesOnPollParamsSchema = z.object({
      pollId: z.string().uuid(),
    })

    const voteOnPollBody = z.object({
      pollOptionId: z.string().uuid(),
    })

    const { pollId } = votesOnPollParamsSchema.parse(request.params)

    const { pollOptionId } = voteOnPollBody.parse(request.body)

    let { sessionId } = request.cookies

    if (sessionId) {
      const userPreviousVotemOnPoll = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: {
            sessionId,
            pollId,
          },
        },
      })

      if (
        userPreviousVotemOnPoll &&
        userPreviousVotemOnPoll.pollOptionId !== pollOptionId
      ) {
        await prisma.vote.delete({
          where: {
            id: userPreviousVotemOnPoll.id,
          },
        })
      } else if (userPreviousVotemOnPoll) {
        return reply
          .status(400)
          .send({ message: 'You already voted on this poll.' })
      }
    }

    if (!sessionId) {
      sessionId = randomUUID()

      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        signed: true,
        httpOnly: true,
      })
    }

    await prisma.vote.create({
      data: {
        sessionId,
        pollId,
        pollOptionId,
      },
    })

    return reply.status(201).send()
  })
}
