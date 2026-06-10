export interface Project {
  id: string
  name: string
  description?: string | null
  color: string
  createdAt: string
  updatedAt: string
  categories?: Category[]
}

export interface Category {
  id: string
  name: string
  description?: string | null
  color: string
  projectId: string
  project?: Project
  createdAt: string
  updatedAt: string
  activities?: Activity[]
}

export interface ActivityDependency {
  id: string
  activityId: string
  prerequisiteId: string
  prerequisite?: {
    id: string
    name: string
    status: string
  }
}

export interface Activity {
  id: string
  name: string
  description?: string | null
  status: 'todo' | 'in_progress' | 'done'
  startedAt?: string | null
  categoryId: string
  category?: Category
  createdAt: string
  updatedAt: string
  tasks?: Task[]
  dependsOn?: ActivityDependency[]
}

export interface TaskDependency {
  id: string
  taskId: string
  prerequisiteId: string
  prerequisite?: {
    id: string
    title: string
    completed: boolean
  }
}

export interface Task {
  id: string
  title: string
  description?: string | null
  completed: boolean
  dueDate?: string | null
  priority: 'low' | 'medium' | 'high'
  reminder: boolean
  reminderDays: number
  activityId: string
  activity?: Activity
  createdAt: string
  updatedAt: string
  dependsOn?: TaskDependency[]
}

export interface Stats {
  projectStats: ProjectStats[]
  overall: {
    totalProjects: number
    totalTasks: number
    completedTasks: number
    pendingTasks: number
    overdueTasks: number
    completionRate: number
  }
  tasksByPriority: {
    high: number
    medium: number
    low: number
  }
  tasksByStatus: {
    todo: number
    in_progress: number
    done: number
  }
  weeklyData: {
    date: string
    completed: number
  }[]
}

export interface ProjectStats {
  id: string
  name: string
  color: string
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  completionRate: number
}
