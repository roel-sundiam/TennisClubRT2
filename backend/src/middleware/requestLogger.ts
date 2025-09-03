import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log request
  console.log(`📥 ${req.method} ${req.originalUrl} - ${req.ip} - ${new Date().toISOString()}`);
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    const contentLength = res.get('Content-Length') || 0;
    
    console.log(`📤 ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${contentLength} bytes`);
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};