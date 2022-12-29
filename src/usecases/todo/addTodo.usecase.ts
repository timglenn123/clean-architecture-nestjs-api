import { ILogger } from '../../domain/logger/logger.interface';
import { TodoModel } from '../../domain/model/todo';
import { TodoRepository } from '../../domain/repositories/todoRepository.interface';

export class addTodoUseCase {
  constructor(private readonly logger: ILogger, private readonly todoRepository: TodoRepository) {}

  async execute(content: string): Promise<TodoModel> {
    const todo = new TodoModel();
    todo.content = content;
    todo.isDone = false;
    const result = await this.todoRepository.insert(todo);
    this.logger.info('addTodoUseCase execute', 'New todo have been inserted');
    return result;
  }
}
