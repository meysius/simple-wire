Here's a complete guide to getting awilix set up with your architecture.

## Installation

```bash
pnpm add awilix
```

That's it - no reflect-metadata, no decorator config needed.

## Basic Setup

### Container Configuration

```typescript
// infrastructure/container.ts
import { createContainer, asClass, asValue, InjectionMode } from 'awilix';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth-service';
import { UserService } from '../services/user-service';
import { UserController } from '../controllers/user-controller';
import { PrismaUserRepository } from './database/repositories/prisma-user-repository';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC
});

export function setupContainer() {
  container.register({
    // Infrastructure
    prisma: asValue(new PrismaClient()),

    // Repositories
    userRepository: asClass(PrismaUserRepository).singleton(),

    // Services
    authService: asClass(AuthService).singleton(),
    userService: asClass(UserService).singleton(),

    // Controllers
    userController: asClass(UserController).scoped()
  });
}

export { container };
```

### Service Classes

The key with `InjectionMode.CLASSIC` is that **constructor parameter names must match the registered names**:

```typescript
// services/auth-service.ts
import { User } from '../domain/entities/user';

export class AuthService {
  // No decorators needed!
  constructor(
    private readonly userRepository: IUserRepository  // Matches 'userRepository' in container
  ) {}

  async validateToken(token: string): Promise<User | null> {
    // Business logic here
    return this.userRepository.findByToken(token);
  }
}
```

```typescript
// services/user-service.ts
export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,  // Matches 'userRepository'
    private readonly authService: AuthService          // Matches 'authService'
  ) {}

  async registerUser(dto: RegisterUserDTO): Promise<User> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) throw new ConflictError('Email already exists');

    return this.userRepository.create({
      email: dto.email,
      hashedPassword: await hash(dto.password)
    });
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}
```

### Repository Implementation

```typescript
// infrastructure/database/repositories/prisma-user-repository.ts
import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '../../../domain/interfaces/IUserRepository';
import { User } from '../../../domain/entities/user';

export class PrismaUserRepository implements IUserRepository {
  constructor(
    private readonly prisma: PrismaClient  // Matches 'prisma'
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
```

### Controller

```typescript
// controllers/user-controller.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user-service';
import { RegisterUserSchema } from '../validators/user.validators';

export class UserController {
  constructor(
    private readonly userService: UserService  // Matches 'userService'
  ) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = RegisterUserSchema.parse(req.body);
      const user = await this.userService.registerUser(dto);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.getUserById(req.params.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  };
}
```

### Routes

```typescript
// routes/user.routes.ts
import { Router } from 'express';
import { container } from '../infrastructure/container';
import { UserController } from '../controllers/user-controller';

export function createUserRoutes(): Router {
  const router = Router();
  const controller = container.resolve<UserController>('userController');

  router.post('/register', controller.register);
  router.get('/:id', controller.getById);

  return router;
}
```

### Entry Point

```typescript
// index.ts
import express from 'express';
import { setupContainer } from './infrastructure/container';
import { createUserRoutes } from './routes/user.routes';
import { errorHandler } from './middleware/error-handler';

setupContainer();

const app = express();
app.use(express.json());

app.use('/api/users', createUserRoutes());
app.use(errorHandler);

app.listen(3000, () => console.log('Server running on port 3000'));
```

## Lifetime Scopes

Awilix supports three lifetimes:

```typescript
container.register({
  // SINGLETON - one instance for entire app lifetime
  prisma: asValue(new PrismaClient()),
  userRepository: asClass(PrismaUserRepository).singleton(),

  // TRANSIENT - new instance every resolve
  authService: asClass(AuthService).transient(),

  // SCOPED - one instance per scope (useful for request-scoped dependencies)
  userController: asClass(UserController).scoped()
});
```

### Request Scoping

For request-scoped dependencies (e.g., current user context):

```typescript
// middleware/scope.middleware.ts
import { container } from '../infrastructure/container';

export function scopeMiddleware(req: Request, res: Response, next: NextFunction) {
  // Create a scoped container for this request
  req.scope = container.createScope();

  // Register request-specific values
  req.scope.register({
    currentUser: asValue(req.user),
    requestId: asValue(crypto.randomUUID())
  });

  next();
}

// Then resolve from scope
const controller = req.scope.resolve<UserController>('userController');
```

## Interface Pattern with Awilix

Since awilix uses string keys, pair them with TypeScript interfaces:

```typescript
// domain/interfaces/IUserRepository.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}

// The parameter name 'userRepository' is what matters for injection
// TypeScript interface provides compile-time type checking
```

```typescript
// services/user-service.ts
import { IUserRepository } from '../domain/interfaces/IUserRepository';

export class UserService {
  constructor(
    private readonly userRepository: IUserRepository  // Type = interface, name = container key
  ) {}
}
```

## Testing

Testing is straightforward - just pass mocks directly:

```typescript
// tests/services/user-service.test.ts
import { UserService } from '../../src/services/user-service';

describe('UserService', () => {
  it('should register a user', async () => {
    const mockUserRepo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: '1', email: 'test@test.com' })
    };

    // No container needed - just instantiate directly
    const userService = new UserService(mockUserRepo as any);

    const result = await userService.registerUser({
      email: 'test@test.com',
      password: 'password123'
    });

    expect(result.email).toBe('test@test.com');
    expect(mockUserRepo.create).toHaveBeenCalled();
  });

  it('should throw if email exists', async () => {
    const mockUserRepo = {
      findByEmail: jest.fn().mockResolvedValue({ id: '1', email: 'test@test.com' }),
      create: jest.fn()
    };

    const userService = new UserService(mockUserRepo as any);

    await expect(
      userService.registerUser({ email: 'test@test.com', password: 'pass' })
    ).rejects.toThrow('Email already exists');
  });
});
```

Or use the container with overrides:

```typescript
import { createContainer, asValue, asClass, InjectionMode } from 'awilix';
import { UserService } from '../../src/services/user-service';

describe('UserService with container', () => {
  it('should work with mocked dependencies', async () => {
    const testContainer = createContainer({ injectionMode: InjectionMode.CLASSIC });

    testContainer.register({
      userRepository: asValue({
        findByEmail: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: '1', email: 'test@test.com' })
      }),
      userService: asClass(UserService)
    });

    const userService = testContainer.resolve<UserService>('userService');
    const result = await userService.registerUser({ email: 'test@test.com', password: 'pass' });

    expect(result.email).toBe('test@test.com');
  });
});
```

## Quick Reference

| Function | Purpose |
|----------|---------|
| `asClass(MyClass)` | Register a class (instantiated by container) |
| `asValue(instance)` | Register an existing instance |
| `asFunction(fn)` | Register a factory function |
| `.singleton()` | One instance forever |
| `.scoped()` | One instance per scope |
| `.transient()` | New instance every time |
| `container.resolve('name')` | Get an instance |
| `container.createScope()` | Create a child container |

This setup works perfectly with `tsx watch` - no decorators, no metadata, just clean dependency injection based on parameter names.