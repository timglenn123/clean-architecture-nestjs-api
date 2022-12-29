import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { UseCaseProxy } from '../src/infrastructure/usecases-proxy/usecases-proxy';
import { UseCaseProxyModule } from '../src/infrastructure/usecases-proxy/usecases-proxy.module';
import { LoginUseCase } from '../src/usecases/auth/login.usecase';
import { IsAuthenticatedUseCase } from '../src/usecases/auth/isAuthenticated.usecase';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/infrastructure/common/guards/jwtAuth.guard';
import JwtRefreshGuard from '../src/infrastructure/common/guards/jwtRefresh.guard';

describe('infrastructure/controllers/auth', () => {
  let app: INestApplication;
  let loginUseCase: LoginUseCase;
  let isAuthenticatedUseCase: IsAuthenticatedUseCase;

  beforeAll(async () => {
    loginUseCase = {} as LoginUseCase;
    loginUseCase.getCookieWithJwtToken = jest.fn();
    loginUseCase.validateUserForLocalStragtegy = jest.fn();
    loginUseCase.getCookieWithJwtRefreshToken = jest.fn();
    const loginUsecaseProxyService: UseCaseProxy<LoginUseCase> = {
      getInstance: () => loginUseCase,
    } as UseCaseProxy<LoginUseCase>;

    isAuthenticatedUseCase = {} as IsAuthenticatedUseCase;
    isAuthenticatedUseCase.execute = jest.fn();
    const isAuthUsecaseProxyService: UseCaseProxy<IsAuthenticatedUseCase> = {
      getInstance: () => isAuthenticatedUseCase,
    } as UseCaseProxy<IsAuthenticatedUseCase>;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UseCaseProxyModule.IS_AUTHENTICATED_USECASE_PROXY)
      .useValue(isAuthUsecaseProxyService)
      .overrideProvider(UseCaseProxyModule.LOGIN_USECASE_PROXY)
      .useValue(loginUsecaseProxyService)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context.switchToHttp().getRequest();
          req.user = { username: 'username' };
          return (
            JSON.stringify(req.cookies) === JSON.stringify({ Authentication: '123456', Path: '/', 'Max-Age': '1800' })
          );
        },
      })
      .overrideGuard(JwtRefreshGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context.switchToHttp().getRequest();
          req.user = { username: 'username' };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  it(`/POST login should return 201`, async (done) => {
    const createDate = new Date().toISOString();
    const updatedDate = new Date().toISOString();
    (loginUseCase.validateUserForLocalStragtegy as jest.Mock).mockReturnValue(
      Promise.resolve({
        id: 1,
        username: 'username',
        createDate: createDate,
        updatedDate: updatedDate,
        lastLogin: null,
        hashRefreshToken: null,
      }),
    );
    (loginUseCase.getCookieWithJwtToken as jest.Mock).mockReturnValue(
      Promise.resolve(`Authentication=123456; HttpOnly; Path=/; Max-Age=${process.env.JWT_EXPIRATION_TIME}`),
    );
    (loginUseCase.getCookieWithJwtRefreshToken as jest.Mock).mockReturnValue(
      Promise.resolve(`Refresh=12345; HttpOnly; Path=/; Max-Age=${process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME}`),
    );

    const result = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'username', password: 'password' })
      .expect(201);

    expect(result.headers['set-cookie']).toEqual([
      `Authentication=123456; HttpOnly; Path=/; Max-Age=1800`,
      `Refresh=12345; HttpOnly; Path=/; Max-Age=86400`,
    ]);

    done();
  });

  it(`/POST logout should return 201`, async (done) => {
    const result = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', ['Authentication=123456; HttpOnly; Path=/; Max-Age=1800'])
      .send()
      .expect(201);

    expect(result.headers['set-cookie']).toEqual([
      'Authentication=; HttpOnly; Path=/; Max-Age=0',
      'Refresh=; HttpOnly; Path=/; Max-Age=0',
    ]);

    done();
  });

  it(`/POST login should return 401`, async (done) => {
    (loginUseCase.validateUserForLocalStragtegy as jest.Mock).mockReturnValue(Promise.resolve(null));

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'username', password: 'password' })
      .expect(401);

    done();
  });

  it(`/POST Refresh token should return 201`, async (done) => {
    (loginUseCase.getCookieWithJwtToken as jest.Mock).mockReturnValue(
      Promise.resolve(`Authentication=123456; HttpOnly; Path=/; Max-Age=${process.env.JWT_EXPIRATION_TIME}`),
    );

    const result = await request(app.getHttpServer()).get('/auth/refresh').send().expect(200);

    expect(result.headers['set-cookie']).toEqual([`Authentication=123456; HttpOnly; Path=/; Max-Age=1800`]);

    done();
  });

  it(`/GET is_authenticated should return 200`, async (done) => {
    (isAuthenticatedUseCase.execute as jest.Mock).mockReturnValue(Promise.resolve({ username: 'username' }));

    await request(app.getHttpServer())
      .get('/auth/is_authenticated')
      .set('Cookie', ['Authentication=123456; HttpOnly; Path=/; Max-Age=1800'])
      .send()
      .expect(200);

    done();
  });

  it(`/GET is_authenticated should return 403`, async (done) => {
    (isAuthenticatedUseCase.execute as jest.Mock).mockReturnValue(Promise.resolve({ username: 'username' }));

    await request(app.getHttpServer()).get('/auth/is_authenticated').send().expect(403);

    done();
  });

  afterAll(async () => {
    await app.close();
  });
});
