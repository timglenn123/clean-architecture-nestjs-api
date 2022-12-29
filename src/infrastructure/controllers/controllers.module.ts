import { Module } from '@nestjs/common';
import { UseCaseProxyModule } from '../usecases-proxy/usecases-proxy.module';
import { AuthController } from './auth/auth.controller';
import { TodoController } from './todo/todo.controller';

@Module({
  imports: [UseCaseProxyModule.register()],
  controllers: [TodoController, AuthController],
})
export class ControllersModule {}
