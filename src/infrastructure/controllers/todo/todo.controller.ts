import { Body, Controller, Delete, Get, Inject, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UseCaseProxy } from '../../usecases-proxy/usecases-proxy';
import { UseCaseProxyModule } from '../../usecases-proxy/usecases-proxy.module';
import { GetTodoUseCase } from '../../../usecases/todo/getTodo.usecase';
import { TodoPresenter } from './todo.presenter';
import { ApiResponseType } from '../../common/swagger/response.decorator';
import { getTodosUseCase } from '../../../usecases/todo/getTodos.usecase';
import { updateTodoUseCases } from '../../../usecases/todo/updateTodo.usecase';
import { AddTodoDto, UpdateTodoDto } from './todo.dto';
import { deleteTodoUseCase } from '../../../usecases/todo/deleteTodo.usecase';
import { addTodoUseCase } from '../../../usecases/todo/addTodo.usecase';

@Controller('todo')
@ApiTags('todo')
@ApiResponse({ status: 500, description: 'Internal error' })
@ApiExtraModels(TodoPresenter)
export class TodoController {
  constructor(
    @Inject(UseCaseProxyModule.GET_TODO_USECASE_PROXY)
    private readonly getTodoUseCaseProxy: UseCaseProxy<GetTodoUseCase>,
    @Inject(UseCaseProxyModule.GET_TODOS_USECASE_PROXY)
    private readonly getAllTodoUseCaseProxy: UseCaseProxy<getTodosUseCase>,
    @Inject(UseCaseProxyModule.PUT_TODO_USECASE_PROXY)
    private readonly updateTodoUseCaseProxy: UseCaseProxy<updateTodoUseCases>,
    @Inject(UseCaseProxyModule.DELETE_TODO_USECASE_PROXY)
    private readonly deleteTodoUseCaseProxy: UseCaseProxy<deleteTodoUseCase>,
    @Inject(UseCaseProxyModule.POST_TODO_USECASE_PROXY)
    private readonly addTodoUseCaseProxy: UseCaseProxy<addTodoUseCase>,
  ) {}

  @Get('todo')
  @ApiResponseType(TodoPresenter, false)
  async getTodo(@Query('id', ParseIntPipe) id: number) {
    const todo = await this.getTodoUseCaseProxy.getInstance().execute(id);
    return new TodoPresenter(todo);
  }

  @Get('todos')
  @ApiResponseType(TodoPresenter, true)
  async getTodos() {
    const todos = await this.getAllTodoUseCaseProxy.getInstance().execute();
    return todos.map((todo) => new TodoPresenter(todo));
  }

  @Put('todo')
  @ApiResponseType(TodoPresenter, true)
  async updateTodo(@Body() updateTodoDto: UpdateTodoDto) {
    const { id, isDone } = updateTodoDto;
    await this.updateTodoUseCaseProxy.getInstance().execute(id, isDone);
    return 'success';
  }

  @Delete('todo')
  @ApiResponseType(TodoPresenter, true)
  async deleteTodo(@Query('id', ParseIntPipe) id: number) {
    await this.deleteTodoUseCaseProxy.getInstance().execute(id);
    return 'success';
  }

  @Post('todo')
  @ApiResponseType(TodoPresenter, true)
  async addTodo(@Body() addTodoDto: AddTodoDto) {
    const { content } = addTodoDto;
    const todoCreated = await this.addTodoUseCaseProxy.getInstance().execute(content);
    return new TodoPresenter(todoCreated);
  }
}
