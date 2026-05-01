import { AppError, ValidationError, AuthenticationError, NotFoundError } from '../errors/customErrors';

describe('Custom Errors', () => {
  it('AppError sets statusCode and isOperational', () => {
    const err = new AppError('test', 400);
    expect(err.message).toBe('test');
    expect(err.statusCode).toBe(400);
    expect(err.isOperational).toBe(true);
  });

  it('ValidationError has statusCode 400', () => {
    const err = new ValidationError('invalid input');
    expect(err.statusCode).toBe(400);
  });

  it('AuthenticationError has statusCode 401', () => {
    const err = new AuthenticationError();
    expect(err.statusCode).toBe(401);
  });

  it('NotFoundError has statusCode 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
  });
});
