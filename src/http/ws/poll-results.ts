import { FastifyInstance } from 'fastify'
import z from 'zod'
import { voting } from '../../utils/voting-pub-sub'

export async function pollResults(app: FastifyInstance) {
  app.get(
    '/polls/:pollId/result',
    { websocket: true },
    (connection, request) => {
      const createPollParamsSchema = z.object({
        pollId: z.string().uuid(),
      })

      const { pollId } = createPollParamsSchema.parse(request.params)

      voting.subscribe(pollId, (message) => {
        connection.socket.send(JSON.stringify(message))
      })
    },
  )
}
