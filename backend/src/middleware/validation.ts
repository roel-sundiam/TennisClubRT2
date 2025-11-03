import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map((error: ValidationError) => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));

    console.error('❌ VALIDATION FAILED ❌');
    console.error('Validation errors:', JSON.stringify(validationErrors, null, 2));
    console.error('Request body:', JSON.stringify(req.body, null, 2));

    const errorMessage = validationErrors.map(e => `${e.field}: ${e.message}`).join('; ');

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: errorMessage,
      details: validationErrors
    });
    return;
  }

  next();
};