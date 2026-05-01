import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/customErrors';

export const registerSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required',
    }),
  firstName: Joi.string().trim().min(1).max(100).required().messages({
    'any.required': 'First name is required',
    'string.min': 'First name cannot be empty',
    'string.max': 'First name must not exceed 100 characters',
  }),
  lastName: Joi.string().trim().min(1).max(100).required().messages({
    'any.required': 'Last name is required',
    'string.min': 'Last name cannot be empty',
    'string.max': 'Last name must not exceed 100 characters',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

export const userPreferencesSchema = Joi.object({
  careerLevel: Joi.string()
    .valid('entry', 'mid', 'senior', 'lead', 'executive')
    .required()
    .messages({
      'any.only':
        'Career level must be one of: entry, mid, senior, lead, executive',
      'any.required': 'Career level is required',
    }),
  jobTypes: Joi.array()
    .items(
      Joi.string().valid('full-time', 'part-time', 'contract', 'freelance', 'internship')
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one job type is required',
      'any.required': 'Job types are required',
    }),
  industries: Joi.array().items(Joi.string().trim()).min(1).required().messages({
    'array.min': 'At least one industry is required',
    'any.required': 'Industries are required',
  }),
  locations: Joi.array().items(Joi.string().trim()).min(1).required().messages({
    'array.min': 'At least one location is required',
    'any.required': 'Locations are required',
  }),
  salaryMin: Joi.number().integer().min(0).optional(),
  salaryMax: Joi.number()
    .integer()
    .min(0)
    .greater(Joi.ref('salaryMin'))
    .optional()
    .messages({
      'number.greater': 'Maximum salary must be greater than minimum salary',
    }),
  companySizes: Joi.array()
    .items(
      Joi.string().valid('startup', 'small', 'medium', 'large', 'enterprise')
    )
    .optional(),
  workEnvironment: Joi.string()
    .valid('remote', 'hybrid', 'onsite', 'flexible')
    .required()
    .messages({
      'any.only': 'Work environment must be one of: remote, hybrid, onsite, flexible',
      'any.required': 'Work environment is required',
    }),
  willingToRelocate: Joi.boolean().optional(),
  openToCareerChange: Joi.boolean().optional(),
  skillsToDevelop: Joi.array().items(Joi.string().trim()).optional(),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).optional(),
  lastName: Joi.string().trim().min(1).max(100).optional(),
  email: Joi.string().email().lowercase().trim().optional(),
});

export const validate =
  (schema: Joi.ObjectSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return next(new ValidationError('Validation failed', details));
    }

    req.body = value;
    next();
  };
