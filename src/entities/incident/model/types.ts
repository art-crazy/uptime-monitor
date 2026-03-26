import { z } from 'zod'

export const incidentSchema = z.object({
  id: z.string().min(1),
  monitorId: z.string().min(1),
  startTime: z.number().int().nonnegative(),
  endTime: z.number().int().nonnegative().nullable(),
})

export const incidentsSchema = z.array(incidentSchema)

export type Incident = z.infer<typeof incidentSchema>
