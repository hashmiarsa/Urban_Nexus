import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import projectApi from '@/api/project.api'
import useProjectStore from '@/store/projectStore'
import toast from 'react-hot-toast'

export function useProjects() {
  const { filters } = useProjectStore()

  return useQuery({
    queryKey: ['projects', filters],
    queryFn:  () => projectApi.getAll(filters).then((r) => r.data),
    keepPreviousData: true,
  })
}

export function useProject(id) {
  return useQuery({
    queryKey: ['project', id],
    queryFn:  () => projectApi.getById(id).then((r) => r.data.data),
    enabled:  !!id,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: projectApi.create,
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      const clashes = data.data?.clashesDetected || 0
      if (clashes > 0) {
        toast.error(`Project submitted — ${clashes} clash(es) detected!`, { duration: 8000 })
      } else {
        toast.success('Project submitted successfully')
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit project')
    },
  })
}

export function useUpdateProjectStatus() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => projectApi.updateStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project status updated')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update status')
    },
  })
}
export function useMyTasks() {
  return useQuery({
    queryKey: ['mytasks'],
    queryFn: () => projectApi.getAll({ assignedToMe: true }).then((r) => r.data),
  })
}
