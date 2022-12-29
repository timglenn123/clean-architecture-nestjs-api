import { TodoModel } from '../../domain/model/todo';
import { TodoRepository } from '../../domain/repositories/todoRepository.interface';

export class GetTodoUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  async execute(id: number): Promise<TodoModel> {
    return await this.todoRepository.findById(id);
  }
}
