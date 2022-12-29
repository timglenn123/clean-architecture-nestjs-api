import { DynamicModule, Module } from '@nestjs/common';
import { addTodoUseCase } from '../../usecases/todo/addTodo.usecase';
import { deleteTodoUseCase } from '../../usecases/todo/deleteTodo.usecase';
import { GetTodoUseCase } from '../../usecases/todo/getTodo.usecase';
import { getTodosUseCase } from '../../usecases/todo/getTodos.usecase';
import { updateTodoUseCases } from '../../usecases/todo/updateTodo.usecase';
import { IsAuthenticatedUseCase } from '../../usecases/auth/isAuthenticated.usecase';
import { LoginUseCase } from '../../usecases/auth/login.usecase';
import { LogoutUseCase } from '../../usecases/auth/logout.usecase';

import { ExceptionsModule } from '../exceptions/exceptions.module';
import { LoggerModule } from '../logger/logger.module';
import { LoggerService } from '../logger/logger.service';

import { BcryptModule } from '../services/bcrypt/bcrypt.module';
import { BcryptService } from '../services/bcrypt/bcrypt.service';
import { JwtModule } from '../services/jwt/jwt.module';
import { JwtTokenService } from '../services/jwt/jwt.service';
import { RepositoriesModule } from '../repositories/repositories.module';

import { DatabaseTodoRepository } from '../repositories/todo.repository';
import { DatabaseUserRepository } from '../repositories/user.repository';

import { EnvironmentConfigModule } from '../config/environment-config/environment-config.module';
import { EnvironmentConfigService } from '../config/environment-config/environment-config.service';
import { UseCaseProxy } from './usecases-proxy';

@Module({
  imports: [LoggerModule, JwtModule, BcryptModule, EnvironmentConfigModule, RepositoriesModule, ExceptionsModule],
})
export class UseCaseProxyModule {
  // Auth
  static LOGIN_USECASE_PROXY = 'LoginUseCaseProxy';
  static IS_AUTHENTICATED_USECASE_PROXY = 'IsAuthenticatedUseCaseProxy';
  static LOGOUT_USECASE_PROXY = 'LogoutUseCaseProxy';

  static GET_TODO_USECASE_PROXY = 'getTodoUseCaseProxy';
  static GET_TODOS_USECASE_PROXY = 'getTodosUseCaseProxy';
  static POST_TODO_USECASE_PROXY = 'postTodoUseCaseProxy';
  static DELETE_TODO_USECASE_PROXY = 'deleteTodoUseCaseProxy';
  static PUT_TODO_USECASE_PROXY = 'putTodoUseCaseProxy';

  static register(): DynamicModule {
    return {
      module: UseCaseProxyModule,
      providers: [
        {
          inject: [LoggerService, JwtTokenService, EnvironmentConfigService, DatabaseUserRepository, BcryptService],
          provide: UseCaseProxyModule.LOGIN_USECASE_PROXY,
          useFactory: (
            logger: LoggerService,
            jwtTokenService: JwtTokenService,
            config: EnvironmentConfigService,
            userRepo: DatabaseUserRepository,
            bcryptService: BcryptService,
          ) => new UseCaseProxy(new LoginUseCase(logger, jwtTokenService, config, userRepo, bcryptService)),
        },
        {
          inject: [DatabaseUserRepository],
          provide: UseCaseProxyModule.IS_AUTHENTICATED_USECASE_PROXY,
          useFactory: (userRepo: DatabaseUserRepository) => new UseCaseProxy(new IsAuthenticatedUseCase(userRepo)),
        },
        {
          inject: [],
          provide: UseCaseProxyModule.LOGOUT_USECASE_PROXY,
          useFactory: () => new UseCaseProxy(new LogoutUseCase()),
        },
        {
          inject: [DatabaseTodoRepository],
          provide: UseCaseProxyModule.GET_TODO_USECASE_PROXY,
          useFactory: (todoRepository: DatabaseTodoRepository) => new UseCaseProxy(new GetTodoUseCase(todoRepository)),
        },
        {
          inject: [DatabaseTodoRepository],
          provide: UseCaseProxyModule.GET_TODOS_USECASE_PROXY,
          useFactory: (todoRepository: DatabaseTodoRepository) => new UseCaseProxy(new getTodosUseCase(todoRepository)),
        },
        {
          inject: [LoggerService, DatabaseTodoRepository],
          provide: UseCaseProxyModule.POST_TODO_USECASE_PROXY,
          useFactory: (logger: LoggerService, todoRepository: DatabaseTodoRepository) =>
            new UseCaseProxy(new addTodoUseCase(logger, todoRepository)),
        },
        {
          inject: [LoggerService, DatabaseTodoRepository],
          provide: UseCaseProxyModule.PUT_TODO_USECASE_PROXY,
          useFactory: (logger: LoggerService, todoRepository: DatabaseTodoRepository) =>
            new UseCaseProxy(new updateTodoUseCases(logger, todoRepository)),
        },
        {
          inject: [LoggerService, DatabaseTodoRepository],
          provide: UseCaseProxyModule.DELETE_TODO_USECASE_PROXY,
          useFactory: (logger: LoggerService, todoRepository: DatabaseTodoRepository) =>
            new UseCaseProxy(new deleteTodoUseCase(logger, todoRepository)),
        },
      ],
      exports: [
        UseCaseProxyModule.GET_TODO_USECASE_PROXY,
        UseCaseProxyModule.GET_TODOS_USECASE_PROXY,
        UseCaseProxyModule.POST_TODO_USECASE_PROXY,
        UseCaseProxyModule.PUT_TODO_USECASE_PROXY,
        UseCaseProxyModule.DELETE_TODO_USECASE_PROXY,
        UseCaseProxyModule.LOGIN_USECASE_PROXY,
        UseCaseProxyModule.IS_AUTHENTICATED_USECASE_PROXY,
        UseCaseProxyModule.LOGOUT_USECASE_PROXY,
      ],
    };
  }
}
