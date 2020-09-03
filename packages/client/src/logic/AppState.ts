import { Todo } from '../../../shared/model'

export type VisibilityFilter = 'SHOW_ALL' | 'SHOW_ACTIVE' | 'SHOW_COMPLETED'

export const defaultTodos: Todo[] = [
  {
    id: 0,
    text: 'Learn fp-ts-routing',
    completed: false,
  },
  {
    id: 1,
    text: 'Go Shopping',
    completed: false,
  }
]